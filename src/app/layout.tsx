import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import Link from "next/link";

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

export const metadata: Metadata = {
  title: "Cobble Labs",
  description:
    "Pokédex, armador de equipos, tabla de tipos y simulador de combates para Cobblemon, con los datos leídos del propio mod.",
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
      {/* Ancho minimo en vez de version movil: esta primera etapa es solo
          escritorio, y una pantalla angosta se corre en horizontal antes que
          romperse en un movil a medio hacer. */}
      <body className="min-w-[1180px] font-sans">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-pieza focus:bg-tinta focus:px-3 focus:py-2 focus:text-sm focus:text-white"
        >
          Saltar al contenido
        </a>

        <header className="sticky top-0 z-30 h-[var(--alto-cabecera)] border-b border-linea bg-panel">
          <div className="mx-auto flex h-full max-w-[1400px] items-stretch px-8">
            <Link href="/" className="flex items-center pr-8" translate="no">
              <Marca />
            </Link>

            <Navegacion />
          </div>
        </header>

        <div id="contenido">{children}</div>

        <footer className="mx-auto max-w-[1400px] border-t border-linea px-8 py-8">
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
      </body>
    </html>
  );
}
