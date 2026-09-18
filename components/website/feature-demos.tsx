"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/providers/i18n-provider";
import { translateUi } from "@/lib/i18n/translate";
import { localizePublicPath } from "@/lib/i18n/config";
import VisibleProductVideo from "./visible-product-video";

type Demo = { kicker: string; title: string; body: string; bullets: readonly string[]; src: string; label: string };

export default function FeatureDemos({ demos }: { demos: readonly Demo[] }) {
  const [selected, setSelected] = useState(0);
  const { locale } = useI18n();
  const tr = (text: string) => translateUi(text, locale);
  const demo = demos[selected];
  return (
    <section id="features" aria-labelledby="feature-demo-title" className="bg-gradient-to-br from-[#5521c8] to-[#7832e3] px-4 py-14 text-white sm:px-8 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {demos.map((item, index) => (
            <button key={item.src} type="button" aria-pressed={selected === index} aria-controls="feature-demo-panel" onClick={() => setSelected(index)}
              className={`min-h-11 rounded-full border px-5 py-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${selected === index ? "border-white bg-white text-[#5521c8]" : "border-white/40 bg-black/10 text-white hover:bg-black/20"}`}>
              {tr(item.kicker)}
            </button>
          ))}
        </div>
        <div id="feature-demo-panel" className="grid items-center gap-8 lg:grid-cols-2 lg:gap-20">
          <div className="text-start">
            <h2 id="feature-demo-title" className="max-w-xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">{tr(demo.title)}</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/90">{tr(demo.body)}</p>
            <ul className="mt-6 space-y-3">
              {demo.bullets.map(bullet => <li key={bullet} className="flex items-start gap-3 text-sm font-semibold"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />{tr(bullet)}</li>)}
            </ul>
            <Link href={localizePublicPath("/sign-up", locale)} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#5521c8]">{tr("GET STARTED")}<ArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" /></Link>
          </div>
          <div className="mx-auto w-[min(60vw,260px)] rounded-[2.5rem] border border-white/25 bg-black p-1.5 shadow-xl">
            <VisibleProductVideo key={demo.src} src={demo.src} label={demo.label} className="aspect-[240/426] w-full rounded-[2.1rem] bg-black object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
