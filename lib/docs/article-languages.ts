import { localizePublicPath, type Locale } from "@/lib/i18n/config";
import type { DocsArticle } from "./types";

type ArticleTranslation = Pick<DocsArticle, "title" | "description" | "headings" | "html" | "updated">;

const slowDmSections = [
  { id: "1-check-the-automation-path", text: "١. راجع خطوات الأتمتة", body: "<ul><li>تؤخر خطوة الانتظار تفعيل الخطوة التالية للمدة التي حددتها.</li><li>قد تنتظر الرسالة الافتتاحية ضغط المستلم على الزر.</li><li>قد تتوقف الأتمتة عند جمع المعلومات حتى يجيب المستلم.</li><li>تُرسَل رسائل المتابعة في الوقت المحدد إذا تحققت شروطها.</li></ul>" },
  { id: "2-check-message-requests", text: "٢. افحص طلبات الرسائل", body: "<p>اطلب من صاحب حساب الاختبار أن يراجع طلبات الرسائل بالإضافة إلى صندوق الوارد الرئيسي. ربما وصلت الرسالة من دون أن ينتبه إليها.</p>" },
  { id: "3-review-activity-and-connection-status", text: "٣. راجع سجل النشاط وحالة الربط", body: "<p>افتح سجل نشاط الأتمتة وتفاصيل ربط حساب إنستغرام ودوّن أي خطأ في الإرسال. إذا انتهت صلاحية التفويض أو لم يكن إذن الرسائل مفعّلًا أو كانت المحادثة تحت إدارة تطبيق آخر، فعالج مشكلة الربط بدل تقصير وقت الانتظار.</p>" },
  { id: "4-check-delivery-scheduling", text: "٤. تحقّق من موعد الإرسال", body: "<p>يجدول AP3K خطوات الانتظار والمتابعة المؤهلة للإرسال. إذا تجاوزت خطوة موعدها، أرسل إلى الدعم اسم الأتمتة ووقت تشغيلها والمنطقة الزمنية حتى يتمكّن الفريق من مراجعة حالة الإرسال. يمكنك أيضًا مراجعة سجل النشاط وحالة الربط مباشرة.</p>" },
  { id: "5-respect-eligibility-and-limits", text: "٥. راجع شروط إنستغرام وحدوده", body: '<p>قد يقيّد إنستغرام الإرسال أو معدّله، ويجب أن تُرسَل المتابعات ضمن فترة المراسلة المسموح بها. الاشتراك المدفوع في AP3K لا يغيّر قيود إنستغرام. <a href="/docs/troubleshoot/fix-instagram-automation-not-working">راجع أذونات حسابك على إنستغرام</a>.</p>' },
];

const slowDmDescription = "إذا تأخرت الرسائل الخاصة، افحص خطوات الأتمتة وطلبات الرسائل وحالة ربط إنستغرام لتعرف أين توقّف الإرسال.";

const germanMigrationSections = [
  { id: "before-you-begin", text: "Vorbereitung", body: "<ul><li>Prüfe, ob du das betroffene Business-Portfolio und die Facebook-Seite verwalten kannst.</li><li>Sichere die Kampagnen und Kontakte, die du weiterhin brauchst.</li><li>Stimme dich mit dem Team ab, bevor du eine gemeinsam genutzte Integration entfernst.</li></ul>" },
  { id: "review-business-integrations", text: "Business-Integrationen prüfen", body: "<p>Suche in den Facebook-Einstellungen nach den Business-Integrationen und prüfe, auf welche Konten Manychat Zugriff hat. Entferne die Integration nur, wenn ihr sie nicht mehr benötigt. Lies vor der Bestätigung, welche Konten betroffen sind.</p>" },
  { id: "review-connected-apps", text: "Verbundene Apps prüfen", body: "<p>Öffne die Einstellungen der Meta Business Suite oder die Nachrichteneinstellungen deiner Seite. Prüfe bei den verbundenen Apps, ob das alte Tool Konversationen übernehmen darf. Entferne oder deaktiviere nur die Verbindung, die du ablösen möchtest.</p>" },
  { id: "review-instagram-conversation-routing", text: "Weiterleitung von Instagram-Nachrichten prüfen", body: "<p>Wenn du eine Standard-App für Konversationen auswählen kannst, prüfe, ob Instagram-Nachrichten noch an Manychat gehen. Menünamen und Optionen hängen von der Einrichtung ab. Ändere nur die Konten und Berechtigungen, die zur Umstellung gehören.</p>" },
  { id: "direct-instagram-login-needs-no-new-page", text: "Für die direkte Instagram-Anmeldung ist keine neue Facebook-Seite nötig", body: "<p>Diese Schritte entfernen eine alte Verbindung. Für die direkte Instagram-Anmeldung bei AP3K brauchst du keine neue Facebook-Seite. AP3K automatisiert keine Nachrichten im Facebook Messenger.</p>" },
  { id: "verify-the-switch", text: "Umstellung testen", body: '<p><a href="/docs/migrating-from-manychat/verify-manychat-is-disconnected">Prüfe, ob die alte Verbindung entfernt wurde (Englisch)</a>. Löse anschließend eine veröffentlichte AP3K-Automatisierung von einem zweiten Instagram-Konto aus und prüfe die Zustellung.</p>' },
];

const germanMigrationDescription = "So prüfst und entfernst du alte Manychat-Berechtigungen in Facebook und testest nach dem Wechsel die Zustellung in AP3K.";

const translations: Record<string, Partial<Record<Locale, ArticleTranslation>>> = {
  "migrating-from-manychat/disconnect-manychat-from-facebook": {
    de: {
      title: "Manychat von Facebook trennen: Berechtigungen prüfen",
      description: germanMigrationDescription,
      updated: "2026-11-28",
      headings: germanMigrationSections.map(({ id, text }) => ({ id, text, level: 2 })),
      html: `<p>Auch nach einem Toolwechsel kann Manychat über eine bestehende Facebook- oder Meta-Business-Verbindung Zugriff auf Instagram haben. Prüfe die folgenden Einstellungen, wenn du Manychat früher über Facebook verbunden hast.</p>` + germanMigrationSections.map(({ id, text, body }) => `<h2 id="${id}">${text}</h2>${body}`).join(""),
    },
  },
  "troubleshoot/fix-slow-dm-delivery": {
    ar: {
      title: "حل مشكلة تأخّر الرسائل الخاصة على إنستغرام",
      description: slowDmDescription,
      updated: "2026-11-28",
      headings: slowDmSections.map(({ id, text }) => ({ id, text, level: 2 })),
      html: `<p>${slowDmDescription} ابدأ بالأتمتة المتأثرة وتحقّق من الخطوة التي تنتظر ردًا أو موعدًا قبل افتراض وجود مشكلة في الإرسال.</p>` + slowDmSections.map(({ id, text, body }) => `<h2 id="${id}">${text}</h2>${body}`).join(""),
    },
  },
};

export function docsArticleTranslation(slug: string, locale: Locale) {
  return translations[slug]?.[locale];
}

export function docsArticleLocales(slug: string): Locale[] {
  return ["en", ...Object.keys(translations[slug] ?? {}) as Exclude<Locale, "en">[]];
}

export function docsArticleAlternates(slug: string) {
  const path = `/docs/${slug}`;
  const langs = Object.fromEntries(
    docsArticleLocales(slug).map(locale => [locale, `https://ap3k.com${localizePublicPath(path, locale)}`]),
  );
  return { ...langs, "x-default": `https://ap3k.com${path}` };
}

export const docsEnglishNotice: Record<Exclude<Locale, "en">, string> = {
  ar: "هذا المقال متاح حاليًا باللغة الإنجليزية.",
  fr: "Cet article est actuellement disponible en anglais.",
  es: "Por ahora, este artículo está disponible en inglés.",
  de: "Dieser Artikel ist derzeit auf Englisch verfügbar.",
  nl: "Dit artikel is momenteel beschikbaar in het Engels.",
  pt: "Este artigo está atualmente disponível em inglês.",
};
