import ArabicCommentDmExperience from "./arabic-comment-dm-experience";
import { arabicCommentDmFaqs } from "./content";
import type { Metadata } from "next";

const PAGE_URL = "https://ap3k.com/ar/instagram-comment-to-dm";
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
        url: "https://ap3k.com/images/docs/create.webp",
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
    images: ["https://ap3k.com/images/docs/create.webp"],
  },
};

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
    mainEntity: arabicCommentDmFaqs.map(({ question, answer }) => ({
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

export default function ArabicCommentToDmPage() {
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}
      <ArabicCommentDmExperience />
    </>
  );
}
