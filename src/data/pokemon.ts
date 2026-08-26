import datos from "@/data/pokemon.json";

export type Habilidad = { nombre: string; oculta: boolean };

export type Stats = {
  hp: number;
  attack: number;
  defence: number;
  special_attack: number;
  special_defence: number;
  speed: number;
};

// Las otras formas de una especie, del propio jar: megaevoluciones y variantes
// regionales, cada una con sus tipos, stats y habilidades. Lo que la forma no
// cambia se hereda de la base.
export type Evolucion = {
  a: string | null;
  // Cuando la evolución lleva a otra forma: "weezing galarian" -> "galarian".
  aspecto: string | null;
  variante: string | null;
  requisitos: { variant?: string; [clave: string]: unknown }[];
  contexto: string | null;
};

export type Forma = {
  nombre: string;
  tipo: "mega" | "regional";
  // "Mega", "Mega X", "Alola", "Galar", "Hisui", "Paldea".
  etiqueta: string;
  aspectos: string[];
  tipos: string[];
  stats: Stats;
  habilidades: Habilidad[];
  // Una forma regional puede evolucionar a otra cosa que la base: el
  // Farfetch'd de Galar evoluciona a Sirfetch'd y el normal a nada.
  evoluciones: Evolucion[];
};

export type Pokemon = {
  dex: number;
  nombre: string;
  slug: string;
  assets: string;
  tipos: string[];
  stats: Stats;
  habilidades: Habilidad[];
  gruposHuevo: string[];
  alturaM: number;
  pesoKg: number;
  tasaCaptura: number;
  grupoExperiencia: string;
  evYield: Record<string, number>;
  etiquetas: string[];
  movimientosPorNivel: { nivel: number; nombre: string }[];
  otrosMovimientos: string[];
  evoluciones: Evolucion[];
  preEvolucion: string | null;
  // Proporcion de machos, de 0 a 1. -1 en los que no tienen genero.
  generoMacho: number | null;
  ciclosHuevo: number | null;
  amistadBase: number | null;
  expBase: number | null;
  apariciones: Aparicion[];
  descripcion: string;
  formas: Forma[];
};

// Donde aparece en el mundo, del spawn_pool_world del jar.
export type Aparicion = {
  rareza: string;
  nivel: string | null;
  peso: number | null;
  contexto: string | null;
  biomas: string[];
  luzMinima: number | null;
  luzMaxima: number | null;
  momento: string | null;
  clima: string | null;
};

export const POKEMON = datos as Pokemon[];

export const TIPOS = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
] as const;

export const NOMBRE_TIPO: Record<string, string> = {
  normal: "Normal", fire: "Fuego", water: "Agua", electric: "Eléctrico",
  grass: "Planta", ice: "Hielo", fighting: "Lucha", poison: "Veneno",
  ground: "Tierra", flying: "Volador", psychic: "Psíquico", bug: "Bicho",
  rock: "Roca", ghost: "Fantasma", dragon: "Dragón", dark: "Siniestro",
  steel: "Acero", fairy: "Hada",
};

// Los 15 grupos huevo y los 6 ritmos de crecimiento que existen en el roster,
// verificados contra los datos. El jar los trae en ingles y sin espacios.
export const NOMBRE_GRUPO_HUEVO: Record<string, string> = {
  amorphous: "Amorfo",
  bug: "Bicho",
  ditto: "Ditto",
  dragon: "Dragón",
  fairy: "Hada",
  field: "Campo",
  flying: "Volador",
  grass: "Planta",
  human_like: "Humanoide",
  mineral: "Mineral",
  monster: "Monstruo",
  undiscovered: "Desconocido",
  water_1: "Agua 1",
  water_2: "Agua 2",
  water_3: "Agua 3",
};

export const NOMBRE_CRECIMIENTO: Record<string, string> = {
  erratic: "Errático",
  fast: "Rápido",
  fluctuating: "Fluctuante",
  medium_fast: "Medio rápido",
  medium_slow: "Medio lento",
  slow: "Lento",
};

export const NOMBRE_STAT: Record<string, string> = {
  hp: "PS",
  attack: "Ataque",
  defence: "Defensa",
  special_attack: "At. Esp.",
  special_defence: "Def. Esp.",
  speed: "Velocidad",
};

// El maximo de una stat base entre los 366 del roster. Sirve para que las
// barras se midan contra lo que existe en el servidor y no contra un 255
// teorico que nadie alcanza.
export const STAT_MAXIMA = Math.max(
  ...POKEMON.flatMap((p) => Object.values(p.stats))
);

// Lo unico que la rejilla necesita de cada Pokemon. Mandar la ficha entera al
// cliente cuesta 1 MB, y el 79% son listas de movimientos que la rejilla no
// muestra: solo se leen al abrir una ficha, que ya se renderiza en el servidor.
export type PokemonEnRejilla = {
  dex: number;
  nombre: string;
  slug: string;
  assets: string;
  tipos: string[];
  stats: Stats;
  total: number;
  generacion: number;
  formas: number;
};

export function paraRejilla(p: Pokemon): PokemonEnRejilla {
  return {
    dex: p.dex,
    nombre: p.nombre,
    slug: p.slug,
    assets: p.assets,
    tipos: p.tipos,
    stats: p.stats,
    total: total(p),
    generacion: generacionDe(p),
    formas: p.formas.length,
  };
}

// La generación sale de la etiqueta del jar. "gen8a" es Hisui, que sigue
// siendo octava. Hace falta leerlas todas porque el roster ya no es solo de
// las tres primeras: Ursaluna es de octava y está porque Ursaring evoluciona.
export function generacionDe(p: Pokemon): number {
  for (const etiqueta of p.etiquetas) {
    const encontrado = /^gen(\d+)/.exec(etiqueta);
    if (encontrado) return Number(encontrado[1]);
  }
  return 0;
}

export function total(p: Pokemon): number {
  return Object.values(p.stats).reduce((a, b) => a + b, 0);
}

export function porSlug(slug: string): Pokemon | undefined {
  return POKEMON.find((p) => p.slug === slug);
}

// Los nombres de habilidades y movimientos vienen en minuscula pegada
// ("solarbeam", "chlorophyll"). No hay traduccion en el jar, asi que al menos
// se muestran legibles.
export function legible(clave: string): string {
  return clave
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

// Los retratos se bajan con `npm run retratos`. Como public/cobblemon no esta
// versionado, en un clon limpio la carpeta arranca vacia y la ficha muestra la
// placa con el numero de Pokedex en vez de una imagen rota.
export const RETRATOS_LISTOS = true;

// De donde sale cada movimiento que no se aprende subiendo de nivel. El jar los
// trae con prefijo ("tm:surf", "egg:wish") y sin traducir.
const FUENTES: { clave: string; titulo: string }[] = [
  { clave: "tm", titulo: "Máquinas técnicas" },
  { clave: "tutor", titulo: "Tutor" },
  { clave: "egg", titulo: "Huevo" },
  { clave: "special", titulo: "Especiales" },
  { clave: "legacy", titulo: "De ediciones viejas" },
];

export function agruparOtrosMovimientos(lista: string[]) {
  const porFuente = new Map<string, string[]>();
  for (const entrada of lista) {
    const corte = entrada.indexOf(":");
    const clave = corte === -1 ? "otros" : entrada.slice(0, corte);
    const nombre = corte === -1 ? entrada : entrada.slice(corte + 1);
    const actual = porFuente.get(clave);
    if (actual) actual.push(nombre);
    else porFuente.set(clave, [nombre]);
  }

  const orden = [...FUENTES, { clave: "otros", titulo: "Otros" }];
  return orden
    .filter((f) => porFuente.has(f.clave))
    .map((f) => ({
      clave: f.clave,
      titulo: f.titulo,
      movimientos: porFuente
        .get(f.clave)!
        .map(legible)
        .sort((a, b) => a.localeCompare(b, "es")),
    }));
}

// 23 Pokemon del roster (Metapod, Gastly, Gengar y companiia) traen la misma
// habilidad dos veces: como normal y como oculta. Se muestra una sola vez, y si
// aparece como normal deja de estar marcada como oculta, porque marcarla seria
// enganioso: se puede tener sin buscarla.
export function habilidadesUnicas(p: Pokemon): Habilidad[] {
  const porNombre = new Map<string, Habilidad>();
  for (const h of p.habilidades) {
    const previa = porNombre.get(h.nombre);
    if (!previa) porNombre.set(h.nombre, { ...h });
    else if (!h.oculta) previa.oculta = false;
  }
  return [...porNombre.values()];
}

// Un Pokemon puede listar la misma evolucion varias veces, una por cada
// condicion de bioma o de region. Para la ficha alcanza con el destino.
export function destinosDeEvolucion(p: Pokemon): string[] {
  const vistos = new Set<string>();
  for (const e of p.evoluciones) {
    if (e.a) vistos.add(legible(e.a));
  }
  return [...vistos];
}

export const ORDEN_STATS = [
  "hp",
  "attack",
  "defence",
  "special_attack",
  "special_defence",
  "speed",
] as const;

export function suma(stats: Stats): number {
  return Object.values(stats).reduce((a, b) => a + b, 0);
}

// Los limites del juego, no de una regla nuestra: Cobblemon usa IVs y EVs como
// los juegos principales. El propio jar los nombra en su idioma
// (cobblemon.ui.stats.ivs y .evs).
export const IV_MAXIMO = 31;
export const EV_MAXIMO_POR_STAT = 252;
export const EV_TOTAL_MAXIMO = 510;
export const NIVEL_MAXIMO = 100;
export const NIVEL_COMPETITIVO = 50;

// Tres letras por tipo para la rejilla de defensas y la de cobertura, donde no
// entra "Eléctrico" completo. Salen del nombre en español, no del inglés.
export const ABREV_TIPO: Record<string, string> = {
  normal: "NOR", fire: "FUE", water: "AGU", electric: "ELE",
  grass: "PLA", ice: "HIE", fighting: "LUC", poison: "VEN",
  ground: "TIE", flying: "VOL", psychic: "PSI", bug: "BIC",
  rock: "ROC", ghost: "FAN", dragon: "DRA", dark: "SIN",
  steel: "ACE", fairy: "HAD",
};

// Version corta de los nombres de stat, para las lineas donde "At. Esp." parte
// el renglon (el EV que da, las comparaciones del Battle Bot).
export const ABREV_STAT: Record<string, string> = {
  hp: "PS",
  attack: "Atq",
  defence: "Def",
  special_attack: "AtEsp",
  special_defence: "DefEsp",
  speed: "Vel",
};
