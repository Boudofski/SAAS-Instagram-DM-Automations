import AP3kLogo from "@/components/global/ap3k-logo";
import Link from "next/link";

export default function WebsiteFooter() {
  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white/60 px-4 py-10 backdrop-blur dark:border-white/10 dark:bg-transparent sm:px-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <AP3kLogo className="text-sm text-slate-700 dark:text-rf-muted" markClassName="h-7 w-7 rounded-lg" />
            <p className="max-w-xs text-xs leading-relaxed text-slate-500 dark:text-rf-muted">
              Instagram comment automation for creators and teams.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-4 text-xs">
            <div className="flex flex-col gap-2">
              <p className="font-black uppercase tracking-[0.16em] text-slate-400 dark:text-rf-subtle">Product</p>
              <Link href="/#features" className="text-slate-500 transition-colors hover:text-slate-900 dark:text-rf-muted dark:hover:text-rf-text">Features</Link>
              <Link href="/#how-it-works" className="text-slate-500 transition-colors hover:text-slate-900 dark:text-rf-muted dark:hover:text-rf-text">How it works</Link>
              <Link href="/pricing" className="text-slate-500 transition-colors hover:text-slate-900 dark:text-rf-muted dark:hover:text-rf-text">Pricing</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-black uppercase tracking-[0.16em] text-slate-400 dark:text-rf-subtle">Legal</p>
              <Link href="/privacy" className="text-slate-500 transition-colors hover:text-slate-900 dark:text-rf-muted dark:hover:text-rf-text">Privacy</Link>
              <Link href="/terms" className="text-slate-500 transition-colors hover:text-slate-900 dark:text-rf-muted dark:hover:text-rf-text">Terms</Link>
              <Link href="/data-deletion" className="text-slate-500 transition-colors hover:text-slate-900 dark:text-rf-muted dark:hover:text-rf-text">Data Deletion</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-black uppercase tracking-[0.16em] text-slate-400 dark:text-rf-subtle">Support</p>
              <a href="mailto:contact@ap3k.com" className="text-slate-500 transition-colors hover:text-slate-900 dark:text-rf-muted dark:hover:text-rf-text">Contact</a>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-200 pt-6 dark:border-white/10">
          <p className="text-xs text-slate-400 dark:text-rf-subtle">© 2026 AP3k. Built on official Meta APIs.</p>
        </div>
      </div>
    </footer>
  );
}
