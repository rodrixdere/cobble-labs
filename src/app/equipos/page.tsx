import type { Metadata } from "next";
import { Suspense } from "react";

import ArmadorEquipo from "@/components/ArmadorEquipo";
import { CATALOGO, ROSTER } from "@/data/roster-combate";

export const metadata: Metadata = {
  title: "Equipos",
  description:
    "Armá tu equipo de seis con recomendaciones que explican por qué cada Pokémon mejora tu equipo, y probalo en el Battle Bot.",
  alternates: { canonical: "/equipos" },
  openGraph: {
    title: "Equipos · Cobble Labs",
    description: "Armá tu equipo de seis con recomendaciones que explican por qué cada Pokémon mejora tu equipo, y probalo en el Battle Bot.",
    url: "/equipos",
  },
};

export default function Equipos() {
  return (
    <main className="mx-auto max-w-[1400px] hoja">
      <Suspense
        fallback={
          <div className="px-4 md:px-8 py-28 text-center text-lectura text-tinta-tenue">
            Cargando el armador…
          </div>
        }
      >
        <ArmadorEquipo roster={ROSTER} catalogo={CATALOGO} />
      </Suspense>
    </main>
  );
}
