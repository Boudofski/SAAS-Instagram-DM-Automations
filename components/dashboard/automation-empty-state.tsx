import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen } from "lucide-react";
import AP3KLogo from "@/components/global/ap3k-logo";
import { UiText } from "@/components/i18n/localized-copy";
import styles from "./automation-empty-state.module.css";

export default function AutomationEmptyState({ slug }: { slug: string }) {
  return <div className={styles.stage}>
    <section className={styles.card} aria-label="Create your first automation">
      <div className={styles.conversation} aria-hidden="true">
        <div className={`${styles.chat} ${styles.first}`}>
          <AP3KLogo showText={false} markClassName="!h-8 !w-8 !rounded-full !shadow-none" />
          <span className={styles.bubble}><UiText>How can we help you?</UiText></span>
        </div>
        <div className={`${styles.chat} ${styles.customer}`}>
          <span className={styles.bubble}><UiText>how does this work?</UiText></span>
          <Image src="/images/preview/richard_roe.jpg" width={32} height={32} alt="" className={styles.avatar} />
        </div>
        <div className={`${styles.chat} ${styles.last}`}>
          <AP3KLogo showText={false} markClassName="!h-8 !w-8 !rounded-full !shadow-none" />
          <span className={styles.bubble}><UiText>Pick a post and a keyword, that’s it</UiText></span>
        </div>
      </div>
      <h2><UiText>Create your first automation</UiText></h2>
      <p><UiText>Create a new DM automation for your Instagram account</UiText></p>
      <div className={styles.actions}>
        <Link href={`/dashboard/${slug}/automation/new`} className={styles.create}><UiText>New automation</UiText><ArrowRight size={18} aria-hidden="true" /></Link>
        <Link href="/help" className={styles.docs}><BookOpen size={17} aria-hidden="true" /><UiText>Read docs</UiText></Link>
      </div>
    </section>
  </div>;
}
