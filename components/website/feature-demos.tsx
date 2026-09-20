"use client";

import { useState } from "react";
import { Check, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/providers/i18n-provider";
import { translateUi } from "@/lib/i18n/translate";
import { localizePublicPath } from "@/lib/i18n/config";
import VisibleProductVideo from "./visible-product-video";
import styles from "./home.module.css";

type Demo = { kicker: string; title: string; body: string; bullets: readonly string[]; src: string; label: string };

export default function FeatureDemos({ demos }: { demos: readonly Demo[] }) {
  const [selected, setSelected] = useState(0);
  const { locale } = useI18n();
  const tr = (text: string) => translateUi(text, locale);
  const demo = demos[selected];
  return (
    <section id="features" aria-labelledby="feature-demo-title" className={`${styles.section} ${styles.featureSection}`}>
      <div className={styles.featureIntro}>
        <h2 id="feature-demo-title" className={styles.sectionTitle}>{tr("A little automation. A lot more connection.")}</h2>
        <p>{tr("Choose a demo. See what happens after the comment.")}</p>
      </div>
      <div className={styles.demoShell}>
        <div className={styles.demoControls}>
          <div className={styles.demoButtons} aria-label={tr("Automation demos")}>
            {demos.map((item, index) => (
              <button key={item.src} type="button" aria-pressed={selected === index} aria-controls="feature-demo-panel" onClick={() => setSelected(index)} className={styles.demoButton}>
                <span aria-hidden="true">0{index + 1}</span><span>{tr(item.kicker)}</span><ArrowUpRight aria-hidden="true" />
              </button>
            ))}
          </div>
          <div id="feature-demo-panel" aria-live="polite" aria-atomic="true" className={styles.demoCopy}>
            <div key={demo.src} className={styles.demoTransition}>
              <h3>{tr(demo.title)}</h3>
              <p>{tr(demo.body)}</p>
              <ul>{demo.bullets.map(bullet => <li key={bullet}><Check aria-hidden="true" />{tr(bullet)}</li>)}</ul>
            </div>
          </div>
          <Link href={localizePublicPath("/sign-up", locale)} className={styles.textLink}>{tr("GET STARTED")}<ArrowUpRight aria-hidden="true" /></Link>
        </div>
        <div className={styles.demoScreen}>
          <div className={styles.phone}>
            <VisibleProductVideo key={demo.src} src={demo.src} label={demo.label} showPlaybackControl className={styles.phoneVideo} />
          </div>
          <p className={styles.demoCaption}>{tr("Illustrative automation example")}</p>
        </div>
      </div>
    </section>
  );
}
