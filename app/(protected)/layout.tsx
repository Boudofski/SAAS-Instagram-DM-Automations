import { ClerkProvider } from "@clerk/nextjs";
import React from "react";

export const metadata = { robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
