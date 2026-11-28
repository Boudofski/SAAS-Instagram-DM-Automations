import type { Locale } from "@/lib/i18n/config";

type FitCopy = {
  jump: string; intro: string; actions: string; accounts: string; automations: string;
  paid: string; match: string; free: string; none: string; see: string; contact: string; note: string; invalid: string;
};

export const PLAN_FIT_COPY: Record<Locale, FitCopy> = {
  en: {
    invalid: "Enter whole numbers and at least one Instagram account.",
    jump: "Find the right plan", intro: "Enter your busiest expected month across all connected Instagram accounts.",
    actions: "Monthly automated actions", accounts: "Instagram accounts", automations: "Active automations",
    paid: "I need AI replies, contact collection, or custom flows", match: "Lowest plan that fits these inputs",
    free: "Free", none: "Your estimate exceeds the public plans.", see: "See plan details", contact: "Contact AP3K",
    note: "One public reply plus one DM uses two actions. Count opening messages and follow-ups too. AI usage has its own limit; check it in the plan details.",
  },
  ar: {
    invalid: "أدخل أعدادًا صحيحة وحساب إنستغرام واحدًا على الأقل.",
    jump: "اعثر على الخطة المناسبة", intro: "قدّر استخدامك في أكثر شهر تتوقع فيه نشاطًا عبر جميع حسابات إنستغرام المرتبطة.",
    actions: "الإجراءات الآلية شهريًا", accounts: "حسابات إنستغرام", automations: "عمليات الأتمتة النشطة",
    paid: "أحتاج إلى ردود بالذكاء الاصطناعي أو جمع بيانات الاتصال أو مسارات مخصّصة", match: "أقل خطة تلبّي هذه الاحتياجات",
    free: "مجانية", none: "يتجاوز استخدامك المتوقع حدود الخطط المتاحة.", see: "عرض تفاصيل الخطة", contact: "تواصل مع AP3K",
    note: "يُحسب الرد العلني والرسالة الخاصة إجراءين. احسب أيضًا الرسائل الافتتاحية والمتابعات. للذكاء الاصطناعي حصة مستقلة يمكنك مراجعتها في تفاصيل الخطة.",
  },
  fr: {
    invalid: "Saisissez des nombres entiers et au moins un compte Instagram.",
    jump: "Trouvez l’offre adaptée", intro: "Estimez votre mois le plus chargé, tous comptes Instagram connectés confondus.",
    actions: "Actions automatisées par mois", accounts: "Comptes Instagram", automations: "Automatisations actives",
    paid: "J’ai besoin de réponses IA, de collecte de contacts ou de parcours personnalisés", match: "Offre la moins chère adaptée à ces critères",
    free: "Gratuit", none: "Votre estimation dépasse les limites des offres publiques.", see: "Voir le détail de l’offre", contact: "Contacter AP3K",
    note: "Une réponse publique et un DM comptent pour deux actions. Incluez aussi les messages d’accueil et les relances. Vérifiez le quota IA, distinct, dans le détail de l’offre.",
  },
  es: {
    invalid: "Introduce números enteros y al menos una cuenta de Instagram.",
    jump: "Encuentra el plan adecuado", intro: "Estima tu mes de mayor actividad sumando todas las cuentas de Instagram conectadas.",
    actions: "Acciones automatizadas al mes", accounts: "Cuentas de Instagram", automations: "Automatizaciones activas",
    paid: "Necesito respuestas con IA, recopilar contactos o crear flujos personalizados", match: "Plan más económico que cumple estos requisitos",
    free: "Gratis", none: "Tu estimación supera los límites de los planes públicos.", see: "Ver detalles del plan", contact: "Contactar con AP3K",
    note: "Una respuesta pública y un mensaje privado son dos acciones. Incluye los mensajes iniciales y los seguimientos. Consulta el límite independiente de IA en los detalles del plan.",
  },
  de: {
    invalid: "Gib ganze Zahlen und mindestens ein Instagram-Konto an.",
    jump: "Finde den passenden Tarif", intro: "Schätze deinen aktivsten Monat für alle verbundenen Instagram-Konten zusammen.",
    actions: "Automatisierte Aktionen pro Monat", accounts: "Instagram-Konten", automations: "Aktive Automatisierungen",
    paid: "Ich brauche KI-Antworten, Kontakterfassung oder eigene Abläufe", match: "Günstigster Tarif für diese Angaben",
    free: "Kostenlos", none: "Dein Bedarf übersteigt die verfügbaren Tarife.", see: "Tarifdetails ansehen", contact: "AP3K kontaktieren",
    note: "Eine öffentliche Antwort plus eine Direktnachricht sind zwei Aktionen. Zähle auch Eröffnungs- und Folgenachrichten. Das separate KI-Limit steht in den Tarifdetails.",
  },
  nl: {
    invalid: "Vul gehele getallen en minstens één Instagram-account in.",
    jump: "Vind het passende abonnement", intro: "Schat je drukste maand in voor al je gekoppelde Instagram-accounts samen.",
    actions: "Geautomatiseerde acties per maand", accounts: "Instagram-accounts", automations: "Actieve automatiseringen",
    paid: "Ik heb AI-antwoorden, contactverzameling of eigen flows nodig", match: "Goedkoopste abonnement dat bij deze gegevens past",
    free: "Gratis", none: "Je schatting ligt boven de limieten van de openbare abonnementen.", see: "Bekijk abonnementsdetails", contact: "Neem contact op met AP3K",
    note: "Een openbare reactie plus een privébericht zijn twee acties. Tel ook openings- en vervolgberichten mee. Bekijk de aparte AI-limiet in de abonnementsdetails.",
  },
  pt: {
    invalid: "Introduza números inteiros e pelo menos uma conta de Instagram.",
    jump: "Encontre o plano adequado", intro: "Estime o seu mês de maior atividade em todas as contas de Instagram ligadas.",
    actions: "Ações automatizadas por mês", accounts: "Contas de Instagram", automations: "Automações ativas",
    paid: "Preciso de respostas com IA, recolha de contactos ou fluxos personalizados", match: "Plano mais económico para estes requisitos",
    free: "Grátis", none: "A sua estimativa excede os limites dos planos públicos.", see: "Ver detalhes do plano", contact: "Contactar a AP3K",
    note: "Uma resposta pública e uma mensagem privada contam como duas ações. Inclua também as mensagens iniciais e de seguimento. Consulte o limite separado de IA nos detalhes do plano.",
  },
};
