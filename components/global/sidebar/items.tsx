import { PRIMARY_NAVIGATION, primaryNavigationHref } from "@/constants/menu";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Props = {
  page: string;
  slug: string;
};

function Items({ page, slug }: Props) {
  return PRIMARY_NAVIGATION.map((item) => {
    const Icon = item.icon;
    const isActive =
      item.segment === ""
        ? page === slug || page === ""
        : page === item.segment;

    return (
      <Link
        key={item.segment || "home"}
        href={primaryNavigationHref(slug, item.segment)}
        className={cn(
          "flex gap-x-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all",
          isActive
            ? "border border-pink-200 bg-gradient-to-r from-orange-50 via-pink-50 to-indigo-50 text-slate-950 dark:border-rf-pink/30 dark:bg-ap3k-gradient-soft dark:text-white"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
        )}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  });
}

export default Items;
