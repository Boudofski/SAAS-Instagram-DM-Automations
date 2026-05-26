import NavBar from "@/components/global/navbar";
import Sidebar from "@/components/global/sidebar";
import { client } from "@/lib/prisma";
import { getDashboardSlugRedirect } from "@/lib/landing-redirect";
import { ClerkCacheSyncer } from "@/providers/clerk-cache-syncer";
import {
  PrefetchUserAutomation,
  PrefetchUserProfile,
} from "@/react-query/prefetch";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

export const metadata: Metadata = {
  title: "Dashboard — AP3k",
  description: "Monitor campaigns, replies, leads, and delivery logs for your Instagram comment automations.",
};

type Props = {
  children: React.ReactNode;
  params: {
    slug: string;
  };
};

async function Layout({ children, params }: Props) {
  const clerkUser = await currentUser();
  const profile = clerkUser
    ? await client.user.findUnique({
        where: { clerkId: clerkUser.id },
        select: { clerkId: true },
      })
    : null;
  const redirectTo = getDashboardSlugRedirect({
    clerkUserId: clerkUser?.id,
    profileClerkId: profile?.clerkId,
    requestedSlug: params.slug,
  });

  if (redirectTo) {
    console.warn("[tenant-denied]", {
      route: "/dashboard/[slug]",
      currentUserExists: Boolean(clerkUser?.id),
      targetResourceExists: Boolean(params.slug),
      ownershipMatch: Boolean(profile?.clerkId && params.slug === profile.clerkId),
      resource: "DashboardSlug",
    });
    redirect(redirectTo);
  }

  const query = new QueryClient();

  await PrefetchUserProfile(query);

  await PrefetchUserAutomation(query);

  return (
    <HydrationBoundary state={dehydrate(query)}>
      <ClerkCacheSyncer />
      <div className="ap3k-page overflow-x-hidden">
        <Sidebar slug={params.slug} />
        <div className="relative z-10 flex min-w-0 flex-col px-3 py-3 lg:ml-[260px] lg:px-6 lg:py-5">
          <NavBar slug={params.slug} />
          {children}
        </div>
      </div>
    </HydrationBoundary>
  );
}

export default Layout;
