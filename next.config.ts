import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // La raiz es esta carpeta y no la de arriba. Turbopack la deduce subiendo
  // hasta el primer package.json, y arriba hay uno (el del taller, con el
  // script de capturas). Sin fijarla, deduce mal, no encuentra el paquete de
  // Next y cada pagina entra en un bucle de recarga.
  turbopack: { root: path.resolve(import.meta.dirname) },

  // Para probar desde el telefono. Sin esto, `next dev` bloquea sus propios
  // recursos de desarrollo cuando la pagina se abre desde otra direccion que no
  // sea localhost: el HTML llega igual, React nunca hidrata y no responde nada.
  // El sintoma es que la pagina se ve bien pero ningun boton hace nada.
  // Van los dos comodines del tailnet, el nombre y el rango de direcciones que
  // reparte Tailscale, para no clavar la maquina de nadie en el repo.
  allowedDevOrigins: ["*.ts.net", "*.*.ts.net", "100.*.*.*"],

  experimental: {
    // El paquete de iconos es un barrel de miles de archivos: sin esto entra
    // entero al bundle aunque se usen tres.
    optimizePackageImports: ["@phosphor-icons/react"],
  },
};

export default nextConfig;
