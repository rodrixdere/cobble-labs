import Script from "next/script";

import { ANALITICA_GA } from "@/data/sitio";

// Google Analytics 4. El sitio es estático y se sirve desde el borde, así que
// esto es lo único que corre en el navegador para medir: sin ID configurado no
// se emite ni el script.
export default function Analitica() {
  if (!ANALITICA_GA) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${ANALITICA_GA}`}
        strategy="afterInteractive"
      />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ANALITICA_GA}');`}
      </Script>
    </>
  );
}
