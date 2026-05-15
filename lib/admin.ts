import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

function parseAllowlist(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireOwnerAdmin() {
  const user = await currentUser();
  if (!user) notFound();

  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
  const emailAllowlist = parseAllowlist(
    process.env.ADMIN_EMAILS || "officialabde@gmail.com"
  );
  const clerkIdAllowlist = parseAllowlist(process.env.ADMIN_CLERK_USER_IDS);

  const allowedByEmail = Boolean(email && emailAllowlist.includes(email));
  const allowedByClerkId = clerkIdAllowlist.includes(user.id.toLowerCase());

  if (!allowedByEmail && !allowedByClerkId) {
    console.warn("[admin-denied]", {
      currentUserExists: true,
      emailMatched: false,
      clerkIdMatched: false,
    });
    notFound();
  }

  return {
    clerkId: user.id,
    email,
    name: user.fullName,
  };
}

export function maskSecret(value?: string | null) {
  if (!value) return "empty";
  if (value.length <= 4) return "stored";
  return `stored ending ${value.slice(-4)}`;
}
