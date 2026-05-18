import NavBar from "@/components/global/navbar";
import Sidebar from "@/components/global/sidebar";
import { onUserInfo } from "@/actions/user";
import { dashboardPath } from "@/lib/dashboard";
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
import { redirect } from "next/navigation";
import React from "react";

export const metadata: Metadata = {
  title: "Dashboard — AP3k",
  description: "Manage your Instagram DM automations",
};

type Props = {
  children: React.ReactNode;
  params: {
    slug: string;
  };
};

async function Layout({ children, params }: Props) {
  const userResult = await onUserInfo();
  const currentClerkId = userResult.status === 200 ? userResult.data?.clerkId : null;

  if (!currentClerkId) {
    redirect("/sign-in");
  }

  if (params.slug !== currentClerkId) {
    console.warn("[tenant-denied]", {
      route: "/dashboard/[slug]",
      currentUserExists: true,
      targetResourceExists: Boolean(params.slug),
      ownershipMatch: false,
      resource: "DashboardSlug",
    });
    redirect(dashboardPath(currentClerkId));
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
