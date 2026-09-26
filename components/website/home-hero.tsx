"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, CheckCheck, Heart, Instagram, MessageCircle, Pause, Play, Send, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/providers/i18n-provider";
import { localizePublicPath } from "@/lib/i18n/config";
import { HOME_HERO_COPY, type HomeHeroCopy } from "@/lib/i18n/home-hero";
import styles from "./home-hero.module.css";

function ConversationCards({ copy, scene, side }: { copy: HomeHeroCopy; scene: number; side: "left" | "right" }) {
  const current = copy.scenes[scene];
  return (
    <div className={`${styles.wing} ${side === "left" ? styles.left : styles.right}`} aria-hidden="true">
      <div className={styles.photo}>
        <Image src={`/media/hero/creator-${side === "left" ? "fashion" : "style"}.webp`} alt="" width={480} height={720} sizes="(min-width: 1280px) 235px, 170px" />
        <div className={styles.photoLabel}><Instagram size={14} /> {side === "left" ? "studio.edit" : "daily.style"}</div>
        <div className={styles.photoActions}><Heart size={18} /><MessageCircle size={18} /><Send size={17} /></div>
      </div>
      <div key={`comment-${scene}`} className={styles.comment}>
        <div className={styles.avatar}>{side === "left" ? "S" : "A"}</div>
        <div className={styles.commentBody}>
          <div className={styles.username}>{side === "left" ? "sara.creates" : "alex.studio"}<span>1m</span><Heart size={13} /></div>
          <p>{current.comment}</p>
          <span className={styles.reply}>{copy.reply}</span>
        </div>
      </div>
      <div key={`dm-${scene}`} className={styles.dm}>
        <div className={styles.dmHeader}>
          <span className={styles.brandAvatar}>A</span>
          <div><strong>AP3K</strong><span><i />{copy.active}</span></div>
          <Instagram size={17} />
        </div>
        <div className={styles.dmBody}>
          <div className={styles.message}>
            <p>{current.message}</p>
            <span className={styles.linkPreview}>{current.button}<ArrowRight size={13} /></span>
          </div>
          <span className={styles.sent}><CheckCheck size={13} />{copy.sent}</span>
        </div>
      </div>
    </div>
  );
}

export default function HomeHero() {
  const { locale } = useI18n();
  const copy = HOME_HERO_COPY[locale];
  const section = useRef<HTMLElement>(null);
  const inView = useInView(section, { amount: 0.15 });
  const reducedMotion = useReducedMotion();
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [interacting, setInteracting] = useState(false);
  const playing = !reducedMotion && !paused && inView && pageVisible && !interacting;

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setScene((current) => (current + 1) % copy.scenes.length), 6000);
    return () => window.clearInterval(timer);
  }, [playing, copy.scenes.length]);

  const visibleScene = reducedMotion ? 0 : scene;
  return (
    <section ref={section} className={styles.hero} data-playing={playing} aria-labelledby="home-hero-title"
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        <p className={styles.eyebrow}><Instagram size={14} />{copy.eyebrow}</p>
        <p className={styles.keywordLine} aria-hidden="true">
          {copy.keywordPrefix}
          <span className={styles.keywordSlot}><span key={visibleScene} className={styles.keyword}>{copy.scenes[visibleScene].keyword}<Sparkles size={15} /></span></span>
          <span>{copy.keywordSuffix}</span>
        </p>
        <h1 id="home-hero-title" className={styles.title}>
          <span>{copy.titleTop}</span>
          <strong>{copy.titleBottom}</strong>
        </h1>
        <p className={styles.description}>{copy.description}</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href={localizePublicPath("/sign-up", locale)}>{copy.cta}<ArrowRight size={18} /></Link>
          <a className={styles.secondary} href="#how-it-works">{copy.secondary}<span aria-hidden="true">↗</span></a>
        </div>
        <p className={styles.allowance}>{copy.allowance}</p>
      </div>

      <div className={styles.scene} role="img" aria-label={copy.demoDescription}
        onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}>
        <ConversationCards copy={copy} scene={visibleScene} side="left" />
        <ConversationCards copy={copy} scene={visibleScene} side="right" />
      </div>

      <div className={styles.trust}>
        <div className={styles.creatorRow}>
          <div className={styles.creatorIcons} aria-hidden="true">
            <span><Image src="/media/hero/creator-fashion.webp" alt="" width={36} height={36} /></span>
            <span><Instagram size={17} /></span>
            <span><Image src="/media/hero/creator-style.webp" alt="" width={36} height={36} /></span>
            <span><Sparkles size={17} /></span>
          </div>
          <p>{copy.audience}</p>
        </div>
        <p className={styles.api}><BadgeCheck size={20} />{copy.api}</p>
      </div>
      <div className={styles.motionControls}>
        <span>{copy.demoLabel}</span>
        {!reducedMotion && <button type="button" onClick={() => setPaused(value => !value)}
          aria-label={paused ? copy.play : copy.pause} aria-pressed={paused} title={paused ? copy.play : copy.pause}>
          {paused ? <Play size={13} /> : <Pause size={13} />}
        </button>}
      </div>
    </section>
  );
}
