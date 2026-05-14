import AP3kLogo from "@/components/global/ap3k-logo";
import Link from "next/link";

export default function WebsiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/10 px-4 py-8 sm:px-8 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 text-xs text-rf-muted sm:flex-row sm:items-center sm:justify-between">
        <AP3kLogo className="text-sm text-rf-muted" markClassName="h-7 w-7 rounded-lg" />
        <div className="flex flex-wrap gap-6">
          <Link href="/privacy" className="transition-colors hover:text-rf-text">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-rf-text">
            Terms
          </Link>
          <a href="mailto:support@ap3k.com" className="transition-colors hover:text-rf-text">
            Support
          </a>
        </div>
        <p>© 2026 AP3k</p>
      </div>
    </footer>
  );
}
