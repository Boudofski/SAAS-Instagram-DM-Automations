"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePath } from "@/hooks/user-nav";
import SubscriptionPlan from "../subscription-plan";
import AP3kLogo from "../ap3k-logo";
import { Home, Link2, Megaphone, Settings } from "lucide-react";
import { useQueryUser } from "@/hooks/user-queries";
import { useClerk, useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";

const NAV = [
  { icon: Home, label: "Home",         segment: "" },
  { icon: Megaphone, label: "Campaigns",    segment: "automation" },
  { icon: Link2, label: "Integrations", segment: "integrations" },
  { icon: Settings, label: "Settings",    segment: "settings" },
] as const;

type Props = { slug: string };

export default function Sidebar({ slug }: Props) {
  const { page } = usePath();
  const { data } = useQueryUser();
  const { user } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const instagram = data?.data?.integrations?.[0];
  const displayName =
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    "Signed in";
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-[260px] flex-col border-r border-slate-200
                      bg-white/92 py-0 text-slate-950 shadow-[18px_0_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl lg:flex">
      {/* Logo */}
      <div className="border-b border-slate-200 px-5 py-5">
        <AP3kLogo className="text-sm text-slate-950" />
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            AP3k user
          </p>
          <p className="mt-2 truncate text-sm font-black text-slate-950">
            {displayName}
          </p>
          {email && (
            <p className="truncate text-xs text-slate-500">{email}</p>
          )}
        </div>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Instagram account
          </p>
          <div className="mt-3 flex items-center gap-3">
            {instagram?.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={instagram.profilePictureUrl}
                alt={instagram.instagramUsername ?? "Instagram account"}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-ap3k-gradient text-xs font-black text-white">
                IG
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">
                {instagram?.instagramUsername
                  ? `@${instagram.instagramUsername}`
                  : "Not connected"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {instagram ? "Official Meta connection" : "Connect to start"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const href = `/dashboard/${slug}${item.segment ? `/${item.segment}` : ""}`;
          const isActive =
            item.segment === ""
              ? page === slug || page === ""
              : page === item.segment;
          return (
            <Link
              key={item.segment}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                isActive
                  ? "border border-pink-200 bg-gradient-to-r from-orange-50 via-pink-50 to-indigo-50 text-slate-950 shadow-[0_10px_30px_rgba(221,42,123,0.10)]"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade card — Free tier only */}
      <SubscriptionPlan type="FREE">
        <div className="px-3 pb-4">
          <div className="relative overflow-hidden rounded-2xl border border-pink-200 bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 p-4">
            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-rf-pink/20 blur-2xl" />
            <p className="relative text-xs font-black text-slate-950 mb-1">Upgrade to Creator</p>
            <p className="text-[11px] text-slate-500 mb-3 leading-snug">
              Unlock AI replies &amp; unlimited campaigns
            </p>
            <Link
              href="/payment"
              className="ap3k-gradient-button block py-2 text-center text-xs"
            >
              Upgrade — $29/mo
            </Link>
          </div>
        </div>
      </SubscriptionPlan>
      <div className="border-t border-slate-200 p-3">
        <button
          onClick={() => {
            queryClient.clear();
            void signOut({ redirectUrl: "/" });
          }}
          className="flex w-full items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
