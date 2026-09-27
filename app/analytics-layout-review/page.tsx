import { notFound } from "next/navigation";
import Review from "./review";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default function Page({ searchParams }: { searchParams: { theme?: string; populated?: string } }) {
  if (process.env.VERCEL_ENV !== "preview") notFound();
  return <Review dark={searchParams.theme === "dark"} populated={searchParams.populated === "1"} />;
}
