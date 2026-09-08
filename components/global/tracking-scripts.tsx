import Script from "next/script";

function validGoogleId(value?: string) {
  return value && /^(G|AW)-[A-Z0-9-]+$/.test(value) ? value : null;
}

function validMetaPixelId(value?: string) {
  return value && /^\d{5,30}$/.test(value) ? value : null;
}

export default function TrackingScripts() {
  const gaId = validGoogleId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
  const adsId = validGoogleId(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID);
  const metaPixelId = validMetaPixelId(process.env.NEXT_PUBLIC_META_PIXEL_ID);
  const googleIds = Array.from(new Set([gaId, adsId].filter((id): id is string => Boolean(id))));
  const primaryGoogleId = googleIds[0];

  return (
    <>
      {primaryGoogleId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${primaryGoogleId}`} strategy="afterInteractive" />
          <Script id="ap3k-google-tags" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());${googleIds.map((id) => `gtag('config',${JSON.stringify(id)});`).join("")}`}
          </Script>
        </>
      ) : null}
      {metaPixelId ? (
        <>
          <Script id="ap3k-meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(metaPixelId)});fbq('track','PageView');`}
          </Script>
          <noscript dangerouslySetInnerHTML={{ __html: `<img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1" />` }} />
        </>
      ) : null}
    </>
  );
}
