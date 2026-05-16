"use client";

import {
  disconnectCurrentInstagramIntegration,
  getCurrentWebhookHealth,
  getInstagramConnectUrl,
  resubscribeCurrentInstagramWebhooks,
} from "@/actions/integration";
import { onUserInfo } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { toast } from "sonner";

type Props = {
  title: string;
  description: string;
  icon: React.ReactNode;
  strategy: "INSTAGRAM" | "CRM";
};

function IntegrationCard({ title, description, icon, strategy }: Props) {
  const [isConnecting, setIsConnecting] = React.useState(false);
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: onUserInfo,
    enabled: Boolean(userId),
  });

  const { data: health } = useQuery({
    queryKey: ["webhook-health", userId],
    queryFn: getCurrentWebhookHealth,
    enabled: Boolean(userId) && strategy === "INSTAGRAM",
  });

  const resubscribe = useMutation({
    mutationKey: ["resubscribe-webhooks", userId],
    mutationFn: resubscribeCurrentInstagramWebhooks,
    onSuccess: async (result) => {
      if (result.status === 200) {
        toast.success(result.data);
      } else {
        toast.error(result.data ?? "Webhook resubscribe failed");
      }
      await queryClient.invalidateQueries({ queryKey: ["webhook-health", userId] });
    },
  });

  const disconnect = useMutation({
    mutationKey: ["disconnect-instagram", userId],
    mutationFn: disconnectCurrentInstagramIntegration,
    onSuccess: async (result) => {
      if (result.status === 200) {
        toast.success(result.data);
      } else {
        toast.error(result.data ?? "Instagram disconnect failed");
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-profile", userId] }),
        queryClient.invalidateQueries({ queryKey: ["webhook-health", userId] }),
      ]);
    },
  });

  const integrated = data?.data?.integrations.find((i) => i.name === strategy);
  const isInstagram = strategy === "INSTAGRAM";

  const onConnect = async () => {
    if (!isInstagram) return;

    setIsConnecting(true);
    try {
      const result = await getInstagramConnectUrl();
      if (result.status === 200 && result.url) {
        window.location.assign(result.url);
        return;
      }

      toast.error("Instagram connection could not be started.");
    } catch {
      toast.error("Instagram connection could not be started.");
    } finally {
      setIsConnecting(false);
    }
  };

  const onDisconnect = () => {
    if (!isInstagram || !integrated || disconnect.isPending) return;

    const confirmed = window.confirm(
      "Disconnect this Instagram account from AP3k? Existing campaigns and logs will stay, but AP3k will stop using this account token until you reconnect."
    );
    if (!confirmed) return;

    disconnect.mutate();
  };

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm transition-colors hover:border-rf-pink/30 sm:flex-row sm:items-center sm:justify-between">
      {icon}
      <div className="flex flex-col flex-1">
        <h3 className="text-xl font-black">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
        {integrated?.instagramId && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            {integrated.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={integrated.profilePictureUrl}
                alt={integrated.instagramUsername ?? "Connected Instagram account"}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ap3k-gradient text-xs font-black text-white">
                IG
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-rf-green">
                {integrated.instagramUsername
                  ? `@${integrated.instagramUsername}`
                  : "Instagram connected"}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                IG business ID: {integrated.instagramId}
              </p>
              {integrated.pageId && (
                <p className="truncate text-[11px] text-slate-500">
                  Page ID: {integrated.pageId}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto">
        <Button
          onClick={onConnect}
          disabled={!isInstagram || isConnecting}
          className="ap3k-gradient-button min-w-36 text-white disabled:opacity-60"
        >
          {integrated ? "Reconnect Instagram" : isConnecting ? "Connecting..." : "Connect Instagram"}
        </Button>
        {integrated && (
          <Button
            type="button"
            variant="outline"
            onClick={() => resubscribe.mutate()}
            disabled={resubscribe.isPending}
            className="min-w-36 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            {resubscribe.isPending ? "Resubscribing..." : "Resubscribe webhooks"}
          </Button>
        )}
        {integrated && (
          <Button
            type="button"
            variant="outline"
            onClick={onDisconnect}
            disabled={disconnect.isPending}
            className="min-w-36 border-red-200 bg-white text-red-700 hover:bg-red-50"
          >
            {disconnect.isPending ? "Disconnecting..." : "Disconnect account"}
          </Button>
        )}
      </div>
      {integrated && (
        <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 sm:basis-full">
          <p className="font-black uppercase tracking-[0.16em] text-slate-500">
            Webhook health
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <HealthBadge
              label="OAuth valid"
              ok={Boolean(health?.data?.oauth?.tokenUsable)}
            />
            <HealthBadge
              label="Token valid"
              ok={Boolean(health?.data?.oauth?.tokenUsable)}
            />
            <HealthBadge
              label="Webhook subscribed"
              ok={Boolean(health?.data?.subscription?.subscribed)}
            />
            <HealthBadge
              label="Comment delivery active"
              ok={Boolean(health?.data?.lastCommentWebhook)}
            />
            <HealthBadge
              label="Messaging active"
              ok={!health?.data?.lastFailure?.errorMessage?.includes("dm_")}
            />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <HealthItem
              label="Page token"
              value={
                health?.data?.oauth
                  ? `${health.data.oauth.tokenPresent ? "stored" : "missing"}${
                      health.data.oauth.tokenExpired ? " · expired" : ""
                    }`
                  : "Unknown"
              }
            />
            <HealthItem
              label="Subscription attempted"
              value={
                health?.data?.subscription?.lastAttemptedAt
                  ? new Date(health.data.subscription.lastAttemptedAt).toLocaleString()
                  : "Never"
              }
            />
            <HealthItem
              label="Subscription result"
              value={
                health?.data?.subscription
                  ? `${health.data.subscription.subscribed ? "success" : "failure"}${
                      health.data.subscription.statusCode
                        ? ` · ${health.data.subscription.statusCode}`
                        : ""
                    }`
                  : "Unknown"
              }
            />
            <HealthItem
              label="Last webhook"
              value={formatHealth(health?.data?.lastWebhook)}
            />
            <HealthItem
              label="Last comment"
              value={formatHealth(health?.data?.lastCommentWebhook)}
            />
            <HealthItem
              label="Last failure"
              value={
                health?.data?.subscription?.error ??
                (health?.data?.lastFailure
                  ? health.data.lastFailure.errorMessage ?? health.data.lastFailure.eventType
                  : "No failures")
              }
            />
          </div>
          {!health?.data?.lastCommentWebhook && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
              No real comment webhook received from Meta yet. Check app mode,
              tester acceptance, media ownership, account type, and webhook subscription.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default IntegrationCard;

function HealthBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={[
        "rounded-full border px-2.5 py-1 text-[11px] font-black",
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-800",
      ].join(" ")}
    >
      {label}: {ok ? "ok" : "check"}
    </span>
  );
}

function HealthItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words font-bold text-slate-800">{value}</p>
    </div>
  );
}

function formatHealth(
  event?: {
    eventType: string;
    status: string;
    createdAt: Date | string;
  } | null
) {
  if (!event) return "None yet";
  const date = new Date(event.createdAt);
  return `${event.eventType} · ${event.status} · ${date.toLocaleString()}`;
}
