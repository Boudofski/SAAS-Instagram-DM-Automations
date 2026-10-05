import { HOME_FEATURES_COPY as SOURCE_COPY } from "./home-features-catalog";
import type { Locale } from "./config";
const BACKTRACK: Record<Locale, string> = {
  en: "Reply to eligible comments from the previous seven days on supported selected posts. Review the rule and delivery results before expanding your campaign.",
  fr: "Répondez aux commentaires éligibles des sept derniers jours sur les publications sélectionnées prises en charge. Vérifiez la règle et les résultats d’envoi.",
  es: "Responde a comentarios aptos de los últimos siete días en publicaciones seleccionadas compatibles. Revisa la regla y los resultados de entrega.",
  de: "Beantworte geeignete Kommentare der letzten sieben Tage für unterstützte ausgewählte Beiträge. Prüfe die Regel und die Zustellergebnisse.",
  pt: "Responda a comentários elegíveis dos últimos sete dias em publicações selecionadas suportadas. Verifique a regra e os resultados de envio.",
};
function revisedFeatures(locale: Locale): (typeof SOURCE_COPY)[Locale] {
  const copy = SOURCE_COPY[locale];
  return { ...copy, cards: [
    copy.cards[0], copy.cards[1], copy.cards[2],
    { ...copy.cards[3], description: BACKTRACK[locale] },
    copy.cards[4], copy.cards[5], copy.cards[6], copy.cards[7],
  ] };
}
export const HOME_FEATURES_COPY = {
  en: revisedFeatures("en"), fr: revisedFeatures("fr"), es: revisedFeatures("es"),
  de: revisedFeatures("de"), pt: revisedFeatures("pt"),
};
