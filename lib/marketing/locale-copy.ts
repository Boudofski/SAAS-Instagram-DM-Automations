import type { Locale } from "@/lib/i18n/config";
type Copy = {
  subjects: string[];
  bodies: string[][];
  labels: string[];
  reason: string;
  unsubscribe: string;
  help: string;
};
export const MARKETING_COPY: Partial<Record<Locale, Copy>> = {
  ar: {
    subjects: [
      "أكّد طلب دليل AP3K",
      "دليلك لتحويل التعليقات إلى رسائل خاصة",
      "اختبر الأتمتة قبل الترويج لمنشورك",
      "ابدأ أول أتمتة مع AP3K",
    ],
    bodies: [
      [
        "طلبت دليل تحويل التعليقات إلى رسائل خاصة ودرسين إضافيين من AP3K.",
        "أكّد بريدك لتصلك السلسلة. تنتهي صلاحية الرابط خلال 48 ساعة. إن لم تطلبها، تجاهل هذه الرسالة.",
      ],
      [
        "ابدأ بمنشور واحد وكلمة مفتاحية ورابط مفيد لجمهورك.",
        "يتضمن الدليل نماذج للتعليق والرد العام والرسالة الخاصة وخطوات الاختبار. استبدل النصوص التجريبية بعرضك الحقيقي.",
      ],
      [
        "اختبر من حساب إنستغرام آخر قبل الترويج.",
        "اكتب الكلمة المفتاحية، وافحص الرسائل وطلبات المراسلة، ثم افتح الرابط. جرّب تعليقًا غير مرتبط للتأكد من أن الأتمتة تتجاهله. أصلح أي مشكلة قبل الإعلان.",
      ],
      [
        "أنشئ حسابك، واربط حساب إنستغرام احترافيًا، واختر منشورًا وكلمة مفتاحية وأضف الرابط الذي وعدت به.",
        "ابدأ مجانًا، واختبر الأتمتة وراجع حدود الخطط قبل الترقية. هذه آخر رسالة في السلسلة؛ ردّ علينا إن احتجت إلى مساعدة.",
      ],
    ],
    labels: ["تأكيد بريدي", "فتح الدليل", "فتح قائمة الاختبار", "إنشاء حسابي"],
    reason: "طلبت سلسلة دليل AP3K التي تتضمن إرشادات وعروضًا عن المنتج.",
    unsubscribe: "إلغاء الاشتراك",
    help: "للمساعدة، ردّ على support@ap3k.com.",
  },
  fr: {
    subjects: [
      "Confirmez votre demande de guide AP3K",
      "Votre guide des commentaires aux messages privés",
      "Testez votre automatisation avant de promouvoir votre publication",
      "Lancez votre première automatisation avec AP3K",
    ],
    bodies: [
      [
        "Vous avez demandé le guide AP3K et deux leçons complémentaires.",
        "Confirmez votre adresse pour recevoir la série. Ce lien expire dans 48 heures. Ignorez cet e-mail si vous ne l’avez pas demandé.",
      ],
      [
        "Commencez avec une publication, un mot-clé et un lien utile.",
        "Le guide contient des modèles de publication, de réponse publique et de message privé, ainsi qu’un test avant lancement. Adaptez-les à votre offre réelle.",
      ],
      [
        "Testez depuis un autre compte Instagram avant toute promotion.",
        "Commentez avec le mot-clé, vérifiez les messages et les invitations, puis ouvrez le lien. Vérifiez aussi qu’un commentaire sans rapport ne déclenche rien. Corrigez les problèmes avant de faire de la publicité.",
      ],
      [
        "Créez votre compte, connectez un compte Instagram professionnel, choisissez une publication et un mot-clé, puis ajoutez le lien promis.",
        "Commencez gratuitement et vérifiez les limites des offres avant de passer à une offre payante. Ceci est le dernier e-mail de la série. Répondez si vous avez besoin d’aide.",
      ],
    ],
    labels: [
      "Confirmer mon adresse",
      "Ouvrir le guide",
      "Ouvrir la liste de vérification",
      "Créer mon compte",
    ],
    reason:
      "Vous avez demandé la série AP3K, qui contient des conseils et des offres sur le produit.",
    unsubscribe: "Se désabonner",
    help: "Besoin d’aide ? Écrivez à support@ap3k.com.",
  },
  es: {
    subjects: [
      "Confirma tu solicitud de la guía de AP3K",
      "Tu guía de comentarios a mensajes privados",
      "Prueba la automatización antes de promocionar tu publicación",
      "Lanza tu primera automatización con AP3K",
    ],
    bodies: [
      [
        "Has solicitado la guía de AP3K y dos lecciones adicionales.",
        "Confirma tu correo para recibir la serie. El enlace caduca en 48 horas. Si no la solicitaste, ignora este mensaje.",
      ],
      [
        "Empieza con una publicación, una palabra clave y un enlace útil.",
        "La guía incluye modelos de publicación, respuesta pública y mensaje privado, además de una prueba previa. Adáptalos a tu oferta real.",
      ],
      [
        "Prueba desde otra cuenta de Instagram antes de promocionar.",
        "Comenta la palabra clave, revisa los mensajes y las solicitudes, y abre el enlace. Comprueba que un comentario no relacionado no active la automatización. Corrige cualquier problema antes de anunciarte.",
      ],
      [
        "Crea tu cuenta, conecta una cuenta profesional de Instagram, elige una publicación y una palabra clave, y añade el enlace prometido.",
        "Empieza gratis y revisa los límites de los planes antes de contratar uno. Este es el último correo de la serie. Responde si necesitas ayuda.",
      ],
    ],
    labels: [
      "Confirmar mi correo",
      "Abrir la guía",
      "Abrir la lista de comprobación",
      "Crear mi cuenta",
    ],
    reason:
      "Has solicitado la serie de AP3K, que incluye consejos y ofertas sobre el producto.",
    unsubscribe: "Cancelar suscripción",
    help: "¿Necesitas ayuda? Escribe a support@ap3k.com.",
  },
  de: {
    subjects: [
      "Bestätige deine Anfrage für den AP3K-Leitfaden",
      "Dein Leitfaden: Vom Kommentar zur Direktnachricht",
      "Teste deine Automation, bevor du deinen Beitrag bewirbst",
      "Starte deine erste Automation mit AP3K",
    ],
    bodies: [
      [
        "Du hast den AP3K-Leitfaden und zwei weitere Lektionen angefordert.",
        "Bestätige deine E-Mail-Adresse, um die Serie zu erhalten. Der Link ist 48 Stunden gültig. Falls du die Serie nicht angefordert hast, ignoriere diese E-Mail.",
      ],
      [
        "Beginne mit einem Beitrag, einem Schlüsselwort und einem hilfreichen Link.",
        "Der Leitfaden enthält Vorlagen für Beiträge, öffentliche Antworten und Direktnachrichten sowie einen Test vor dem Start. Passe sie an dein tatsächliches Angebot an.",
      ],
      [
        "Teste vor der Bewerbung mit einem anderen Instagram-Konto.",
        "Kommentiere mit dem Schlüsselwort, prüfe Nachrichten und Nachrichtenanfragen und öffne den Link. Ein unpassender Kommentar sollte nichts auslösen. Behebe Probleme, bevor du Werbung schaltest.",
      ],
      [
        "Erstelle dein Konto, verbinde ein professionelles Instagram-Konto, wähle einen Beitrag und ein Schlüsselwort und füge den versprochenen Link hinzu.",
        "Starte kostenlos und prüfe vor einem Upgrade die Tariflimits. Dies ist die letzte E-Mail der Serie. Antworte, wenn du Hilfe brauchst.",
      ],
    ],
    labels: [
      "E-Mail-Adresse bestätigen",
      "Leitfaden öffnen",
      "Checkliste öffnen",
      "Konto erstellen",
    ],
    reason:
      "Du hast die AP3K-Serie mit Produkttipps und Angeboten angefordert.",
    unsubscribe: "Abmelden",
    help: "Fragen? Schreibe an support@ap3k.com.",
  },
  nl: {
    subjects: [
      "Bevestig je aanvraag voor de AP3K-gids",
      "Je gids: van reacties naar privéberichten",
      "Test je automatisering voordat je je bericht promoot",
      "Start je eerste automatisering met AP3K",
    ],
    bodies: [
      [
        "Je hebt de AP3K-gids en twee vervolglessen aangevraagd.",
        "Bevestig je e-mailadres om de reeks te ontvangen. Deze link verloopt na 48 uur. Negeer deze e-mail als je niets hebt aangevraagd.",
      ],
      [
        "Begin met één bericht, één trefwoord en één nuttige link.",
        "De gids bevat voorbeelden voor berichten, openbare reacties en privéberichten, plus een test vóór de start. Pas ze aan je eigen aanbod aan.",
      ],
      [
        "Test vóór promotie met een ander Instagram-account.",
        "Plaats het trefwoord, controleer je inbox en berichtverzoeken en open de link. Controleer ook dat een niet-gerelateerde reactie niets activeert. Los problemen op voordat je adverteert.",
      ],
      [
        "Maak je account aan, koppel een professioneel Instagram-account, kies een bericht en een trefwoord en voeg de beloofde link toe.",
        "Begin gratis en bekijk de abonnementslimieten voordat je upgradet. Dit is de laatste e-mail van de reeks. Antwoord als je hulp nodig hebt.",
      ],
    ],
    labels: [
      "E-mailadres bevestigen",
      "Gids openen",
      "Checklist openen",
      "Account aanmaken",
    ],
    reason:
      "Je hebt de AP3K-reeks met producttips en aanbiedingen aangevraagd.",
    unsubscribe: "Afmelden",
    help: "Vragen? Mail naar support@ap3k.com.",
  },
  pt: {
    subjects: [
      "Confirme seu pedido do guia AP3K",
      "Seu guia: dos comentários às mensagens privadas",
      "Teste a automação antes de divulgar sua publicação",
      "Lance sua primeira automação com AP3K",
    ],
    bodies: [
      [
        "Você solicitou o guia AP3K e duas aulas complementares.",
        "Confirme seu e-mail para receber a série. O link expira em 48 horas. Se não fez a solicitação, ignore esta mensagem.",
      ],
      [
        "Comece com uma publicação, uma palavra-chave e um link útil.",
        "O guia inclui modelos de publicação, resposta pública e mensagem privada, além de um teste antes do lançamento. Adapte os modelos à sua oferta real.",
      ],
      [
        "Teste com outra conta do Instagram antes de divulgar.",
        "Comente a palavra-chave, confira as mensagens e solicitações e abra o link. Verifique também se um comentário sem relação não ativa a automação. Corrija os problemas antes de anunciar.",
      ],
      [
        "Crie sua conta, conecte uma conta profissional do Instagram, escolha uma publicação e uma palavra-chave e adicione o link prometido.",
        "Comece grátis e confira os limites dos planos antes de contratar. Este é o último e-mail da série. Responda se precisar de ajuda.",
      ],
    ],
    labels: [
      "Confirmar meu e-mail",
      "Abrir o guia",
      "Abrir a lista de verificação",
      "Criar minha conta",
    ],
    reason:
      "Você solicitou a série AP3K, que inclui dicas e ofertas sobre o produto.",
    unsubscribe: "Cancelar inscrição",
    help: "Dúvidas? Escreva para support@ap3k.com.",
  },
};
