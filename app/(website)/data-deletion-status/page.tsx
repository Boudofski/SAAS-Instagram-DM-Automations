import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion Status — AP3k",
  description: "Status page for AP3k Meta data deletion requests.",
};

type DataDeletionStatusPageProps = {
  searchParams?: {
    code?: string;
  };
};

export default function DataDeletionStatusPage({ searchParams }: DataDeletionStatusPageProps) {
  const code = typeof searchParams?.code === "string" ? searchParams.code : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-rf-background px-6 text-rf-text">
      <section className="max-w-xl text-center">
        <p className="ap3k-kicker">Data deletion status</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          Your data deletion request was received and processed.
        </h1>
        <p className="mt-4 text-sm leading-7 text-rf-muted">
          AP3k has processed the Meta data deletion callback for this request.
          No further action is required.
        </p>
        {code ? (
          <p className="mt-6 break-all rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-rf-muted">
            Confirmation code: <span className="font-bold text-rf-text">{code}</span>
          </p>
        ) : null}
      </section>
    </main>
  );
}
