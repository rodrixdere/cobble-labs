import { conjuntoVacio, type Conjunto } from "@/team/conjunto";

// Guardado de equipos en el navegador. No hay servidor: todo vive en
// localStorage, y por eso cada lectura y cada escritura estan envueltas, que un
// navegador con el almacenamiento bloqueado no rompa la pagina.

const CLAVE = "cobble-labs:equipos";
// La clave vieja, de cuando un equipo era una lista de slugs sin sets.
const CLAVE_VIEJA = "cobble-labs:equipo";

export type EquipoGuardado = {
  id: string;
  nombre: string;
  notas: string;
  miembros: Conjunto[];
  creado: number;
  actualizado: number;
};

function leerTodos(): EquipoGuardado[] {
  if (typeof window === "undefined") return [];
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return [];
    const lista = JSON.parse(crudo);
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function escribirTodos(equipos: EquipoGuardado[]): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(equipos));
  } catch {
    // Sin almacenamiento el equipo sigue vivo en memoria.
  }
}

export function listarEquipos(): EquipoGuardado[] {
  return leerTodos().toSorted((a, b) => b.actualizado - a.actualizado);
}

export function guardarEquipo(
  nombre: string,
  miembros: Conjunto[],
  notas = "",
  id?: string
): EquipoGuardado {
  const equipos = leerTodos();
  const ahora = Date.now();

  if (id) {
    const indice = equipos.findIndex((e) => e.id === id);
    if (indice >= 0) {
      const actualizado: EquipoGuardado = {
        ...equipos[indice],
        nombre,
        notas,
        miembros,
        actualizado: ahora,
      };
      equipos[indice] = actualizado;
      escribirTodos(equipos);
      return actualizado;
    }
  }

  const nuevo: EquipoGuardado = {
    id: `${ahora}-${Math.random().toString(36).slice(2, 8)}`,
    nombre: nombre.trim() || "Equipo sin nombre",
    notas,
    miembros,
    creado: ahora,
    actualizado: ahora,
  };

  escribirTodos([nuevo, ...equipos]);
  return nuevo;
}

export function borrarEquipo(id: string): void {
  escribirTodos(leerTodos().filter((e) => e.id !== id));
}

export function duplicarEquipo(id: string): EquipoGuardado | null {
  const equipo = leerTodos().find((e) => e.id === id);
  if (!equipo) return null;
  return guardarEquipo(`${equipo.nombre} (copia)`, equipo.miembros, equipo.notas);
}

export function cargarEquipo(id: string): EquipoGuardado | null {
  return leerTodos().find((e) => e.id === id) ?? null;
}

// El equipo que quedó abierto en el armador, para no perderlo al recargar y
// para que el Battle Bot lo levante sin volver a pedirlo.
const CLAVE_ACTUAL = "cobble-labs:equipo-actual";

export function guardarActual(miembros: Conjunto[]): void {
  try {
    localStorage.setItem(CLAVE_ACTUAL, JSON.stringify(miembros));
  } catch {
    // Idem.
  }
}

export function leerActual(): Conjunto[] {
  if (typeof window === "undefined") return [];
  try {
    const crudo = localStorage.getItem(CLAVE_ACTUAL);
    if (crudo) {
      const lista = JSON.parse(crudo);
      if (Array.isArray(lista) && lista.length > 0) return lista;
    }

    // Compatibilidad con la versión vieja, que guardaba solo los slugs.
    const viejo = localStorage.getItem(CLAVE_VIEJA);
    if (viejo) {
      const slugs = JSON.parse(viejo);
      if (Array.isArray(slugs)) {
        return slugs.map((slug: string) => conjuntoVacio(slug));
      }
    }
  } catch {
    return [];
  }
  return [];
}
