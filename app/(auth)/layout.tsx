import { ClerkProvider } from "@clerk/nextjs";
import React from "react";

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
};

function Layout({ children }: Props) {
  return (
    <ClerkProvider>
      <div className="h-screen flex justify-center items-center">
        {children}
      </div>
    </ClerkProvider>
  );
}

export default Layout;
