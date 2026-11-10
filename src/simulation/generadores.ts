import { presente } from "@/lib/coleccion";
import { statANivel } from "@/engine/calculo-dano";
import {
  armarLuchador,
  conjuntoPorDefecto,
  type MovimientoCatalogo,
  type PokemonCombate,
} from "@/team/combate";
import type { Conjunto } from "@/team/conjunto";
import type { Luchador } from "@/simulation/simulador";
import type { Azar } from "@/simulation/azar";

// Generadores de equipos rivales.
//
// Todo lo que sale de acá es DATO GENERADO, no dato real: son composiciones
// armadas por reglas sobre el roster del servidor. No hay resultados de torneo
// ni datos de uso del servidor, así que no existe forma honesta de decir "este
// es un equipo que se juega". Lo que sí es real es la regla: un equipo de
// Espacio Raro se arma con Pokémon que de verdad pueden ponerlo y con lentos
// que de verdad pegan.

export type Origen = "arquetipo" | "aleatorio" | "propio";

// El jar marca legendary, mythical y restricted en las etiquetas de la especie.
// Es dato del propio Cobblemon, no un criterio nuestro sobre quién es "muy
// fuerte": por eso se puede filtrar sin inventar nada.
const ETIQUETAS_RESTRINGIDAS = ["legendary", "mythical", "restricted"];

export function esRestringido(p: PokemonCombate): boolean {
  return p.etiquetas.some((e) => ETIQUETAS_RESTRINGIDAS.includes(e));
}

export function sinRestringidos(roster: PokemonCombate[]): PokemonCombate[] {
  return roster.filter((p) => !esRestringido(p));
}

// Reglas de cualquier equipo que arma el bot: solo la ultima etapa de cada
// linea, como mucho un legendario (si el usuario los deja entrar) y como mucho
// una mega, que es lo que permite el juego por combate.
const ultimaEtapa = (roster: PokemonCombate[]) => roster.filter((p) => !p.puedeEvolucionar);

// Lo que ya lleva el equipo mientras se arma: con un legendario adentro, el
// resto de los legendarios deja de ser candidato.
type Armado = { slugs: Set<string>; conLegendario: boolean };
const nuevoArmado = (): Armado => ({ slugs: new Set(), conLegendario: false });
const entra = (p: PokemonCombate, a: Armado) =>
  !a.slugs.has(p.slug) && !(a.conLegendario && esRestringido(p));
function sumar(p: PokemonCombate, a: Armado) {
  a.slugs.add(p.slug);
  if (esRestringido(p)) a.conLegendario = true;
}

export type EquipoRival = {
  id: string;
  origen: Origen;
  // Dato generado o dato real. Hoy solo "propio" es dato real del usuario.
  esDatoReal: boolean;
  arquetipo: string;
  nombre: string;
  estrategia: string;
  dificultad: "baja" | "media" | "alta";
  condicionDeVictoria: string;
  miembros: Luchador[];
  conjuntos: Conjunto[];
};

type Filtro = (p: PokemonCombate, catalogo: MovimientoCatalogo[]) => boolean;

function aprende(p: PokemonCombate, catalogo: MovimientoCatalogo[], clave: string) {
  return p.movimientos.some((i) => catalogo[i].clave === clave);
}

function tieneHabilidad(p: PokemonCombate, claves: string[]) {
  return p.habilidades.some((h) => claves.includes(h.clave));
}

const velocidad = (p: PokemonCombate) => statANivel(p.stats.speed, false);
const pegada = (p: PokemonCombate) => Math.max(p.stats.attack, p.stats.special_attack);
const aguante = (p: PokemonCombate) =>
  p.stats.hp + (p.stats.defence + p.stats.special_defence) / 2;

// Elige de a uno sin repetir, priorizando a los que mejor cumplen el criterio
// pero con algo de azar para que dos equipos del mismo arquetipo no salgan
// idénticos.
function elegir(
  roster: PokemonCombate[],
  catalogo: MovimientoCatalogo[],
  filtro: Filtro,
  puntuar: (p: PokemonCombate) => number,
  cuantos: number,
  armado: Armado,
  azar: Azar
): PokemonCombate[] {
  const candidatos = roster
    .filter((p) => !armado.slugs.has(p.slug) && filtro(p, catalogo))
    .toSorted((a, b) => puntuar(b) - puntuar(a));

  // De los mejores treinta se toma al azar: mantiene la identidad del
  // arquetipo sin repetir siempre los mismos seis.
  const pozo = candidatos.slice(0, Math.max(cuantos, 30));
  const salida: PokemonCombate[] = [];

  for (const p of azar.mezclar(pozo)) {
    if (salida.length >= cuantos) break;
    if (!entra(p, armado)) continue;
    salida.push(p);
    sumar(p, armado);
  }

  return salida;
}

type Receta = {
  clave: string;
  nombre: string;
  estrategia: string;
  dificultad: "baja" | "media" | "alta";
  condicionDeVictoria: string;
  // Cada tramo pide unos cuantos con un criterio.
  tramos: {
    cuantos: number;
    filtro: Filtro;
    puntuar: (p: PokemonCombate) => number;
  }[];
};

export const RECETAS: Receta[] = [
  {
    clave: "espacio-raro",
    nombre: "Espacio Raro",
    estrategia:
      "Dos que pueden poner Espacio Raro y cuatro lentos con pegada que se aprovechan de moverse primero.",
    dificultad: "alta",
    condicionDeVictoria: "Invertir el orden de turno y romper antes de que se acabe.",
    tramos: [
      {
        cuantos: 2,
        filtro: (p, c) => aprende(p, c, "trickroom"),
        puntuar: (p) => aguante(p),
      },
      {
        cuantos: 4,
        filtro: (p) => velocidad(p) < 95 && pegada(p) >= 95,
        puntuar: (p) => pegada(p) - velocidad(p) / 2,
      },
    ],
  },
  {
    clave: "viento-afin",
    nombre: "Viento Afín",
    estrategia:
      "Uno que pone Viento Afín y cinco rápidos que con el bonus pasan por encima de todo.",
    dificultad: "media",
    condicionDeVictoria: "Ganar los cuatro turnos de velocidad doblada.",
    tramos: [
      {
        cuantos: 1,
        filtro: (p, c) => aprende(p, c, "tailwind"),
        puntuar: (p) => aguante(p),
      },
      {
        cuantos: 5,
        filtro: (p) => velocidad(p) >= 90,
        puntuar: (p) => velocidad(p) + pegada(p),
      },
    ],
  },
  {
    clave: "sol",
    nombre: "Sol",
    estrategia:
      "Quien pone sol más los que lo aprovechan: Fuego potenciado y habilidades que doblan velocidad con sol.",
    dificultad: "media",
    condicionDeVictoria: "Poner el sol y sostenerlo mientras el Fuego pega un 50 % más.",
    tramos: [
      {
        cuantos: 1,
        filtro: (p, c) => tieneHabilidad(p, ["drought"]) || aprende(p, c, "sunnyday"),
        puntuar: (p) => (tieneHabilidad(p, ["drought"]) ? 1000 : 0) + aguante(p),
      },
      {
        cuantos: 2,
        filtro: (p) => tieneHabilidad(p, ["chlorophyll", "solarpower", "flowergift"]),
        puntuar: (p) => pegada(p),
      },
      {
        cuantos: 3,
        filtro: (p) => p.tipos.includes("fire"),
        puntuar: (p) => pegada(p) + velocidad(p) / 2,
      },
    ],
  },
  {
    clave: "lluvia",
    nombre: "Lluvia",
    estrategia:
      "Quien pone lluvia más nadadores rápidos y Agua potenciada.",
    dificultad: "media",
    condicionDeVictoria: "Con lluvia, los de Nado Rápido llegan primero y el Agua rompe.",
    tramos: [
      {
        cuantos: 1,
        filtro: (p, c) => tieneHabilidad(p, ["drizzle"]) || aprende(p, c, "raindance"),
        puntuar: (p) => (tieneHabilidad(p, ["drizzle"]) ? 1000 : 0) + aguante(p),
      },
      {
        cuantos: 2,
        filtro: (p) => tieneHabilidad(p, ["swiftswim", "raindish", "dryskin"]),
        puntuar: (p) => pegada(p),
      },
      {
        cuantos: 3,
        filtro: (p) => p.tipos.includes("water"),
        puntuar: (p) => pegada(p) + aguante(p) / 2,
      },
    ],
  },
  {
    clave: "arena",
    nombre: "Arena",
    estrategia:
      "Tormenta de arena y cuerpos que no la sufren: Roca, Tierra y Acero aguantando el desgaste.",
    dificultad: "media",
    condicionDeVictoria: "Ganar por desgaste mientras la arena pela al rival.",
    tramos: [
      {
        cuantos: 1,
        filtro: (p, c) => tieneHabilidad(p, ["sandstream"]) || aprende(p, c, "sandstorm"),
        puntuar: (p) => (tieneHabilidad(p, ["sandstream"]) ? 1000 : 0) + aguante(p),
      },
      {
        cuantos: 5,
        filtro: (p) =>
          p.tipos.some((t) => ["rock", "ground", "steel"].includes(t)),
        puntuar: (p) => aguante(p) + pegada(p) / 2,
      },
    ],
  },
  {
    clave: "ofensiva-total",
    nombre: "Ofensiva total",
    estrategia: "Seis que pegan fuerte y rápido, sin nada defensivo.",
    dificultad: "alta",
    condicionDeVictoria: "Tumbar uno por turno antes de recibir el segundo golpe.",
    tramos: [
      {
        cuantos: 6,
        filtro: (p) => velocidad(p) >= 90 && pegada(p) >= 100,
        puntuar: (p) => pegada(p) + velocidad(p),
      },
    ],
  },
  {
    clave: "muros",
    nombre: "Muros",
    estrategia: "Seis cuerpos difíciles de tumbar, que ganan por aguante.",
    dificultad: "baja",
    condicionDeVictoria: "Sobrevivir a todo y cerrar con lo poco que pega.",
    tramos: [
      {
        cuantos: 6,
        filtro: (p) => aguante(p) >= 150,
        puntuar: (p) => aguante(p),
      },
    ],
  },
  {
    clave: "equilibrado",
    nombre: "Equilibrado",
    estrategia:
      "Dos que aguantan, dos que rompen y dos rápidos: el reparto más común.",
    dificultad: "media",
    condicionDeVictoria: "No perder ningún cruce por goleada y cerrar con el que quede.",
    tramos: [
      { cuantos: 2, filtro: (p) => aguante(p) >= 145, puntuar: (p) => aguante(p) },
      { cuantos: 2, filtro: (p) => pegada(p) >= 105, puntuar: (p) => pegada(p) },
      { cuantos: 2, filtro: (p) => velocidad(p) >= 95, puntuar: (p) => velocidad(p) },
    ],
  },
  {
    clave: "prioridad",
    nombre: "Prioridad",
    estrategia:
      "Equipo que cierra con movimientos que pegan siempre primero, sin importar la velocidad.",
    dificultad: "media",
    condicionDeVictoria: "Rematar a los que quedan tocados sin darles el turno.",
    tramos: [
      {
        cuantos: 6,
        filtro: (p, c) =>
          p.movimientos.some((i) => c[i].prioridad > 0 && c[i].potencia > 0),
        puntuar: (p) => pegada(p) + aguante(p) / 3,
      },
    ],
  },
];

function completar(
  elegidos: PokemonCombate[],
  roster: PokemonCombate[],
  armado: Armado,
  azar: Azar
): PokemonCombate[] {
  const salida = [...elegidos];
  for (const p of azar.mezclar(roster)) {
    if (salida.length >= 6) break;
    if (!entra(p, armado)) continue;
    salida.push(p);
    sumar(p, armado);
  }
  return salida;
}

const totalDe = (s: PokemonCombate["stats"]) => Object.values(s).reduce((a, b) => a + b, 0);

// Si alguno puede megaevolucionar, lo hace uno solo: el que mas gana con su
// mega. Lleva la habilidad de la mega, que es la que tiene en combate.
function conUnaMega(elegidos: PokemonCombate[], conjuntos: Conjunto[]): Conjunto[] {
  const opciones = elegidos.flatMap((p, i) =>
    p.formas
      .filter((f) => f.tipo === "mega")
      .map((f) => ({ i, f, gana: totalDe(f.stats) - totalDe(p.stats) }))
  );
  if (opciones.length === 0) return conjuntos;
  const { i, f } = opciones.reduce((a, b) => (b.gana > a.gana ? b : a));
  return conjuntos.map((c, j) =>
    j === i ? { ...c, forma: f.clave, habilidad: f.habilidades[0]?.clave ?? c.habilidad } : c
  );
}

function aEquipo(
  elegidos: PokemonCombate[],
  catalogo: MovimientoCatalogo[]
): { miembros: Luchador[]; conjuntos: Conjunto[] } {
  const conjuntos = conUnaMega(elegidos, elegidos.map((p) => conjuntoPorDefecto(p, catalogo)));
  return {
    conjuntos,
    miembros: elegidos.map((p, i) => armarLuchador(p, conjuntos[i], catalogo)),
  };
}

export function generarPorArquetipo(
  receta: Receta,
  roster: PokemonCombate[],
  catalogo: MovimientoCatalogo[],
  azar: Azar,
  indice: number
): EquipoRival {
  const armado = nuevoArmado();
  const pozo = ultimaEtapa(roster);
  let elegidos: PokemonCombate[] = [];

  for (const tramo of receta.tramos) {
    elegidos = [
      ...elegidos,
      ...elegir(pozo, catalogo, tramo.filtro, tramo.puntuar, tramo.cuantos, armado, azar),
    ];
  }

  elegidos = completar(elegidos, pozo, armado, azar).slice(0, 6);
  const { miembros, conjuntos } = aEquipo(elegidos, catalogo);

  return {
    id: `arquetipo-${receta.clave}-${indice}`,
    origen: "arquetipo",
    esDatoReal: false,
    arquetipo: receta.nombre,
    nombre: `${receta.nombre} #${indice + 1}`,
    estrategia: receta.estrategia,
    dificultad: receta.dificultad,
    condicionDeVictoria: receta.condicionDeVictoria,
    miembros,
    conjuntos,
  };
}

export function generarAleatorioLegal(
  roster: PokemonCombate[],
  catalogo: MovimientoCatalogo[],
  azar: Azar,
  indice: number,
  calidad: "casual" | "competitivo" = "competitivo"
): EquipoRival {
  const finales = ultimaEtapa(roster);
  const pozo =
    calidad === "competitivo"
      ? finales.toSorted((a, b) => b.total - a.total).slice(0, 140)
      : finales;

  const elegidos = completar([], pozo, nuevoArmado(), azar).slice(0, 6);
  const { miembros, conjuntos } = aEquipo(elegidos, catalogo);

  return {
    id: `aleatorio-${calidad}-${indice}`,
    origen: "aleatorio",
    esDatoReal: false,
    arquetipo: calidad === "competitivo" ? "Aleatorio fuerte" : "Aleatorio",
    nombre: `Aleatorio #${indice + 1}`,
    estrategia:
      calidad === "competitivo"
        ? "Seis al azar entre los de mayor total de stats, sin ninguna estrategia detrás."
        : "Seis al azar de todo el roster.",
    dificultad: calidad === "competitivo" ? "media" : "baja",
    condicionDeVictoria: "Ninguna en particular: es el control del experimento.",
    miembros,
    conjuntos,
  };
}

// Los equipos que el usuario guardó, que sí son dato real suyo.
export function desdeEquipoPropio(
  nombre: string,
  conjuntos: Conjunto[],
  porSlug: Map<string, PokemonCombate>,
  catalogo: MovimientoCatalogo[],
  indice: number
): EquipoRival | null {
  const miembros = conjuntos
    .map((c) => {
      const p = porSlug.get(c.slug);
      return p ? armarLuchador(p, c, catalogo) : null;
    })
    .filter(presente);

  if (miembros.length === 0) return null;

  return {
    id: `propio-${indice}`,
    origen: "propio",
    esDatoReal: true,
    arquetipo: "Equipo guardado",
    nombre,
    estrategia: "Uno de tus equipos guardados.",
    dificultad: "media",
    condicionDeVictoria: "La que le hayas puesto vos.",
    miembros,
    conjuntos,
  };
}
