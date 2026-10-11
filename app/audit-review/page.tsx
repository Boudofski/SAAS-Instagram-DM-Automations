import { notFound } from "next/navigation";
import Review from "./review";
export const metadata = { robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ frame?: string; screen?: string; theme?: string }> }) {
  if (process.env.VERCEL_ENV !== "preview") notFound();
  return <Review {...await searchParams}/>;
}
