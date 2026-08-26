import objetos from "@/data/objetos.json";
import {
  NOMBRE_TIPO,
  type Aparicion,
  type Evolucion,
  type Pokemon,
} from "@/data/pokemon";

// Traducción de lo que el jar guarda en clave técnica: biomas, rarezas,
// contextos de aparición y requisitos de evolución. Los nombres son nuestros;
// los datos, del juego.

export const NOMBRE_RAREZA: Record<string, string> = {
  common: "Común",
  uncommon: "Poco común",
  rare: "Raro",
  "ultra-rare": "Muy raro",
};

export const ORDEN_RAREZA = ["common", "uncommon", "rare", "ultra-rare"];

export const NOMBRE_CONTEXTO: Record<string, string> = {
  grounded: "En tierra",
  submerged: "Bajo el agua",
  surface: "En la superficie del agua",
  seafloor: "En el fondo del mar",
  fishing: "Pescando",
};

// Los tags de bioma vienen como "#cobblemon:is_jungle". Se traducen los que
// aparecen de verdad en el roster; el resto cae al nombre limpio.
const BIOMAS: Record<string, string> = {
  // Estos tres no son biomas sino dimensiones enteras: quiere decir que sale
  // en cualquier bioma de ahí.
  is_overworld: "Cualquier bioma del Overworld",
  is_nether: "Cualquier bioma del Nether",
  is_end: "Cualquier bioma del End",
  is_jungle: "Jungla",
  is_tropical_island: "Isla tropical",
  is_forest: "Bosque",
  is_taiga: "Taiga",
  is_plains: "Llanura",
  is_grassland: "Pradera",
  is_desert: "Desierto",
  is_arid: "Árido",
  is_badlands: "Meseta",
  is_savanna: "Sabana",
  is_swamp: "Pantano",
  is_mushroom: "Isla champiñón",
  is_beach: "Playa",
  is_coast: "Costa",
  is_ocean: "Océano",
  is_deep_ocean: "Océano profundo",
  is_cold_ocean: "Océano frío",
  is_frozen_ocean: "Océano helado",
  is_warm_ocean: "Océano cálido",
  is_freshwater: "Agua dulce",
  is_river: "Río",
  is_cold: "Frío",
  is_freezing: "Helado",
  is_glacial: "Glaciar",
  is_snowy: "Nevado",
  is_highlands: "Tierras altas",
  is_hills: "Colinas",
  is_mountain: "Montaña",
  is_peak: "Pico",
  is_cave: "Cueva",
  is_underground: "Subsuelo",
  is_deep_dark: "Deep Dark",
  is_dripstone: "Cueva de goteo",
  is_lush: "Cueva frondosa",
  is_floral: "Floral",
  is_cherry_blossom: "Cerezos",
  is_bamboo: "Bambú",
  is_island: "Isla",
  is_magical: "Mágico",
  is_spooky: "Tenebroso",
  is_volcanic: "Volcánico",
  is_sky: "Cielo",
  is_temperate: "Templado",
  is_water: "Agua",
};

export function nombreDeBioma(tag: string): string {
  const limpio = tag.replace(/^#/, "").replace(/^[a-z_]+:/, "");
  const traducido = BIOMAS[limpio];
  if (traducido) return traducido;

  // "has_block/mud" o un bioma de otro mod: se muestra legible.
  return limpio
    .replace(/^is_/, "")
    .replace(/^has_block\//, "Con ")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

export function biomasDe(aparicion: Aparicion): string[] {
  return [...new Set(aparicion.biomas.map(nombreDeBioma))];
}

// Un resumen por rareza: en qué biomas aparece y con qué niveles, sin repetir
// la misma entrada quince veces.
export type LugarDeAparicion = {
  rareza: string;
  nivel: string | null;
  contexto: string | null;
  biomas: string[];
  soloDeNoche: boolean;
};

export function lugaresDe(p: Pokemon): LugarDeAparicion[] {
  const vistos = new Map<string, LugarDeAparicion>();

  for (const a of p.apariciones) {
    const biomas = biomasDe(a);
    if (biomas.length === 0) continue;

    // La luz del cielo baja marca la noche o el interior de una cueva.
    const soloDeNoche = a.luzMaxima !== null && a.luzMaxima < 8;
    const clave = `${a.rareza}|${a.nivel}|${a.contexto}|${soloDeNoche}|${biomas.join(",")}`;

    if (!vistos.has(clave)) {
      vistos.set(clave, {
        rareza: a.rareza,
        nivel: a.nivel,
        contexto: a.contexto,
        biomas,
        soloDeNoche,
      });
    }
  }

  return [...vistos.values()].toSorted(
    (a, b) => ORDEN_RAREZA.indexOf(a.rareza) - ORDEN_RAREZA.indexOf(b.rareza)
  );
}

// --- Evoluciones -------------------------------------------------------------

const NOMBRE_VARIANTE: Record<string, string> = {
  level_up: "Subiendo de nivel",
  item_interact: "Usando un objeto",
  trade: "Intercambiándolo",
};

// Las piedras evolutivas y los objetos que se llevan están en el catálogo del
// jar con su nombre en español: "cobblemon:thunder_stone" -> "Piedra Trueno".
const NOMBRE_OBJETO = new Map(
  (objetos as { clave: string; nombre: string }[]).map((o) => [o.clave, o.nombre])
);

function nombreDeObjeto(clave: string): string {
  const limpio = clave.replace(/^[a-z]+:/, "");
  const enEspanol = NOMBRE_OBJETO.get(limpio.replace(/_/g, ""));
  if (enEspanol) return enEspanol;

  return limpio.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

// Los movimientos de la condición vienen con la clave del mod.
function nombreDeMovimiento(clave: string): string {
  return clave.replace(/^[a-z]+:/, "").replace(/^./, (c) => c.toUpperCase());
}

type Requisito = { variant?: string; [clave: string]: unknown };

function textoDeRequisito(r: Requisito): string | null {
  switch (r.variant) {
    case "level":
      return `a partir del nivel ${r.minLevel ?? "?"}`;
    case "friendship":
      return `con ${r.amount ?? "mucha"} de amistad`;
    case "biome": {
      const biomas = Array.isArray(r.biomas) ? (r.biomas as string[]) : [];
      if (biomas.length === 0) return "en ciertos biomas";
      return `en ${[...new Set(biomas.map(nombreDeBioma))].join(" o ")}`;
    }
    case "time_range":
      return `de ${String(r.range ?? "día").replace("night", "noche").replace("day", "día")}`;
    case "held_item":
      return `llevando ${nombreDeObjeto(String(r.itemCondition ?? ""))}`;
    case "use_move":
    case "has_move":
      return `sabiendo ${nombreDeMovimiento(String(r.move ?? ""))}`;
    case "has_move_type": {
      const tipo = String(r.type ?? "").toLowerCase();
      return `sabiendo un movimiento de tipo ${NOMBRE_TIPO[tipo] ?? tipo}`;
    }
    case "moon_phase":
      return "en cierta fase lunar";
    case "stat_compare":
    case "stat_equal":
      return "según cómo queden sus stats";
    case "properties":
      return "con cierta forma";
    default:
      return null;
  }
}

// Los aspectos con los que el jar nombra a las formas regionales.
const NOMBRE_ASPECTO: Record<string, string> = {
  alolan: "de Alola",
  galarian: "de Galar",
  hisuian: "de Hisui",
  paldean: "de Paldea",
};

export type EvolucionLegible = {
  a: string;
  slug: string;
  // Desde qué forma se evoluciona: null si es desde la base.
  desde: string | null;
  como: string;
  detalles: string[];
};

function aLegible(e: Evolucion, desde: string | null): EvolucionLegible | null {
  if (!e.a) return null;

  const detalles: string[] = [];
  if (e.contexto && e.variante === "item_interact") {
    detalles.push(`con ${nombreDeObjeto(e.contexto)}`);
  }
  for (const r of e.requisitos ?? []) {
    const texto = textoDeRequisito(r as Requisito);
    if (texto) detalles.push(texto);
  }

  const aspecto = e.aspecto ? NOMBRE_ASPECTO[e.aspecto] : null;
  const nombre = e.a.replace(/^./, (c) => c.toUpperCase());

  return {
    a: aspecto ? `${nombre} ${aspecto}` : nombre,
    slug: e.a,
    desde,
    como: NOMBRE_VARIANTE[e.variante ?? ""] ?? "De alguna forma",
    detalles,
  };
}

export function evolucionesDe(p: Pokemon): EvolucionLegible[] {
  const salida: EvolucionLegible[] = [];

  for (const e of p.evoluciones) {
    const legible = aLegible(e, null);
    if (legible) salida.push(legible);
  }

  // Y las de cada forma regional, que llevan a otra cosa.
  for (const forma of p.formas) {
    for (const e of forma.evoluciones ?? []) {
      const legible = aLegible(e, forma.etiqueta);
      if (legible) salida.push(legible);
    }
  }

  return salida;
}

// El género se guarda como proporción de machos. -1 es "sin género".
export function textoDeGenero(maleRatio: number | null): string {
  if (maleRatio === null || maleRatio < 0) return "Sin género";
  if (maleRatio === 1) return "Solo machos";
  if (maleRatio === 0) return "Solo hembras";
  const machos = Math.round(maleRatio * 1000) / 10;
  return `${machos} % machos · ${Math.round((100 - machos) * 10) / 10} % hembras`;
}

// Los ciclos de huevo son pasos: cada ciclo son 128 pasos en Cobblemon.
export function textoDeCiclos(ciclos: number | null): string {
  if (ciclos === null) return "-";
  return `${ciclos} ciclos`;
}
