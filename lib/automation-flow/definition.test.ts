import { describe, expect, it } from "vitest";
import { validateFlow, branchTarget, responseTarget } from "./definition";
import { TEMPLATES, templateFlow } from "./templates";
describe("custom flow graph validation", () => {
  it("accepts every executable flow template", () => {
    for (const t of TEMPLATES.filter(
      (t) => t.type === "flow" && !t.unavailable,
    )) {
      const flow = templateFlow(t.id);
      for (const node of flow.nodes)
        if ("links" in node)
          node.links = node.links.map((link) => ({
            ...link,
            url: link.url || "https://ap3k.com/resource",
          }));
      expect(validateFlow(flow).errors, t.id).toEqual([]);
    }
  });
  it("requires an actual destination for the free resource", () => {
    expect(validateFlow(templateFlow("email")).flow).toBeNull();
  });
  it("keeps comment automation first and popular", () =>
    expect(TEMPLATES[0]).toMatchObject({ type: "comment", popular: true }));
  it("does not advertise unsupported live triggers as publishable", () => {
    for (const t of TEMPLATES.filter((t) => t.trigger === "live"))
      expect(t.unavailable).toBeTruthy();
  });
  it("rejects cycles, disconnected steps and broken destinations", () => {
    const f = templateFlow();
    const n = f.nodes[0];
    if (n.kind !== "message") throw Error();
    n.next = n.id;
    expect(validateFlow(f).errors.join()).toContain("loop");
    n.next = "missing";
    expect(validateFlow(f).flow).toBeNull();
    n.next = null;
    f.nodes.push({ ...n, id: "unreachable" });
    expect(validateFlow(f).errors.join()).toContain("not connected");
  });
  it("rejects unsafe link schemes", () => {
    const f = templateFlow();
    const n = f.nodes[0];
    if (n.kind === "message")
      n.links = [{ label: "Open", url: "javascript:alert(1)" }];
    expect(validateFlow(f).flow).toBeNull();
  });
  it("bounds automatic message bursts", () => {
    const f = templateFlow();
    f.nodes = Array.from({ length: 7 }, (_, i) => ({
      id: `n${i}`,
      kind: "message" as const,
      label: `M${i}`,
      x: 0,
      y: 0,
      text: "Hi",
      links: [],
      next: i === 6 ? null : `n${i + 1}`,
    }));
    f.entry = "n0";
    expect(validateFlow(f).errors.join()).toContain("six messages");
  });
  it("collects only a complete email and supports skip", () => {
    const n = templateFlow("email").nodes[0];
    expect(responseTarget(n, "send it to me")).toBeNull();
    expect(responseTarget(n, "Person@Example.com")).toEqual({
      next: "delivery",
      values: { email: "person@example.com" },
    });
    expect(responseTarget(n, "SKIP")).toEqual({ next: "delivery", values: {} });
  });
  it("matches a choice without treating unknown text as an answer", () => {
    const n = templateFlow("quiz").nodes[0];
    expect(responseTarget(n, "GETTING STARTED")).toMatchObject({
      next: "beginner",
      values: { interest: "Getting started" },
    });
    expect(responseTarget(n, "something else")).toBeNull();
  });
  it("uses probabilities, with a testable boundary", () => {
    const n = templateFlow("giveaway").nodes[0];
    expect(branchTarget(n, {}, 0.049)).toBe("winner");
    expect(branchTarget(n, {}, 0.05)).toBe("thanks");
  });
});
