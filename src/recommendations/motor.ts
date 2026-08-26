import { analizarEquipo, type AnalisisDeEquipo } from "@/analysis/equipo";
import type { Rol } from "@/analysis/roles";
import {
  armarMiembro,
  conjuntoPorDefecto,
  type Miembro,
  type MovimientoCatalogo,
  type PokemonCombate,
} from "@/team/combate";
import type { Conjunto } from "@/team/conjunto";
import { amenazasContra } from "@/recommendations/amenazas";
import {
  armarContexto,
  prepararCandidato,
  type Candidato,
  type Contexto,
} from "@/recommendations/contexto";
import { REGLAS, type Aporte } from "@/recommendations/reglas";
import { pesosDe, type Criterio, type Pesos } from "@/recommendations/pesos";

// Motor de recomendaciones. La pregunta no es "cual es el mejor Pokemon" sino
// "por que este mejora ESTE equipo": cada punto queda con su motivo, y esos
// motivos son lo que se muestra.
//
// Sin datos de uso ni de tier, porque el servidor no los publica. Lo mas
// parecido a viabilidad es el total de stats, y pesa poco por eso mismo.
//
// Aca solo se orquesta: las reglas estan en reglas.ts y el contexto en
// contexto.ts.

export { amenazasContra, type Amenaza } from "@/recommendations/amenazas";
export { CRITERIOS, type Criterio } from "@/recommendations/pesos";

export type Recomendacion = {
  pokemon: PokemonCombate;
  conjunto: Conjunto;
  puntaje: number;
  roles: Rol[];
  razones: string[];
  desglose: { motivo: string; puntos: number }[];
};

const TOTAL_MAXIMO = 720;

/** Cuantas amenazas del rival se tienen en cuenta al puntuar. */
const AMENAZAS_QUE_PESAN = 6;

// Cada tipo ya ofrecido descuenta a los que lo repiten. Sin esto, si el equipo
// sufre a Agua, las cinco recomendaciones resisten Agua: la misma idea repetida
// en vez de cinco maneras de tapar el hueco.
const DESCUENTO_POR_TIPO_REPETIDO = 0.72;

export function recomendar(
  equipo: Miembro[],
  roster: PokemonCombate[],
  catalogo: MovimientoCatalogo[],
  criterio: Criterio = "general",
  cuantas = 5,
  analisis?: AnalisisDeEquipo
): Recomendacion[] {
  if (equipo.length === 0) {
    return mejoresPorSiSolos(roster, catalogo, cuantas);
  }

  const pesos = pesosDe(criterio);
  const amenazas = amenazasContra(equipo, roster, catalogo, AMENAZAS_QUE_PESAN);
  const ctx = armarContexto(equipo, roster, catalogo, criterio, amenazas, analisis);
  const yaEstan = new Set(equipo.map((m) => m.pokemon.slug));

  const recomendaciones: Recomendacion[] = [];

  for (const pokemon of roster) {
    if (yaEstan.has(pokemon.slug)) continue;

    const candidato = prepararCandidato(pokemon, catalogo);
    const recomendacion = puntuar(candidato, ctx, pesos);
    if (recomendacion) recomendaciones.push(recomendacion);
  }

  return conVariedad(recomendaciones, cuantas);
}

/** Aplica las once reglas. Devuelve null si el candidato no aporta nada. */
function puntuar(
  candidato: Candidato,
  ctx: Contexto,
  pesos: Pesos
): Recomendacion | null {
  const aportes: Aporte[] = REGLAS.flatMap((regla) => regla(candidato, ctx, pesos));

  const puntaje = aportes.reduce((total, a) => total + a.puntos, 0);
  const razones = aportes.map((a) => a.razon).filter((r) => r !== undefined);

  // Sin motivo no hay recomendacion: la tarjeta quedaria sin nada que explicar.
  if (puntaje <= 0 || razones.length === 0) return null;

  return {
    pokemon: candidato.pokemon,
    conjunto: candidato.conjunto,
    puntaje,
    roles: candidato.roles,
    razones,
    desglose: aportes
      .map(({ motivo, puntos }) => ({ motivo, puntos }))
      .toSorted((a, b) => b.puntos - a.puntos),
  };
}

/**
 * Con el equipo vacio no hay nada que complementar: se contesta con lo que mas
 * rinde por si solo, y se dice que el criterio es ese.
 */
function mejoresPorSiSolos(
  roster: PokemonCombate[],
  catalogo: MovimientoCatalogo[],
  cuantas: number
): Recomendacion[] {
  return roster
    .toSorted((a, b) => b.total - a.total)
    .slice(0, cuantas)
    .map((pokemon) => {
      const { conjunto, roles } = prepararCandidato(pokemon, catalogo);
      return {
        pokemon,
        conjunto,
        puntaje: Math.min(100, Math.round((pokemon.total / TOTAL_MAXIMO) * 100)),
        roles,
        razones: [
          `Total de stats ${pokemon.total}, de los más altos del roster`,
          "Con el equipo vacío todavía no hay huecos que tapar",
        ],
        desglose: [{ motivo: "Total de stats base", puntos: pokemon.total }],
      };
    });
}

/**
 * Elige las mejores penalizando las que repiten tipo, y pasa el puntaje a
 * relativo: en bruto los primeros veinte se amontonan, y "100 y 61" si dice
 * cuanto mejor es el primero.
 */
function conVariedad(
  recomendaciones: Recomendacion[],
  cuantas: number
): Recomendacion[] {
  const mejor = recomendaciones.reduce((max, r) => Math.max(max, r.puntaje), 0);
  if (mejor === 0) return [];

  const pendientes = recomendaciones.toSorted(
    (a, b) => b.puntaje - a.puntaje || b.pokemon.total - a.pokemon.total
  );

  const elegidas: Recomendacion[] = [];
  const ofrecidos = new Map<string, number>();

  while (elegidas.length < cuantas && pendientes.length > 0) {
    let mejorIndice = 0;
    let mejorAjustado = -Infinity;

    pendientes.forEach((r, i) => {
      const repeticiones = r.pokemon.tipos.reduce(
        (acc, t) => acc + (ofrecidos.get(t) ?? 0),
        0
      );
      const ajustado = r.puntaje * DESCUENTO_POR_TIPO_REPETIDO ** repeticiones;
      if (ajustado > mejorAjustado) {
        mejorAjustado = ajustado;
        mejorIndice = i;
      }
    });

    const [elegida] = pendientes.splice(mejorIndice, 1);
    elegidas.push(elegida);
    for (const t of elegida.pokemon.tipos) {
      ofrecidos.set(t, (ofrecidos.get(t) ?? 0) + 1);
    }
  }

  return elegidas.map((r) => ({
    ...r,
    puntaje: Math.round((r.puntaje / mejor) * 100),
  }));
}

export type Reemplazo = {
  sale: Miembro;
  entra: Recomendacion;
  mejora: number;
};

// Con los seis puestos ya no se suma, se cambia: se saca a cada miembro, se
// busca el mejor para ese hueco y se compara la sinergia. Solo salen los que la
// suben.
export function optimizar(
  equipo: Miembro[],
  roster: PokemonCombate[],
  catalogo: MovimientoCatalogo[],
  criterio: Criterio = "general"
): Reemplazo[] {
  if (equipo.length === 0) return [];

  const actual = analizarEquipo(equipo).sinergia.total;
  const cambios: Reemplazo[] = [];

  for (let i = 0; i < equipo.length; i += 1) {
    const sinEl = equipo.filter((_, j) => j !== i);
    const [entra] = recomendar(sinEl, roster, catalogo, criterio, 1);
    if (!entra) continue;

    const conElNuevo = [
      ...sinEl,
      armarMiembro(entra.pokemon, entra.conjunto, catalogo),
    ];
    const nueva = analizarEquipo(conElNuevo).sinergia.total;

    if (nueva > actual) {
      cambios.push({ sale: equipo[i], entra, mejora: nueva - actual });
    }
  }

  return cambios.toSorted((a, b) => b.mejora - a.mejora);
}

// Que mensaje y que seccion se muestran. La cantidad de miembros es la unica
// entrada, asi que va como tabla y no como cadena de ifs.
const ESTADO = {
  vacio: {
    clave: "vacio",
    titulo: "Empezá a armar tu equipo",
    detalle:
      "Elegí el primero y desde ahí las recomendaciones se calculan sobre lo que tengas.",
  },
  primero: {
    clave: "primero",
    titulo: "Buscá con quién combina",
    detalle: "Estas son las mejores parejas para tu primera elección.",
  },
  nucleo: {
    clave: "nucleo",
    titulo: "Núcleo detectado",
    detalle:
      "Con tres ya se ven las debilidades que comparten y los tipos que nadie cubre.",
  },
  casi: {
    clave: "casi",
    titulo: "Faltan los dos últimos",
    detalle: "Estos son los que mejor tapan lo que quedó abierto.",
  },
  sexto: {
    clave: "sexto",
    titulo: "Falta el sexto",
    detalle: "El último hueco es el que decide contra qué te podés defender.",
  },
  completo: {
    clave: "completo",
    titulo: "Equipo completo",
    detalle: "Ahora la pregunta es qué cambiar, no qué sumar.",
  },
} as const;

// Indexado por cuantos miembros hay. Dos y tres comparten mensaje: en los dos
// casos ya hay nucleo y todavia falta la mitad del equipo.
const POR_CANTIDAD = [
  ESTADO.vacio,
  ESTADO.primero,
  ESTADO.nucleo,
  ESTADO.nucleo,
  ESTADO.casi,
  ESTADO.sexto,
  ESTADO.completo,
];

export function estadoDelEquipo(cuantos: number) {
  return POR_CANTIDAD[Math.min(cuantos, POR_CANTIDAD.length - 1)];
}
