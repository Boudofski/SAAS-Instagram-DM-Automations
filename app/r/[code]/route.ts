import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE,
  normalizeReferralCode,
} from "@/lib/referral-program";
import { client } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  const code = normalizeReferralCode(params.code);
  const destination = new URL("/sign-up", request.url);
  if (!code) return NextResponse.redirect(destination);

  const partner = await client.referralPartner.findUnique({
    where: { code },
    select: { id: true },
  });
  const response = NextResponse.redirect(destination);
  if (!partner) return response;

  response.cookies.set(REFERRAL_COOKIE, code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFERRAL_COOKIE_MAX_AGE,
  });
  return response;
}
