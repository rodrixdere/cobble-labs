import {
  EV_MAXIMO_POR_STAT,
  EV_TOTAL_MAXIMO,
  IV_MAXIMO,
  NIVEL_MAXIMO,
  ORDEN_STATS,
  type Stats,
} from "@/data/pokemon";
import { evDe, evsUsados, ivDe, type Conjunto } from "@/team/conjunto";
import type { MovimientoCatalogo, PokemonCombate } from "@/team/combate";

// Reglas del equipo. Todas se comprueban contra los datos del jar: un
// movimiento es legal si esa especie lo aprende, una habilidad es legal si es
// una de las suyas. No hay lista de legalidad escrita a mano.

export const MAXIMO_MIEMBROS = 6;
export const MAXIMO_MOVIMIENTOS = 4;
export const NIVEL_FIJO = 50;

export type Falla = {
  // A que hueco apunta el problema, o null si es del equipo entero.
  indice: number | null;
  regla: string;
  mensaje: string;
  gravedad: "error" | "aviso";
};

export function validarEquipo(
  conjuntos: Conjunto[],
  porSlug: Map<string, PokemonCombate>,
  catalogo: MovimientoCatalogo[]
): Falla[] {
  const fallas: Falla[] = [];

  if (conjuntos.length > MAXIMO_MIEMBROS) {
    fallas.push({
      indice: null,
      regla: "maximo",
      mensaje: `Un equipo no puede tener más de ${MAXIMO_MIEMBROS} Pokémon.`,
      gravedad: "error",
    });
  }

  const vistos = new Map<string, number>();
  const objetos = new Map<string, number>();

  conjuntos.forEach((c, i) => {
    const p = porSlug.get(c.slug);

    if (!p) {
      fallas.push({
        indice: i,
        regla: "especie",
        mensaje: `"${c.slug}" no está en el roster del servidor.`,
        gravedad: "error",
      });
      return;
    }

    // Duplicados de especie.
    const previo = vistos.get(c.slug);
    if (previo !== undefined) {
      fallas.push({
        indice: i,
        regla: "duplicado",
        mensaje: `${p.nombre} está repetido: no se permiten Pokémon duplicados.`,
        gravedad: "error",
      });
    } else {
      vistos.set(c.slug, i);
    }

    // Duplicados de objeto.
    if (c.objeto && c.objeto !== "ninguno") {
      const previoObjeto = objetos.get(c.objeto);
      if (previoObjeto !== undefined) {
        fallas.push({
          indice: i,
          regla: "objeto-duplicado",
          mensaje: `El objeto de ${p.nombre} ya lo lleva otro miembro: no se permiten objetos duplicados.`,
          gravedad: "error",
        });
      } else {
        objetos.set(c.objeto, i);
      }
    }

    // Movimientos: cantidad y legalidad.
    if (c.movimientos.length > MAXIMO_MOVIMIENTOS) {
      fallas.push({
        indice: i,
        regla: "movimientos",
        mensaje: `${p.nombre} tiene más de ${MAXIMO_MOVIMIENTOS} movimientos.`,
        gravedad: "error",
      });
    }
    if (c.movimientos.length === 0) {
      fallas.push({
        indice: i,
        regla: "sin-movimientos",
        mensaje: `${p.nombre} no tiene ningún movimiento cargado.`,
        gravedad: "aviso",
      });
    }

    const aprendibles = new Set(c.movimientos.length ? p.movimientos.map((i2) => catalogo[i2].clave) : []);
    for (const clave of c.movimientos) {
      if (!aprendibles.has(clave)) {
        const nombre = catalogo.find((m) => m.clave === clave)?.nombre ?? clave;
        fallas.push({
          indice: i,
          regla: "movimiento-ilegal",
          mensaje: `${p.nombre} no aprende ${nombre}.`,
          gravedad: "error",
        });
      }
    }

    const repetidos = c.movimientos.filter(
      (clave, j) => c.movimientos.indexOf(clave) !== j
    );
    if (repetidos.length > 0) {
      fallas.push({
        indice: i,
        regla: "movimiento-repetido",
        mensaje: `${p.nombre} tiene el mismo movimiento dos veces.`,
        gravedad: "error",
      });
    }

    // Habilidad legal para la forma elegida.
    const forma = c.forma ? p.formas.find((m) => m.clave === c.forma) : null;
    if (c.forma && !forma) {
      fallas.push({
        indice: i,
        regla: "forma",
        mensaje: `${p.nombre} no tiene esa megaevolución.`,
        gravedad: "error",
      });
    }
    const habilidades = (forma?.habilidades ?? p.habilidades).map((h) => h.clave);
    if (c.habilidad && !habilidades.includes(c.habilidad)) {
      fallas.push({
        indice: i,
        regla: "habilidad",
        mensaje: `${p.nombre} no puede tener esa habilidad en esta forma.`,
        gravedad: "error",
      });
    }

    // Nivel.
    if (c.nivel < 1 || c.nivel > NIVEL_MAXIMO) {
      fallas.push({
        indice: i,
        regla: "nivel",
        mensaje: `El nivel de ${p.nombre} tiene que estar entre 1 y ${NIVEL_MAXIMO}.`,
        gravedad: "error",
      });
    }

    // EVs: 252 por stat y 510 en total, como en el juego.
    const usados = evsUsados(c);
    if (usados > EV_TOTAL_MAXIMO) {
      fallas.push({
        indice: i,
        regla: "evs",
        mensaje: `${p.nombre} reparte ${usados} EVs y el máximo es ${EV_TOTAL_MAXIMO}.`,
        gravedad: "error",
      });
    }

    for (const stat of ORDEN_STATS) {
      const ev = evDe(c, stat);
      if (ev > EV_MAXIMO_POR_STAT || ev < 0) {
        fallas.push({
          indice: i,
          regla: "ev-stat",
          mensaje: `${p.nombre} tiene ${ev} EVs en una stat: el rango es 0 a ${EV_MAXIMO_POR_STAT}.`,
          gravedad: "error",
        });
        break;
      }
    }

    for (const stat of ORDEN_STATS) {
      const iv = ivDe(c, stat);
      if (iv > IV_MAXIMO || iv < 0) {
        fallas.push({
          indice: i,
          regla: "iv-stat",
          mensaje: `${p.nombre} tiene un IV de ${iv}: el rango es 0 a ${IV_MAXIMO}.`,
          gravedad: "error",
        });
        break;
      }
    }
  });

  // Más de una mega en el mismo equipo: en el juego solo se puede
  // megaevolucionar una vez por combate.
  const megas = conjuntos.filter((c) => c.forma);
  if (megas.length > 1) {
    fallas.push({
      indice: null,
      regla: "megas",
      mensaje: `Hay ${megas.length} megaevoluciones: en combate solo se puede usar una.`,
      gravedad: "aviso",
    });
  }

  return fallas;
}

export function hayErrores(fallas: Falla[]): boolean {
  return fallas.some((f) => f.gravedad === "error");
}

export function fallasDe(fallas: Falla[], indice: number): Falla[] {
  return fallas.filter((f) => f.indice === indice);
}

// Los EVs que quedan por repartir, por si hace falta mostrarlo fuera del editor.
export function evsLibresDe(c: Conjunto): number {
  return EV_TOTAL_MAXIMO - evsUsados(c);
}

export type { Stats };
