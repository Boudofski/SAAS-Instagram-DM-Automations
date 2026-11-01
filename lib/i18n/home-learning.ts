import type { Locale } from './config';

type LearningCopy = { title: string; intro: string; guide: string; archive: string; cards: [string, string][] };
export const HOME_LEARNING: Record<Locale, LearningCopy> = {
  en: {
    title: 'Build an Instagram automation that works for your audience',
    intro: 'Choose a clear trigger, send a useful reply and test the complete conversation before sharing your campaign.',
    guide: 'Read the Instagram automation guide', archive: 'Browse practical guides',
    cards: [
      ['Send a link after a comment', 'Choose the post and keyword, write the opening message and check that the right link reaches your visitor.'],
      ['Turn conversations into leads', 'Explain what people will receive and ask only for the information you need to follow up.'],
      ['Find out why a message did not arrive', 'Check the connected account, automation status, comment trigger and test conditions in order.'],
    ],
  },
  ar: {
    title: 'أنشئ أتمتة إنستغرام تناسب جمهورك',
    intro: 'اختر محفزًا واضحًا، وأرسل ردًا مفيدًا، واختبر المحادثة كاملة قبل إطلاق حملتك.',
    guide: 'اقرأ دليل أتمتة إنستغرام', archive: 'تصفح الأدلة العملية',
    cards: [
      ['إرسال رابط بعد تعليق', 'اختر المنشور والكلمة المفتاحية، واكتب الرسالة الافتتاحية، وتأكد من وصول الرابط الصحيح.'],
      ['تحويل المحادثات إلى عملاء محتملين', 'وضّح ما سيحصل عليه الشخص واطلب فقط المعلومات التي تحتاجها للمتابعة.'],
      ['معرفة سبب عدم وصول الرسالة', 'تحقق بالترتيب من الحساب المتصل وحالة الأتمتة ومحفز التعليق وشروط الاختبار.'],
    ],
  },
  fr: {
    title: 'Créez une automatisation Instagram adaptée à votre audience',
    intro: 'Choisissez un déclencheur précis, préparez une réponse utile et testez toute la conversation avant de lancer votre campagne.',
    guide: 'Lire le guide de l’automatisation Instagram', archive: 'Consulter les guides pratiques',
    cards: [
      ['Envoyer un lien après un commentaire', 'Sélectionnez la publication et le mot-clé, rédigez le message d’accueil et vérifiez que le bon lien arrive à votre destinataire.'],
      ['Transformer les échanges en prospects', 'Expliquez ce que la personne va recevoir et demandez uniquement les informations nécessaires pour la recontacter.'],
      ['Comprendre pourquoi un message n’arrive pas', 'Vérifiez le compte connecté, l’état de l’automatisation, le déclencheur et les conditions du test, étape par étape.'],
    ],
  },
  es: {
    title: 'Crea una automatización de Instagram pensada para tu audiencia',
    intro: 'Elige un desencadenante claro, prepara una respuesta útil y prueba toda la conversación antes de lanzar tu campaña.',
    guide: 'Leer la guía de automatización de Instagram', archive: 'Explorar las guías prácticas',
    cards: [
      ['Enviar un enlace después de un comentario', 'Selecciona la publicación y la palabra clave, redacta el mensaje inicial y comprueba que la persona recibe el enlace correcto.'],
      ['Convertir conversaciones en clientes potenciales', 'Explica qué va a recibir la persona y pide solo los datos que necesitas para volver a contactar con ella.'],
      ['Descubrir por qué no llega un mensaje', 'Revisa la cuenta conectada, el estado de la automatización, el desencadenante y las condiciones de la prueba, paso a paso.'],
    ],
  },
  de: {
    title: 'Richte eine Instagram-Automatisierung ein, die zu deiner Zielgruppe passt',
    intro: 'Wähle einen eindeutigen Auslöser, formuliere eine hilfreiche Antwort und teste den gesamten Ablauf, bevor du deine Kampagne startest.',
    guide: 'Anleitung zur Instagram-Automatisierung lesen', archive: 'Alle Praxisanleitungen ansehen',
    cards: [
      ['Nach einem Kommentar einen Link senden', 'Wähle den Beitrag und das Schlüsselwort, schreibe die erste Nachricht und prüfe, ob der richtige Link beim Empfänger ankommt.'],
      ['Aus Gesprächen neue Kundenkontakte gewinnen', 'Erkläre, was die Person erhält, und frage nur nach den Angaben, die du für die weitere Kontaktaufnahme brauchst.'],
      ['Prüfen, warum eine Nachricht nicht ankommt', 'Kontrolliere Schritt für Schritt das verbundene Konto, den Status der Automatisierung, den Auslöser und die Testbedingungen.'],
    ],
  },
  nl: {
    title: 'Maak een Instagram-automatisering die bij je doelgroep past',
    intro: 'Kies een duidelijke trigger, schrijf een nuttig antwoord en test het hele gesprek voordat je je campagne start.',
    guide: 'Lees de handleiding voor Instagram-automatisering', archive: 'Bekijk de praktijkgidsen (Engels)',
    cards: [
      ['Een link sturen na een reactie (Engels)', 'Kies het bericht en trefwoord, schrijf het openingsbericht en controleer of de juiste link aankomt.'],
      ['Gesprekken omzetten in leads (Engels)', 'Leg uit wat iemand ontvangt en vraag alleen de gegevens die je nodig hebt om contact op te nemen.'],
      ['Uitzoeken waarom een bericht niet aankomt (Engels)', 'Controleer stap voor stap het gekoppelde account, de automatisering, de trigger en de testvoorwaarden.'],
    ],
  },
  pt: {
    title: 'Crie uma automação do Instagram adequada ao seu público',
    intro: 'Escolha um acionador claro, prepare uma resposta útil e teste toda a conversa antes de lançar a sua campanha.',
    guide: 'Ler o guia de automação do Instagram', archive: 'Explorar os guias práticos',
    cards: [
      ['Enviar um link depois de um comentário', 'Escolha a publicação e a palavra-chave, escreva a mensagem inicial e confirme que o destinatário recebe o link correto.'],
      ['Transformar conversas em potenciais clientes', 'Explique o que a pessoa vai receber e peça apenas os dados necessários para voltar a contactá-la.'],
      ['Perceber por que uma mensagem não chega', 'Verifique a conta ligada, o estado da automação, o acionador e as condições do teste, passo a passo.'],
    ],
  },
};

export const HOME_LEARNING_PATHS = [
  '/blog/send-link-instagram-dm-after-comment',
  '/blog/turn-instagram-comments-into-leads',
  '/blog/instagram-comment-automation-not-working',
] as const;
