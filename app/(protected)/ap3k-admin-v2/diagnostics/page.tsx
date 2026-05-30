import { getAdminV2WebhookEvents, getAdminV2LoopGuardEvents } from "@/lib/admin-v2/queries";
import { V2Table } from "@/components/admin-v2/v2-table";
import { V2Badge, statusTone, eventTone } from "@/components/admin-v2/v2-badge";
import { AdvancedPanel } from "@/components/admin-v2/advanced-panel";
import { humanError, humanEvent } from "@/lib/admin-v2/labels";
import LocalTime from "@/components/global/local-time";

export default async function AdminV2DiagnosticsPage() {
  const [webhooks, loopGuard] = await Promise.all([
    getAdminV2WebhookEvents(0),
    getAdminV2LoopGuardEvents(),
  ]);

  const loopGuardRows = loopGuard.map((e) => [
    <span key="time" className="tabular-nums text-[11px] text-slate-500">
      <LocalTime value={e.createdAt} />
    </span>,
    <V2Badge key="type" tone={eventTone(e.eventType)}>
      {humanEvent(e.eventType)}
    </V2Badge>,
    <span key="campaign" className="text-[11px] text-slate-300">{e.campaignName ?? "—"}</span>,
    <span key="owner" className="text-[11px] text-slate-500">{e.ownerEmail ?? "—"}</span>,
  ]);

  const webhookRows = webhooks.map((e) => [
    <span key="time" className="tabular-nums text-[11px] text-slate-500">
      <LocalTime value={e.createdAt} />
    </span>,
    <V2Badge key="source" tone={e.eventSource === "META_REAL" ? "green" : "blue"}>
      {e.eventSource === "META_REAL" ? "Meta" : e.eventSource}
    </V2Badge>,
    <span key="type" className="text-[11px] text-slate-300">{humanEvent(e.eventType)}</span>,
    <V2Badge key="status" tone={statusTone(e.status)}>{e.status}</V2Badge>,
    <span key="campaign" className="text-[11px] text-slate-400">{e.campaignName ?? "—"}</span>,
    <div key="error" className="max-w-[240px]">
      {e.errorMessage ? (
        <>
          <p className="text-[11px] text-slate-300">{humanError(e.errorMessage)}</p>
          <AdvancedPanel label="Raw code">
            <p className="font-mono text-[10px] text-slate-500">{e.errorMessage}</p>
          </AdvancedPanel>
        </>
      ) : (
        <span className="text-[11px] text-slate-600">—</span>
      )}
    </div>,
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-pink-400">Diagnostics</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-white">System Diagnostics</h1>
        <p className="mt-1 text-xs text-slate-500">
          Internal signals only. Raw codes are behind expandable panels. Not visible to users or Meta reviewers.
        </p>
      </div>

      {loopGuard.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-black text-amber-400">⚠ Loop Guard Events (latest 50)</h2>
          <V2Table
            headers={["Time", "Event", "Campaign", "Owner"]}
            rows={loopGuardRows}
            empty="No loop guard events."
          />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-400">
          Webhook Events (latest 50)
        </h2>
        <V2Table
          headers={["Time", "Source", "Type", "Status", "Campaign", "Error"]}
          rows={webhookRows}
          empty="No webhook events found."
        />
        <AdvancedPanel label="App Review Notes">
          <p className="text-xs leading-relaxed text-slate-400">
            This section shows webhook delivery signals for internal debugging only.
            It is not visible to users or Meta App Review evaluators.
            Raw error codes are hidden behind expandable panels above.
          </p>
        </AdvancedPanel>
      </section>
    </div>
  );
}
