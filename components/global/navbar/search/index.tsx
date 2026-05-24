import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import React from "react";

type Props = {};

function Search({}: Props) {
  return (
    <div className="flex min-w-0 items-center gap-x-2 overflow-hidden rounded-xl border border-slate-200 bg-white/70 px-3 py-0.5 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:flex">
      <SearchIcon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
      <Input
        placeholder="Search campaigns, keywords, or leads"
        className="h-8 flex-1 border-none bg-transparent px-0 text-sm text-slate-950 outline-none ring-0 placeholder:text-slate-400 focus:ring-0 dark:text-slate-50 dark:placeholder:text-slate-500"
      />
    </div>
  );
}
Search;
export default Search;
