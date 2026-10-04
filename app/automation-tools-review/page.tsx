import { notFound } from "next/navigation";
import Review from "./review";
export const metadata = { robots: { index: false, follow: false } };
export default function Page({ searchParams }: { searchParams: { frame?: string; state?: string; dark?: string } }) {
  if (process.env.VERCEL_ENV !== "preview" && process.env.NODE_ENV === "production") notFound();
  return <Review frame={searchParams.frame === "1"} state={searchParams.state ?? "caution"} dark={searchParams.dark === "1"} />;
}
