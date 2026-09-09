import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import AutomationDemo from "@/components/website/automation-demo";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

const canonical = "/ar/instagram-dm-automation";

export const metadata: Metadata = {
  title: "أتمتة رسائل إنستغرام والتعليقات | AP3K",
  description: "حوّل تعليقات إنستغرام إلى ردود ورسائل خاصة وروابط قابلة للتتبع باستخدام AP3K، من دون تدفقات معقدة أو برمجة.",
  keywords: ["أتمتة رسائل إنستغرام", "الرد التلقائي على تعليقات إنستغرام", "تحويل التعليقات إلى رسائل خاصة"],
  alternates: {
    canonical,
    languages: { "en-US": "/instagram-dm-automation", ar: canonical, "x-default": "/instagram-dm-automation" },
  },
  openGraph: {
    title: "أتمتة رسائل إنستغرام والتعليقات | AP3K",
    description: "أرسل الرد أو الرابط الموعود تلقائياً بعد تعليق مؤهل، وتابع النتائج بوضوح.",
    url: `https://ap3k.com${canonical}`,
    siteName: "AP3K",
    locale: "ar_MA",
    type: "website",
    images: [{ url: "https://ap3k.com/media/ap3k-product-03.jpg", width: 1156, height: 2056, alt: "مثال عملي لأتمتة رسائل إنستغرام عبر AP3K" }],
  },
};

const FAQ = [
  { q: "هل يمكن إرسال رسالة خاصة من دون رد علني؟", a: "نعم. الرد على التعليق وإرسال الرسالة الخاصة إجراءان منفصلان، ويمكنك تفعيل ما تحتاج إليه فقط." },
  { q: "هل يمكن إضافة رابط قابل للنقر؟", a: "نعم. أضف رابط HTTPS كاملاً واكتب اسماً قصيراً وواضحاً للزر مثل افتح الدليل أو شاهد المنتج." },
  { q: "ما الذي يتضمنه الحساب المجاني؟", a: "يتضمن 500 إجراء آلي كل شهر، وحساب إنستغرام واحداً، وما يصل إلى خمس أتمتات نشطة. الردود بالذكاء الاصطناعي متاحة في الخطط المدفوعة." },
];

export default function ArabicInstagramDmAutomationPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "ar",
    mainEntity: FAQ.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  };

  return (
    <div lang="ar" dir="rtl" className="min-h-screen bg-[#f8f7fc] text-slate-950 dark:bg-[#080911] dark:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />
      <div dir="ltr"><WebsiteNav /></div>
      <main>
        <section className="overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(217,70,239,.28),transparent_28rem),linear-gradient(135deg,#32107e,#6225cc_48%,#8b2ed8)] px-4 py-16 text-white sm:px-8 lg:px-16 lg:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[.12em] text-fuchsia-200">أتمتة تعليقات ورسائل إنستغرام</p>
              <h1 className="mt-5 text-4xl font-black leading-[1.12] tracking-tight sm:text-6xl">حوّل تعليقات إنستغرام إلى عملاء.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-9 text-white/80">ردّ على التعليقات تلقائياً، وأرسل الرابط الموعود برسالة خاصة، وتابع كل عميل محتمل—من دون تدفقات معقدة أو برمجة.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-violet-700 shadow-xl">ابدأ الآن <ArrowLeft className="h-4 w-4" /></Link>
                <a href="#example" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 py-4 text-sm font-black">شاهد المثال</a>
              </div>
              <p className="mt-4 text-xs font-bold text-white/65">500 إجراء آلي شهرياً · حساب إنستغرام واحد · 5 أتمتات نشطة</p>
            </div>
            <div className="ap3k-product-float relative mx-auto w-full max-w-[390px]">
              <div aria-hidden="true" className="pointer-events-none absolute -inset-12 rounded-[4rem] bg-fuchsia-300/30 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2.6rem] border border-white/25 bg-black p-2 shadow-[0_34px_110px_rgba(10,3,35,.52)]">
                <video autoPlay muted loop playsInline poster="/media/ap3k-product-03.jpg" preload="metadata" aria-label="مثال عملي لأتمتة رسائل إنستغرام عبر AP3K" className="aspect-[1200/2128] w-full rounded-[2.15rem] bg-black object-cover object-top">
                  <source src="/media/instagram-features_04.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-black uppercase tracking-[.12em] text-violet-600 dark:text-violet-300">طريقة العمل</p>
            <h2 className="mt-3 text-3xl font-black sm:text-5xl">أربع خطوات واضحة من التفاعل إلى الرسالة.</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                ["اربط إنستغرام", "اربط حساب أعمال أو منشئ محتوى عبر التفويض الرسمي."],
                ["اختر المحفّز", "استخدم كلمة محددة أو تعليقاً مؤهلاً أو تفاعلاً مع القصة."],
                ["اختر الإجراءات", "فعّل الرد العلني أو الرسالة الخاصة أو كليهما حسب هدفك."],
                ["اختبر وتابع", "اختبر من حساب آخر وراجع الإرسال والنشاط والعملاء المحتملين."],
              ].map(([title, body], index) => <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[.04]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-xs font-black text-white">{index + 1}</span><h3 className="mt-5 font-black">{title}</h3><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{body}</p></div>)}
            </div>
          </div>
        </section>

        <section id="example" dir="ltr" className="bg-[#11131d] px-4 py-20 text-white sm:px-8 lg:px-16">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
            <div dir="rtl"><p className="text-xs font-black text-fuchsia-300">مثال تفاعلي</p><h2 className="mt-3 text-3xl font-black sm:text-5xl">جرّب منطق التعليق إلى الرسالة.</h2><p className="mt-5 text-base leading-8 text-white/65">يوضح المثال ترتيب الحدث في AP3K. في الأتمتة الفعلية تختار المنشور والمحفّز والرد والرسالة والرابط بشكل مستقل.</p></div>
            <AutomationDemo keyword="دليل" />
          </div>
        </section>

        <section className="px-4 py-20 sm:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-black text-violet-600 dark:text-violet-300">الأسئلة الشائعة</p>
            <h2 className="mt-3 text-3xl font-black sm:text-5xl">ما تحتاج إلى معرفته قبل الإطلاق.</h2>
            <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">{FAQ.map((item) => <details key={item.q} className="py-5"><summary className="cursor-pointer font-black">{item.q}</summary><p className="pt-4 text-sm leading-7 text-slate-600 dark:text-slate-400">{item.a}</p></details>)}</div>
            <div className="mt-10 rounded-3xl bg-violet-50 p-6 dark:bg-violet-500/[.07]"><h3 className="font-black">حدود مهمة</h3><ul className="mt-4 grid gap-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{["يتطلب AP3K حساب Instagram Business أو Creator.", "تعمل الأتمتة على التفاعلات الجديدة بعد تفعيلها، ولا ترجع إلى التعليقات القديمة.", "كل رد علني ناجح وكل رسالة خاصة ناجحة يُحسب إجراءً آلياً واحداً.", "تظل عملية الإرسال خاضعة لصلاحيات وقواعد منصة Meta."].map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-violet-600" />{item}</li>)}</ul></div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-violet-700 to-fuchsia-600 px-4 py-16 text-center text-white sm:px-8">
          <h2 className="text-3xl font-black sm:text-5xl">ابدأ أول أتمتة مجاناً.</h2>
          <p className="mt-4 text-white/75">500 إجراء آلي كل شهر، من دون بطاقة ائتمان.</p>
          <Link href="/sign-up" className="mt-7 inline-flex rounded-full bg-white px-7 py-4 text-sm font-black text-violet-700">ابدأ الآن</Link>
        </section>
      </main>
      <div dir="ltr"><WebsiteFooter /></div>
    </div>
  );
}
