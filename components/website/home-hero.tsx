"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/providers/i18n-provider";
import { localizePublicPath } from "@/lib/i18n/config";
import { HOME_HERO_COPY, KEYWORD_ANIMATION_COPY } from "@/lib/i18n/home-hero";
import styles from "./home-hero.module.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });
const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], display: "swap" });

function ConversationCards({ side }: { side: "left" | "right" }) {
  return (
    <div className={`${styles.wing} ${styles[side]}`} aria-hidden="true">
      {(["photo", "comment", "dm"] as const).map(kind => (
        <div key={kind} className={`${styles.card} ${styles[kind]}`}>
          {(["light", "dark"] as const).map(theme => (
            <Image key={theme} className={styles[`${theme}Art`]} src={`/media/hero/${side}-${kind}-${theme}.svg`}
              alt="" width={285} height={282} unoptimized />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function HomeHero() {
  const { locale } = useI18n();
  const copy = HOME_HERO_COPY[locale];
  const keywordCopy = KEYWORD_ANIMATION_COPY[locale];
  const section = useRef<HTMLElement>(null);
  const inView = useInView(section, { amount: 0.15 });
  const reducedMotion = useReducedMotion();
  const [pageVisible, setPageVisible] = useState(true);
  const [motionReady, setMotionReady] = useState(false);
  const [wideScene, setWideScene] = useState(false);
  const [keywordScene, setKeywordScene] = useState(0);
  const playing = motionReady && reducedMotion === false && inView && pageVisible;

  useEffect(() => {
    // Load decorative desktop art only when it can be displayed. Rendering the
    // hidden cards on phones made browsers download more than 1 MB of SVGs.
    const media = window.matchMedia("(min-width: 1280px)");
    const update = () => setWideScene(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    // Let the headline and poster paint before requesting the optional demo.
    // This keeps the video away from the mobile LCP critical path.
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;
    let timeout = 0;
    let idle = 0;
    const start = () => {
      const requestIdle = (window as Window & {
        requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      }).requestIdleCallback;
      if (requestIdle) idle = requestIdle(() => setMotionReady(true), { timeout: 2500 });
      else timeout = window.setTimeout(() => setMotionReady(true), 1500);
    };
    start();
    return () => {
      if (timeout) window.clearTimeout(timeout);
      const cancelIdle = (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      if (idle && cancelIdle) cancelIdle(idle);
    };
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () => setKeywordScene((current) => (current + 1) % keywordCopy.keywords.length),
      2800,
    );
    return () => window.clearInterval(timer);
  }, [keywordCopy.keywords.length, playing]);

  useEffect(() => {
    const element = section.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const offset = reducedMotion ? 0 : Math.max(0, Math.min(window.scrollY, 650));
      element.style.setProperty("--scroll", String(offset));
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  return (
    <section ref={section} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`${styles.hero} ${locale === "ar" ? arabic.className : inter.className}`} data-playing={playing} aria-labelledby="home-hero-title">
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.scene} role="img" aria-label={copy.demoDescription}>
        {wideScene && <ConversationCards side="left" />}
        {wideScene && <ConversationCards side="right" />}
      </div>
      <div className={styles.content}>
        <div className={styles.keywordAnimation} aria-hidden="true">
          <div className={styles.localizedKeyword} dir={locale === "ar" ? "rtl" : "ltr"}>
            <span>{keywordCopy.prefix}{" "}
              <strong key={`${locale}-${keywordScene}`}><bdi>{keywordCopy.keywords[keywordScene]}</bdi></strong>
              {" "}{keywordCopy.suffix}
            </span>
          </div>
        </div>
        <h1 id="home-hero-title" className={styles.title}>
          <span>{copy.titleTop}{" "}</span>
          <strong>{copy.titleBottom}</strong>
        </h1>
        <p className={styles.description} dir={locale === "ar" ? "rtl" : undefined}>
          {copy.description.includes("AP3K") ? <>
            {copy.description.split("AP3K")[0]}<bdi dir="ltr">AP3K</bdi>{copy.description.split("AP3K")[1]}
          </> : copy.description}
        </p>
        <div className={styles.actions}>
          <Link className={styles.primary} href={localizePublicPath("/sign-up", locale)}>{copy.cta}</Link>
        </div>
        <div className={styles.trust}>
          <p>{copy.audience}</p>
          <Image src="/media/hero/creator-portraits.webp" alt="" width={123} height={36} sizes="123px" className={styles.portraits} />
        </div>
        <div className={styles.api}>
          <Image className={styles.lightArt} src="/media/hero/meta-business-partner-light.png" alt="Meta Business Partner" width={324} height={129} />
          <Image className={styles.darkArt} src="/media/hero/meta-business-partner-dark.png" alt="Meta Business Partner" width={324} height={129} />
        </div>
      </div>
    </section>
  );
}
