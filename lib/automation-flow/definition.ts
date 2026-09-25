import { z } from "zod";

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,60}$/);
const link = z.object({
  label: z.string().trim().min(1).max(20),
  url: z
    .string()
    .trim()
    .url()
    .refine((s) => /^https:\/\//i.test(s), "Use an HTTPS link"),
});
const base = {
  id,
  label: z.string().max(80),
  x: z.number().min(0).max(6000),
  y: z.number().min(0).max(6000),
};
const next = id.nullable();
export const flowNodeSchema = z.discriminatedUnion("kind", [
  z.object({
    ...base,
    kind: z.literal("message"),
    text: z.string().trim().min(1).max(1000),
    links: z.array(link).max(3),
    next,
  }),
  z.object({
    ...base,
    kind: z.literal("product"),
    text: z.string().trim().min(1).max(80),
    subtitle: z.string().max(80),
    image: z.string().url(),
    links: z.array(link).min(1).max(3),
    next,
  }),
  z.object({
    ...base,
    kind: z.literal("email"),
    text: z.string().trim().min(1).max(800),
    next,
    skip: next,
  }),
  z.object({
    ...base,
    kind: z.literal("question"),
    text: z.string().trim().min(1).max(800),
    field: id,
    options: z
      .array(z.object({ label: z.string().trim().min(1).max(20), next }))
      .min(2)
      .max(3),
  }),
  z.object({
    ...base,
    kind: z.literal("random"),
    percent: z.number().int().min(1).max(99),
    yes: next,
    no: next,
  }),
  z.object({
    ...base,
    kind: z.literal("condition"),
    field: id,
    equals: z.string().max(100),
    yes: next,
    no: next,
  }),
  z.object({ ...base, kind: z.literal("tag"), tag: id, next }),
  z.object({ ...base, kind: z.literal("end") }),
]);
export const flowSchema = z.object({
  version: z.literal(1),
  entry: id,
  oncePerContact: z.boolean(),
  nodes: z.array(flowNodeSchema).min(1).max(30),
});
export type Flow = z.infer<typeof flowSchema>;
export type FlowNode = Flow["nodes"][number];
export type FlowValues = Record<string, string>;
export function edges(
  node: FlowNode,
): Array<{ label: string; target: string | null }> {
  if (node.kind === "end") return [];
  if (node.kind === "random")
    return [
      { label: `${node.percent}%`, target: node.yes },
      { label: `${100 - node.percent}%`, target: node.no },
    ];
  if (node.kind === "condition")
    return [
      { label: "Yes", target: node.yes },
      { label: "No", target: node.no },
    ];
  if (node.kind === "question")
    return node.options.map((o) => ({ label: o.label, target: o.next }));
  if (node.kind === "email")
    return [
      { label: "Valid email", target: node.next },
      { label: "SKIP", target: node.skip },
    ];
  return [{ label: "Next", target: node.next }];
}
export function validateFlow(
  raw: unknown,
): { flow: Flow; errors: [] } | { flow: null; errors: string[] } {
  const parsed = flowSchema.safeParse(raw);
  if (!parsed.success)
    return {
      flow: null,
      errors: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .slice(0, 12),
    };
  const flow = parsed.data;
  const errors: string[] = [];
  const nodes = new Map(flow.nodes.map((n) => [n.id, n]));
  if (nodes.size !== flow.nodes.length) errors.push("Step IDs must be unique.");
  if (!nodes.has(flow.entry)) errors.push("Choose a starting step.");
  for (const n of flow.nodes) {
    for (const edge of edges(n))
      if (edge.target && !nodes.has(edge.target))
        errors.push(`${n.label}: connect ${edge.label} to an existing step.`);
    if (
      n.kind === "question" &&
      new Set(n.options.map((o) => o.label.toLowerCase())).size !==
        n.options.length
    )
      errors.push(`${n.label}: answer labels must be different.`);
  }
  const seen = new Set<string>();
  const visiting = new Set<string>();
  const visitedStates = new Set<string>();
  function visit(key: string, sends: number) {
    if (visiting.has(key)) {
      errors.push(
        "This flow contains a loop. Connect branches forward to prevent repeated messages.",
      );
      return;
    }
    const stateKey = `${key}:${sends}`;
    if (visitedStates.has(stateKey)) return;
    visitedStates.add(stateKey);
    const n = nodes.get(key);
    if (!n) return;
    const count = ["message", "product", "email", "question"].includes(n.kind)
      ? sends + 1
      : sends;
    if (count > 6) {
      errors.push("Use at most six messages between customer replies.");
      return;
    }
    seen.add(key);
    visiting.add(key);
    for (const edge of edges(n))
      if (edge.target)
        visit(edge.target, ["email", "question"].includes(n.kind) ? 0 : count);
    visiting.delete(key);
  }
  visit(flow.entry, 0);
  for (const n of flow.nodes)
    if (!seen.has(n.id))
      errors.push(
        `${n.label}: this step is not connected to the starting step.`,
      );
  return errors.length
    ? { flow: null, errors: Array.from(new Set(errors)).slice(0, 12) }
    : { flow, errors: [] };
}
export function readFlow(value: unknown): Flow | null {
  return validateFlow(value).flow;
}
export function branchTarget(
  node: FlowNode,
  values: FlowValues,
  draw: number,
): string | null {
  if (node.kind === "random")
    return draw * 100 < node.percent ? node.yes : node.no;
  if (node.kind === "condition")
    return values[node.field] === node.equals ? node.yes : node.no;
  return "next" in node ? node.next : null;
}
export function resolveFlowText(text: string, values: FlowValues) {
  return text
    .replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (_, key) => values[key] ?? "")
    .slice(0, 1000);
}
export function responseTarget(
  node: FlowNode,
  text: string,
): { next: string | null; values: FlowValues } | null {
  const input = text.trim();
  if (node.kind === "email") {
    if (/^skip$/i.test(input)) return { next: node.skip, values: {} };
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input) && input.length <= 254)
      return { next: node.next, values: { email: input.toLowerCase() } };
  }
  if (node.kind === "question") {
    const option = node.options.find(
      (o) => o.label.toLowerCase() === input.toLowerCase(),
    );
    if (option)
      return { next: option.next, values: { [node.field]: option.label } };
  }
  return null;
}
