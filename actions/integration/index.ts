"use server";

import { generateToken } from "@/lib/fetch";
import axios from "axios";
import { redirect } from "next/navigation";
import { onCurrentUser } from "../user";
import { createIntegration, getIntegrations } from "./queries";

export const onOathInstagram = async (strategy: "INSTAGRAM" | "CRM") => {
  if (strategy === "INSTAGRAM") {
    return redirect(process.env.INSTAGRAM_EMBEDDED_OAUTH_URL as string);
  }
};

export const onIntegrate = async (code: string) => {
  console.log(`[oauth] code received length=${code?.length ?? 0}`);
  const user = await onCurrentUser();

  try {
    const integration = await getIntegrations(user.id);

    if (integration && integration.integrations.length === 0) {
      const token = await generateToken(code);

      if (token) {
        const insts_id = await axios.get(
          `${process.env.INSTAGRAM_BASE_URL}/me?fields=user_id&access_token=${token.access_token}`
        );

        console.log(`[oauth] token exchange succeeded igUserId=${insts_id.data.user_id}`);
        const today = new Date();
        const expire_date = today.setDate(today.getDate() + 60);
        const create = await createIntegration(
          user.id,
          token.access_token,
          new Date(expire_date),
          insts_id.data.user_id
        );
        return { status: 200, data: create };
      }
      console.log("[oauth] token exchange failed: generateToken returned null");
      return { status: 401 };
    }

    console.log("[oauth] integration already exists for user");
    return { status: 404 };
  } catch (error) {
    console.error("[oauth] onIntegrate error:", error instanceof Error ? error.message : String(error));
    return { status: 500 };
  }
};
