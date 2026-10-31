"use client";

import AP3KLogo from "@/components/global/ap3k-logo";
import {
  ArrowLeft,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  Instagram,
  Link2,
  MessageCircle,
  MousePointerClick,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { arabicCommentDmFaqs } from "./content";
import styles from "./arabic-comment-dm.module.css";

const SIGN_UP_URL =
  "/sign-up?utm_source=arabic-landing&utm_medium=website&utm_campaign=comment-to-dm";

const steps = [
  {
    icon: Instagram,
    number: "01",
    title: "اربط حسابك",
    body: "اربط حساب Instagram Business أو Creator عبر شاشة التفويض الرسمية.",
  },
  {
    icon: MessageCircle,
    number: "02",
    title: "اختر التعليق المحفّز",
    body: "استخدم كلمة مثل «رابط» أو اختر أي تعليق مؤهل على المنشور أو الريلز.",
  },
  {
    icon: Send,
    number: "03",
    title: "جهّز الرسالة والرابط",
    body: "اكتب الرسالة مرة واحدة، وأضف زرًا واضحًا يقود إلى ما وعدت به.",
  },
  {
    icon: BarChart3,
    number: "04",
    title: "اختبر ثم فعّل",
    body: "جرّب من حساب آخر، فعّل الأتمتة، وراجع نشاط الإرسال من AP3K.",
  },
];

const useCases = [
  {
    icon: Link2,
    eyebrow: "للمتاجر",
    title: "أرسل رابط المنتج أو العرض",
    body: "حوّل سؤال «أين الرابط؟» إلى رسالة خاصة فيها صفحة المنتج أو العرض المطلوب.",
    keyword: "رابط",
  },
  {
    icon: Sparkles,
    eyebrow: "لصنّاع المحتوى",
    title: "سلّم الدليل أو الملف المجاني",
    body: "اطلب كلمة واضحة في التعليقات، ثم أرسل المورد الذي وعدت به فورًا في الخاص.",
    keyword: "دليل",
  },
  {
    icon: Zap,
    eyebrow: "للخدمات",
    title: "وجّه المهتم إلى الحجز",
    body: "أرسل صفحة الحجز أو تفاصيل الخدمة عندما يطلبها المتابع على منشورك.",
    keyword: "حجز",
  },
];

const reveal = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] as const },
};

export default function ArabicCommentDmExperience() {
  const reduceMotion = useReducedMotion();
  return (
    <div className={styles.page} lang="ar" dir="rtl">
      <header className={styles.navWrap}>
        <nav className={styles.nav} aria-label="التنقل الرئيسي">
          <Link href="/" aria-label="الصفحة الرئيسية لـ AP3K">
            <AP3KLogo
              className={styles.logo}
              markClassName="h-9 w-9 rounded-xl"
            />
          </Link>
          <div className={styles.navLinks}>
            <a href="#how">كيف يعمل؟</a>
            <a href="#demo">شاهد المنتج</a>
            <a href="#free">الخطة المجانية</a>
          </div>
          <Link className={styles.navCta} href={SIGN_UP_URL}>
            ابدأ مجانًا <ArrowLeft size={17} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <main>
        <section className={styles.hero} aria-labelledby="arabic-hero-title">
          <div className={styles.heroGrid}>
            <motion.div
              className={styles.heroCopy}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={styles.eyebrow}>
                <span className={styles.liveDot} />
                من التعليق إلى الخاص — تلقائيًا
              </div>
              <h1 id="arabic-hero-title">
                علّقوا على الريلز.<span>‏ AP3K يرسل الرابط.</span>
              </h1>
              <p className={styles.heroLead}>
                عندما يكتب شخص <strong>«رابط»</strong> أو{" "}
                <strong>«السعر»</strong>، يطابق AP3K التعليق ويرسل الرسالة التي
                أعددتها مع زر مباشر — دون نسخ ولصق لكل شخص.
              </p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryCta} href={SIGN_UP_URL}>
                  أنشئ أول أتمتة مجانًا{" "}
                  <ArrowLeft size={20} aria-hidden="true" />
                </Link>
                <a className={styles.secondaryCta} href="#demo">
                  <Play size={17} fill="currentColor" aria-hidden="true" /> شاهد
                  المنتج
                </a>
              </div>
              <div className={styles.microProof}>
                <span>
                  <Check size={16} /> دون بطاقة بنكية
                </span>
                <span>
                  <Check size={16} /> دون برمجة
                </span>
                <span>
                  <Check size={16} /> حساب Business أو Creator
                </span>
              </div>
              <div className={styles.partnerProof}>
                <span className={styles.partnerImages}>
                  <Image
                    className={styles.partnerLight}
                    src="/media/hero/meta-business-partner-light.png"
                    alt="Meta Business Partner"
                    width={162}
                    height={65}
                    priority
                  />
                  <Image
                    className={styles.partnerDark}
                    src="/media/hero/meta-business-partner-dark.png"
                    alt="Meta Business Partner"
                    width={162}
                    height={65}
                    priority
                  />
                </span>
                <span>اتصال عبر واجهة Instagram الرسمية</span>
              </div>
            </motion.div>

            <motion.div
              className={styles.heroStage}
              initial={false}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{
                duration: 0.85,
                delay: 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              aria-label="عرض حقيقي لأتمتة التعليقات في AP3K"
            >
              <div className={styles.orbOne} aria-hidden="true" />
              <div className={styles.orbTwo} aria-hidden="true" />
              <div className={styles.videoPhone}>
                <div className={styles.phoneSpeaker} aria-hidden="true" />
                <video
                  muted
                  loop
                  playsInline
                  autoPlay={!reduceMotion}
                  preload="metadata"
                  poster="/media/instagram-features_01-poster.webp"
                  aria-label="فيديو يوضح الرد التلقائي على تعليقات إنستغرام"
                >
                  <source
                    src="/media/instagram-features_01-phone.mp4"
                    type="video/mp4"
                  />
                </video>
              </div>
              <motion.div
                className={`${styles.floatCard} ${styles.commentFloat}`}
                animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
                transition={{
                  duration: 4.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <span className={styles.avatar}>م</span>
                <span>
                  <small>@mohamed</small>
                  <strong>رابط</strong>
                </span>
                <CheckCircle2 size={19} />
              </motion.div>
              <motion.div
                className={`${styles.floatCard} ${styles.dmFloat}`}
                animate={reduceMotion ? undefined : { y: [0, 9, 0] }}
                transition={{
                  duration: 5.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              >
                <span className={styles.dmIcon}>
                  <Send size={17} />
                </span>
                <span>
                  <small>رسالة خاصة</small>
                  <strong>تم إرسال الرابط</strong>
                </span>
              </motion.div>
              <div className={styles.deliveryPath} aria-hidden="true">
                <span>تعليق</span>
                <i />
                <span>تطابق</span>
                <i />
                <span>رسالة</span>
              </div>
            </motion.div>
          </div>
          <a
            className={styles.scrollCue}
            href="#how"
            aria-label="انتقل إلى طريقة العمل"
          >
            <MousePointerClick size={16} /> شاهد كيف تتحول التعليقات إلى محادثات
          </a>
        </section>

        <motion.section
          className={styles.proofStrip}
          aria-label="مزايا الخطة المجانية"
          {...reveal}
        >
          <div>
            <strong>500</strong>
            <span>عملية تلقائية ناجحة شهريًا</span>
          </div>
          <div>
            <strong>5</strong>
            <span>عمليات أتمتة نشطة</span>
          </div>
          <div>
            <strong>1</strong>
            <span>حساب إنستغرام</span>
          </div>
          <div>
            <strong>0$</strong>
            <span>للبدء — دون بطاقة</span>
          </div>
        </motion.section>

        <section className={styles.flowSection} id="how">
          <motion.div className={styles.sectionIntro} {...reveal}>
            <span className={styles.sectionLabel}>
              المسار الكامل في لقطة واحدة
            </span>
            <h2>التعليق لا يتوقف عند المنشور</h2>
            <p>
              أعطِ المتابع ما طلبه في الخاص، واترك المحادثة مفتوحة للخطوة
              التالية.
            </p>
          </motion.div>
          <div className={styles.flowRail}>
            {(
              [
                [MessageCircle, "تعليق جديد", "رابط"],
                [Zap, "تطابق الكلمة", "الحملة الصحيحة"],
                [Send, "رسالة خاصة", "النص الذي راجعته"],
                [Link2, "فتح الرابط", "المنتج أو الدليل"],
              ] as const
            ).map(([FlowIcon, title, body], index) => (
              <motion.article
                key={title}
                className={styles.flowNode}
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: index * 0.09 }}
              >
                <span className={styles.flowNodeIcon}>
                  <FlowIcon size={22} />
                </span>
                <small>0{index + 1}</small>
                <h3>{title}</h3>
                <p>{body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className={styles.demoSection} id="demo">
          <motion.div className={styles.demoCopy} {...reveal}>
            <span className={styles.sectionLabel}>هذا هو المنتج الحقيقي</span>
            <h2>أنشئ الحملة وراجعها قبل أن تعمل</h2>
            <p>
              اختر المنشور والكلمة، ثم فعّل الرد العام أو الرسالة الخاصة أو
              كليهما. راجع النص والرابط من المعاينة، وبعدها اختبر بتعليق جديد من
              حساب آخر.
            </p>
            <ul>
              <li>
                <CheckCircle2 size={19} /> كلمة مفتاحية أو أي تعليق مؤهل
              </li>
              <li>
                <CheckCircle2 size={19} /> رد عام ورسالة خاصة بشكل مستقل
              </li>
              <li>
                <CheckCircle2 size={19} /> زر رابط واضح داخل الرسالة
              </li>
              <li>
                <CheckCircle2 size={19} /> نشاط إرسال يساعدك على اكتشاف المشكلة
              </li>
            </ul>
            <div className={styles.inlineActions}>
              <Link className={styles.primaryCta} href={SIGN_UP_URL}>
                جرّبها مجانًا <ArrowLeft size={19} />
              </Link>
              <Link
                className={styles.textLink}
                href="/tutorials/instagram-comment-to-dm"
              >
                شاهد الشرح الكامل
              </Link>
            </div>
          </motion.div>
          <motion.div
            className={styles.productWindow}
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.1 }}
          >
            <div className={styles.browserBar} aria-hidden="true">
              <span />
              <span />
              <span />
              <p>ap3k.com</p>
            </div>
            <Image
              src="/images/docs/create.webp"
              alt="واجهة إنشاء أتمتة التعليقات والرسائل الخاصة في AP3K"
              width={1363}
              height={936}
              sizes="(max-width: 900px) 94vw, 56vw"
            />
            <div className={styles.windowBadge}>
              <ShieldCheck size={16} /> راجع ثم فعّل
            </div>
          </motion.div>
        </section>

        <section className={styles.stepsSection}>
          <motion.div className={styles.sectionIntro} {...reveal}>
            <span className={styles.sectionLabel}>ابدأ دون تعقيد</span>
            <h2>أربع خطوات إلى أول أتمتة</h2>
          </motion.div>
          <div className={styles.stepsGrid}>
            {steps.map(({ icon: Icon, number, title, body }, index) => (
              <motion.article
                key={number}
                className={styles.stepCard}
                initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <div className={styles.stepTop}>
                  <span className={styles.stepIcon}>
                    <Icon size={22} />
                  </span>
                  <span className={styles.stepNumber}>{number}</span>
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className={styles.useSection} id="uses">
          <motion.div className={styles.sectionIntro} {...reveal}>
            <span className={styles.sectionLabel}>
              حملة بسيطة، نتائج قابلة للقياس
            </span>
            <h2>ابدأ بما يطلبه جمهورك فعلًا</h2>
            <p>
              التجربة الأقوى تبدأ بوعد واحد واضح: كلمة واحدة، رسالة واحدة، ووجهة
              واحدة.
            </p>
          </motion.div>
          <div className={styles.useGrid}>
            {useCases.map(
              ({ icon: Icon, eyebrow, title, body, keyword }, index) => (
                <motion.article
                  key={title}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                >
                  <div className={styles.useTop}>
                    <span className={styles.useIcon}>
                      <Icon size={23} />
                    </span>
                    <small>{eyebrow}</small>
                  </div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                  <div className={styles.keywordChip}>
                    الكلمة: <strong>{keyword}</strong>
                  </div>
                </motion.article>
              ),
            )}
          </div>
        </section>

        <section className={styles.freeSection} id="free">
          <motion.div className={styles.freeCopy} {...reveal}>
            <span className={styles.sectionLabel}>ابدأ على جمهورك الحقيقي</span>
            <h2>اختبر الفكرة مجانًا قبل أن تدفع</h2>
            <p>
              أنشئ حملة واحدة واضحة، اختبر التعليق والرسالة والرابط، ثم قرر من
              بياناتك إن كنت تحتاج إلى خطة أكبر.
            </p>
            <div className={styles.securityNote}>
              <ShieldCheck size={22} />
              <span>
                <strong>تفويض رسمي من Instagram</strong>لا تدخل كلمة مرور
                إنستغرام داخل AP3K.
              </span>
            </div>
          </motion.div>
          <motion.div
            className={styles.planCard}
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.1 }}
          >
            <div className={styles.planHeader}>
              <div>
                <span>الخطة المجانية</span>
                <strong>
                  <b>$</b>0
                </strong>
                <small>شهريًا</small>
              </div>
              <span className={styles.planBadge}>ابدأ هنا</span>
            </div>
            <ul>
              <li>
                <Check size={18} /> 500 عملية تلقائية ناجحة شهريًا
              </li>
              <li>
                <Check size={18} /> حساب Instagram واحد
              </li>
              <li>
                <Check size={18} /> حتى 5 عمليات أتمتة نشطة
              </li>
              <li>
                <Check size={18} /> ردود عامة ورسائل خاصة
              </li>
            </ul>
            <Link className={styles.primaryCta} href={SIGN_UP_URL}>
              أنشئ حسابك المجاني <ArrowLeft size={20} />
            </Link>
            <p className={styles.planNote}>
              لا بطاقة بنكية. يمكنك البدء بالخطة المجانية.
            </p>
          </motion.div>
        </section>

        <section className={styles.faqSection}>
          <motion.div className={styles.sectionIntro} {...reveal}>
            <span className={styles.sectionLabel}>قبل أن تبدأ</span>
            <h2>أسئلة واضحة، دون مفاجآت</h2>
          </motion.div>
          <div className={styles.faqList}>
            {arabicCommentDmFaqs.map(({ question, answer }) => (
              <details key={question}>
                <summary>
                  {question}
                  <ChevronDown size={20} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <motion.section className={styles.finalCta} {...reveal}>
          <div className={styles.finalGlow} aria-hidden="true" />
          <span className={styles.finalMark}>
            <AP3KLogo showText={false} markClassName="h-14 w-14 rounded-2xl" />
          </span>
          <span className={styles.sectionLabel}>جاهز لأول اختبار؟</span>
          <h2>دع تعليقك القادم يبدأ محادثة مفيدة</h2>
          <p>اربط حسابك، أنشئ أول أتمتة، واختبرها من حساب إنستغرام آخر.</p>
          <Link className={styles.primaryCta} href={SIGN_UP_URL}>
            ابدأ مجانًا الآن <ArrowLeft size={20} />
          </Link>
          <span className={styles.finalNote}>
            <Check size={15} /> دون بطاقة بنكية
          </span>
        </motion.section>
      </main>

      <footer className={styles.footer}>
        <AP3KLogo
          className={styles.footerLogo}
          markClassName="h-8 w-8 rounded-xl"
        />
        <p>© 2026 AP3K LLC. جميع الحقوق محفوظة.</p>
        <div>
          <Link href="/privacy">الخصوصية</Link>
          <Link href="/terms">الشروط</Link>
          <Link href="/contact">تواصل معنا</Link>
        </div>
      </footer>
      <div className={styles.mobileCta}>
        <span>
          <strong>AP3K مجانًا</strong>
          <small>دون بطاقة بنكية</small>
        </span>
        <Link href={SIGN_UP_URL}>
          ابدأ الآن <ArrowLeft size={17} />
        </Link>
      </div>
    </div>
  );
}
