/** Customer-facing copy is independent of the dashboard language. */
export const BOUDOFI_INTEGRATION_ID = "981901f8-6606-4175-89f3-32fca0ae4ed5";
export const COPY_LANGUAGES = { en: "English", ar: "العربية", fr: "Français", es: "Español", de: "Deutsch", nl: "Nederlands", pt: "Português" };
const copy = {
 en: { replies: ["Check your DMs for the details 📩", "Your link is coming in a DM 🔗 Check your inbox!", "Look out for my message 📩 Check message requests too 👌"], message: "Here’s what you asked for 👇 Open the link below 🔗", button: "Open the link 🔗", opening: "Your details are ready ✨ Tap below to receive them 📩", openingButton: "Send it to me 📩" },
 ar: { replies: ["التفاصيل بتوصلك على الخاص 📩 شيّك الرسائل 👌", "رابطك بيجيك في رسالة خاصة 🔗 تفقد الخاص 📩", "شيّك الخاص وطلبات الرسائل 📩 التفاصيل بانتظارك ✨"], message: "تفضل! التفاصيل التي طلبتها موجودة هنا 👇", button: "عرض التفاصيل 🔗", opening: "أهلًا 👋 جهزت لك التفاصيل التي طلبتها ✨ اضغط بالأسفل للحصول عليها.", openingButton: "أرسلها لي 📩" },
 fr: { replies: ["Les détails arrivent en message privé 📩", "Surveille tes messages privés pour le lien 🔗", "Pense aussi aux invitations par message 📩👌"], message: "Voici ce que tu as demandé 👇 Ouvre le lien ci-dessous 🔗", button: "Ouvrir le lien 🔗", opening: "Tout est prêt ✨ Appuie ci-dessous pour recevoir les détails 📩", openingButton: "Envoyez-moi ça 📩" },
 es: { replies: ["Los detalles te llegarán por mensaje privado 📩", "Revisa tus mensajes para encontrar el enlace 🔗", "Mira también las solicitudes de mensajes 📩👌"], message: "Aquí tienes lo que pediste 👇 Abre el enlace de abajo 🔗", button: "Abrir el enlace 🔗", opening: "Ya está listo ✨ Toca abajo para recibir los detalles 📩", openingButton: "Envíamelo 📩" },
 de: { replies: ["Die Infos kommen per Direktnachricht 📩", "Schau für den Link in deine Nachrichten 🔗", "Prüfe auch deine Nachrichtenanfragen 📩👌"], message: "Hier ist, was du angefragt hast 👇 Öffne den Link unten 🔗", button: "Link öffnen 🔗", opening: "Alles ist bereit ✨ Tippe unten, um die Infos zu erhalten 📩", openingButton: "Jetzt senden 📩" },
 nl: { replies: ["De details komen via een privébericht 📩", "Bekijk je privéberichten voor de link 🔗", "Kijk ook bij je berichtverzoeken 📩👌"], message: "Hier is wat je vroeg 👇 Open de link hieronder 🔗", button: "Open de link 🔗", opening: "Alles staat klaar ✨ Tik hieronder om de details te ontvangen 📩", openingButton: "Stuur maar 📩" },
 pt: { replies: ["Os detalhes vão chegar por mensagem privada 📩", "Veja as suas mensagens para encontrar o link 🔗", "Veja também os pedidos de mensagem 📩👌"], message: "Aqui está o que pediu 👇 Abra o link abaixo 🔗", button: "Abrir o link 🔗", opening: "Está tudo pronto ✨ Toque abaixo para receber os detalhes 📩", openingButton: "Enviar para mim 📩" },
};
export function automationCopyLocale(locale = "en", integrationId = "") {
 return integrationId === BOUDOFI_INTEGRATION_ID ? "ar" : locale in copy ? locale as keyof typeof copy : "en";
}
export function automationStarterCopy(locale = "en", integrationId = "") { return copy[automationCopyLocale(locale, integrationId)]; }
