import Link from "next/link";

type Props = { params: { slug: string } };

const REVIEW_STEPS = [
  "Connect Instagram with Meta Login",
  "Create campaign",
  "Add keyword trigger",
  "Enable public reply",
  "Comment from another Instagram account",
  "Confirm public reply sent",
  "Review activity log and captured lead",
];

export default function ReviewDemoPage({ params }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-1 py-4 text-slate-950 dark:text-slate-50 sm:px-2 lg:py-8">
      <div>
        <p className="ap3k-kicker">App Review demo</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">End-to-end review checklist</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Use this clean checklist for the screencast flow. It uses real AP3k screens and does not create sample data.
        </p>
      </div>

      <section className="ap3k-card rounded-2xl p-5 sm:p-6">
        <ol className="grid gap-3">
          {REVIEW_STEPS.map((step, index) => (
            <li key={step} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rf-pink/10 text-xs font-black text-rf-pink">
                {index + 1}
              </span>
              <span className="pt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href={`/dashboard/${params.slug}/account`} className="ap3k-gradient-button inline-flex justify-center px-5 py-2.5 text-sm">
          Start with Instagram connection
        </Link>
        <Link href={`/dashboard/${params.slug}/automation/new`} className="ap3k-outline-button inline-flex justify-center px-5 py-2.5 text-sm">
          Create campaign
        </Link>
      </div>
    </div>
  );
}
