import Link from "next/link";
import { MailCheck, Send, ShieldCheck, TriangleAlert } from "lucide-react";
import { adminSendEmailTestAction } from "@/actions/admin/email";
import { AdminPageHeader, AdminSectionHeader, AdminSurface } from "@/components/admin-v2/page-header";
import { V2Badge } from "@/components/admin-v2/v2-badge";
import { EMAIL_TEMPLATE_LIST, EMAIL_TEMPLATES, isEmailTemplateId } from "@/lib/email/catalog";
import { getEmailAdminOverview } from "@/lib/email/admin";
import LocalTime from "@/components/global/local-time";

export default async function EmailCenterPage({ searchParams }: { searchParams?: { template?: string; test?: string } }) {
  const selectedId = isEmailTemplateId(searchParams?.template) ? searchParams.template : "welcome";
  const selected = EMAIL_TEMPLATES[selectedId];
  const overview = await getEmailAdminOverview();
  const sentCount = (overview.counts.SENT || 0) + (overview.counts.DELIVERED || 0) + (overview.counts.OPENED || 0) + (overview.counts.CLICKED || 0);
  const failureCount = (overview.counts.FAILED || 0) + (overview.counts.BOUNCED || 0) + (overview.counts.COMPLAINED || 0) + (overview.counts.SUPPRESSED || 0);

  return (
    <div className="flex flex-col gap-7 sm:gap-8">
      <AdminPageHeader
        eyebrow="Email system"
        title="AP3K Email Center"
        description="Preview every customer email, verify delivery health, and send a protected test to the owner inbox. Critical facts stay deterministic; optional AI copy can only personalize non-sensitive lifecycle messages."
        actions={<V2Badge tone={overview.configuration.configured ? "green" : "amber"}>{overview.configuration.configured ? "Delivery connected" : "Connection required"}</V2Badge>}
      />

      {searchParams?.test ? (
        <div className={`rounded-xl border px-4 py-3 text-xs font-bold ${searchParams.test === "sent" ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-200" : "border-amber-500/20 bg-amber-500/[0.08] text-amber-200"}`}>
          {searchParams.test === "sent" ? "Test email sent to the AP3K owner inbox." : searchParams.test === "not-configured" ? "Connect Resend and verify the AP3K sending domain before sending tests." : `Test email was not sent (${searchParams.test}).`}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard label="Templates" value={EMAIL_TEMPLATE_LIST.length} detail="Transactional + lifecycle" icon={<MailCheck className="h-4 w-4" />} />
        <StatusCard label="Successful" value={sentCount} detail="Sent or confirmed by Resend" icon={<Send className="h-4 w-4" />} />
        <StatusCard label="Delivery issues" value={failureCount} detail="Failed, bounced, or suppressed" icon={<TriangleAlert className="h-4 w-4" />} />
        <StatusCard label="Webhook" value={overview.configuration.webhookConfigured ? "Ready" : "Missing"} detail="Signed delivery events" icon={<ShieldCheck className="h-4 w-4" />} />
      </div>

      <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div>
          <AdminSectionHeader title="Template library" description="Choose any customer event to inspect its real email." />
          <AdminSurface className="max-h-[760px] overflow-y-auto p-2">
            <div className="space-y-1">
              {EMAIL_TEMPLATE_LIST.map((template) => (
                <Link key={template.id} href={`/admin/emails?template=${template.id}`} className={`block rounded-xl border px-3 py-3 transition ${template.id === selectedId ? "border-pink-400/20 bg-pink-400/[0.08]" : "border-transparent hover:border-white/[0.06] hover:bg-white/[0.03]"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black text-slate-100">{template.label}</p>
                    <span className="rounded-full border border-white/[0.07] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">{template.category}</span>
                  </div>
                  <p className="mt-1 text-[10px] leading-4 text-slate-500">{template.description}</p>
                </Link>
              ))}
            </div>
          </AdminSurface>
        </div>

        <div>
          <AdminSectionHeader
            title={selected.label}
            description={`${selected.description} ${selected.aiPersonalization ? "Safe AI personalization is available for this lifecycle message." : "Account facts and wording remain deterministic."}`}
            action={
              <form action={adminSendEmailTestAction.bind(null, selected.id)}>
                <button disabled={!overview.configuration.configured} className="rounded-lg border border-pink-400/20 bg-pink-400/[0.08] px-3 py-2 text-[11px] font-black text-pink-200 transition hover:bg-pink-400/[0.14] disabled:cursor-not-allowed disabled:opacity-40">Send owner test</button>
              </form>
            }
          />
          <AdminSurface className="overflow-hidden p-2 sm:p-3">
            <iframe title={`${selected.label} email preview`} src={`/api/admin/email-preview?template=${selected.id}`} className="h-[760px] w-full rounded-xl border-0 bg-[#F6F5FB]" />
          </AdminSurface>
        </div>
      </section>

      <section>
        <AdminSectionHeader title="Recent delivery activity" description="Provider IDs and failure states are stored for support and deliverability diagnostics." />
        <AdminSurface className="overflow-hidden">
          {overview.recent.length ? (
            <div className="divide-y divide-white/[0.05]">
              {overview.recent.map((delivery) => (
                <div key={delivery.id} className="grid gap-2 px-4 py-3 text-[11px] sm:grid-cols-[150px_minmax(0,1fr)_130px_110px] sm:items-center">
                  <V2Badge tone={["FAILED", "BOUNCED", "COMPLAINED", "SUPPRESSED"].includes(delivery.status) ? "red" : delivery.status === "SKIPPED" ? "amber" : "green"}>{delivery.status}</V2Badge>
                  <div className="min-w-0"><p className="truncate font-bold text-slate-200">{delivery.subject}</p><p className="truncate text-slate-600">{delivery.templateId} · {delivery.recipient}</p>{delivery.errorMessage ? <p className="mt-1 text-rose-300">{delivery.errorMessage}</p> : null}</div>
                  <p className="truncate font-mono text-[9px] text-slate-600">{delivery.providerMessageId || "No provider ID"}</p>
                  <p className="text-slate-500"><LocalTime value={delivery.createdAt} /></p>
                </div>
              ))}
            </div>
          ) : <div className="px-5 py-12 text-center text-sm text-slate-500">No AP3K application emails have been sent yet.</div>}
        </AdminSurface>
      </section>
    </div>
  );
}

function StatusCard({ label, value, detail, icon }: { label: string; value: string | number; detail: string; icon: React.ReactNode }) {
  return <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex items-center justify-between"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">{label}</p><span className="text-pink-300">{icon}</span></div><p className="mt-3 text-2xl font-black tracking-tight text-white">{value}</p><p className="mt-1 text-[10px] text-slate-500">{detail}</p></div>;
}
