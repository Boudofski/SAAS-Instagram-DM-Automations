"use client";

import { getInstagramConnectUrl } from "@/actions/integration";
import { UiText } from "@/components/i18n/localized-copy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Instagram, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  className?: string;
  label?: string;
};

export default function ConnectInstagramButton({
  className,
  label = "Connect with Instagram",
}: Props) {
  const [isConnecting, setIsConnecting] = useState(false);

  async function connect() {
    if (isConnecting) return;

    setIsConnecting(true);
    try {
      const result = await getInstagramConnectUrl();
      if (result.status !== 200 || !result.url) throw new Error();
      window.location.assign(result.url);
    } catch {
      toast.error("Instagram connection could not be started.");
      setIsConnecting(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={connect}
      disabled={isConnecting}
      aria-label={label}
      className={cn(
        "ap3k-gradient-button inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-white disabled:opacity-60",
        className,
      )}
    >
      {isConnecting ? (
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
      ) : (
        <Instagram aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
      )}
      <UiText>{isConnecting ? "Connecting..." : label}</UiText>
    </Button>
  );
}
