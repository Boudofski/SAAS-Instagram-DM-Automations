import { notFound } from "next/navigation";
import AutomationLibrary from "@/components/dashboard/automation-library";
import AutomationTable from "@/components/dashboard/automation-table";
import QuickStart from "@/components/dashboard/quick-start";
export const metadata = { robots: { index: false, follow: false } };
export default function Review() {
  if (process.env.VERCEL_ENV !== "preview" && process.env.NODE_ENV === "production") notFound();
  const automations = [
    { name: "Creator guide — Instagram comments", active: true, source: "COMMENT", triggerMode: "ANY_COMMENT", metrics: { runs: 255, leads: 247 } },
    { name: "دليل التصوير الإعلاني وتصميم المنتجات", active: false, source: "COMMENT", metrics: { runs: 40, leads: 32 } },
    { name: "New followers welcome message", active: false, source: "DM", needsReview: true, metrics: { runs: 0, leads: 0 } },
    { name: "Story replies", active: true, source: "STORY", metrics: { runs: 329, leads: 313 } },
  ].map((row, i) => ({ ...row, id: `00000000-0000-0000-0000-00000000000${i}`, createdAt: new Date(2026,9,6-i), posts: [{ postid: "ANY" }], keywords: [{word:"GUIDE"}], listener: { commentReply:"Sent!" } }));
  return <main className="min-h-screen bg-slate-50 p-3 text-slate-950 dark:bg-[#090b15] dark:text-white"><QuickStart slug="preview"/><h2 className="my-3 font-bold">Recent automations</h2><AutomationTable slug="preview" automations={automations} showControls={false}/><h2 className="my-4 font-bold">Automation library</h2><AutomationLibrary slug="preview" automations={automations}/></main>;
}
