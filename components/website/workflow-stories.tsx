"use client";

import { useEffect, useRef, useState } from "react";
import { AtSign, Check, MessageCircle, Reply, Send, Users } from "lucide-react";
import { useI18n } from "@/providers/i18n-provider";
import { translateUi } from "@/lib/i18n/translate";
import styles from "./home.module.css";

const JOURNEY_STEPS = [
  { number: "01", title: "Choose the trigger", copy: "Use a specific keyword like GUIDE, or respond to any eligible comment on the post.", Icon: MessageCircle },
  { number: "02", title: "Reply publicly", copy: "AP3K posts one of your saved replies so the commenter knows to check their DMs.", Icon: Reply },
  { number: "03", title: "Send the DM", copy: "Deliver your message and optional link button automatically while interest is fresh.", Icon: Send },
  { number: "04", title: "See what happened", copy: "Keep replies, DMs, automation activity, and captured leads together in AP3K.", Icon: Users },
] as const;

const SETUP_STEPS = [
  { number: "01", title: "Connect Instagram", copy: "Authorize your professional Instagram account.", Icon: AtSign },
  { number: "02", title: "Choose a post + trigger", copy: "Use a keyword or any eligible comment.", Icon: MessageCircle },
  { number: "03", title: "Choose Actions", copy: "Reply to comment, Send a DM, or enable both.", Icon: Send },
  { number: "04", title: "Activate", copy: "AP3K starts listening and records the activity.", Icon: Check },
] as const;

function useSequencedStep(stepCount: number) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio > 0.2), { threshold: [0, 0.2] });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % stepCount), 2300);
    return () => window.clearInterval(timer);
  }, [paused, stepCount, visible]);

  return { root, active, setActive, setPaused };
}

export function WorkflowStory() {
  const { locale } = useI18n();
  const tr = (text: string) => translateUi(text, locale);
  const { root, active, setActive, setPaused } = useSequencedStep(JOURNEY_STEPS.length);

  return (
    <div ref={root} className={styles.workflowStory} onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <div className={styles.workflowLine} aria-hidden="true"><span style={{ inlineSize: `${((active + 1) / JOURNEY_STEPS.length) * 100}%` }} /></div>
      <div className={styles.workflowGrid}>
        {JOURNEY_STEPS.map(({ number, title, copy, Icon }, index) => (
          <button key={number} type="button" className={styles.workflowCard} aria-current={active === index ? "step" : undefined} onClick={() => setActive(index)} onPointerEnter={() => setActive(index)}>
            <span className={styles.workflowCardTop}><span className={styles.workflowIcon}><Icon aria-hidden="true" /></span><span className={styles.workflowNumber}>{number}</span></span>
            <span className={styles.workflowTitle}>{tr(title)}</span>
            <span className={styles.workflowCopy}>{tr(copy)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SetupTimeline() {
  const { locale } = useI18n();
  const tr = (text: string) => translateUi(text, locale);
  const { root, active, setActive, setPaused } = useSequencedStep(SETUP_STEPS.length);

  return (
    <div ref={root} className={styles.setupTimeline} onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <span className={styles.setupTimelineTrack} aria-hidden="true"><span style={{ blockSize: `${((active + 1) / SETUP_STEPS.length) * 100}%` }} /></span>
      {SETUP_STEPS.map(({ number, title, copy, Icon }, index) => (
        <button key={number} type="button" className={styles.setupStep} aria-current={active === index ? "step" : undefined} onClick={() => setActive(index)}>
          <span className={styles.setupStepMarker}><Icon aria-hidden="true" /><span>{number}</span></span>
          <span><strong>{tr(title)}</strong><small>{tr(copy)}</small></span>
          <span className={styles.setupStepCheck} aria-hidden="true"><Check /></span>
        </button>
      ))}
    </div>
  );
}
