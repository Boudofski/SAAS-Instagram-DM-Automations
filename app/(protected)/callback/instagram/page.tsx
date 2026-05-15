import { onIntegrate, recordInstagramOAuthError } from "@/actions/integration";
import { dashboardPath } from "@/lib/dashboard";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type Props = {
  searchParams: {
    code?: string;
    error?: string;
    error_reason?: string;
    error_description?: string;
    message?: string;
  };
};

function integrationRedirect(slug?: string, error?: string) {
  const target = slug ? `${dashboardPath(slug)}/integrations` : "/dashboard";
  if (!error) return redirect(target);

  const separator = target.includes("?") ? "&" : "?";
  return redirect(`${target}${separator}integration_error=${encodeURIComponent(error)}`);
}

function isInsufficientDeveloperRole(params: Props["searchParams"]) {
  const combined = [
    params.error,
    params.error_reason,
    params.error_description,
    params.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return combined.includes("insufficient developer role");
}

async function Page({ searchParams }: Props) {
  const { code, error, error_reason, error_description, message } = searchParams;

  if (error || error_reason || error_description || message) {
    const clerkUser = await currentUser();
    const errorCode = isInsufficientDeveloperRole(searchParams)
      ? "insufficient_developer_role"
      : "provider_denied";

    if (errorCode === "insufficient_developer_role") {
      await recordInstagramOAuthError(errorCode);
    }

    console.warn("[oauth] callback returned provider error", {
      hasCode: Boolean(code),
      providerError: true,
      errorCode,
    });
    return integrationRedirect(clerkUser?.id, errorCode);
  }

  if (code) {
    const user = await onIntegrate(code.split("#_")[0]);
    const slug = user.data?.clerkId || "";

    if (user.status === 200) {
      return integrationRedirect(slug);
    }

    return integrationRedirect(slug, user.error ?? "oauth_failed");
  }

  return integrationRedirect(undefined, "missing_code");
}

export default Page;
