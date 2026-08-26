import type { Metadata } from "next";
import { Suspense } from "react";

import BattleBot from "@/components/BattleBot";
import { CATALOGO, ROSTER } from "@/data/roster-combate";

export const metadata: Metadata = {
  title: "Battle Bot",
  description:
    "Calculadora de daño con clima y terreno, motor de combate contra un pool de rivales, y probador de equipos.",
  alternates: { canonical: "/battle-bot" },
  openGraph: {
    title: "Battle Bot · Cobble Labs",
    description: "Calculadora de daño con clima y terreno, motor de combate contra un pool de rivales, y probador de equipos.",
    url: "/battle-bot",
  },
};

export default function PaginaBattleBot() {
  return (
    <main className="mx-auto max-w-[1400px] hoja">
      <div className="px-4 md:px-8 pb-6 pt-9">
        <h1 className="font-display text-portada">
          Battle Bot
        </h1>
        <p className="mt-3 max-w-[62ch] text-realce leading-relaxed text-tinta-media">
          Tres herramientas sobre la fórmula del propio Showdown que resuelve
          los combates del servidor: una calculadora de daño, un motor que hace
          pelear tu equipo contra un pool de rivales, y un cara a cara entre dos
          equipos.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="border-t border-linea px-4 md:px-8 py-24 text-center text-lectura text-tinta-tenue">
            Cargando las herramientas…
          </div>
        }
      >
        <BattleBot roster={ROSTER} catalogo={CATALOGO} />
      </Suspense>
    </main>
  );
}
