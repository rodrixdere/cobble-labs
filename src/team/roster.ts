import { indexarPor, presente } from "@/lib/coleccion";
import type { Luchador } from "@/simulation/simulador";
import {
  armarLuchador,
  armarMiembro,
  conjuntoPorDefecto,
  type Miembro,
  type MovimientoCatalogo,
  type PokemonCombate,
} from "@/team/combate";
import type { Conjunto } from "@/team/conjunto";

// Las cuatro operaciones que toda pantalla de equipos necesita antes de poder
// mostrar nada.

/** El roster indexado por slug, que es como lo busca todo el mundo. */
export type IndicePokemon = Map<string, PokemonCombate>;

export function indexarRoster(roster: readonly PokemonCombate[]): IndicePokemon {
  return indexarPor(roster, (p) => p.slug);
}

/**
 * Los equipos guardados de la version vieja vienen sin movimientos: se les arma
 * el set de fabrica, o aparecen en cero y parece que estan rotos.
 *
 * Un slug que ya no esta en el roster pasa tal cual, para no perder dato del
 * usuario: quien lo muestre decide si lo descarta.
 */
export function rehidratar(
  conjuntos: readonly Conjunto[],
  indice: IndicePokemon,
  catalogo: MovimientoCatalogo[]
): Conjunto[] {
  return conjuntos.map((c) => {
    const p = indice.get(c.slug);
    if (!p || c.movimientos.length > 0) return c;
    return conjuntoPorDefecto(p, catalogo);
  });
}

/** Los conjuntos resueltos a miembros, salteando los que ya no existen. */
export function armarEquipo(
  conjuntos: readonly Conjunto[],
  indice: IndicePokemon,
  catalogo: MovimientoCatalogo[]
): Miembro[] {
  return conjuntos
    .map((c) => {
      const p = indice.get(c.slug);
      return p ? armarMiembro(p, c, catalogo) : null;
    })
    .filter(presente);
}

/** Lo mismo, pero para el simulador, que trabaja con luchadores. */
export function armarBando(
  conjuntos: readonly Conjunto[],
  indice: IndicePokemon,
  catalogo: MovimientoCatalogo[]
): Luchador[] {
  return conjuntos
    .map((c) => {
      const p = indice.get(c.slug);
      return p ? armarLuchador(p, c, catalogo) : null;
    })
    .filter(presente);
}
