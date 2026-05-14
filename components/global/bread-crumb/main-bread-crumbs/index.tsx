import { PAGE_ICONS } from "@/constants/pages";
import React from "react";

type Props = {
  page: string;
  slug: string;
};

function MainBreadCrumbs({ page, slug }: Props) {
  const title = page === "Home" ? "Home" : page;
  const subtitle =
    page === "Home"
      ? `Welcome back, ${slug}.`
      : page === "integrations"
      ? "Connect Instagram and manage official account access."
      : page === "automation"
      ? "Create and manage comment-to-DM campaigns."
      : page === "settings"
      ? "Review your AP3k plan and account settings."
      : "Manage your AP3k workspace.";

  return (
    <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-rf-pink/20 bg-ap3k-gradient-soft">
          {PAGE_ICONS[page.toUpperCase()]}
        </span>
        <div>
          <h2 className="text-2xl font-black capitalize tracking-tight text-rf-text">
            {title}
          </h2>
          <p className="mt-1 text-sm text-rf-muted">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default MainBreadCrumbs;
