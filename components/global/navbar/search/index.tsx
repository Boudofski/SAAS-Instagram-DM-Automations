import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import React from "react";

type Props = {};

function Search({}: Props) {
  return (
    <div className="flex flex-1 items-center gap-x-2 overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] px-4 py-1 backdrop-blur">
      <SearchIcon className="h-4 w-4 text-rf-pink" />
      <Input
        placeholder="Search campaigns, keywords, or leads"
        className="flex-1 border-none bg-transparent outline-none ring-0 focus:ring-0"
      />
    </div>
  );
}
Search;
export default Search;
