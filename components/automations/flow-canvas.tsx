"use client";
import { useRef, useState } from "react";
import {
  Plus,
  Minus,
  Move,
  Trash2,
  GitBranch,
  MessageCircle,
  Mail,
  ImageIcon,
  Tag,
  Flag,
  Shuffle,
  HelpCircle,
  List,
} from "lucide-react";
import {
  edges,
  type Flow,
  type FlowNode,
} from "@/lib/automation-flow/definition";
import ProductCardEditor from "./product-card-editor";
const names: Record<FlowNode["kind"], string> = {
  message: "Send message",
  product: "Product card",
  email: "Collect email",
  question: "Ask a question",
  random: "Random split",
  condition: "Condition",
  tag: "Set tag",
  end: "Finish",
};
const icons = {
  message: MessageCircle,
  product: ImageIcon,
  email: Mail,
  question: HelpCircle,
  random: Shuffle,
  condition: GitBranch,
  tag: Tag,
  end: Flag,
};
export default function FlowCanvas({
  flow,
  onChange,
}: {
  flow: Flow;
  onChange: (f: Flow) => void;
}) {
  const [selected, setSelected] = useState(flow.entry);
  const [view, setView] = useState<"auto" | "canvas" | "list">("auto");
  const editorRef = useRef<HTMLElement>(null);
  const [zoom, setZoom] = useState(0.85);
  const [kind, setKind] = useState<FlowNode["kind"]>("message");
  const drag = useRef<{
    id: string;
    x: number;
    y: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  const node = flow.nodes.find((n) => n.id === selected);
  const width = Math.max(1100, ...flow.nodes.map((n) => n.x + 360));
  const height = Math.max(640, ...flow.nodes.map((n) => n.y + 240));
  function update(patch: Record<string, unknown>) {
    onChange({
      ...flow,
      nodes: flow.nodes.map((n) =>
        n.id === selected ? ({ ...n, ...patch } as FlowNode) : n,
      ),
    });
  }
  function add() {
    const id = `step_${crypto.randomUUID().slice(0, 8)}`;
    const base = {
      id,
      label: names[kind],
      x: 120 + (flow.nodes.length % 3) * 360,
      y: 100 + Math.floor(flow.nodes.length / 3) * 260,
    };
    let n: FlowNode;
    if (kind === "message")
      n = {
        ...base,
        kind,
        text: "Write your message here.",
        links: [],
        next: null,
      };
    else if (kind === "product")
      n = {
        ...base,
        kind,
        text: "Your product",
        subtitle: "",
        image: "",
        links: [],
        next: null,
      };
    else if (kind === "email")
      n = {
        ...base,
        kind,
        text: "What is your email address?",
        next: null,
        skip: null,
      };
    else if (kind === "question")
      n = {
        ...base,
        kind,
        text: "Which option would you prefer?",
        field: `answer_${flow.nodes.length}`,
        options: [
          { label: "Option A", next: null },
          { label: "Option B", next: null },
        ],
      };
    else if (kind === "random")
      n = { ...base, kind, percent: 50, yes: null, no: null };
    else if (kind === "condition")
      n = {
        ...base,
        kind,
        field: "interest",
        equals: "Getting started",
        yes: null,
        no: null,
      };
    else if (kind === "tag")
      n = { ...base, kind, tag: "interested", next: null };
    else n = { ...base, kind: "end" };
    onChange({ ...flow, nodes: [...flow.nodes, n] });
    setSelected(id);
  }
  function remove() {
    if (!node) return;
    onChange({
      ...flow,
      entry:
        flow.entry === node.id
          ? (flow.nodes.find((n) => n.id !== node.id)?.id ?? "")
          : flow.entry,
      nodes: flow.nodes
        .filter((n) => n.id !== node.id)
        .map((n) => {
          const copy = { ...n };
          if ("next" in copy && copy.next === node.id) copy.next = null;
          if ("skip" in copy && copy.skip === node.id) copy.skip = null;
          if ("yes" in copy && copy.yes === node.id) copy.yes = null;
          if ("no" in copy && copy.no === node.id) copy.no = null;
          if (copy.kind === "question")
            copy.options = copy.options.map((o) => ({
              ...o,
              next: o.next === node.id ? null : o.next,
            }));
          return copy;
        }),
    });
    setSelected(flow.entry === node.id ? "" : flow.entry);
  }
  const connection = (
    label: string,
    value: string | null,
    set: (v: string | null) => void,
  ) => (
    <label className="block text-xs font-semibold">
      {label}
      <select
        value={value ?? ""}
        onChange={(e) => set(e.target.value || null)}
        className="ap3k-input min-h-11 min-w-0 mt-1.5 w-full rounded-lg p-2 text-sm"
      >
        <option value="">Finish this path</option>
        {flow.nodes
          .filter((n) => n.id !== node?.id)
          .map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
      </select>
    </label>
  );
  return (
    <div className="grid min-w-0 max-w-full items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#141824]">
          <select
            aria-label="New step type"
            value={kind}
            onChange={(e) => setKind(e.target.value as FlowNode["kind"])}
            className="ap3k-input min-h-11 min-w-0 flex-1 rounded-lg p-2 text-sm sm:max-w-44"
          >
            {Object.entries(names).map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </select>
          <button
            disabled={flow.nodes.length >= 30}
            onClick={add}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            Add step
          </button>
          <div className="flex w-full flex-wrap items-center gap-2 sm:ms-auto sm:w-auto">
            <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-white/5" aria-label="Editor view">
              <button type="button" onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list" ? true : view === "canvas" ? false : undefined} className={`flex min-h-11 items-center gap-1 rounded-md px-3 text-xs font-semibold ${view === "list" ? "bg-violet-600 text-white" : view === "auto" ? "bg-violet-600 text-white xl:bg-transparent xl:text-inherit" : ""}`}><List size={15} />List</button>
              <button type="button" onClick={() => setView("canvas")} aria-label="Canvas view" aria-pressed={view === "canvas" ? true : view === "list" ? false : undefined} className={`flex min-h-11 items-center gap-1 rounded-md px-3 text-xs font-semibold ${view === "canvas" ? "bg-violet-600 text-white" : view === "auto" ? "xl:bg-violet-600 xl:text-white" : ""}`}><GitBranch size={15} />Canvas</button>
            </div>
          <div className={`${view === "list" ? "hidden" : view === "auto" ? "hidden xl:flex" : "flex"} ms-auto items-center gap-1`}>
            <button
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
              className="grid h-11 w-11 place-items-center rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <Minus size={16} />
            </button>
            <span className="self-center text-xs">
              {Math.round(zoom * 100)}%
            </span>
            <button
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(1.3, z + 0.1))}
              className="grid h-11 w-11 place-items-center rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <Plus size={16} />
            </button>
          </div>
          </div>
        </div>
        <div className={`${view === "canvas" ? "hidden" : view === "auto" ? "xl:hidden" : ""} max-h-80 space-y-2 overflow-y-auto overscroll-contain bg-slate-50 p-3 dark:bg-[#0b0f19]`} aria-label="Conversation steps">
          {flow.nodes.map((n) => {
            const Icon = icons[n.kind];
            return <button type="button" key={n.id} aria-pressed={selected === n.id} onClick={() => { setSelected(n.id); editorRef.current?.scrollIntoView({ block: "nearest", behavior: "auto" }); }} className={`flex min-h-14 w-full min-w-0 items-start gap-3 rounded-xl border p-3 text-start ${selected === n.id ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10" : "border-slate-200 bg-white dark:border-white/10 dark:bg-[#141824]"}`}>
              <Icon size={18} className="mt-1 shrink-0 text-violet-500" />
              <span className="min-w-0 flex-1"><span className="block break-words text-sm font-bold">{n.label}{n.id === flow.entry && <span className="ms-2 text-[10px] text-violet-500">START</span>}</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{names[n.kind]}</span><span className="mt-2 block break-words text-xs text-slate-500 dark:text-slate-400">{edges(n).filter(e => e.target).map(e => `${e.label}: ${flow.nodes.find(target => target.id === e.target)?.label ?? "Missing step"}`).join(" · ") || "Finish this path"}</span></span>
            </button>;
          })}
        </div>
        <div
          aria-label="Conversation canvas"
          className={`${view === "list" ? "hidden" : view === "auto" ? "hidden xl:block" : ""} h-[clamp(280px,55dvh,600px)] overflow-auto overscroll-contain bg-[#f3f4f9] dark:bg-[#0b0f19]`}
          style={{
            backgroundImage: "radial-gradient(#85859b44 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          <div style={{ width: width * zoom, height: height * zoom }}>
            <div
              className="relative origin-top-left"
              style={{ width, height, transform: `scale(${zoom})` }}
            >
              <svg
                className="pointer-events-none absolute inset-0"
                width={width}
                height={height}
                aria-hidden
              >
                <defs>
                  <marker
                    id="flow-arrow"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M0,0 L8,4 L0,8" fill="#9b81dd" />
                  </marker>
                </defs>
                {flow.nodes.flatMap((n) =>
                  edges(n).map((e, i) => {
                    const target = flow.nodes.find((t) => t.id === e.target);
                    if (!target) return null;
                    const x1 = n.x + 280,
                      y1 = n.y + 78 + i * 26,
                      x2 = target.x,
                      y2 = target.y + 65;
                    return (
                      <g key={`${n.id}-${i}`}>
                        <path
                          d={`M${x1},${y1} C${x1 + 80},${y1} ${x2 - 80},${y2} ${x2},${y2}`}
                          fill="none"
                          stroke="#9b81dd"
                          strokeWidth="2"
                          markerEnd="url(#flow-arrow)"
                        />
                        <text
                          x={x1 + 10}
                          y={y1 - 8}
                          fontSize="11"
                          fill="#8b6fc9"
                        >
                          {e.label}
                        </text>
                      </g>
                    );
                  }),
                )}
              </svg>
              {flow.nodes.map((n) => {
                const Icon = icons[n.kind];
                return (
                  <article
                    key={n.id}
                    style={{ left: n.x, top: n.y }}
                    className={`absolute w-[280px] overflow-hidden rounded-2xl border-2 bg-white shadow-sm dark:bg-[#171c29] ${n.id === selected ? "border-violet-500 ring-4 ring-violet-500/10" : "border-slate-200 dark:border-slate-700"}`}
                  >
                    <button
                      aria-label={`Move ${n.label}. Use arrow keys to reposition.`}
                      onPointerDown={(e) => {
                        drag.current = {
                          id: n.id,
                          x: n.x,
                          y: n.y,
                          clientX: e.clientX,
                          clientY: e.clientY,
                        };
                        e.currentTarget.setPointerCapture(e.pointerId);
                        setSelected(n.id);
                      }}
                      onPointerMove={(e) => {
                        const d = drag.current;
                        if (d?.id === n.id)
                          onChange({
                            ...flow,
                            nodes: flow.nodes.map((v) =>
                              v.id === n.id
                                ? {
                                    ...v,
                                    x: Math.max(
                                      0,
                                      Math.min(
                                        6000,
                                        d.x + (e.clientX - d.clientX) / zoom,
                                      ),
                                    ),
                                    y: Math.max(
                                      0,
                                      Math.min(
                                        6000,
                                        d.y + (e.clientY - d.clientY) / zoom,
                                      ),
                                    ),
                                  }
                                : v,
                            ),
                          });
                      }}
                      onPointerUp={() => {
                        drag.current = null;
                      }}
                      onPointerCancel={() => {
                        drag.current = null;
                      }}
                      onKeyDown={(e) => {
                        const direction = {
                          ArrowLeft: [-20, 0],
                          ArrowRight: [20, 0],
                          ArrowUp: [0, -20],
                          ArrowDown: [0, 20],
                        }[e.key];
                        if (direction) {
                          e.preventDefault();
                          onChange({
                            ...flow,
                            nodes: flow.nodes.map((v) =>
                              v.id === n.id
                                ? {
                                    ...v,
                                    x: Math.max(
                                      0,
                                      Math.min(6000, v.x + direction[0]),
                                    ),
                                    y: Math.max(
                                      0,
                                      Math.min(6000, v.y + direction[1]),
                                    ),
                                  }
                                : v,
                            ),
                          });
                        }
                      }}
                      className="flex w-full touch-none items-center gap-2 border-b border-slate-100 bg-violet-50 px-4 py-3 text-left text-xs font-bold text-violet-700 dark:border-white/10 dark:bg-violet-500/10 dark:text-violet-300"
                    >
                      <Icon size={15} />
                      {names[n.kind]}
                      <Move size={13} className="ml-auto" />
                    </button>
                    <button
                      onClick={() => setSelected(n.id)}
                      className="block min-h-24 w-full p-4 text-left"
                    >
                      <p className="text-sm font-bold">
                        {n.label}
                        {n.id === flow.entry && (
                          <span className="ml-2 text-[10px] text-violet-500">
                            START
                          </span>
                        )}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {"text" in n
                          ? n.text
                          : n.kind === "random"
                            ? `${n.percent}% / ${100 - n.percent}%`
                            : n.kind === "condition"
                              ? `${n.field} = ${n.equals}`
                              : n.kind === "tag"
                                ? n.tag
                                : "Conversation complete"}
                      </p>
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
        <p className="border-t border-slate-200 bg-white p-3 text-xs text-slate-500 dark:border-white/10 dark:bg-[#141824] dark:text-slate-400">
          Select a step to edit its message and connections. In canvas view,
          drag headers or use arrow keys to reposition steps.
        </p>
      </div>
      <aside ref={editorRef} aria-label="Step settings" className="min-w-0 max-w-full space-y-4 xl:max-h-[710px] xl:overflow-auto rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#141824]">
        <label className="block text-xs font-semibold">
          Starting step
          <select
            value={flow.entry}
            onChange={(e) => onChange({ ...flow, entry: e.target.value })}
            className="ap3k-input min-h-11 min-w-0 mt-2 w-full rounded-lg p-2 text-sm"
          >
            {flow.nodes.map((n) => (
              <option value={n.id} key={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </label>
        {node ? (
          <>
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-white/10">
              <h3 className="font-bold">Edit step</h3>
              <button
                aria-label="Delete step"
                onClick={remove}
                disabled={flow.nodes.length === 1}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg p-2 text-red-500 disabled:opacity-30"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <Field
              label="Step name"
              value={node.label}
              onChange={(v) => update({ label: v })}
              max={80}
            />
            {"text" in node && node.kind !== "product" && (
              <Field
                area
                label="Message"
                value={node.text}
                onChange={(v) => update({ text: v })}
                max={node.kind === "message" ? 1000 : 800}
              />
            )}
            {node.kind === "message" && (
              <>
                <p className="text-xs text-slate-500">
                  Optional link buttons (up to 3)
                </p>
                {node.links.map((l, i) => (
                  <div
                    key={i}
                    className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-white/10"
                  >
                    <Field
                      label="Button label"
                      value={l.label}
                      max={20}
                      onChange={(v) =>
                        update({
                          links: node.links.map((a, j) =>
                            i === j ? { ...a, label: v } : a,
                          ),
                        })
                      }
                    />
                    <Field
                      label="HTTPS destination"
                      value={l.url}
                      onChange={(v) =>
                        update({
                          links: node.links.map((a, j) =>
                            i === j ? { ...a, url: v } : a,
                          ),
                        })
                      }
                    />
                    <button
                      className="text-xs text-red-500"
                      onClick={() =>
                        update({ links: node.links.filter((_, j) => j !== i) })
                      }
                    >
                      Remove link
                    </button>
                  </div>
                ))}
                {node.links.length < 3 && (
                  <button
                    onClick={() =>
                      update({
                        links: [...node.links, { label: "Open", url: "" }],
                      })
                    }
                    className="text-sm font-semibold text-violet-600 dark:text-violet-300"
                  >
                    + Add a link
                  </button>
                )}
              </>
            )}
            {node.kind === "product" && (
              <ProductCardEditor
                title={node.text}
                subtitle={node.subtitle}
                imageUrl={node.image}
                linkButtons={node.links}
                onChange={(p) =>
                  update({
                    ...(p.title !== undefined ? { text: p.title } : {}),
                    ...(p.subtitle !== undefined
                      ? { subtitle: p.subtitle }
                      : {}),
                    ...(p.imageUrl !== undefined ? { image: p.imageUrl } : {}),
                    ...(p.linkButtons ? { links: p.linkButtons } : {}),
                  })
                }
              />
            )}
            {node.kind === "email" && (
              <p className="text-xs leading-5 text-slate-500">
                A valid email is saved as a lead. SKIP and STOP are included
                automatically. This does not grant marketing consent.
              </p>
            )}
            {node.kind === "question" && (
              <>
                <Field
                  label="Save answer as"
                  value={node.field}
                  onChange={(v) => update({ field: v })}
                />
                {node.options.map((o, i) => (
                  <div
                    key={i}
                    className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-white/10"
                  >
                    <Field
                      label={`Answer ${i + 1}`}
                      value={o.label}
                      max={20}
                      onChange={(v) =>
                        update({
                          options: node.options.map((a, j) =>
                            i === j ? { ...a, label: v } : a,
                          ),
                        })
                      }
                    />
                    {connection("Then go to", o.next, (v) =>
                      update({
                        options: node.options.map((a, j) =>
                          i === j ? { ...a, next: v } : a,
                        ),
                      }),
                    )}
                  </div>
                ))}
                {node.options.length < 3 && (
                  <button
                    className="text-sm text-violet-500"
                    onClick={() =>
                      update({
                        options: [
                          ...node.options,
                          { label: "Option C", next: null },
                        ],
                      })
                    }
                  >
                    + Add answer
                  </button>
                )}
              </>
            )}
            {node.kind === "random" && (
              <>
                <label className="block text-xs font-semibold">
                  Path A probability (%)
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={node.percent}
                    onChange={(e) =>
                      update({ percent: Number(e.target.value) })
                    }
                    className="ap3k-input min-h-11 min-w-0 mt-2 w-full rounded-lg p-2"
                  />
                </label>
                <p className="text-xs leading-5 text-slate-500">
                  Each contact gets an independent random outcome. This does not
                  guarantee exactly one winner.
                </p>
              </>
            )}
            {node.kind === "condition" && (
              <>
                <Field
                  label="Saved answer or tag field"
                  value={node.field}
                  onChange={(v) => update({ field: v })}
                />
                <Field
                  label="Equals (case sensitive)"
                  value={node.equals}
                  onChange={(v) => update({ equals: v })}
                />
                <p className="text-xs text-slate-500">
                  For a tag named interested, use tag_interested equals true.
                </p>
              </>
            )}
            {node.kind === "tag" && (
              <>
                <Field
                  label="Tag"
                  value={node.tag}
                  onChange={(v) => update({ tag: v })}
                />
                <p className="text-xs text-slate-500">
                  Tags apply within this conversation flow.
                </p>
              </>
            )}
            {"yes" in node && (
              <>
                {connection(
                  node.kind === "random"
                    ? `Path A (${node.percent}%)`
                    : "Matches",
                  node.yes,
                  (v) => update({ yes: v }),
                )}
                {connection("Other path", node.no, (v) => update({ no: v }))}
              </>
            )}
            {"next" in node &&
              connection(
                node.kind === "email" ? "Valid email →" : "Next step",
                node.next,
                (v) => update({ next: v }),
              )}
            {node.kind === "email" &&
              connection("SKIP →", node.skip, (v) => update({ skip: v }))}
          </>
        ) : (
          <p className="text-sm text-slate-500">Select a step on the canvas.</p>
        )}
      </aside>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  max = 1000,
  area = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max?: number;
  area?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold">
      {label}
      {area ? (
        <textarea
          value={value}
          maxLength={max}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className="ap3k-textarea mt-2 w-full rounded-lg p-3 text-sm"
        />
      ) : (
        <input
          value={value}
          maxLength={max}
          onChange={(e) => onChange(e.target.value)}
          className="ap3k-input min-h-11 min-w-0 mt-2 w-full rounded-lg p-2 text-sm"
        />
      )}
    </label>
  );
}
