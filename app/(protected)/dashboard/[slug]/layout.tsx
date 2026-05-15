import NavBar from "@/components/global/navbar";
import Sidebar from "@/components/global/sidebar";
import { onUserInfo } from "@/actions/user";
import { dashboardPath } from "@/lib/dashboard";
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
      <div className="min-h-screen bg-slate-50 p-3 text-slate-950">
        <Sidebar slug={params.slug} />
        <div className="relative z-10 flex flex-col overflow-auto lg:ml-[260px] lg:pl-8 lg:py-5">
          <NavBar slug={params.slug} />
          {children}
        </div>
      </div>
    </HydrationBoundary>
  );
}

export default Layout;
