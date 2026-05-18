import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import React from "react";

type Props = {};

function Search({}: Props) {
  return (
    <div className="hidden min-w-0 flex-1 items-center gap-x-2 overflow-hidden rounded-xl border border-slate-200 bg-white px-3 py-1 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:flex">
      <SearchIcon className="h-4 w-4 text-rf-pink" />
      <Input
        placeholder="Search campaigns, keywords, or leads"
        className="h-9 flex-1 border-none bg-transparent text-slate-950 outline-none ring-0 placeholder:text-slate-400 focus:ring-0 dark:text-slate-50 dark:placeholder:text-slate-500"
      />
    </div>
  );
}
Search;
export default Search;
