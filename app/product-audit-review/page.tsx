import { notFound } from "next/navigation";
import Review from "./review";
export const metadata = { robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  if (process.env.VERCEL_ENV !== "preview" && process.env.NODE_ENV === "production") notFound();
  return <Review screen={(await searchParams).screen} />;
}
