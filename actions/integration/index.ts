"use server";

import { generateToken } from "@/lib/fetch";
import axios from "axios";
import { redirect } from "next/navigation";
import { onCurrentUser } from "../user";
import { createIntegration, getIntegrations, updateIntegration } from "./queries";

const REQUIRED_IG_SCOPES = [
  "instagram_basic",
  "instagram_manage_comments",
  "instagram_manage_messages",
  "pages_show_list",
  "pages_read_engagement",
];

export async function getInstagramOAuthUrl() {
  const redirectUri =
    process.env.META_REDIRECT_URI ??
    (process.env.NEXT_PUBLIC_HOST_URL
      ? `${process.env.NEXT_PUBLIC_HOST_URL}/callback/instagram`
      : undefined);

  if (!redirectUri) throw new Error("META_REDIRECT_URI is not configured");

  const configured = process.env.INSTAGRAM_EMBEDDED_OAUTH_URL;
  const clientId = process.env.INSTAGRAM_CLIENT_ID ?? process.env.META_APP_ID;

  if (configured) {
    const url = new URL(configured);
    url.searchParams.set("redirect_uri", redirectUri);
    const scopes = new Set(
      (url.searchParams.get("scope") ?? "")
        .split(",")
        .map((scope) => scope.trim())
        .filter(Boolean)
    );
    REQUIRED_IG_SCOPES.forEach((scope) => scopes.add(scope));
    url.searchParams.set("scope", Array.from(scopes).join(","));
    return url.toString();
  }

  if (!clientId) throw new Error("META_APP_ID or INSTAGRAM_CLIENT_ID is not configured");

  const url = new URL("https://api.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", REQUIRED_IG_SCOPES.join(","));
  url.searchParams.set("response_type", "code");
  return url.toString();
}

export const onOathInstagram = async (strategy: "INSTAGRAM" | "CRM") => {
  if (strategy === "INSTAGRAM") {
    return redirect(await getInstagramOAuthUrl());
  }
};

export const getInstagramConnectUrl = async () => {
  try {
    const url = await getInstagramOAuthUrl();
    console.log("[oauth] connect URL generated", {
      hasMetaAppId: Boolean(process.env.META_APP_ID),
      hasConfiguredOAuthUrl: Boolean(process.env.INSTAGRAM_EMBEDDED_OAUTH_URL),
      hasRedirectUri: Boolean(process.env.META_REDIRECT_URI),
    });
    return { status: 200, url };
  } catch (error) {
    console.error("[oauth] failed to generate connect URL", {
      message: error instanceof Error ? error.message : String(error),
      hasMetaAppId: Boolean(process.env.META_APP_ID),
      hasConfiguredOAuthUrl: Boolean(process.env.INSTAGRAM_EMBEDDED_OAUTH_URL),
      hasRedirectUri: Boolean(process.env.META_REDIRECT_URI),
    });
    return { status: 500, error: "oauth_url_unavailable" };
  }
};

export const onIntegrate = async (code: string) => {
  console.log("[oauth] callback received", { hasCode: Boolean(code) });
  const user = await onCurrentUser();

  try {
    const integration = await getIntegrations(user.id);
    const existing = integration?.integrations[0];
    const token = await generateToken(code);

    if (!token) {
      console.log("[oauth] token exchange failed: generateToken returned null");
      return { status: 401 };
    }

    const insts_id = await axios.get(
      `${process.env.INSTAGRAM_BASE_URL}/me?fields=user_id`,
      {
        headers: { Authorization: `Bearer ${token.access_token}` },
      }
    );

    console.log("[oauth] token exchange succeeded", {
      hasInstagramUserId: Boolean(insts_id.data.user_id),
      updatingExistingIntegration: Boolean(existing),
    });

    const today = new Date();
    const expire_date = today.setDate(today.getDate() + 60);

    if (existing) {
      const update = await updateIntegration(
        token.access_token,
        new Date(expire_date),
        existing.id,
        insts_id.data.user_id
      );
      return {
        status: 200,
        data: {
          firstname: user.firstName,
          lastname: user.lastName,
          clerkId: user.id,
          integrationId: update.id,
        },
      };
    }

    const create = await createIntegration(
      user.id,
      token.access_token,
      new Date(expire_date),
      insts_id.data.user_id
    );
    return { status: 200, data: create };
  } catch (error) {
    console.error("[oauth] onIntegrate error:", error instanceof Error ? error.message : String(error));
    return { status: 500 };
  }
};
