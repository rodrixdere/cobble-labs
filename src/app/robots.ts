import type { MetadataRoute } from "next";

import { SITIO } from "@/data/sitio";

// Con output "export" hay que declararlo estatico a mano: Next asume dinamica
// cualquier ruta de metadata y el build falla si no se le dice.
export const dynamic = "force-static";

// Todo el sitio es publico y estatico: no hay nada que esconder de un rastreador.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITIO}/sitemap.xml`,
    host: SITIO,
  };
}
