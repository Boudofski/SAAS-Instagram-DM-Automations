/* The supplied artwork is never recolored, cropped or decorated. */
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  markClassName?: string;
  showText?: boolean;
  /** Choose the exact approved lockup for the surface. */
  variant?: "horizontal" | "wordmark" | "icon";
  /** Use solid black/white artwork instead of the brand-accent wordmark. */
  monochrome?: boolean;
  /** Use the simplified artwork appropriate to the rendered icon size. */
  iconSize?: "tiny" | "small" | "full";
};

export default function AP3KLogo({
  className,
  markClassName,
  showText = true,
  variant,
  monochrome = false,
  iconSize = "tiny",
}: Props) {
  const resolvedVariant = variant ?? (showText ? "horizontal" : "icon");

  if (resolvedVariant !== "icon") {
    const isWordmark = resolvedVariant === "wordmark";
    const lightFile = isWordmark
      ? monochrome
        ? "ap3k-wordmark-black.svg"
        : "ap3k-wordmark-ink.svg"
      : monochrome
        ? "ap3k-horizontal-black.svg"
        : "ap3k-horizontal-for-light-bg.svg";
    const darkFile = isWordmark
      ? monochrome
        ? "ap3k-wordmark-white-mono.svg"
        : "ap3k-wordmark-white.svg"
      : monochrome
        ? "ap3k-horizontal-white.svg"
        : "ap3k-horizontal-for-dark-bg.svg";
    const width = isWordmark ? 638 : 1135;
    const height = isWordmark ? 242 : 428;

    return (
      <span role="img" aria-label="AP3K" dir="ltr" className={cn("inline-flex max-w-full shrink-0 items-center", className)}>
        {/* CSS theme selection avoids a wrong-theme flash and hydration dependency. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/brand/v2/${lightFile}`} alt="" width={width} height={height} className={cn("block h-9 w-auto max-w-full object-contain dark:hidden", markClassName)} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/brand/v2/${darkFile}`} alt="" width={width} height={height} className={cn("hidden h-9 w-auto max-w-full object-contain dark:block", markClassName)} />
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
