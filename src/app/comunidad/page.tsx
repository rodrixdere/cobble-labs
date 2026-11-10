import type { Metadata } from "next";
import { Suspense } from "react";

import Comunidad from "@/components/Comunidad";
import { CATALOGO, ROSTER } from "@/data/roster-combate";
import { COMUNIDAD_ACTIVA } from "@/data/sitio";

const DESCRIPCION =
  "Equipos que publicó la comunidad del servidor, listos para cargar en el armador o probar en el Battle Bot.";

export const metadata: Metadata = {
  title: "Comunidad",
  description: DESCRIPCION,
  alternates: { canonical: "/comunidad" },
  // Mientras la comunidad no este abierta, la pagina existe pero no se indexa.
  robots: COMUNIDAD_ACTIVA ? undefined : { index: false },
};

export default function PaginaComunidad() {
  return (
    <main className="mx-auto max-w-[1400px] hoja">
      {COMUNIDAD_ACTIVA ? (
        <Suspense
          fallback={
            <p className="px-4 py-28 text-center text-lectura text-tinta-tenue md:px-8">
              Cargando la comunidad…
            </p>
          }
        >
          <Comunidad roster={ROSTER} catalogo={CATALOGO} />
        </Suspense>
      ) : (
        <p className="px-4 py-28 text-center text-lectura text-tinta-tenue md:px-8">
          La comunidad todavía no está abierta.
        </p>
      )}
    </main>
  );
}
