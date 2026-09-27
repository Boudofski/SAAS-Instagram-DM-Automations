"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { activateAutomation } from "@/actions/automation";
import { refreshSavedAutomation } from "@/lib/automation-query-cache";
import { BarChart3, Lightbulb, MessageCircleMore, MousePointerClick, SquarePen, UserRoundCheck, UsersRound } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import type { AutomationAnalytics } from "@/lib/automation-analytics";
import "./automation-analytics.css";

export default function AutomationAnalyticsView({ data, slug }: { data: AutomationAnalytics; slug: string }) {
  const [tab, setTab] = useState<"hits" | "clicks" | "follows">("hits");
  const { automation: a, totals: t } = data;
  const [active, setActive] = useState(a.active);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => setActive(a.active), [a.active]);
  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const next = !active;
      const result = await activateAutomation(a.id, next);
      if (result.status === 200) {
        setActive(next);
        await refreshSavedAutomation(queryClient, a.id);
        router.refresh();
      } else setError(String(result.data));
    } catch {
      setError("Could not update this automation. Try again.");
    } finally { setBusy(false); }
  }
  const sourceLabel = a.source === "COMMENT" ? "Comment" : a.source === "STORY" ? "Story" : "Message";
  const sourceNoun = sourceLabel.toLowerCase();
  const followDescription = "New followers are counted only when Instagram confirms a change from not following to following within seven days of a follow check. Existing followers and unknown statuses are excluded.";
  const metrics = [
    { label: "Total hits", value: t.hits.toLocaleString(), detail: `${sourceLabel} triggers received`, Icon: MessageCircleMore, explanation: "Recorded automation triggers. Duplicate webhook deliveries are counted once." },
    { label: "Click rate", value: `${t.clickRate.toFixed(1)}%`, detail: `${t.clicks.toLocaleString()} of ${t.uniqueHitRecipients.toLocaleString()} opened link`, Icon: MousePointerClick, explanation: "Unique people who opened a tracked link divided by unique people who triggered this automation." },
    { label: "Follow conversion", value: `${t.followRate.toFixed(1)}%`, detail: `${t.newFollowers.toLocaleString()} followed via Ask-to-Follow`, Icon: UsersRound, explanation: `${t.newFollowers.toLocaleString()} of ${t.eligibleNonFollowers.toLocaleString()} verified non-followers followed. ${followDescription}` },
    { label: "New followers", value: t.newFollowers.toLocaleString(), detail: "From this automation", Icon: UserRoundCheck, explanation: followDescription },
  ];
  const funnel = [
    { label: "Hits", detail: `${sourceNoun} triggers`, value: t.hits, color: "#a5b4fc" },
    { label: "Clicks", detail: "opened the link", value: t.clicks, color: "#84bf46" },
    { label: "Follows", detail: "followed to unlock", value: t.newFollowers, color: "#e99b20" },
  ];
  const tabDescription = { hits: `Latest ${sourceNoun} triggers`, clicks: "Latest link opens", follows: "Latest new followers" };
  const hasDailyActivity = data.daily.some(day => day.hits > 0 || day.clicks > 0);
  const dateLabel = (date: string, weekday = false) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", weekday ? { weekday: "short", timeZone: "UTC" } : { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return (
    <main className="automation-analytics-page" aria-label="Automation analytics">
      <section className="aa-panel aa-summary">
        {a.postThumbnail ? <img src={a.postThumbnail} alt="Automation post" className="aa-thumbnail" /> : <span className="aa-thumbnail aa-placeholder"><BarChart3 size={25} /></span>}
        <div className="aa-summary-copy">
          <div className="aa-title-row"><h1>{a.name}</h1><span className={`aa-status ${active ? "aa-status-active" : ""}`}><i />{active ? "Active" : "Paused"}</span></div>
          <p>Created {new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })} · {a.responseCount.toLocaleString()} Auto Replies · {a.messageType ?? `${sourceLabel} automation`}</p>
        </div>
        <div className="aa-summary-actions">
          <Link aria-label="Edit automation" title="Edit automation" className="aa-edit" href={`/dashboard/${slug}/automation/new?edit=${a.id}`}><SquarePen size={23} /></Link>
          <button type="button" role="switch" aria-label="Automation active" aria-checked={active} disabled={busy} onClick={() => void toggle()} className={`aa-switch ${active ? "aa-switch-on" : ""}`}><span /></button>
        </div>
      </section>
      {error && <p role="alert" className="aa-error">{error}</p>}
      <div className="aa-metrics">
        {metrics.map(({ label, value, detail, Icon, explanation }) => <section key={label} className="aa-panel aa-metric" aria-label={label}>
          <span className="aa-metric-icon"><Icon size={21} strokeWidth={1.8} /></span>
          <h2 title={explanation}>{label}</h2><p className="aa-metric-value">{value}</p><p className="aa-metric-detail">{detail}</p>
        </section>)}
      </div>
      <div className="aa-chart-grid">
        <section className="aa-panel aa-funnel">
          <h2>Conversion funnel</h2><p className="aa-subtitle">From {sourceNoun} to follow</p>
          <div className="aa-funnel-steps">{funnel.map(item => <div key={item.label}>
            <div className="aa-funnel-label"><i style={{ background: item.color }} /><strong>{item.label}</strong><span>{item.detail}</span><b>{item.value.toLocaleString()}</b></div>
            <div className="aa-funnel-track" role="meter" aria-label={item.label} aria-valuenow={item.value} aria-valuemin={0} aria-valuemax={Math.max(1, t.hits, item.value)}>
              <div style={{ background: item.color, width: `${t.hits ? Math.min(100, item.value / t.hits * 100) : 0}%` }} />
            </div>
          </div>)}</div>
          {!t.hits && <p className="aa-no-activity"><Lightbulb size={18} /><span>No activity yet. Once {a.source === "COMMENT" ? "comments" : a.source === "STORY" ? "story interactions" : "messages"} come in, the funnel fills here.</span></p>}
        </section>
        <section className="aa-panel aa-daily">
          <header className="aa-chart-header"><div><h2>Daily activity</h2><p className="aa-subtitle">Hits vs clicks over the last 7 days</p></div><div className="aa-legend"><span><i className="aa-hit-dot" />Hits</span><span><i className="aa-click-dot" />Clicks</span></div></header>
          <div className="aa-chart" role="img" aria-label="Hits and clicks over the last seven days, grouped by UTC date">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily} margin={{ top: 14, right: 12, left: 12, bottom: 0 }}>
                <XAxis dataKey="date" tickFormatter={value => dateLabel(value, true)} tick={{ fontSize: 12, fill: "var(--aa-faint)" }} axisLine={false} tickLine={false} tickMargin={14} interval="preserveStartEnd" minTickGap={16} />
                <YAxis hide={!hasDailyActivity} allowDecimals={false} domain={[0, "auto"]} tick={{ fontSize: 11, fill: "var(--aa-muted)" }} width={30} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={value => `${dateLabel(String(value))} · UTC`} contentStyle={{ background: "var(--aa-panel)", border: "1px solid var(--aa-border)", borderRadius: 10, color: "var(--aa-text)", fontSize: 12 }} />
                <Line name="Clicks" dataKey="clicks" stroke="#84bf46" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line name="Hits" dataKey="hits" stroke="#465fff" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      <section className="aa-panel aa-countries"><h2>Clicks by country</h2><p className="aa-subtitle">Top regions opening your link</p>
        {!data.countries.length ? <p className="aa-empty aa-empty-muted">No data available</p> : <div className="aa-country-list">{data.countries.map(country => <div className="aa-country" key={country.country ?? "unknown"}>
          <span>{countryName(country.country)}</span><div className="aa-country-track"><div style={{ width: `${Math.min(100, country.clicks / Math.max(1, t.clicks) * 100)}%` }} /></div><strong>{country.clicks.toLocaleString()}</strong>
        </div>)}</div>}
      </section>
      <section className="aa-panel aa-recent">
        <header><div><h2>Recent activity</h2><p className="aa-subtitle">{tabDescription[tab]}</p></div>
          <div role="tablist" aria-label="Activity type" className="aa-tabs">{(["hits", "clicks", "follows"] as const).map((value, index, values) => <button type="button" role="tab" aria-selected={tab === value} aria-controls="automation-activity-panel" id={`automation-activity-${value}`} tabIndex={tab === value ? 0 : -1} key={value} onClick={() => setTab(value)} onKeyDown={event => {
            const next = event.key === "ArrowRight" ? (index + 1) % values.length : event.key === "ArrowLeft" ? (index + values.length - 1) % values.length : event.key === "Home" ? 0 : event.key === "End" ? values.length - 1 : -1;
            if (next < 0) return;
            event.preventDefault(); setTab(values[next]); document.getElementById(`automation-activity-${values[next]}`)?.focus();
          }}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div>
        </header>
        <div role="tabpanel" id="automation-activity-panel" aria-labelledby={`automation-activity-${tab}`} tabIndex={0}>
          {!data.recent[tab].length ? <p className="aa-empty">No data available</p> : <div className="aa-activity-list">{data.recent[tab].map(row => <div className="aa-activity" key={row.id}>
            <span className="aa-contact-icon"><UsersRound size={17} /></span><strong>Contact {row.recipient}</strong><span className="aa-activity-kind">{tab === "hits" ? `${row.source === "COMMENT" ? "Comment" : row.source === "STORY" ? "Story" : "Message"} trigger` : tab === "follows" ? "New follower" : countryName(row.country ?? null)}</span><time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString()}</time>
          </div>)}</div>}
        </div>
      </section>
      <p className="aa-tracking-note">{data.trackingStartedAt ? `Tracked activity since ${new Date(data.trackingStartedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}.` : "Tracking starts with new activity."} <span title={followDescription}>New followers are verified through this automation.</span></p>
    </main>
  );
}
function countryName(code: string | null) {
  if (!code) return "Unknown";
  try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code; } catch { return code; }
}
