import objetos from "@/data/objetos.json";
import textos from "@/data/textos.json";
import { describirEfecto } from "@/engine/objetos";
import {
  EV_TOTAL_MAXIMO,
  IV_MAXIMO,
  NIVEL_COMPETITIVO,
  ORDEN_STATS,
  type Stats,
} from "@/data/pokemon";

// El conjunto es todo lo que define a un Pokemon en combate mas alla de su
// especie: sus cuatro movimientos, la habilidad, la naturaleza, el objeto, el
// reparto de los 66 puntos y si megaevoluciona.

export type Reparto = Partial<Record<keyof Stats, number>>;

export type Conjunto = {
  slug: string;
  nivel: number;
  movimientos: string[];
  habilidad: string;
  naturaleza: string;
  objeto: string;
  // Los dos sistemas del juego: los IVs son lo que trae de nacimiento (0 a 31)
  // y los EVs lo que gana entrenando (252 por stat, 510 en total).
  ivs: Reparto;
  evs: Reparto;
  forma: string | null;
};

type NaturalezaCruda = {
  clave: string;
  nombre: string;
  sube: string | null;
  baja: string | null;
};

// Showdown nombra las stats atk/def/spa/spd/spe; el resto del sitio usa las
// claves largas del jar de Cobblemon.
const EQUIVALENCIA: Record<string, keyof Stats> = {
  atk: "attack",
  def: "defence",
  spa: "special_attack",
  spd: "special_defence",
  spe: "speed",
};

export type Naturaleza = {
  clave: string;
  nombre: string;
  sube: keyof Stats | null;
  baja: keyof Stats | null;
};

export const NATURALEZAS: Naturaleza[] = (
  textos.naturalezas as NaturalezaCruda[]
)
  .map((n) => ({
    clave: n.clave,
    nombre: n.nombre,
    sube: n.sube ? EQUIVALENCIA[n.sube] : null,
    baja: n.baja ? EQUIVALENCIA[n.baja] : null,
  }))
  .toSorted((a, b) => a.nombre.localeCompare(b.nombre, "es"));

export function naturalezaPorClave(clave: string): Naturaleza {
  return NATURALEZAS.find((n) => n.clave === clave) ?? NATURALEZAS[0];
}

// Los 264 objetos de combate que existen en Cobblemon, con su nombre y su
// descripcion en espaniol sacados del jar. Se pueden elegir todos, porque son
// los que el jugador tiene de verdad; lo que el motor sabe aplicar es el
// subconjunto de EFECTOS_DE_OBJETO, y la interfaz lo dice cuando no.
export type Objeto = {
  clave: string;
  nombre: string;
  desc: string;
  esBaya: boolean;
  megaPara: string | null;
};

const CATALOGO = objetos as Objeto[];

export const SIN_OBJETO: Objeto = {
  clave: "ninguno",
  nombre: "Sin objeto",
  desc: "",
  esBaya: false,
  megaPara: null,
};

export const OBJETOS: Objeto[] = [SIN_OBJETO, ...CATALOGO];

// Lo que se ofrece para elegir: solo los objetos que la simulacion aplica. Un
// objeto sin efecto no cambia nada al probar el equipo. OBJETOS sigue completo
// para leer equipos viejos o importados que traigan cualquier otra cosa.
export const OBJETOS_CON_EFECTO: Objeto[] = CATALOGO.filter((o) => describirEfecto(o.clave) !== null);

export function objetoPorClave(clave: string): Objeto {
  return OBJETOS.find((o) => o.clave === clave) ?? SIN_OBJETO;
}

// Lo que el motor aplica de verdad sale de engine/objetos, que es la misma
// tabla que usan la calculadora y el simulador: asi no se pueden desfasar.
export function efectoDe(clave: string): string | null {
  return describirEfecto(clave);
}

// Habilidades que el simulador aplica de verdad. El resto se puede elegir
// igual, porque es parte de la ficha del Pokemon, pero no cambia el resultado:
// simular las 156 pediria un motor de combate completo.
export const HABILIDADES_SIMULADAS: Record<string, string> = {
  levitate: "Inmune a Tierra",
  flashfire: "Inmune a Fuego",
  waterabsorb: "Inmune a Agua",
  dryskin: "Inmune a Agua, recibe un 25 % más de Fuego",
  stormdrain: "Inmune a Agua",
  voltabsorb: "Inmune a Eléctrico",
  lightningrod: "Inmune a Eléctrico",
  motordrive: "Inmune a Eléctrico",
  sapsipper: "Inmune a Planta",
  thickfat: "Fuego y Hielo le hacen la mitad",
  hugepower: "Ataque ×2",
  purepower: "Ataque ×2",
  overgrow: "Planta ×1.5 con poca vida",
  blaze: "Fuego ×1.5 con poca vida",
  torrent: "Agua ×1.5 con poca vida",
  swarm: "Bicho ×1.5 con poca vida",
};

// Por defecto, IVs perfectos: es lo que se asume en cualquier calculadora
// competitiva, y lo que hace comparables dos Pokemon.
export const IVS_PERFECTOS: Reparto = {
  hp: IV_MAXIMO,
  attack: IV_MAXIMO,
  defence: IV_MAXIMO,
  special_attack: IV_MAXIMO,
  special_defence: IV_MAXIMO,
  speed: IV_MAXIMO,
};

export function conjuntoVacio(slug: string): Conjunto {
  return {
    slug,
    nivel: NIVEL_COMPETITIVO,
    movimientos: [],
    habilidad: "",
    naturaleza: "serious",
    objeto: "ninguno",
    ivs: { ...IVS_PERFECTOS },
    evs: {},
    forma: null,
  };
}

export function ivDe(conjunto: Conjunto, stat: keyof Stats): number {
  return conjunto.ivs[stat] ?? IV_MAXIMO;
}

export function evDe(conjunto: Conjunto, stat: keyof Stats): number {
  return conjunto.evs[stat] ?? 0;
}

export function evsUsados(conjunto: Conjunto): number {
  return ORDEN_STATS.reduce((a, s) => a + evDe(conjunto, s), 0);
}

export function evsLibres(conjunto: Conjunto): number {
  return EV_TOTAL_MAXIMO - evsUsados(conjunto);
}

export function multiplicadorNaturaleza(
  conjunto: Conjunto,
  stat: keyof Stats
): number {
  if (stat === "hp") return 1;
  const naturaleza = naturalezaPorClave(conjunto.naturaleza);
  if (naturaleza.sube === stat) return 1.1;
  if (naturaleza.baja === stat) return 0.9;
  return 1;
}
