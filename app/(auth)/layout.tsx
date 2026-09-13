import AuthLocaleShell from "@/components/i18n/auth-locale-shell";
import React from "react";

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
};

function Layout({ children }: Props) {
  return <AuthLocaleShell>{children}</AuthLocaleShell>;
}

export default Layout;
