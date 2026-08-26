import { presente } from "@/lib/coleccion";
import { conjuntoVacio, type Conjunto } from "@/team/conjunto";
import type { Stats } from "@/data/pokemon";
import type { Luchador, MovimientoSim } from "@/simulation/simulador";

// Lo que el Battle Bot necesita de cada Pokemon. Es mas que la rejilla (suma
// habilidades y megas) y menos que la ficha (no lleva descripciones ni
// movimientos de estado).
export type PokemonCombate = {
  slug: string;
  nombre: string;
  assets: string;
  dex: number;
  tipos: string[];
  stats: Stats;
  total: number;
  generacion: number;
  // Las etiquetas del jar: gen1, starter, legendary, restricted, mythical...
  etiquetas: string[];
  habilidades: { clave: string; nombre: string; oculta: boolean }[];
  formas: {
    clave: string;
    tipo: "mega" | "regional";
    etiqueta: string;
    tipos: string[];
    stats: Stats;
    habilidades: { clave: string; nombre: string; oculta: boolean }[];
  }[];
  movimientos: number[];
};

// El catalogo que viaja al cliente. Lleva lo que hace falta para calcular daño
// y ademas lo que hace falta para analizar un equipo: a quien apunta, si pone
// clima o terreno, si deja un efecto de lado (Viento Afín) o de campo (Espacio
// Raro), si causa estado y que stats cambia.
export type MovimientoCatalogo = MovimientoSim & {
  precision: number | null;
  pp: number;
  prioridad: number;
  objetivo: string;
  estado: string | null;
  efectoDeLado: string | null;
  efectoDeCampo: string | null;
  clima: string | null;
  terreno: string | null;
  cambiosPropios: Record<string, number> | null;
  cambiosAlRival: Record<string, number> | null;
};

// El set con el que entra un Pokemon si nadie lo toca: sus cuatro movimientos
// mas potentes sin repetir tipo, su primera habilidad, naturaleza neutra y sin
// objeto. Es una regla explicita, no una opinion sobre cual es su buen set.
export function conjuntoPorDefecto(
  p: PokemonCombate,
  catalogo: MovimientoCatalogo[]
): Conjunto {
  const mejorPorTipo = new Map<string, MovimientoCatalogo>();
  for (const i of p.movimientos) {
    const m = catalogo[i];
    if (m.categoria === "status" || m.potencia <= 0) continue;
    const previo = mejorPorTipo.get(m.tipo);
    if (!previo || m.potencia > previo.potencia) mejorPorTipo.set(m.tipo, m);
  }

  const movimientos = [...mejorPorTipo.values()]
    .toSorted((a, b) => b.potencia - a.potencia)
    .slice(0, 4)
    .map((m) => m.clave);

  return {
    ...conjuntoVacio(p.slug),
    movimientos,
    habilidad: p.habilidades[0]?.clave ?? "",
  };
}

export function armarLuchador(
  p: PokemonCombate,
  conjunto: Conjunto,
  catalogo: MovimientoCatalogo[]
): Luchador {
  const forma = conjunto.forma
    ? p.formas.find((f) => f.clave === conjunto.forma)
    : undefined;

  // Las stats que viajan son las BASE de la forma. Los IVs, los EVs, el nivel y
  // la naturaleza se aplican donde corresponde, con la fórmula del juego.
  const stats: Stats = forma?.stats ?? p.stats;

  const porClave = new Map(p.movimientos.map((i) => [catalogo[i].clave, catalogo[i]]));
  const movimientos = conjunto.movimientos
    .map((clave) => porClave.get(clave))
    .filter(presente);

  return {
    slug: p.slug,
    nombre: forma ? `${p.nombre} ${forma.etiqueta}` : p.nombre,
    tipos: forma?.tipos ?? p.tipos,
    stats,
    conjunto,
    movimientos,
  };
}

// Un miembro del equipo ya resuelto: la especie, su set, y los tipos, stats y
// movimientos con los que realmente pelea (contando mega y puntos). Es lo que
// consumen el analisis y el motor de recomendaciones.
export type Miembro = {
  pokemon: PokemonCombate;
  conjunto: Conjunto;
  nombre: string;
  tipos: string[];
  stats: Stats;
  movimientos: MovimientoCatalogo[];
};

export function armarMiembro(
  p: PokemonCombate,
  conjunto: Conjunto,
  catalogo: MovimientoCatalogo[]
): Miembro {
  const luchador = armarLuchador(p, conjunto, catalogo);
  const porClave = new Map(p.movimientos.map((i) => [catalogo[i].clave, catalogo[i]]));

  return {
    pokemon: p,
    conjunto,
    nombre: luchador.nombre,
    tipos: luchador.tipos,
    stats: luchador.stats,
    movimientos: conjunto.movimientos
      .map((clave) => porClave.get(clave))
      .filter(presente),
  };
}
