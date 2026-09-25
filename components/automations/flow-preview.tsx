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
type Bubble = {
  text: string;
  incoming?: boolean;
  image?: string;
  links?: { label: string; url: string }[];
  options?: string[];
};
export default function FlowPreview({ flow }: { flow: Flow }) {
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [waiting, setWaiting] = useState<FlowNode | null>(null);
  const [values, setValues] = useState<FlowValues>({});
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [draw, setDraw] = useState(0.001);
  const [ended, setEnded] = useState(false);
  useEffect(() => {
    setMessages([]);
    setInput("");
    setWaiting(null);
    setValues({});
    setEnded(false);
    setError("");
  }, [flow]);
  function advance(start: string | null, data: FlowValues, history: Bubble[]) {
    let id = start;
    const out = [...history];
    const vars = { ...data };
    setError("");
    setWaiting(null);
    for (let i = 0; id && i < 30; i++) {
      const n = flow.nodes.find((n) => n.id === id);
      if (!n) {
        setError("Connect this branch to an existing step.");
        break;
      }
      if (n.kind === "end") {
        id = null;
        break;
      }
      if (n.kind === "random" || n.kind === "condition" || n.kind === "tag") {
        if (n.kind === "tag") vars[`tag_${n.tag}`] = "true";
        id = branchTarget(n, vars, draw);
        continue;
      }
      out.push({
        text:
          resolveFlowText(n.text, vars) +
          (n.kind === "email"
            ? "\n\nReply SKIP to continue without an email, or STOP to cancel."
            : ""),
        image: n.kind === "product" ? n.image : undefined,
        links: "links" in n ? n.links : undefined,
        options:
          n.kind === "question" ? n.options.map((o) => o.label) : undefined,
      });
      if (n.kind === "email" || n.kind === "question") {
        setWaiting(n);
        break;
      }
      id = n.next;
    }
    setMessages(out);
    setValues(vars);
    setEnded(!id);
  }
  function reply(text: string) {
    if (!waiting || !text.trim()) return;
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
          {!messages.length ? (
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
                className={`min-w-0 max-w-[95%] shrink-0 overflow-hidden rounded-2xl ${m.incoming ? "self-end bg-violet-600" : "self-start bg-[#262a33]"}`}
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
            disabled={!waiting}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={waiting ? "Write a reply…" : "Start preview to test"}
            aria-label="Preview reply"
            className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-400"
          />
          <button
            aria-label="Send preview reply"
            disabled={!waiting}
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
