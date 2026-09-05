import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import Link from "next/link";

import Analitica from "@/components/Analitica";
import Marca from "@/components/Marca";
import Navegacion from "@/components/Navegacion";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const ALT_OG =
  "Cobble Labs: Pokédex, armador de equipos y simulador para Cobblemon";

const DESCRIPCION =
  "Pokédex, armador de equipos, tabla de tipos y simulador de combates para Cobblemon, con los datos leídos del propio mod.";

export const metadata: Metadata = {
  // El sitio se sirve en dos direcciones a la vez, el dominio y el
  // .workers.dev, con el mismo contenido. Sin una canonica apuntando siempre
  // acá, Google elige por su cuenta y puede quedarse con la de workers.dev.
  metadataBase: new URL("https://cobble-lab.com"),
  alternates: { canonical: "/" },

  // El template deja que cada pagina ponga solo su nombre.
  title: {
    default: "Cobble Labs: Pokédex y armador de equipos para Cobblemon",
    template: "%s · Cobble Labs",
  },
  description: DESCRIPCION,
  applicationName: "Cobble Labs",
  authors: [{ name: "rodrixdere" }],
  creator: "rodrixdere",

  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    siteName: "Cobble Labs",
    title: "Cobble Labs: Pokédex y armador de equipos para Cobblemon",
    description: DESCRIPCION,
    // PNG estatico y no la ruta opengraph-image de Next: esa emite un archivo
    // sin extension y Cloudflare lo sirve sin Content-Type, con lo cual las
    // redes no muestran la tarjeta. El generador quedo en el taller.
    images: [{ url: "/og.png", width: 1200, height: 630, alt: ALT_OG }],
  },

  twitter: {
    card: "summary_large_image",
    title: "Cobble Labs: Pokédex y armador de equipos para Cobblemon",
    description: DESCRIPCION,
    images: [{ url: "/og.png", alt: ALT_OG }],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export function generateViewport() {
  return { themeColor: "#ffffff" };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${sora.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body className="font-sans">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[var(--z-salto)] focus:rounded-pieza focus:bg-tinta focus:px-3 focus:py-2 focus:text-lectura focus:text-white"
        >
          Saltar al contenido
        </a>

        <header className="sticky top-0 z-[var(--z-cabecera)] h-[var(--alto-cabecera)] border-b border-linea bg-panel">
          <div className="mx-auto flex h-full max-w-[1400px] items-stretch px-4 md:px-8">
            <Link
              href="/"
              prefetch={false}
              className="flex shrink-0 items-center pr-4 md:pr-8"
              translate="no"
            >
              <Marca />
            </Link>

            <Navegacion />
          </div>
        </header>

        <div id="contenido">{children}</div>

        <footer className="mx-auto max-w-[1400px] border-t border-linea px-4 py-8 md:px-8">
          <p className="max-w-[70ch] text-lectura leading-relaxed text-tinta-media">
            Cobble Labs es una herramienta de comunidad. Los datos de especies,
            movimientos, habilidades y apariciones se leen del jar de Cobblemon
            que corre el servidor, y los textos son los del propio juego en
            español.
          </p>

          {/* La atribucion a dCIM no es cortesia: su licencia MIT la pide donde
              se distribuyan los iconos, y esta pagina los distribuye. */}
          <p className="mt-2 max-w-[70ch] text-lectura leading-relaxed text-tinta-media">
            Los retratos son del pack{" "}
            <a
              href="https://modrinth.com/resourcepack/dcim"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-tinta"
            >
              dCIM
            </a>
            , de datboiwill, con licencia MIT.
          </p>

          <p className="rotulo mt-4">
            Sin relación oficial con Cobblemon ni Nintendo
          </p>
        </footer>
        <Analitica />
      </body>
    </html>
  );
}
