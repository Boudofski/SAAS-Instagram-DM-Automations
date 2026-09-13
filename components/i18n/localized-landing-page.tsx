import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import { localizePublicPath, type Locale } from "@/lib/i18n/config";
import { ArrowRight, CheckCircle2, MessageCircle, Reply, Send, Sparkles } from "lucide-react";
import Link from "next/link";

export type LandingCopy = {
  badge: string;
  title: string;
  description: string;
  freeNote: string;
  primaryCta: string;
  secondaryCta: string;
  workflowKicker: string;
  workflowTitle: string;
  workflowDescription: string;
  steps: Array<{ title: string; description: string }>;
  benefitsKicker: string;
  benefitsTitle: string;
  benefits: string[];
  pricingKicker: string;
  pricingTitle: string;
  pricingDescription: string;
  plans: Array<{ name: string; price: string; description: string }>;
  faqKicker: string;
  faqTitle: string;
  faqs: Array<{ question: string; answer: string }>;
  finalTitle: string;
  finalDescription: string;
};

const COPY: Record<Exclude<Locale, "en">, LandingCopy> = {
  ar: {
    badge: "أتمتة تعليقات ورسائل إنستغرام",
    title: "حوّل تعليقات إنستغرام إلى عملاء.",
    description: "رد تلقائيًا على التعليقات، وأرسل الرابط المطلوب عبر الرسائل الخاصة، وتابع كل عميل محتمل دون تدفقات معقدة أو برمجة.",
    freeNote: "500 إجراء آلي كل شهر. لا تحتاج إلى بطاقة ائتمان.",
    primaryCta: "ابدأ مجانًا",
    secondaryCta: "شاهد كيف يعمل",
    workflowKicker: "طريقة عمل AP3K",
    workflowTitle: "من تعليق إنستغرام إلى رابط مُرسَل تلقائيًا.",
    workflowDescription: "اختر المنشور والمحفّز والإجراءات مرة واحدة، وسيتولى AP3K المتابعة فور وصول التفاعل المناسب.",
    steps: [
      { title: "اختر المحفّز", description: "استخدم كلمة مفتاحية محددة أو أي تعليق مؤهل." },
      { title: "رد علنًا", description: "أرسل ردًا محفوظًا ليعرف الشخص أن عليه مراجعة رسائله." },
      { title: "أرسل الرسالة الخاصة", description: "أرسل رسالتك وزر الرابط الاختياري تلقائيًا." },
      { title: "تابع النتائج", description: "شاهد الردود والرسائل والعملاء المحتملين في مكان واحد." },
    ],
    benefitsKicker: "أتمتة بسيطة وفعالة",
    benefitsTitle: "تابع جمهورك في اللحظة المناسبة.",
    benefits: ["الرد تلقائيًا على التعليقات المؤهلة", "إرسال رسالة خاصة وزر رابط واضح", "تنظيم العملاء المحتملين ونشاط الأتمتة", "استخدام واجهة Instagram API الرسمية"],
    pricingKicker: "أسعار واضحة",
    pricingTitle: "ابدأ مجانًا ثم ترقَّ عند نموك.",
    pricingDescription: "جميع الخطط تدعم حساب إنستغرام احترافيًا واحدًا. يمكنك التغيير أو الإلغاء من داخل AP3K.",
    plans: [
      { name: "مجاني", price: "$0", description: "500 إجراء شهريًا وحتى 5 عمليات أتمتة نشطة." },
      { name: "احترافي", price: "$9 / شهر", description: "أتمتة نشطة غير محدودة وميزات الذكاء الاصطناعي." },
      { name: "أعمال", price: "$29 / شهر", description: "حدود استخدام أعلى للحملات المتنامية." },
    ],
    faqKicker: "الأسئلة الشائعة",
    faqTitle: "إجابات واضحة قبل أن تبدأ.",
    faqs: [
      { question: "ما الحسابات التي يمكن ربطها؟", answer: "يدعم AP3K حسابات إنستغرام للأعمال والمنشئين عبر عملية التفويض الرسمية من Meta." },
      { question: "هل يمكن إرسال رد وتعليق خاص معًا؟", answer: "نعم. يمكنك تشغيل الرد العلني أو الرسالة الخاصة أو كليهما ضمن الأتمتة نفسها." },
      { question: "هل يمكن أن تحتوي الرسالة على رابط؟", answer: "نعم. أضف عنوان الوجهة ونص الزر لإرسال رابط قابل للنقر داخل الرسالة الخاصة." },
      { question: "كيف أختبر الأتمتة؟", answer: "فعّلها ثم اختبرها من حساب إنستغرام مختلف، وراجع الرد والرسالة والرابط قبل نشر حملتك." },
    ],
    finalTitle: "ابدأ أتمتة إنستغرام اليوم.",
    finalDescription: "أنشئ أول أتمتة واختبرها ودع AP3K يتولى المتابعة المتكررة.",
  },
  fr: {
    badge: "Automatisation des commentaires et DM Instagram",
    title: "Transformez les commentaires Instagram en clients.",
    description: "Répondez automatiquement aux commentaires, envoyez le lien promis par DM et suivez chaque prospect, sans flux complexes ni code.",
    freeNote: "500 actions automatisées par mois. Aucune carte bancaire requise.",
    primaryCta: "Commencer gratuitement",
    secondaryCta: "Voir le fonctionnement",
    workflowKicker: "Le fonctionnement d’AP3K",
    workflowTitle: "Du commentaire Instagram au lien envoyé, automatiquement.",
    workflowDescription: "Choisissez une fois la publication, le déclencheur et les actions. AP3K assure le suivi dès que la bonne interaction arrive.",
    steps: [
      { title: "Choisissez le déclencheur", description: "Utilisez un mot-clé précis ou tout commentaire éligible." },
      { title: "Répondez publiquement", description: "Publiez une réponse enregistrée pour inviter la personne à consulter ses DM." },
      { title: "Envoyez le DM", description: "Envoyez automatiquement votre message et un bouton de lien facultatif." },
      { title: "Suivez les résultats", description: "Regroupez réponses, DM et prospects au même endroit." },
    ],
    benefitsKicker: "Une automatisation simple et efficace",
    benefitsTitle: "Répondez au moment où votre audience est attentive.",
    benefits: ["Réponses automatiques aux commentaires éligibles", "DM avec un bouton de lien clair", "Prospects et activité regroupés", "Utilisation de l’API Instagram officielle"],
    pricingKicker: "Des tarifs clairs",
    pricingTitle: "Commencez gratuitement, évoluez quand vous grandissez.",
    pricingDescription: "Chaque offre prend en charge un compte Instagram professionnel. Changez d’offre ou résiliez depuis AP3K.",
    plans: [
      { name: "Gratuit", price: "0 $", description: "500 actions par mois et jusqu’à 5 automatisations actives." },
      { name: "Pro", price: "9 $ / mois", description: "Automatisations actives illimitées et fonctions d’IA." },
      { name: "Business", price: "29 $ / mois", description: "Des limites supérieures pour les campagnes en croissance." },
    ],
    faqKicker: "Questions fréquentes",
    faqTitle: "Des réponses claires avant de commencer.",
    faqs: [
      { question: "Quels comptes puis-je connecter ?", answer: "AP3K prend en charge les comptes Instagram Business et Creator via l’autorisation officielle de Meta." },
      { question: "Puis-je répondre publiquement et envoyer un DM ?", answer: "Oui. Activez la réponse publique, le DM ou les deux dans une même automatisation." },
      { question: "Le DM peut-il contenir un lien ?", answer: "Oui. Ajoutez l’URL de destination et le libellé du bouton pour envoyer un lien cliquable." },
      { question: "Comment tester une automatisation ?", answer: "Activez-la, testez-la depuis un autre compte Instagram, puis vérifiez la réponse, le DM et le lien avant votre campagne." },
    ],
    finalTitle: "Automatisez Instagram dès aujourd’hui.",
    finalDescription: "Créez votre première automatisation, testez-la et laissez AP3K gérer le suivi répétitif.",
  },
  es: {
    badge: "Automatización de comentarios y DM de Instagram",
    title: "Convierte los comentarios de Instagram en clientes.",
    description: "Responde automáticamente a los comentarios, envía el enlace prometido por DM y registra cada contacto, sin flujos complejos ni código.",
    freeNote: "500 acciones automatizadas al mes. Sin tarjeta de crédito.",
    primaryCta: "Empezar gratis",
    secondaryCta: "Ver cómo funciona",
    workflowKicker: "Cómo funciona AP3K",
    workflowTitle: "Del comentario de Instagram al enlace entregado, automáticamente.",
    workflowDescription: "Elige una vez la publicación, el activador y las acciones. AP3K se ocupa del seguimiento cuando llega la interacción adecuada.",
    steps: [
      { title: "Elige el activador", description: "Usa una palabra clave concreta o cualquier comentario válido." },
      { title: "Responde públicamente", description: "Publica una respuesta guardada para indicar que revise sus DM." },
      { title: "Envía el DM", description: "Entrega automáticamente tu mensaje y un botón de enlace opcional." },
      { title: "Revisa los resultados", description: "Consulta respuestas, DM y contactos en un solo lugar." },
    ],
    benefitsKicker: "Automatización sencilla y eficaz",
    benefitsTitle: "Responde cuando tu audiencia sigue atenta.",
    benefits: ["Respuesta automática a comentarios válidos", "DM con un botón de enlace claro", "Contactos y actividad organizados", "Uso de la API oficial de Instagram"],
    pricingKicker: "Precios claros",
    pricingTitle: "Empieza gratis y mejora cuando crezcas.",
    pricingDescription: "Todos los planes admiten una cuenta profesional de Instagram. Cambia o cancela desde AP3K.",
    plans: [
      { name: "Gratis", price: "$0", description: "500 acciones al mes y hasta 5 automatizaciones activas." },
      { name: "Pro", price: "$9 / mes", description: "Automatizaciones activas ilimitadas y funciones de IA." },
      { name: "Business", price: "$29 / mes", description: "Límites más altos para campañas en crecimiento." },
    ],
    faqKicker: "Preguntas frecuentes",
    faqTitle: "Respuestas claras antes de empezar.",
    faqs: [
      { question: "¿Qué cuentas puedo conectar?", answer: "AP3K admite cuentas Business y Creator de Instagram mediante la autorización oficial de Meta." },
      { question: "¿Puedo responder públicamente y enviar un DM?", answer: "Sí. Activa la respuesta pública, el DM o ambas acciones en la misma automatización." },
      { question: "¿El DM puede incluir un enlace?", answer: "Sí. Añade la URL de destino y el texto del botón para enviar un enlace en el DM." },
      { question: "¿Cómo pruebo una automatización?", answer: "Actívala, pruébala desde otra cuenta de Instagram y comprueba la respuesta, el DM y el enlace antes de promocionarla." },
    ],
    finalTitle: "Empieza a automatizar Instagram hoy.",
    finalDescription: "Crea tu primera automatización, pruébala y deja que AP3K gestione el seguimiento repetitivo.",
  },
  de: {
    badge: "Automatisierung für Instagram-Kommentare und DMs",
    title: "Mach aus Instagram-Kommentaren Kunden.",
    description: "Beantworte Kommentare automatisch, sende den versprochenen Link per DM und erfasse jeden Lead – ohne komplizierte Abläufe oder Code.",
    freeNote: "500 automatisierte Aktionen pro Monat. Keine Kreditkarte erforderlich.",
    primaryCta: "Kostenlos starten",
    secondaryCta: "So funktioniert’s",
    workflowKicker: "Der AP3K-Ablauf",
    workflowTitle: "Vom Instagram-Kommentar zum zugestellten Link – automatisch.",
    workflowDescription: "Wähle Beitrag, Auslöser und Aktionen einmal aus. AP3K übernimmt die Nachverfolgung, sobald die passende Interaktion eingeht.",
    steps: [
      { title: "Auslöser wählen", description: "Nutze ein bestimmtes Keyword oder jeden zulässigen Kommentar." },
      { title: "Öffentlich antworten", description: "Sende eine gespeicherte Antwort mit dem Hinweis auf die DMs." },
      { title: "DM senden", description: "Sende deine Nachricht und optional einen Link-Button automatisch." },
      { title: "Ergebnisse prüfen", description: "Behalte Antworten, DMs und Leads an einem Ort im Blick." },
    ],
    benefitsKicker: "Einfache, wirksame Automatisierung",
    benefitsTitle: "Antworte, solange deine Zielgruppe aufmerksam ist.",
    benefits: ["Automatische Antworten auf zulässige Kommentare", "DMs mit einem klaren Link-Button", "Leads und Aktivität übersichtlich gebündelt", "Nutzung der offiziellen Instagram API"],
    pricingKicker: "Klare Preise",
    pricingTitle: "Starte kostenlos und wechsle bei Bedarf.",
    pricingDescription: "Alle Tarife unterstützen ein professionelles Instagram-Konto. Wechsel oder Kündigung erfolgen direkt in AP3K.",
    plans: [
      { name: "Kostenlos", price: "0 $", description: "500 Aktionen pro Monat und bis zu 5 aktive Automatisierungen." },
      { name: "Pro", price: "9 $ / Monat", description: "Unbegrenzte aktive Automatisierungen und KI-Funktionen." },
      { name: "Business", price: "29 $ / Monat", description: "Höhere Limits für wachsende Kampagnen." },
    ],
    faqKicker: "Häufige Fragen",
    faqTitle: "Klare Antworten vor dem Start.",
    faqs: [
      { question: "Welche Konten kann ich verbinden?", answer: "AP3K unterstützt Instagram-Business- und Creator-Konten über die offizielle Autorisierung von Meta." },
      { question: "Kann ich öffentlich antworten und eine DM senden?", answer: "Ja. Aktiviere die öffentliche Antwort, die DM oder beides in derselben Automatisierung." },
      { question: "Kann die DM einen Link enthalten?", answer: "Ja. Füge die Ziel-URL und die Button-Beschriftung hinzu, um einen anklickbaren Link zu senden." },
      { question: "Wie teste ich eine Automatisierung?", answer: "Aktiviere sie, teste mit einem anderen Instagram-Konto und prüfe Antwort, DM und Link vor deiner Kampagne." },
    ],
    finalTitle: "Automatisiere Instagram noch heute.",
    finalDescription: "Erstelle deine erste Automatisierung, teste sie und überlasse AP3K die wiederkehrende Nachverfolgung.",
  },
  pt: {
    badge: "Automação de comentários e DMs do Instagram",
    title: "Transforme comentários do Instagram em clientes.",
    description: "Responda automaticamente a comentários, envie o link prometido por DM e acompanhe cada contacto, sem fluxos complexos nem código.",
    freeNote: "500 ações automatizadas por mês. Sem cartão de crédito.",
    primaryCta: "Começar grátis",
    secondaryCta: "Ver como funciona",
    workflowKicker: "Como funciona o AP3K",
    workflowTitle: "Do comentário no Instagram ao link entregue, automaticamente.",
    workflowDescription: "Escolha uma vez a publicação, o acionador e as ações. O AP3K trata do seguimento quando chega a interação certa.",
    steps: [
      { title: "Escolha o acionador", description: "Use uma palavra-chave específica ou qualquer comentário elegível." },
      { title: "Responda publicamente", description: "Publique uma resposta guardada para indicar que deve consultar as DMs." },
      { title: "Envie a DM", description: "Envie automaticamente a mensagem e um botão de link opcional." },
      { title: "Veja os resultados", description: "Acompanhe respostas, DMs e contactos num só lugar." },
    ],
    benefitsKicker: "Automação simples e eficaz",
    benefitsTitle: "Responda enquanto o público ainda está atento.",
    benefits: ["Respostas automáticas a comentários elegíveis", "DMs com um botão de link claro", "Contactos e atividade organizados", "Utilização da API oficial do Instagram"],
    pricingKicker: "Preços claros",
    pricingTitle: "Comece grátis e evolua quando crescer.",
    pricingDescription: "Todos os planos suportam uma conta profissional do Instagram. Altere ou cancele dentro do AP3K.",
    plans: [
      { name: "Grátis", price: "0 $", description: "500 ações por mês e até 5 automações ativas." },
      { name: "Pro", price: "9 $ / mês", description: "Automações ativas ilimitadas e funcionalidades de IA." },
      { name: "Business", price: "29 $ / mês", description: "Limites superiores para campanhas em crescimento." },
    ],
    faqKicker: "Perguntas frequentes",
    faqTitle: "Respostas claras antes de começar.",
    faqs: [
      { question: "Que contas posso ligar?", answer: "O AP3K suporta contas Business e Creator do Instagram através da autorização oficial da Meta." },
      { question: "Posso responder publicamente e enviar uma DM?", answer: "Sim. Ative a resposta pública, a DM ou ambas na mesma automação." },
      { question: "A DM pode incluir um link?", answer: "Sim. Adicione o URL de destino e o texto do botão para enviar um link clicável." },
      { question: "Como testo uma automação?", answer: "Ative-a, teste com outra conta do Instagram e confirme a resposta, a DM e o link antes da campanha." },
    ],
    finalTitle: "Comece hoje a automatizar o Instagram.",
    finalDescription: "Crie a primeira automação, teste-a e deixe o AP3K tratar do seguimento repetitivo.",
  },
};

const STEP_ICONS = [MessageCircle, Reply, Send, CheckCircle2] as const;

export function getLocalizedLandingCopy(locale: Exclude<Locale, "en">) {
  return COPY[locale];
}

export default function LocalizedLandingPage({ locale }: { locale: Exclude<Locale, "en"> }) {
  const copy = getLocalizedLandingCopy(locale);
  const href = (path: string) => localizePublicPath(path, locale);

  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#080911] dark:text-white">
      <WebsiteNav current="home" />
      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#5121c7_0%,#7435e8_44%,#9c3eea_100%)] px-4 py-20 text-white sm:px-8 lg:px-16 lg:py-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(244,114,182,.35),transparent_30rem)]" />
          <div className="relative mx-auto max-w-5xl text-center">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.16em]"><Sparkles className="h-4 w-4" />{copy.badge}</p>
            <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-black leading-[.98] tracking-[-.05em] sm:text-7xl">{copy.title}</h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-white/85 sm:text-xl">{copy.description}</p>
            <p className="mt-4 text-sm font-bold text-white/85">{copy.freeNote}</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={href("/sign-up")} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black text-violet-700 shadow-xl">{copy.primaryCta}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
              <a href="#how-it-works" className="rounded-full border border-white/25 bg-white/10 px-8 py-4 text-sm font-black backdrop-blur">{copy.secondaryCta}</a>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-4 py-20 sm:px-8 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center"><p className="ap3k-kicker">{copy.workflowKicker}</p><h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{copy.workflowTitle}</h2><p className="mt-5 leading-8 text-slate-600 dark:text-slate-300">{copy.workflowDescription}</p></div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{copy.steps.map((step, index) => { const Icon = STEP_ICONS[index]; return <article key={step.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[.04]"><Icon className="h-6 w-6 text-violet-600 dark:text-violet-300" /><p className="mt-5 text-lg font-black">{step.title}</p><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.description}</p></article>; })}</div>
          </div>
        </section>

        <section id="features" className="bg-violet-700 px-4 py-20 text-white sm:px-8 lg:px-16"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center"><div><p className="text-xs font-black uppercase tracking-[.2em] text-fuchsia-200">{copy.benefitsKicker}</p><h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{copy.benefitsTitle}</h2></div><div className="grid gap-3">{copy.benefits.map((benefit) => <div key={benefit} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 font-bold"><CheckCircle2 className="h-5 w-5 shrink-0 text-fuchsia-200" />{benefit}</div>)}</div></div></section>

        <section className="px-4 py-20 sm:px-8 lg:px-16"><div className="mx-auto max-w-6xl"><div className="text-center"><p className="ap3k-kicker">{copy.pricingKicker}</p><h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{copy.pricingTitle}</h2><p className="mx-auto mt-5 max-w-2xl leading-8 text-slate-600 dark:text-slate-300">{copy.pricingDescription}</p></div><div className="mt-10 grid gap-4 md:grid-cols-3">{copy.plans.map((plan) => <article key={plan.name} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-white/[.04]"><h3 className="text-xl font-black">{plan.name}</h3><p className="mt-4 text-3xl font-black text-violet-600 dark:text-violet-300">{plan.price}</p><p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{plan.description}</p></article>)}</div><div className="mt-8 text-center"><Link href={href("/pricing")} className="font-black text-violet-600 dark:text-violet-300">{copy.pricingKicker} <ArrowRight className="inline h-4 w-4 rtl:rotate-180" /></Link></div></div></section>

        <section className="bg-[#11131d] px-4 py-20 text-white sm:px-8"><div className="mx-auto max-w-3xl"><div className="text-center"><p className="text-xs font-black uppercase tracking-[.2em] text-violet-300">{copy.faqKicker}</p><h2 className="mt-4 text-4xl font-black tracking-tight">{copy.faqTitle}</h2></div><div className="mt-10 divide-y divide-white/10 border-y border-white/10">{copy.faqs.map((item) => <details key={item.question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-black"><span>{item.question}</span><span className="text-2xl text-violet-300 transition group-open:rotate-45">+</span></summary><p className="pt-4 text-sm leading-7 text-white/70">{item.answer}</p></details>)}</div></div></section>

        <section className="bg-[linear-gradient(135deg,#5420ca,#963be5)] px-4 py-20 text-center text-white sm:px-8"><div className="mx-auto max-w-3xl"><h2 className="text-4xl font-black tracking-tight sm:text-5xl">{copy.finalTitle}</h2><p className="mx-auto mt-5 max-w-2xl leading-8 text-white/80">{copy.finalDescription}</p><Link href={href("/sign-up")} className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black text-violet-700">{copy.primaryCta}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link></div></section>
      </main>
      <WebsiteFooter />
    </div>
  );
}
