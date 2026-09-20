"use client";

import { useRef, useState } from "react";
import { Check, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/providers/i18n-provider";
import { translateUi } from "@/lib/i18n/translate";
import { localizePublicPath } from "@/lib/i18n/config";
import VisibleProductVideo from "./visible-product-video";
import styles from "./home.module.css";

type Demo = { kicker: string; title: string; body: string; bullets: readonly string[]; src: string; poster: string; label: string };

export default function FeatureDemos({ demos }: { demos: readonly Demo[] }) {
  const [selected, setSelected] = useState(0);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const touchStart = useRef<number | null>(null);
  const { locale } = useI18n();
  const tr = (text: string) => translateUi(text, locale);
  const demo = demos[selected];
  const select = (index: number) => {
    const normalized = (index + demos.length) % demos.length;
    setDirection(normalized === selected ? direction : (index > selected || (selected === demos.length - 1 && normalized === 0) ? "next" : "previous"));
    setSelected(normalized);
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(distance) > 45) select(selected + (distance < 0 ? 1 : -1));
  };
  return (
    <section id="features" aria-labelledby="feature-demo-title" className={`${styles.section} ${styles.featureSection}`}>
      <div className={styles.featureIntro}>
        <h2 id="feature-demo-title" className={styles.sectionTitle}>{tr("A little automation. A lot more connection.")}</h2>
        <p>{tr("Choose a demo. See what happens after the comment.")}</p>
      </div>
      <div className={styles.demoTabs} role="tablist" aria-label={tr("Automation demos")}>
        {demos.map((item, index) => (
          <button key={item.src} id={`feature-demo-tab-${index}`} role="tab" type="button" aria-selected={selected === index} aria-controls="feature-demo-panel" onClick={() => select(index)} className={styles.demoTab}>
            <span aria-hidden="true">0{index + 1}</span><span>{tr(item.kicker)}</span>
          </button>
        ))}
      </div>
      <div className={styles.demoShell} onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={onTouchEnd}>
        <div className={styles.demoControls}>
          <div className={styles.demoNav}>
            <p><span>{String(selected + 1).padStart(2, "0")}</span> / {String(demos.length).padStart(2, "0")}</p>
            <div>
              <button type="button" onClick={() => select(selected - 1)} aria-label={tr("Previous slide")}><ChevronLeft aria-hidden="true" /></button>
              <button type="button" onClick={() => select(selected + 1)} aria-label={tr("Next slide")}><ChevronRight aria-hidden="true" /></button>
            </div>
          </div>
          <div id="feature-demo-panel" role="tabpanel" aria-labelledby={`feature-demo-tab-${selected}`} aria-live="polite" aria-atomic="true" className={styles.demoCopy}>
            <div key={demo.src} className={`${styles.demoTransition} ${direction === "next" ? styles.slideNext : styles.slidePrevious}`}>
              <p className={styles.demoKicker}>{tr(demo.kicker)}</p>
              <h3>{tr(demo.title)}</h3>
              <p>{tr(demo.body)}</p>
              <ul>{demo.bullets.map(bullet => <li key={bullet}><Check aria-hidden="true" />{tr(bullet)}</li>)}</ul>
            </div>
          </div>
          <Link href={localizePublicPath("/sign-up", locale)} className={styles.textLink}>{tr("GET STARTED")}<ArrowUpRight aria-hidden="true" /></Link>
        </div>
        <div className={styles.demoScreen}>
          <div key={demo.src} className={`${styles.phone} ${styles.demoPhoneTransition} ${direction === "next" ? styles.slideNext : styles.slidePrevious}`}>
            <VisibleProductVideo src={demo.src} poster={demo.poster} label={demo.label} showPlaybackControl className={styles.phoneVideo} />
          </div>
          <p className={styles.demoCaption}>{tr("Illustrative automation example")}</p>
        </div>
      </div>
    </section>
  );
}
