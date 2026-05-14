import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  markClassName?: string;
  showText?: boolean;
};

export default function AP3kLogo({ className, markClassName, showText = true }: Props) {
  return (
    <div className={cn("flex items-center gap-2.5 font-bold text-rf-text", className)}>
      <div
        className={cn(
          "grid h-8 w-8 place-items-center rounded-xl bg-ap3k-gradient text-[8px] font-black text-white shadow-ap3k-glow ring-1 ring-white/15",
          markClassName
        )}
      >
        AP3K
      </div>
      {showText && <span>AP3k</span>}
    </div>
  );
}
