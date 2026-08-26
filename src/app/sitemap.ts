import type { MetadataRoute } from "next";

import { POKEMON } from "@/data/pokemon";
import { SECCIONES, SITIO } from "@/data/sitio";

// Con output "export" hay que declararlo estatico a mano: Next asume dinamica
// cualquier ruta de metadata y el build falla si no se le dice.
export const dynamic = "force-static";

// El sitemap sale del roster, no de una lista escrita a mano: si mañana el
// servidor habilita otra generacion, las fichas nuevas entran solas.
export default function sitemap(): MetadataRoute.Sitemap {
  const hoy = new Date();

  const secciones = SECCIONES.map(({ ruta, prioridad }) => ({
    url: `${SITIO}${ruta}`,
    lastModified: hoy,
    changeFrequency: "weekly" as const,
    priority: prioridad,
  }));

  const fichas = POKEMON.map((p) => ({
    url: `${SITIO}/pokemon/${p.slug}`,
    lastModified: hoy,
    // Una ficha solo cambia cuando se actualiza el mod.
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...secciones, ...fichas];
}
