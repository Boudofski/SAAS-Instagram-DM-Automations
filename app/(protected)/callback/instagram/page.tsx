import { onIntegrate } from "@/actions/integration";
import { dashboardPath } from "@/lib/dashboard";
import { redirect } from "next/navigation";

type Props = {
  searchParams: {
    code: string;
    error?: string;
    error_reason?: string;
    error_description?: string;
  };
};

function integrationRedirect(slug?: string, error?: string) {
  const target = slug ? `${dashboardPath(slug)}/integrations` : "/dashboard";
  if (!error) return redirect(target);

  const separator = target.includes("?") ? "&" : "?";
  return redirect(`${target}${separator}integration_error=${encodeURIComponent(error)}`);
}

async function Page({ searchParams: { code, error, error_reason } }: Props) {
  if (error || error_reason) {
    console.warn("[oauth] callback returned provider error", {
      hasCode: Boolean(code),
      providerError: Boolean(error || error_reason),
    });
    return integrationRedirect(undefined, "provider_denied");
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
