import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // La raiz es esta carpeta y no la de arriba. Turbopack la deduce subiendo
  // hasta el primer package.json, y arriba hay uno (el del taller, con el
  // script de capturas). Sin fijarla, deduce mal, no encuentra el paquete de
  // Next y cada pagina entra en un bucle de recarga.
  turbopack: { root: path.resolve(import.meta.dirname) },

  experimental: {
    // El paquete de iconos es un barrel de miles de archivos: sin esto entra
    // entero al bundle aunque se usen tres.
    optimizePackageImports: ["@phosphor-icons/react"],
  },
};

export default nextConfig;
