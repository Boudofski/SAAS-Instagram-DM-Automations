import { SIDEBAR_MENU } from "@/constants/menu";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Props = {
  page: string;
  slug: string;
};

function Items({ page, slug }: Props) {
  return SIDEBAR_MENU.map((item) => (
    <Link
      key={item.id}
      href={`/dashboard/${slug}/${item.label === "home" ? "/" : item.label}`}
      className={cn(
        "capitalize flex gap-x-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all",
        (page === item.label || (page === slug && item.label === "home"))
          ? "border border-pink-200 bg-gradient-to-r from-orange-50 via-pink-50 to-indigo-50 text-slate-950 dark:border-rf-pink/30 dark:bg-ap3k-gradient-soft dark:text-white"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
      )}
    >
      {item.icon}
      {item.label}
    </Link>
  ));
}

export default Items;
