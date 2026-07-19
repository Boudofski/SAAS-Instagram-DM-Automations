import {
  Sheet as ShadcnSheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Props = {
  trigger: React.ReactNode;
  triggerLabel: string;
  children: React.ReactNode;
  className?: string;
  side?: "left" | "right";
};

function Sheet({ trigger, triggerLabel, children, className, side }: Props) {
  return (
    <ShadcnSheet>
      <SheetTrigger
        aria-label={triggerLabel}
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-pink",
          className
        )}
      >
        {trigger}
      </SheetTrigger>
      <SheetContent side={side} className="p-0">
        <SheetTitle className="sr-only">{triggerLabel}</SheetTitle>
        {children}
      </SheetContent>
    </ShadcnSheet>
  );
}

export default Sheet;
