import {
  analizarEquipo,
  balanceOfensivo,
  debilidadesCompartidas,
  puntosCiegos,
  type AnalisisDeEquipo,
  type BalanceOfensivo,
} from "@/analysis/equipo";
import { pareceEspacioRaro } from "@/analysis/campo";
import { rolesDe, type Rol } from "@/analysis/roles";
import {
  armarMiembro,
  conjuntoPorDefecto,
  type Miembro,
  type MovimientoCatalogo,
  type PokemonCombate,
} from "@/team/combate";
import type { Conjunto } from "@/team/conjunto";
import type { Amenaza } from "@/recommendations/amenazas";
import type { Criterio } from "@/recommendations/pesos";

// Lo que le falta al equipo, calculado una sola vez. Cada regla mira este
// contexto y decide si el candidato aporta algo.
//
// Va afuera del bucle de candidatos por dos motivos: no repetir el mismo trabajo
// 410 veces, y poder armar una situacion a mano para testear una regla sola.

export type Contexto = {
  criterio: Criterio;
  roster: PokemonCombate[];
  catalogo: MovimientoCatalogo[];
  analisis: AnalisisDeEquipo;
  /** Tipos a los que dos o mas miembros son debiles. */
  compartidas: ReturnType<typeof debilidadesCompartidas>;
  /** Tipos a los que nadie del equipo le pega fuerte. */
  ciegos: string[];
  /** Tipos que nadie del equipo resiste ni es inmune. */
  sinResistencia: string[];
  balance: BalanceOfensivo;
  amenazas: Amenaza[];
  /** Cuantos miembros tienen cada tipo, para penalizar el tercero. */
  vecesPorTipo: Record<string, number>;
  rolesDelEquipo: Set<Rol>;
  /** El equipo ya juega Espacio Raro o es lo bastante lento como para hacerlo. */
  buscaEspacioRaro: boolean;
};

/** El candidato con todo lo que las reglas necesitan mirarle. */
export type Candidato = {
  pokemon: PokemonCombate;
  conjunto: Conjunto;
  miembro: Miembro;
  roles: Rol[];
};

export function prepararCandidato(
  pokemon: PokemonCombate,
  catalogo: MovimientoCatalogo[]
): Candidato {
  const conjunto = conjuntoPorDefecto(pokemon, catalogo);
  const miembro = armarMiembro(pokemon, conjunto, catalogo);
  return { pokemon, conjunto, miembro, roles: rolesDe(miembro) };
}

export function armarContexto(
  equipo: Miembro[],
  roster: PokemonCombate[],
  catalogo: MovimientoCatalogo[],
  criterio: Criterio,
  amenazas: Amenaza[],
  analisisPrevio?: AnalisisDeEquipo
): Contexto {
  const analisis = analisisPrevio ?? analizarEquipo(equipo);

  const vecesPorTipo: Record<string, number> = {};
  for (const m of equipo) {
    for (const t of m.tipos) vecesPorTipo[t] = (vecesPorTipo[t] ?? 0) + 1;
  }

  return {
    criterio,
    roster,
    catalogo,
    analisis,
    compartidas: debilidadesCompartidas(equipo),
    ciegos: puntosCiegos(equipo),
    sinResistencia: analisis.defensas
      .filter((d) => d.resisten + d.inmunes === 0)
      .map((d) => d.tipo),
    balance: balanceOfensivo(equipo),
    amenazas,
    vecesPorTipo,
    rolesDelEquipo: new Set(analisis.roles.conteo.map((c) => c.rol)),
    buscaEspacioRaro:
      analisis.campo.espacioRaro.activo || pareceEspacioRaro(equipo),
  };
}
