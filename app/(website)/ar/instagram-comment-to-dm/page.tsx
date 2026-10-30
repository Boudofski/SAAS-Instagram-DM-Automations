import AP3KLogo from "@/components/global/ap3k-logo";
import {
  ArrowLeft,
  BarChart3,
  Check,
  CheckCircle2,
  Instagram,
  Link2,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./arabic-comment-dm.module.css";

const PAGE_URL = "https://ap3k.com/ar/instagram-comment-to-dm";
const SIGN_UP_URL =
  "/sign-up?utm_source=arabic-landing&utm_medium=website&utm_campaign=comment-to-dm";

const languageAlternates = {
  ar: PAGE_URL,
  en: "https://ap3k.com/instagram-comment-to-dm",
  fr: "https://ap3k.com/fr/instagram-comment-to-dm",
  es: "https://ap3k.com/es/instagram-comment-to-dm",
  de: "https://ap3k.com/de/instagram-comment-to-dm",
  pt: "https://ap3k.com/pt/instagram-comment-to-dm",
  "x-default": "https://ap3k.com/instagram-comment-to-dm",
};

export const metadata: Metadata = {
  title: "أتمتة التعليقات والرسائل الخاصة على إنستغرام | AP3K",
  description:
    "حوّل تعليقات إنستغرام إلى ردود ورسائل خاصة تلقائية مع رابط مباشر. ابدأ مجانًا مع AP3K واختبر أول أتمتة دون بطاقة بنكية.",
  keywords: [
    "أتمتة إنستغرام",
    "الرد التلقائي على تعليقات إنستغرام",
    "إرسال رسالة خاصة تلقائيًا إنستغرام",
    "تحويل التعليقات إلى رسائل خاصة",
    "Instagram comment to DM automation",
    "AP3K",
  ],
  alternates: { canonical: PAGE_URL, languages: languageAlternates },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "حوّل تعليقات إنستغرام إلى رسائل خاصة تلقائيًا | AP3K",
    description:
      "ردّ على التعليقات وأرسل الرابط المطلوب في الخاص تلقائيًا. ابدأ بخطة AP3K المجانية.",
    url: PAGE_URL,
    siteName: "AP3K",
    locale: "ar_MA",
    type: "website",
    images: [
      {
        url: "https://ap3k.com/images/docs/message.webp",
        width: 1363,
        height: 936,
        alt: "واجهة AP3K لأتمتة رسائل إنستغرام",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "أتمتة تعليقات ورسائل إنستغرام | AP3K",
    description: "حوّل التعليقات إلى رسائل خاصة وروابط تلقائية. ابدأ مجانًا.",
    images: ["https://ap3k.com/images/docs/message.webp"],
  },
};

const faqs = [
  {
    question: "هل يمكنني تجربة AP3K مجانًا؟",
    answer:
      "نعم. تشمل الخطة المجانية حساب إنستغرام واحدًا، وخمس عمليات أتمتة نشطة، و500 عملية تلقائية ناجحة كل شهر. لا تحتاج إلى بطاقة بنكية للبدء.",
  },
  {
    question: "كيف تتحول التعليقات إلى رسائل خاصة؟",
    answer:
      "تختار منشورًا أو ريلز، وتحدد كلمة مثل «رابط» أو «دليل». عندما يكتبها شخص في تعليق مؤهل، ينفّذ AP3K الرد العام أو الرسالة الخاصة التي أعددتها، أو كليهما.",
  },
  {
    question: "هل أحتاج إلى إعطاء AP3K كلمة مرور إنستغرام؟",
    answer:
      "لا. تربط حساب Instagram Business أو Creator من خلال مسار التفويض الرسمي. لا تكتب كلمة مرور إنستغرام داخل أداة إنشاء الأتمتة.",
  },
  {
    question: "كيف يتم احتساب 500 عملية؟",
    answer:
      "كل رد عام تم إرساله بنجاح يُحتسب عملية، وكل رسالة خاصة ناجحة تُحتسب عملية أخرى. إذا أرسلت ردًا عامًا ورسالة خاصة للشخص نفسه، تُحتسب عمليتان.",
  },
  {
    question: "هل تعمل الأتمتة على المنشورات والريلز؟",
    answer:
      "يمكنك اختيار محتوى إنستغرام المؤهل الذي يظهر في مساحة العمل، ثم ربطه بكلمة مفتاحية أو بالتعليقات المؤهلة. اختبر الحملة من حساب آخر قبل نشر الإعلان أو توسيعها.",
  },
];

const schemas = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AP3K",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "ar",
    url: PAGE_URL,
    description:
      "أداة لأتمتة الردود على تعليقات إنستغرام وإرسال الرسائل الخاصة والروابط المطلوبة.",
    featureList: [
      "الرد التلقائي على التعليقات",
      "إرسال رسالة خاصة بعد التعليق",
      "روابط قابلة للنقر داخل الرسالة",
      "تتبع النشاط والعملاء المحتملين",
    ],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      url: "https://ap3k.com/sign-up",
      description:
        "حساب إنستغرام واحد، خمس أتمتات نشطة، و500 عملية تلقائية ناجحة شهريًا.",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "ar",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "AP3K",
        item: "https://ap3k.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "أتمتة التعليقات والرسائل الخاصة",
        item: PAGE_URL,
      },
    ],
  },
];

const steps = [
  {
    icon: Instagram,
    number: "01",
    title: "اربط حساب إنستغرام",
    body: "استخدم حساب Business أو Creator واربطه عبر شاشة التفويض الرسمية.",
  },
  {
    icon: MessageCircle,
    number: "02",
    title: "اختر المنشور والكلمة",
    body: "حدد منشورًا أو ريلز، ثم اختر كلمة واضحة مثل «رابط» أو «السعر».",
  },
  {
    icon: Send,
    number: "03",
    title: "اكتب الرد والرسالة",
    body: "أضف ردًا عامًا، ورسالة خاصة، والرابط الذي وعدت به في المحتوى.",
  },
  {
    icon: BarChart3,
    number: "04",
    title: "اختبر وراقب النتائج",
    body: "جرّب من حساب آخر، ثم تابع الإرسال والنشاط من لوحة AP3K.",
  },
];

const useCases = [
  {
    icon: Link2,
    title: "إرسال رابط المنتج",
    body: "اكتب «الرابط في الخاص» واترك AP3K يرسل صفحة المنتج للشخص الذي طلبها.",
  },
  {
    icon: Sparkles,
    title: "تسليم دليل مجاني",
    body: "حوّل الريلز التعليمي إلى وسيلة لجمع الاهتمام وتسليم الدليل فورًا.",
  },
  {
    icon: Zap,
    title: "الرد على سؤال متكرر",
    body: "أرسل السعر أو طريقة الحجز أو التفاصيل نفسها دون نسخ ولصق كل مرة.",
  },
];

export default function ArabicCommentToDmPage() {
  return (
    <div className={styles.page} lang="ar" dir="rtl">
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}

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
            <a href="#uses">الاستخدامات</a>
            <a href="#free">الخطة المجانية</a>
          </div>
          <Link className={styles.navCta} href={SIGN_UP_URL}>
            ابدأ مجانًا <ArrowLeft size={17} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.glow} aria-hidden="true" />
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>
              <span className={styles.liveDot} />
              أتمتة تعليقات ورسائل إنستغرام
            </div>
            <h1>
              حوّل كل تعليق إلى
              <span> رسالة خاصة تلقائيًا</span>
            </h1>
            <p className={styles.heroLead}>
              عندما يكتب شخص كلمة مثل <strong>«رابط»</strong> أو{" "}
              <strong>«السعر»</strong>، يرد AP3K على التعليق ويرسل له الرابط
              المطلوب في الخاص خلال لحظات.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryCta} href={SIGN_UP_URL}>
                جرّب AP3K مجانًا <ArrowLeft size={20} aria-hidden="true" />
              </Link>
              <a className={styles.secondaryCta} href="#demo">
                شاهد كيف يعمل
              </a>
            </div>
            <div className={styles.microProof}>
              <span><Check size={16} /> دون بطاقة بنكية</span>
              <span><Check size={16} /> إعداد بدون برمجة</span>
              <span><Check size={16} /> اتصال رسمي بإنستغرام</span>
            </div>
            <div className={styles.partnerProof}>
              <Image
                src="/media/hero/meta-business-partner-dark.png"
                alt="Meta Business Partner"
                width={162}
                height={65}
              />
              <span>تكامل عبر واجهة Instagram الرسمية</span>
            </div>
          </div>

          <div className={styles.heroVisual} aria-label="مثال توضيحي لتدفق التعليق إلى الرسالة الخاصة">
            <div className={styles.visualTop}>
              <span>حملة نشطة</span>
              <span className={styles.status}>تعمل الآن</span>
            </div>
            <div className={styles.postPreview}>
              <div className={styles.avatar}>A</div>
              <div>
                <strong>@yourbrand</strong>
                <p>اكتب «رابط» وسنرسله لك في الخاص 👇</p>
              </div>
            </div>
            <div className={styles.flowLine}>
              <span>تعليق جديد</span>
              <span className={styles.flowArrow}>←</span>
              <span>تطابق الكلمة</span>
              <span className={styles.flowArrow}>←</span>
              <span>إرسال تلقائي</span>
            </div>
            <div className={styles.commentCard}>
              <div className={styles.smallAvatar}>م</div>
              <div>
                <strong>@mohamed</strong>
                <p>رابط</p>
              </div>
              <span className={styles.checkIcon}><CheckCircle2 size={18} /></span>
            </div>
            <div className={styles.dmCard}>
              <div className={styles.dmHeader}>
                <Send size={16} /> رسالة خاصة أُرسلت
              </div>
              <p>أهلًا 👋 هذا هو الرابط الذي طلبته.</p>
              <span className={styles.linkButton}>فتح الرابط</span>
            </div>
          </div>
        </section>

        <section className={styles.stats} aria-label="مزايا الخطة المجانية">
          <div><strong>500</strong><span>عملية تلقائية شهريًا</span></div>
          <div><strong>5</strong><span>عمليات أتمتة نشطة</span></div>
          <div><strong>1</strong><span>حساب إنستغرام</span></div>
          <div><strong>0$</strong><span>للبدء والتجربة</span></div>
        </section>

        <section className={styles.problemSection}>
          <div className={styles.sectionIntro}>
            <span className={styles.sectionLabel}>لا تترك الاهتمام يضيع</span>
            <h2>كل تعليق قد يكون عميلًا ينتظر ردك</h2>
            <p>
              المتابع يطلب الرابط الآن. إذا وصل ردك بعد ساعات، ربما يكون قد نسي
              المنتج أو غادر التطبيق. AP3K ينفّذ الخطوة المتكررة فورًا ويترك لك
              المحادثات التي تحتاج إلى تدخل بشري.
            </p>
          </div>
          <div className={styles.problemGrid}>
            <article>
              <span>بدون AP3K</span>
              <h3>نسخ ولصق طوال اليوم</h3>
              <p>فتح التعليقات، البحث عن الحساب، نسخ الرابط، ثم إرسال الرسالة يدويًا.</p>
            </article>
            <article className={styles.highlightCard}>
              <span>مع AP3K</span>
              <h3>تعليق واحد يبدأ الرحلة</h3>
              <p>الكلمة تطابق الحملة، ويصل الرد والرابط الخاص وفق الإعداد الذي راجعته.</p>
            </article>
          </div>
        </section>

        <section className={styles.howSection} id="how">
          <div className={styles.sectionIntro}>
            <span className={styles.sectionLabel}>إعداد واضح</span>
            <h2>من أول تعليق إلى أول رسالة في أربع خطوات</h2>
            <p>لا تحتاج إلى كود أو مخطط معقد لتبدأ حملة بسيطة وتختبرها.</p>
          </div>
          <div className={styles.stepsGrid}>
            {steps.map(({ icon: Icon, number, title, body }) => (
              <article key={number} className={styles.stepCard}>
                <div className={styles.stepTop}>
                  <span className={styles.stepIcon}><Icon size={22} /></span>
                  <span className={styles.stepNumber}>{number}</span>
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.demoSection} id="demo">
          <div className={styles.demoCopy}>
            <span className={styles.sectionLabel}>شاهد المنتج الحقيقي</span>
            <h2>أنشئ الحملة، راجع الرسالة، ثم فعّلها</h2>
            <p>
              تختار المحتوى والكلمة، وتحدد ما إذا كنت تريد ردًا عامًا أو رسالة
              خاصة أو كليهما. قبل التفعيل، راجع النص والرابط واختبر التجربة من
              حساب إنستغرام آخر.
            </p>
            <ul>
              <li><CheckCircle2 size={19} /> كلمات مفتاحية أو أي تعليق مؤهل</li>
              <li><CheckCircle2 size={19} /> رد عام ورسالة خاصة بشكل مستقل</li>
              <li><CheckCircle2 size={19} /> زر رابط واضح داخل الرسالة</li>
              <li><CheckCircle2 size={19} /> سجل للنشاط والإرسال</li>
            </ul>
            <Link className={styles.textLink} href="/tutorials/instagram-comment-to-dm">
              شاهد الشرح الكامل <ArrowLeft size={17} />
            </Link>
          </div>
          <div className={styles.screenshotFrame}>
            <div className={styles.browserBar} aria-hidden="true">
              <span /><span /><span />
              <p>ap3k.com</p>
            </div>
            <Image
              src="/images/docs/create.webp"
              alt="واجهة إنشاء أتمتة التعليقات والرسائل الخاصة في AP3K"
              width={1363}
              height={936}
              sizes="(max-width: 900px) 94vw, 52vw"
            />
          </div>
        </section>

        <section className={styles.usesSection} id="uses">
          <div className={styles.sectionIntro}>
            <span className={styles.sectionLabel}>استخدامات عملية</span>
            <h2>استخدم الأتمتة لتسليم ما طلبه المتابع</h2>
          </div>
          <div className={styles.useGrid}>
            {useCases.map(({ icon: Icon, title, body }) => (
              <article key={title}>
                <span className={styles.useIcon}><Icon size={24} /></span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.freeSection} id="free">
          <div className={styles.freeCopy}>
            <span className={styles.sectionLabel}>ابدأ دون مخاطرة</span>
            <h2>اختبر أول حملة مجانًا على جمهورك الحقيقي</h2>
            <p>
              الخطة المجانية مناسبة لبناء حملة واحدة، اختبار التعليقات والرسائل،
              ومعرفة إن كانت الأتمتة توفر وقتك قبل الانتقال إلى خطة مدفوعة.
            </p>
            <div className={styles.trustRow}>
              <ShieldCheck size={21} />
              <span>ربط الحساب عبر مسار تفويض إنستغرام، دون إدخال كلمة المرور في AP3K.</span>
            </div>
          </div>
          <div className={styles.planCard}>
            <div className={styles.planHeader}>
              <div><span>الخطة المجانية</span><strong>0$</strong></div>
              <span className={styles.planBadge}>للبدء</span>
            </div>
            <ul>
              <li><Check size={18} /> 500 عملية تلقائية ناجحة شهريًا</li>
              <li><Check size={18} /> حساب Instagram واحد</li>
              <li><Check size={18} /> حتى 5 عمليات أتمتة نشطة</li>
              <li><Check size={18} /> ردود عامة ورسائل خاصة</li>
            </ul>
            <Link className={styles.primaryCta} href={SIGN_UP_URL}>
              أنشئ حسابك المجاني <ArrowLeft size={20} />
            </Link>
            <p className={styles.planNote}>لا تحتاج إلى بطاقة بنكية.</p>
          </div>
        </section>

        <section className={styles.faqSection}>
          <div className={styles.sectionIntro}>
            <span className={styles.sectionLabel}>أسئلة شائعة</span>
            <h2>كل ما تحتاج معرفته قبل التجربة</h2>
          </div>
          <div className={styles.faqList}>
            {faqs.map(({ question, answer }) => (
              <details key={question}>
                <summary>{question}<span>+</span></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.finalCta}>
          <div className={styles.finalGlow} aria-hidden="true" />
          <AP3KLogo className={styles.finalLogo} markClassName="h-12 w-12 rounded-2xl" />
          <h2>دع تعليقك القادم يبدأ محادثة مفيدة</h2>
          <p>أنشئ أول أتمتة، اختبرها من حساب آخر، ثم اترك AP3K يتولى الرد المتكرر.</p>
          <Link className={styles.primaryCta} href={SIGN_UP_URL}>
            ابدأ مجانًا الآن <ArrowLeft size={20} />
          </Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <AP3KLogo className={styles.footerLogo} markClassName="h-8 w-8 rounded-xl" />
        <p>© 2026 AP3K. جميع الحقوق محفوظة.</p>
        <div>
          <Link href="/privacy">سياسة الخصوصية</Link>
          <Link href="/terms">شروط الاستخدام</Link>
          <Link href="/contact">تواصل معنا</Link>
        </div>
      </footer>
    </div>
  );
}
