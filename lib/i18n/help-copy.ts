import type { Locale } from "./config";

const rows = [
  ["All topics", "كل المواضيع", "Tous les sujets", "Todos los temas", "Alle Themen", "Todos os temas"],
  ["Browse by topic", "تصفّح حسب الموضوع", "Parcourir par sujet", "Explorar por tema", "Nach Thema suchen", "Explorar por tema"],
  ["Search results", "نتائج البحث", "Résultats de recherche", "Resultados de búsqueda", "Suchergebnisse", "Resultados da pesquisa"],
  ["Clear search", "مسح البحث", "Effacer la recherche", "Borrar búsqueda", "Suche löschen", "Limpar pesquisa"],
  ["Back to help", "العودة إلى مركز المساعدة", "Retour à l’aide", "Volver a la ayuda", "Zurück zur Hilfe", "Voltar à ajuda"],
  ["In this article", "في هذا الشرح", "Dans cet article", "En este artículo", "In diesem Artikel", "Neste artigo"],
  ["Step by step", "الخطوات", "Étape par étape", "Paso a paso", "Schritt für Schritt", "Passo a passo"],
  ["Related questions", "أسئلة ذات صلة", "Questions connexes", "Preguntas relacionadas", "Verwandte Fragen", "Perguntas relacionadas"],
  ["More in this topic", "المزيد حول هذا الموضوع", "Sur le même sujet", "Más sobre este tema", "Mehr zu diesem Thema", "Mais sobre este tema"],
  ["Still need help?", "تحتاج إلى مساعدة إضافية؟", "Besoin d’aide ?", "¿Necesitas más ayuda?", "Noch Fragen?", "Precisa de mais ajuda?"],
  ["Find an answer, follow the steps, and get back to your work.", "ابحث عن إجابة، واتبع الخطوات، وأكمل عملك بسهولة.", "Trouvez une réponse, suivez les étapes et reprenez votre travail.", "Encuentra una respuesta, sigue los pasos y continúa con tu trabajo.", "Finde eine Antwort, folge den Schritten und arbeite weiter.", "Encontre uma resposta, siga os passos e continue o seu trabalho."],
  ["Try another search or browse all topics.", "جرّب كلمات أخرى أو تصفّح كل المواضيع.", "Essayez une autre recherche ou parcourez tous les sujets.", "Prueba otra búsqueda o explora todos los temas.", "Versuche eine andere Suche oder durchsuche alle Themen.", "Experimente outra pesquisa ou explore todos os temas."],
] as const;
export const HELP_COPY = Object.fromEntries((["en", "ar", "fr", "es", "de", "pt"] as const).map((locale, index) => [locale, Object.fromEntries(rows.map(row => [row[0], row[index]]))])) as Record<Locale, Record<string, string>>;
