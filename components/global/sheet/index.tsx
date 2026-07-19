import {
  Sheet as ShadcnSheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

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
      <SheetTrigger aria-label={triggerLabel} className={className}>{trigger}</SheetTrigger>
      <SheetContent side={side} className="p-0">
        {children}
      </SheetContent>
    </ShadcnSheet>
  );
}

export default Sheet;
