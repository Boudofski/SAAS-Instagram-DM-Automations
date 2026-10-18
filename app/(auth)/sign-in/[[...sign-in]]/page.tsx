import AuthExperience from "@/components/auth/auth-experience";

import { getServerLocale } from "@/lib/i18n/server";
import { AUTH_COPY } from "@/components/auth/copy";

export function generateMetadata() {
  return { title: `${AUTH_COPY[getServerLocale()].signIn} — AP3K` };
}

export default function Page() {
  return <AuthExperience key="sign-in" mode="sign-in" />;
}
