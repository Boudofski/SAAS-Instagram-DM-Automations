import NavBar from "@/components/global/navbar";
import Sidebar from "@/components/global/sidebar";
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
  const query = new QueryClient();

  await PrefetchUserProfile(query);

  await PrefetchUserAutomation(query);

  return (
    <HydrationBoundary state={dehydrate(query)}>
      <div className="p-3">
        <Sidebar slug={params.slug} />
        <div className="lg:ml-[250px] lg:pl-10 lg:py-5 flex flex-col overflow-auto">
          <NavBar slug={params.slug} />
          {children}
        </div>
      </div>
    </HydrationBoundary>
  );
}

export default Layout;
