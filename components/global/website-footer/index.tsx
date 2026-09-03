import AP3KLogo from "@/components/global/ap3k-logo";
import Link from "next/link";

export default function WebsiteFooter() {
  const linkClass = "text-slate-500 transition-colors hover:text-slate-900 dark:text-rf-muted dark:hover:text-rf-text";

  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white/60 px-4 py-10 backdrop-blur dark:border-white/10 dark:bg-transparent sm:px-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <AP3KLogo className="text-sm text-slate-700 dark:text-rf-muted" markClassName="h-7 w-7 rounded-lg" />
            <p className="max-w-sm text-xs leading-relaxed text-slate-500 dark:text-rf-muted">
              Instagram automation for Business and Creator accounts. Reply to comments, stories, and DMs, then manage conversations and leads in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-4 text-xs">
            <div className="flex flex-col gap-2">
              <p className="font-black uppercase tracking-[0.16em] text-slate-400">Product</p>
              <Link href="/#features" className={linkClass}>Features</Link>
              <Link href="/#how-it-works" className={linkClass}>How it works</Link>
              <Link href="/pricing" className={linkClass}>Pricing</Link>
              <Link href="/blog" className={linkClass}>Blog</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-black uppercase tracking-[0.16em] text-slate-400">Popular guides</p>
              <Link href="/blog/automate-instagram-dms-from-comments" className={linkClass}>Automate DMs from comments</Link>
              <Link href="/blog/instagram-comment-reply-vs-dm" className={linkClass}>Comment reply vs DM</Link>
              <Link href="/blog/turn-instagram-comments-into-leads" className={linkClass}>Comments to leads</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-black uppercase tracking-[0.16em] text-slate-400">Legal</p>
              <Link href="/privacy" className={linkClass}>Privacy</Link>
              <Link href="/terms" className={linkClass}>Terms</Link>
              <Link href="/data-deletion" className={linkClass}>Data Deletion</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-black uppercase tracking-[0.16em] text-slate-400">Support</p>
              <Link href="/contact" className={linkClass}>Contact support</Link>
              <a href="mailto:support@ap3k.com" className={linkClass}>support@ap3k.com</a>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-200 pt-6 dark:border-white/10">
          <p className="text-xs text-slate-400">© 2026 AP3K. Instagram comment and DM automation for professional accounts.</p>
        </div>
      </div>
    </footer>
  );
}
