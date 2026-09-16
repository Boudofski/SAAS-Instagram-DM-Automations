import Image from "next/image";
import Link from "next/link";
import { getServerLocale } from "@/lib/i18n/server";
import { localizePublicPath } from "@/lib/i18n/config";
import intents from "@/lib/content/growth/search-intents.json";
import { GROWTH_SOURCES } from "@/lib/content/growth/sources";

const copy = {
  en: ["Official sources", "See the comment-to-DM example", "Screenshot of AP3K’s public interactive example in English, using sample data. It illustrates the sequence, not an actual customer conversation or delivery result.", "Run the interactive example", "Setup and troubleshooting", "Compare plans"],
  ar: ["المصادر الرسمية", "شاهد مثالًا لتحويل التعليق إلى رسالة خاصة", "لقطة شاشة للمثال التفاعلي العام في AP3K باللغة الإنجليزية وببيانات تجريبية. توضح تسلسل الخطوات، وليست محادثة عميل حقيقية أو نتيجة تسليم فعلية.", "شغّل المثال التفاعلي", "الإعداد وحل المشكلات", "قارن الخطط"],
  fr: ["Sources officielles", "Voir le parcours du commentaire au DM", "Capture de l’exemple interactif public d’AP3K en anglais, avec des données de démonstration. Elle illustre les étapes, pas une conversation client ou une livraison réelle.", "Lancer l’exemple interactif", "Configuration et dépannage", "Comparer les offres"],
  es: ["Fuentes oficiales", "Mira el ejemplo de comentario a DM", "Captura del ejemplo interactivo público de AP3K en inglés con datos de muestra. Ilustra la secuencia, no una conversación real ni un resultado de entrega.", "Abrir el ejemplo interactivo", "Configuración y solución de problemas", "Comparar planes"],
  de: ["Offizielle Quellen", "Beispiel vom Kommentar zur DM ansehen", "Screenshot des öffentlichen interaktiven AP3K-Beispiels auf Englisch mit Beispieldaten. Er zeigt den Ablauf, kein echtes Kundengespräch oder Zustellergebnis.", "Interaktives Beispiel starten", "Einrichtung und Fehlerbehebung", "Tarife vergleichen"],
  pt: ["Fontes oficiais", "Veja o exemplo de comentário para DM", "Captura do exemplo interativo público do AP3K em inglês com dados de demonstração. Ilustra a sequência, não uma conversa real nem um resultado de entrega.", "Abrir o exemplo interativo", "Configuração e resolução de problemas", "Comparar planos"],
};

export function GrowthSectionSources({ slug, index }: { slug: string; index: number }) {
  const sources = GROWTH_SOURCES[slug]?.[index];
  if (!sources) return null;
  const labels = copy[getServerLocale()];
  return <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
    <span>{labels[0]}:</span>
    {sources.map(source => <a key={source.url} href={source.url} className="font-semibold text-violet-600 underline underline-offset-4 dark:text-violet-300">{source.name}</a>)}
  </p>;
}

export default function GrowthGuideExtras({ slug }: { slug: string }) {
  if (!Object.prototype.hasOwnProperty.call(intents, slug)) return null;
  const locale = getServerLocale();
  const labels = copy[locale];
  return <section className="mt-12 rounded-3xl border border-violet-500/20 bg-violet-50/60 p-5 dark:bg-violet-500/5 sm:p-8">
    <h2 className="text-2xl font-black">{labels[1]}</h2>
    <figure className="mx-auto mt-6 max-w-xl">
      <Image src="/images/guides/comment-to-dm-example.jpg" alt={labels[1]} width={556} height={405} sizes="(max-width: 640px) 85vw, 556px" className="h-auto w-full rounded-2xl" />
      <figcaption className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{labels[2]}</figcaption>
    </figure>
    <nav className="mt-6 flex flex-wrap gap-4 text-sm font-bold text-violet-600 dark:text-violet-300">
      <Link href={`${localizePublicPath("/instagram-dm-automation", locale)}#example`} className="underline underline-offset-4">{labels[3]}</Link>
      <Link href={localizePublicPath("/help", locale)} className="underline underline-offset-4">{labels[4]}</Link>
      <Link href={localizePublicPath("/pricing", locale)} className="underline underline-offset-4">{labels[5]}</Link>
    </nav>
  </section>;
}
