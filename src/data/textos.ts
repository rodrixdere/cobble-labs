import textos from "@/data/textos.json";

type Entrada = { nombre: string; desc: string };

// Nombres y descripciones en espaniol, sacados del idioma es_es del propio jar
// de Cobblemon: es literalmente lo que lee el jugador dentro del juego, no una
// traduccion nuestra. Las claves son las del mod ("dragonclaw", "solarpower").
//
// Este diccionario pesa 120 KB y se usa solo en el servidor. Ninguna pantalla
// lo manda entero al cliente: la ficha se renderiza en el servidor y los
// componentes de cliente reciben ya resueltos los pocos textos que muestran.
const MOVIMIENTOS = textos.movimientos as Record<string, Entrada>;
const HABILIDADES = textos.habilidades as Record<string, Entrada>;

// Cuando el jar no trae el texto, al menos se muestra la clave legible en vez
// de un hueco: "dragonclaw" -> "Dragonclaw".
function respaldo(clave: string): string {
  return clave.replace(/[_:]/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export function movimiento(clave: string): Entrada {
  return MOVIMIENTOS[clave] ?? { nombre: respaldo(clave), desc: "" };
}

export function habilidad(clave: string): Entrada {
  return HABILIDADES[clave] ?? { nombre: respaldo(clave), desc: "" };
}

export const TOTAL_MOVIMIENTOS = Object.keys(MOVIMIENTOS).length;

// Ficha tecnica de Showdown: tipo, categoria, potencia, precision y PP. Es el
// mismo motor que resuelve los combates del servidor.
export type CambioDeStats = Partial<
  Record<"atk" | "def" | "spa" | "spd" | "spe" | "accuracy" | "evasion", number>
>;

export type FichaMovimiento = {
  tipo: string;
  categoria: "physical" | "special" | "status";
  potencia: number;
  precision: number | null;
  pp: number;
  prioridad: number;
  // A quien apunta. Es lo que separa un movimiento de uno contra los dos
  // rivales, y lo que hace falta para dobles.
  objetivo: string;
  protegible: boolean;
  contacto: boolean;
  sonido: boolean;
  estado: string | null;
  volatil: string | null;
  cambiosPropios: CambioDeStats | null;
  secundario: {
    probabilidad: number;
    estado: string | null;
    cambios: CambioDeStats | null;
    volatil: string | null;
  } | null;
  cambiosAlUsar: CambioDeStats | null;
  drenaje: number[] | null;
  retroceso: number[] | null;
  multiGolpe: number | number[] | null;
  efectoDeLado: string | null;
  efectoDeCampo: string | null;
  clima: string | null;
  terreno: string | null;
  curacion: number[] | null;
};

const FICHAS = textos.fichas as unknown as Record<string, FichaMovimiento>;

export function fichaMovimiento(clave: string): FichaMovimiento | null {
  return FICHAS[clave] ?? null;
}

export const NOMBRE_CATEGORIA: Record<string, string> = {
  physical: "Físico",
  special: "Especial",
  status: "Estado",
};
