import { useMemo } from "react";

import { escribirGuardado, useGuardado } from "@/lib/guardado";

// Quien entro, guardado en el navegador para no preguntarle al Worker en cada
// pagina. No es la credencial: esa es la cookie, que JavaScript no ve. Si la
// cookie vence, la primera escritura responde 401 y esto se borra.

const CLAVE = "cobble-labs:sesion";

export type Sesion = { id: string; nombre: string };

export function guardarSesion(sesion: Sesion): void {
  escribirGuardado(CLAVE, JSON.stringify(sesion));
}

export function olvidarSesion(): void {
  escribirGuardado(CLAVE, null);
}

export function useSesion(): Sesion | null {
  const crudo = useGuardado(CLAVE);
  return useMemo(() => {
    if (!crudo) return null;
    try {
      const sesion = JSON.parse(crudo);
      return typeof sesion?.id === "string" && typeof sesion?.nombre === "string" ? sesion : null;
    } catch {
      return null;
    }
  }, [crudo]);
}
