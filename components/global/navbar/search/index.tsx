import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import React from "react";

type Props = {};

function Search({}: Props) {
  return (
    <div className="flex flex-1 items-center gap-x-2 overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-1 shadow-sm">
      <SearchIcon className="h-4 w-4 text-rf-pink" />
      <Input
        placeholder="Search campaigns, keywords, or leads"
        className="flex-1 border-none bg-transparent text-slate-950 outline-none ring-0 placeholder:text-slate-400 focus:ring-0"
      />
    </div>
  );
}
Search;
export default Search;
