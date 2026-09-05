import InboxClient from "@/components/dashboard/inbox-client";

export const metadata = { title: "Inbox | AP3K" };

export default function InboxPage({ searchParams }: { searchParams?: { conversation?: string } }) {
  return <InboxClient initialConversationId={searchParams?.conversation} />;
}
