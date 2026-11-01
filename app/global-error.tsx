"use client";

import { useEffect, useState } from "react";

const errorCopy = {
  en: {
    title: "Something went wrong",
    body: "Your data is safe. Try this page again, or contact support@ap3k.com if the problem continues.",
    retry: "Try again",
  },
  ar: {
    title: "حدث خطأ",
    body: "بياناتك آمنة. حاول فتح هذه الصفحة مرة أخرى، أو تواصل مع support@ap3k.com إذا استمرت المشكلة.",
    retry: "حاول مرة أخرى",
  },
  fr: {
    title: "Un problème est survenu",
    body: "Vos données sont en sécurité. Réessayez d’ouvrir cette page ou contactez support@ap3k.com si le problème persiste.",
    retry: "Réessayer",
  },
  es: {
    title: "Algo salió mal",
    body: "Tus datos están seguros. Vuelve a abrir esta página o contacta con support@ap3k.com si el problema continúa.",
    retry: "Intentar de nuevo",
  },
  de: {
    title: "Etwas ist schiefgelaufen",
    body: "Deine Daten sind sicher. Öffne diese Seite erneut oder kontaktiere support@ap3k.com, falls das Problem weiterhin besteht.",
    retry: "Erneut versuchen",
  },
  nl: {
    title: "Er is iets misgegaan",
    body: "Je gegevens zijn veilig. Open deze pagina opnieuw of neem contact op met support@ap3k.com als het probleem aanhoudt.",
    retry: "Opnieuw proberen",
  },
  pt: {
    title: "Ocorreu um problema",
    body: "Os seus dados estão seguros. Abra esta página novamente ou contacte support@ap3k.com se o problema continuar.",
    retry: "Tentar novamente",
  },
} as const;

type ErrorLocale = keyof typeof errorCopy;

function browserErrorLocale(): ErrorLocale {
  const saved = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("ap3k_locale="))
    ?.split("=")[1]
    ?.toLowerCase();
  const language = (saved || document.documentElement.lang || navigator.language)
    .split(/[-_]/)[0] as ErrorLocale;
  return language in errorCopy ? language : "en";
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<ErrorLocale>("en");
  const copy = errorCopy[locale];

  useEffect(() => {
    const activeLocale = browserErrorLocale();
    setLocale(activeLocale);
    document.documentElement.lang = activeLocale;
    document.documentElement.dir = activeLocale === "ar" ? "rtl" : "ltr";
    console.error(
      JSON.stringify({
        level: "error",
        message: "AP3K global render failure",
        digest: error.digest,
        error: error.message,
      }),
    );
  }, [error]);

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <title>AP3K — Please try again</title>
      </head>
      <body className="grid min-h-screen place-items-center bg-[#090A10] px-5 text-white">
        <main className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#111320] p-7 text-center shadow-2xl">
          <div data-nosnippet>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">
              AP3K
            </p>
            <h1 className="mt-3 text-2xl font-black">{copy.title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {copy.body}
            </p>
            <button
              type="button"
              onClick={reset}
              className="ap3k-gradient-button mt-6 min-h-11 w-full px-5 text-sm"
            >
              {copy.retry}
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
