import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { client } from "@/lib/prisma";
import { getUserMonthlyUsage } from "@/actions/usage/queries";
export const dynamic = "force-dynamic";
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({}, { status: 401 });
  const user = await client.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!user) return NextResponse.json({}, { status: 404 });
  const usage = await getUserMonthlyUsage(user.id);
  return NextResponse.json(
    { used: usage.staticReplies.used, limit: usage.staticReplies.limit },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
