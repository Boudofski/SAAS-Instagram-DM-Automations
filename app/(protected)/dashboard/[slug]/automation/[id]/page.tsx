import { redirect } from "next/navigation";

// Keep bookmarks and previously sent links working after removing the details view.
// The editor loads the automation through the existing ownership-checked action.
export default function LegacyAutomationPage({ params }: { params: { slug: string; id: string } }) {
  redirect(`/dashboard/${encodeURIComponent(params.slug)}/automation/new?edit=${encodeURIComponent(params.id)}`);
}
