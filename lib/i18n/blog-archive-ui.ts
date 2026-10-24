import type { Locale } from './config';
type Copy = {
  featured: string; picks: string; search: string; searchLabel: string;
  latest: string; articles: string; results: string; empty: string; browse: string;
  pagination: string; previous: string; next: string; directory: string; directoryIntro: string;
  english: string; languageNote: string;
};
export const BLOG_ARCHIVE_UI: Record<Locale, Copy> = {
  en: {
    featured: 'Featured guides', picks: 'Start with these practical guides.', search: 'Search', searchLabel: 'Search guides',
    latest: 'Latest articles', articles: 'Articles', results: 'Results for', empty: 'No articles matched. Try another search or', browse: 'browse all articles',
    pagination: 'Blog pagination', previous: 'Previous', next: 'Next', directory: 'Browse all guides by topic', directoryIntro: 'Find setup instructions, campaign examples and troubleshooting guides by topic.',
    english: 'Browse the English archive', languageNote: 'These guides are available in English.',
  },
  fr: {
    featured: 'Guides à découvrir', picks: 'Commencez par ces guides pratiques.', search: 'Rechercher', searchLabel: 'Rechercher un guide',
    latest: 'Derniers articles', articles: 'Articles', results: 'Résultats pour', empty: 'Aucun article trouvé. Essayez une autre recherche ou', browse: 'consultez tous les articles',
    pagination: 'Pagination du blog', previous: 'Précédent', next: 'Suivant', directory: 'Tous les guides par thème', directoryIntro: 'Retrouvez les instructions de configuration, les exemples de campagnes et les conseils de dépannage par thème.',
    english: 'Consulter aussi les articles en anglais', languageNote: 'Cette sélection regroupe les guides disponibles en français.',
  },
  es: {
    featured: 'Guías destacadas', picks: 'Empieza con estas guías prácticas.', search: 'Buscar', searchLabel: 'Buscar guías',
    latest: 'Últimos artículos', articles: 'Artículos', results: 'Resultados para', empty: 'No se han encontrado artículos. Prueba otra búsqueda o', browse: 'consulta todos los artículos',
    pagination: 'Páginas del blog', previous: 'Anterior', next: 'Siguiente', directory: 'Todas las guías por tema', directoryIntro: 'Encuentra instrucciones de configuración, ejemplos de campañas y soluciones a problemas organizados por tema.',
    english: 'Ver también los artículos en inglés', languageNote: 'Esta selección reúne las guías disponibles en español.',
  },
  de: {
    featured: 'Empfohlene Anleitungen', picks: 'Starte mit diesen praktischen Anleitungen.', search: 'Suchen', searchLabel: 'Anleitungen suchen',
    latest: 'Neueste Artikel', articles: 'Artikel', results: 'Ergebnisse für', empty: 'Keine passenden Artikel gefunden. Versuche einen anderen Suchbegriff oder', browse: 'sieh dir alle Artikel an',
    pagination: 'Blog-Seitennavigation', previous: 'Zurück', next: 'Weiter', directory: 'Alle Anleitungen nach Thema', directoryIntro: 'Finde Anleitungen zur Einrichtung, Kampagnenbeispiele und Hilfe bei Problemen, nach Themen geordnet.',
    english: 'Auch die englischen Artikel ansehen', languageNote: 'Hier findest du die Anleitungen, die auf Deutsch verfügbar sind.',
  },
  pt: {
    featured: 'Guias em destaque', picks: 'Comece por estes guias práticos.', search: 'Pesquisar', searchLabel: 'Pesquisar guias',
    latest: 'Artigos mais recentes', articles: 'Artigos', results: 'Resultados para', empty: 'Não foram encontrados artigos. Experimente outra pesquisa ou', browse: 'consulte todos os artigos',
    pagination: 'Navegação entre páginas do blogue', previous: 'Anterior', next: 'Seguinte', directory: 'Todos os guias por tema', directoryIntro: 'Encontre instruções de configuração, exemplos de campanhas e soluções para problemas, organizados por tema.',
    english: 'Consultar também os artigos em inglês', languageNote: 'Esta seleção reúne os guias disponíveis em português.',
  },
  nl: {
    featured: 'Uitgelichte handleidingen', picks: 'Begin met deze praktische handleidingen.', search: 'Zoeken', searchLabel: 'Handleidingen zoeken',
    latest: 'Nieuwste artikelen', articles: 'Artikelen', results: 'Resultaten voor', empty: 'Geen artikelen gevonden. Probeer een andere zoekopdracht of', browse: 'bekijk alle artikelen',
    pagination: 'Blogpaginering', previous: 'Vorige', next: 'Volgende', directory: 'Alle handleidingen per onderwerp', directoryIntro: 'Vind instructies, campagnevoorbeelden en oplossingen voor problemen per onderwerp.',
    english: 'Bekijk ook de Engelse artikelen', languageNote: 'Hier vind je de handleidingen die in het Nederlands beschikbaar zijn.',
  },
};
