import { useMemo } from "react";

import type { ResumenEquipo } from "@/comunidad/tipos";
import { escribirGuardado, leerGuardado, useGuardado } from "@/lib/guardado";

// Los favoritos viven en este navegador y no llaman a nadie. Se guarda el
// resumen entero para poder mostrarlos sin volver a pedirlos.

const CLAVE = "cobble-labs:favoritos";

function leer(crudo: string | null): ResumenEquipo[] {
  try {
    const lista = JSON.parse(crudo ?? "[]");
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export function alternarFavorito(equipo: ResumenEquipo): void {
  const lista = leer(leerGuardado(CLAVE));
  const yaEsta = lista.some((e) => e.id === equipo.id);
  const nueva = yaEsta ? lista.filter((e) => e.id !== equipo.id) : [equipo, ...lista];
  escribirGuardado(CLAVE, JSON.stringify(nueva));
}

export function useFavoritos(): ResumenEquipo[] {
  const crudo = useGuardado(CLAVE);
  return useMemo(() => leer(crudo), [crudo]);
}
