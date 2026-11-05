"use client";

import { useI18n } from "@/providers/i18n-provider";
import type { Locale } from "@/lib/i18n/config";
import { getPlanLimits } from "@/lib/plan-limits";
import s from "./public-pricing.module.css";

type Copy = { title: string; intro: string; pairs: string; note: string; free: string };
export const CAPACITY_COPY: Record<Locale, Copy> = {
  en: { title: "What does your monthly allowance cover?", intro: "For a simple campaign that sends one public reply and one DM per comment:", pairs: "reply + DM pairs per month", note: "Examples use the full action allowance. Opening messages, follow-up messages and other replies also use actions, so your actual capacity may be lower. Choose features and account limits in the plans above.", free: "Free" },
  ar: { title: "كم تكفيك حصتك الشهرية؟", intro: "في حملة بسيطة ترسل ردًا عامًا واحدًا ورسالة خاصة واحدة لكل تعليق:", pairs: "رد عام مع رسالة خاصة شهريًا", note: "تفترض هذه الأمثلة استخدام الحصة كاملة. تستهلك الرسائل الافتتاحية ورسائل المتابعة والردود الأخرى إجراءات إضافية، لذا قد يكون العدد الفعلي أقل. راجع أيضًا الميزات وعدد الحسابات في الخطط أعلاه.", free: "مجاني" },
  fr: { title: "Que permet votre quota mensuel ?", intro: "Pour une campagne simple qui envoie une réponse publique et un message privé par commentaire :", pairs: "ensembles réponse + message privé par mois", note: "Ces exemples utilisent la totalité du quota. Les messages d’accueil, les relances et les autres réponses consomment aussi des actions et réduisent cette capacité. Comparez également les fonctionnalités et le nombre de comptes ci-dessus.", free: "Gratuit" },
  es: { title: "¿Cuánto permite hacer tu límite mensual?", intro: "En una campaña sencilla que envía una respuesta pública y un mensaje privado por comentario:", pairs: "pares de respuesta + mensaje privado al mes", note: "Estos ejemplos utilizan todo el límite de acciones. Los mensajes iniciales, los seguimientos y otras respuestas también consumen acciones, por lo que la capacidad real puede ser menor. Compara también las funciones y el número de cuentas de los planes anteriores.", free: "Gratis" },
  de: { title: "Wie weit reicht dein monatliches Kontingent?", intro: "Für eine einfache Kampagne mit einer öffentlichen Antwort und einer Direktnachricht pro Kommentar:", pairs: "Paare aus Antwort + Direktnachricht pro Monat", note: "Die Beispiele nutzen das gesamte Aktionskontingent. Eröffnungsnachrichten, Folgenachrichten und weitere Antworten verbrauchen ebenfalls Aktionen. Die tatsächliche Kapazität kann daher geringer sein. Vergleiche auch die Funktionen und Kontolimits der Tarife oben.", free: "Kostenlos" },
  nl: { title: "Wat kun je met je maandelijkse limiet?", intro: "Voor een eenvoudige campagne met één openbare reactie en één privébericht per opmerking:", pairs: "combinaties van reactie + privébericht per maand", note: "Deze voorbeelden gebruiken de volledige actielimiet. Openingsberichten, vervolgberichten en andere reacties verbruiken ook acties, waardoor de werkelijke capaciteit lager kan zijn. Vergelijk ook de functies en accountlimieten van de bovenstaande abonnementen.", free: "Gratis" },
  pt: { title: "Quanto rende o seu limite mensal?", intro: "Numa campanha simples que envia uma resposta pública e uma mensagem privada por comentário:", pairs: "pares de resposta + mensagem privada por mês", note: "Estes exemplos utilizam todo o limite de ações. As mensagens iniciais, as mensagens de acompanhamento e outras respostas também consomem ações, pelo que a capacidade real pode ser menor. Compare também as funcionalidades e os limites de contas dos planos acima.", free: "Grátis" },
};

export default function PricingCapacity() {
  const { locale } = useI18n();
  const copy = CAPACITY_COPY[locale];
  return (
    <section className={s.capacity} dir={locale === "ar" ? "rtl" : "ltr"} aria-labelledby="pricing-capacity-title">
      <h2 id="pricing-capacity-title">{copy.title}</h2>
      <p>{copy.intro}</p>
      <ul className={s.capacityGrid}>
        {(["FREE", "PRO", "BUSINESS"] as const).map(plan => {
          const limits = getPlanLimits(plan);
          const limit = limits.staticRepliesPerMonth;
          return <li key={plan}>
            <span>{plan === "FREE" ? copy.free : limits.label}</span>
            <strong>{typeof limit === "number" ? new Intl.NumberFormat(locale).format(Math.floor(limit / 2)) : "∞"}</strong>
            <span>{copy.pairs}</span>
          </li>;
        })}
      </ul>
      <p className={s.capacityNote}>{copy.note}</p>
    </section>
  );
}
