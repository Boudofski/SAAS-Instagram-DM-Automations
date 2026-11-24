import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  markClassName?: string;
  showText?: boolean;
};

export default function AP3KLogo({ className, markClassName, showText = true }: Props) {
  return (
    <div className={cn("flex items-center gap-2.5 text-slate-950 dark:text-rf-text", className)}>
      <Image
        src="/brand/ap3k-mark.svg?v=quick-reply"
        alt=""
        aria-hidden="true"
        width={36}
        height={36}
        unoptimized
        className={cn("h-9 w-9 shrink-0 object-contain", markClassName)}
      />
      {showText && (
        <span className="text-[1.05em] font-black leading-none tracking-[-0.055em]">{" AP3K "}</span>
      )}
    </div>
  );
}
