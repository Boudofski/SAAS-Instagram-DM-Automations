"use client";
import { useEffect, useState } from "react";
import { RotateCcw, Send } from "lucide-react";
import {
  branchTarget,
  responseTarget,
  resolveFlowText,
  type Flow,
  type FlowNode,
  type FlowValues,
} from "@/lib/automation-flow/definition";
import { previewFlowAction } from "@/lib/automation-flow/action-preview";
export type FlowPreviewBubble = {
  text: string;
  incoming?: boolean;
  image?: string;
  links?: { label: string; url: string }[];
  options?: string[];
  notice?: boolean;
  cards?: {
    title: string;
    subtitle: string;
    image: string;
    links: { label: string; url: string }[];
  }[];
};
type Bubble = FlowPreviewBubble;
export function advanceFlowPreview(
  flow: Flow,
  start: string | null,
  data: FlowValues,
  history: Bubble[],
  draw = 0.001,
) {
  let id = start;
  const messages = [...history];
  let values = { ...data };
  let waiting: FlowNode | null = null;
  let error = "";
  let steps = 0;
  while (id && steps++ < 60) {
    const node = flow.nodes.find((n) => n.id === id);
    if (!node) {
      error = "Connect this branch to an existing step.";
      break;
    }
    if (node.kind === "end") {
      id = null;
      break;
    }
    if (
      node.kind === "tag" ||
      node.kind === "setfield" ||
      node.kind === "webhook"
    ) {
      const action = previewFlowAction(node, values)!;
      if (action.error) {
        error = action.error;
        break;
      }
      values = action.values;
      if (action.notice) messages.push({ text: action.notice, notice: true });
      id = action.next;
      continue;
    }
    if (node.kind === "random" || node.kind === "condition") {
      id = branchTarget(node, values, draw);
      continue;
    }
    if (node.kind === "delay") {
      messages.push({
        text: `Scheduled wait: ${formatDelay(node.seconds)}. Use Continue preview to skip this wait in the simulation.`,
        notice: true,
      });
      waiting = node;
      break;
    }
    const responseHint =
      node.kind === "email"
        ? "email"
        : node.kind === "phone"
          ? "phone number"
          : node.kind === "capture"
            ? "answer"
            : null;
    messages.push({
      text:
        resolveFlowText(node.text, values) +
        (node.kind === "product" && node.subtitle
          ? `\n${resolveFlowText(node.subtitle, values)}`
          : "") +
        (responseHint
          ? `\n\nReply SKIP to continue without sharing your ${responseHint}, or STOP to cancel.`
          : ""),
      image: node.kind === "product" ? node.image : undefined,
      links: "links" in node ? node.links : undefined,
      options:
        node.kind === "question" ? node.options.map((o) => o.label) : undefined,
      cards:
        node.kind === "carousel"
          ? node.cards.map((card) => ({
              ...card,
              title: resolveFlowText(card.title, values),
              subtitle: resolveFlowText(card.subtitle, values),
            }))
          : undefined,
    });
    if (
      node.kind === "email" ||
      node.kind === "phone" ||
      node.kind === "capture" ||
      node.kind === "question"
    ) {
      waiting = node;
      break;
    }
    id = node.next;
  }
  if (id && !waiting && !error)
    error =
      "Preview stopped after 60 steps. Check the flow for an automatic loop.";
  return { messages, values, waiting, error, ended: !id };
}
function formatDelay(seconds: number) {
  if (seconds % 86400 === 0)
    return `${seconds / 86400} day${seconds === 86400 ? "" : "s"}`;
  if (seconds % 3600 === 0)
    return `${seconds / 3600} hour${seconds === 3600 ? "" : "s"}`;
  if (seconds % 60 === 0)
    return `${seconds / 60} minute${seconds === 60 ? "" : "s"}`;
  return `${seconds} second${seconds === 1 ? "" : "s"}`;
}
const SIMULATED_FIELDS = [
  ["_followsBusiness", "User follows you"],
  ["_businessFollows", "You follow the user"],
  ["_verified", "Verified on Instagram"],
  ["_linkClicked", "User clicked a flow link"],
] as const;
export default function FlowPreview({ flow }: { flow: Flow }) {
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [waiting, setWaiting] = useState<FlowNode | null>(null);
  const [values, setValues] = useState<FlowValues>({});
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [draw, setDraw] = useState(0.001);
  const [ended, setEnded] = useState(false);
  const [started, setStarted] = useState(false);
  const [simulated, setSimulated] = useState<FlowValues>({
    _followsBusiness: "false",
    _businessFollows: "false",
    _verified: "false",
    _linkClicked: "false",
    _followerCount: "0",
  });
  useEffect(() => {
    setMessages([]);
    setInput("");
    setWaiting(null);
    setValues({});
    setEnded(false);
    setStarted(false);
    setError("");
  }, [flow]);
  function advance(start: string | null, data: FlowValues, history: Bubble[]) {
    const vars = { ...data };
    for (const key of [
      ...SIMULATED_FIELDS.map(([field]) => field),
      "_followerCount",
    ]) {
      delete vars[key];
      if (simulated[key] !== "" && simulated[key] !== undefined)
        vars[key] = simulated[key];
    }
    const next = advanceFlowPreview(flow, start, vars, history, draw);
    setStarted(true);
    setMessages(next.messages);
    setValues(next.values);
    setWaiting(next.waiting);
    setError(next.error);
    setEnded(next.ended);
  }
  function reply(text: string) {
    if (!waiting || waiting.kind === "delay" || !text.trim()) return;
    const out = [...messages, { text, incoming: true }];
    setInput("");
    if (/^stop$/i.test(text.trim())) {
      setMessages(out);
      setWaiting(null);
      setEnded(true);
      return;
    }
    const result = responseTarget(waiting, text);
    if (!result) {
      setError(
        waiting.kind === "email"
          ? "Use a valid email, SKIP, or STOP."
          : waiting.kind === "phone"
            ? "Use a valid phone number, SKIP, or STOP."
            : waiting.kind === "capture"
              ? "Write an answer under 1,001 characters, SKIP, or STOP."
              : "Choose one of the listed answers, or reply STOP.",
      );
      return;
    }
    advance(result.next, { ...values, ...result.values }, out);
  }
  return (
    <section className="mx-auto min-w-0 w-full max-w-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Interactive preview</h3>
        <button
          onClick={() => {
            setValues({});
            setInput("");
            advance(flow.entry, {}, []);
          }}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-violet-600 dark:text-violet-300"
        >
          <RotateCcw size={15} />
          Restart
        </button>
      </div>
      <div className="overflow-hidden rounded-[2.5rem] border-[8px] border-[#272b3a] bg-[#101216] text-white shadow-xl">
        <header className="border-b border-white/10 p-3 sm:p-5">
          <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-white/20" />
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-600 font-bold">
              A3
            </span>
            <div>
              <p className="text-sm font-bold">AP3K preview</p>
              <p className="text-xs text-slate-400">
                Sample conversation · nothing is sent
              </p>
            </div>
          </div>
        </header>
        <div
          className="flex h-[clamp(200px,42dvh,380px)] flex-col gap-3 overflow-auto p-4"
          aria-live="polite"
        >
          {!started ? (
            <div className="m-auto text-center">
              <p className="mb-4 text-sm text-slate-400">
                Try your message and every branch.
              </p>
              <button
                onClick={() => advance(flow.entry, {}, [])}
                className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
              >
                Start preview
              </button>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`min-w-0 max-w-[95%] shrink-0 overflow-hidden rounded-2xl ${m.notice ? "self-center border border-white/10 text-slate-400" : m.incoming ? "self-end bg-violet-600" : "self-start bg-[#262a33]"}`}
              >
                {m.image && (
                  <img
                    src={m.image}
                    alt="Product preview"
                    className="max-h-48 w-full object-contain"
                  />
                )}
                <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] p-3 text-sm leading-6">
                  {m.text}
                </p>
                {m.cards && (
                  <div
                    className="flex max-w-full snap-x gap-2 overflow-x-auto p-2"
                    aria-label="Preview carousel cards"
                  >
                    {m.cards.map((card, cardIndex) => (
                      <article
                        key={cardIndex}
                        className="w-52 shrink-0 snap-start overflow-hidden rounded-xl border border-white/10"
                      >
                        <img
                          src={card.image}
                          alt={card.title}
                          className="h-32 w-full object-cover"
                        />
                        <p className="break-words px-3 pt-3 text-sm font-semibold">
                          {card.title}
                        </p>
                        <p className="break-words px-3 pb-2 text-xs text-slate-400">
                          {card.subtitle}
                        </p>
                        {card.links.map((link, linkIndex) => (
                          <span
                            key={linkIndex}
                            className="m-2 block break-words rounded-lg bg-white/10 px-3 py-2 text-center text-sm"
                          >
                            {link.label} ↗
                          </span>
                        ))}
                      </article>
                    ))}
                  </div>
                )}
                {m.links?.map((l) => (
                  <span
                    key={l.label}
                    className="m-2 block break-words rounded-lg bg-white/10 px-4 py-2 text-center text-sm"
                  >
                    {l.label} ↗
                  </span>
                ))}
                {m.options?.map((o) => (
                  <button
                    key={o}
                    disabled={i !== messages.length - 1 || !waiting}
                    onClick={() => reply(o)}
                    className="m-2 block min-h-11 w-[calc(100%-1rem)] break-words rounded-lg bg-white/10 px-3 py-2 text-sm disabled:opacity-50"
                  >
                    {o}
                  </button>
                ))}
              </div>
            ))
          )}
          {waiting?.kind === "delay" && (
            <div className="space-y-2 text-center">
              {waiting.seconds >= 86400 && (
                <p className="text-xs text-amber-300">
                  A live follow-up may expire outside Instagram&apos;s messaging
                  window.
                </p>
              )}
              <button
                type="button"
                onClick={() => advance(waiting.next, values, messages)}
                className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold"
              >
                Continue preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setWaiting(null);
                  setEnded(true);
                }}
                className="ms-2 px-3 py-3 text-sm text-slate-400"
              >
                Stop preview
              </button>
            </div>
          )}
          {ended && (
            <p className="py-2 text-center text-xs text-slate-400">
              Flow finished
            </p>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            reply(input);
          }}
          className="flex gap-2 border-t border-white/10 p-3"
        >
          <input
            disabled={!waiting || waiting.kind === "delay"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              waiting?.kind === "delay"
                ? "Skip the wait to continue"
                : waiting
                  ? "Write a reply…"
                  : ended
                    ? "Preview finished"
                    : "Start preview to test"
            }
            aria-label="Preview reply"
            className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-400"
          />
          <button
            aria-label="Send preview reply"
            disabled={!waiting || waiting.kind === "delay"}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-600 p-2.5 disabled:opacity-40"
          >
            <Send size={17} />
          </button>
        </form>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}
      <details className="mt-4 rounded-xl border border-slate-200 p-3 dark:border-white/10">
        <summary className="cursor-pointer text-sm font-medium">
          Simulated contact
        </summary>
        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          These values only affect this preview. Change them before continuing
          to test each condition.
        </p>
        <div className="mt-3 space-y-3">
          {SIMULATED_FIELDS.map(([field, label]) => (
            <label key={field} className="block text-xs font-medium">
              {label}
              <select
                value={simulated[field]}
                onChange={(e) =>
                  setSimulated((v) => ({ ...v, [field]: e.target.value }))
                }
                className="ap3k-input mt-1 min-h-11 w-full rounded-lg p-2 text-sm"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
                <option value="">Unknown / unavailable</option>
              </select>
            </label>
          ))}
          <label className="block text-xs font-medium">
            Follower count
            <input
              type="number"
              min={0}
              step={1}
              value={simulated._followerCount}
              onChange={(e) =>
                setSimulated((v) => ({ ...v, _followerCount: e.target.value }))
              }
              placeholder="Unknown"
              className="ap3k-input mt-1 min-h-11 w-full rounded-lg p-2 text-sm"
            />
          </label>
        </div>
      </details>
      {flow.nodes.some((n) => n.kind === "random") && (
        <label className="mt-4 block text-sm">
          Test a random path
          <select
            value={draw}
            onChange={(e) => {
              setDraw(Number(e.target.value));
              setMessages([]);
              setWaiting(null);
              setInput("");
              setValues({});
              setError("");
              setEnded(false);
              setStarted(false);
            }}
            className="ap3k-input mt-2 w-full rounded-xl p-2"
          >
            <option value={0.001}>Path A (low draw)</option>
            <option value={0.999}>Path B (high draw)</option>
          </select>
        </label>
      )}
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
        This simulation uses your saved branching rules. Instagram controls the
        final message appearance. No live messages, entries, or leads are
        created.
      </p>
    </section>
  );
}
