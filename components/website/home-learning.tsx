import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getServerLocale } from '@/lib/i18n/server';
import { localizePublicPath } from '@/lib/i18n/config';
import { HOME_LEARNING, HOME_LEARNING_PATHS } from '@/lib/i18n/home-learning';

export default function HomeLearning() {
  const locale = getServerLocale();
  const copy = HOME_LEARNING[locale];
  return <section aria-labelledby="home-learning-title" className="px-5 py-16 sm:px-8 lg:py-20">
    <div className="mx-auto max-w-6xl">
      <h2 id="home-learning-title" className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">{copy.title}</h2>
      <p className="mt-4 max-w-3xl leading-7 text-slate-600 dark:text-slate-300">{copy.intro}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {copy.cards.map(([title, text], index) => <Link key={HOME_LEARNING_PATHS[index]} href={localizePublicPath(HOME_LEARNING_PATHS[index], locale)} className="group rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-violet-400">
          <h3 className="text-lg font-semibold leading-7">{title}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{text}</p>
          <ArrowRight aria-hidden="true" className="mt-5 h-5 w-5 text-violet-600 dark:text-violet-300" />
        </Link>)}
      </div>
      <div className="mt-7 flex flex-wrap gap-x-8 gap-y-4 text-sm font-semibold text-violet-700 dark:text-violet-300">
        <Link href={localizePublicPath('/instagram-automation-guide', locale)} className="underline underline-offset-4">{copy.guide}</Link>
        <Link href={localizePublicPath('/blog', locale)} className="underline underline-offset-4">{copy.archive}</Link>
      </div>
    </div>
  </section>;
}
