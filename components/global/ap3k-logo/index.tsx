/* The supplied artwork is never recolored, cropped or decorated. */
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  markClassName?: string;
  showText?: boolean;
  /** Use the simplified artwork appropriate to the rendered icon size. */
  iconSize?: "tiny" | "small" | "full";
};

export default function AP3KLogo({ className, markClassName, showText = true, iconSize = "tiny" }: Props) {
  if (showText) {
    return (
      <span role="img" aria-label="AP3K" dir="ltr" className={cn("inline-flex max-w-full shrink-0 items-center", className)}>
        {/* CSS theme selection avoids a wrong-theme flash and hydration dependency. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/v2/ap3k-horizontal-for-light-bg.svg" alt="" width={1135} height={428} className={cn("block h-9 w-auto max-w-full object-contain dark:hidden", markClassName, "w-auto")} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/v2/ap3k-horizontal-for-dark-bg.svg" alt="" width={1135} height={428} className={cn("hidden h-9 w-auto max-w-full object-contain dark:block", markClassName, "w-auto")} />
      </span>
    );
  }
  const file = iconSize === "full" ? "ap3k-icon.svg" : iconSize === "small" ? "ap3k-icon-small.svg" : "favicon.svg";
  return (
    <span role="img" aria-label="AP3K" dir="ltr" className={cn("inline-flex shrink-0 items-center", className)}>
      <span className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center", markClassName)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/brand/v2/${file}`} alt="" width={512} height={512} className="h-full w-full object-contain" />
      </span>
    </span>
  );
}
