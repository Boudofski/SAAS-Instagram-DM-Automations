import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { client } from "@/lib/prisma";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({}, { status: 403 });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({}, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!SUPPORTED_LOCALES.includes(body?.locale as Locale))
    return NextResponse.json({}, { status: 400 });
  await client.user.updateMany({
    where: {
      clerkId: userId,
      OR: [
        { preferredLocale: null },
        { preferredLocale: { not: body.locale } },
      ],
    },
    data: { preferredLocale: body.locale },
  });
  return NextResponse.json({ ok: true });
}
