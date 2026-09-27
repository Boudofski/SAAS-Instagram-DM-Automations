import { redirect } from "next/navigation";

// Existing automation detail links open the account-scoped analytics page.
export default function LegacyAutomationPage({ params }: { params: { slug: string; id: string } }) {
  redirect(`/dashboard/${encodeURIComponent(params.slug)}/automation/${encodeURIComponent(params.id)}/analytics`);
}
