// Los objetos que el motor aplica, en un solo lugar para la calculadora y para
// el simulador. Antes cada uno tenia su lista y se desfasaban: la interfaz
// anunciaba efectos que el simulador no aplicaba.
//
// Las claves son las del jar de Cobblemon. Solo entra lo que el motor puede
// aplicar de verdad: sin estados, criticos, contacto ni prioridad, un objeto
// como el Casco Dentado o la Garra Rapida se queda afuera en vez de anunciarse
// y no hacer nada.

/** Refuerzan un tipo ×1.2. El Carbon no esta: en Cobblemon no existe como objeto propio. */
export const POTENCIADORES_DE_TIPO: Record<string, string> = {
  mysticwater: "water",
  miracleseed: "grass",
  magnet: "electric",
  nevermeltice: "ice",
  blackbelt: "fighting",
  poisonbarb: "poison",
  softsand: "ground",
  sharpbeak: "flying",
  twistedspoon: "psychic",
  silverpowder: "bug",
  hardstone: "rock",
  spelltag: "ghost",
  dragonfang: "dragon",
  blackglasses: "dark",
  metalcoat: "steel",
  silkscarf: "normal",
  fairyfeather: "fairy",
};

/** Una sola vez: el primer golpe de ese tipo pega ×1.3 y la gema se gasta. */
export const GEMAS: Record<string, string> = {
  normalgem: "normal",
  firegem: "fire",
  watergem: "water",
  grassgem: "grass",
  electricgem: "electric",
  icegem: "ice",
  fightinggem: "fighting",
  poisongem: "poison",
  groundgem: "ground",
  flyinggem: "flying",
  psychicgem: "psychic",
  buggem: "bug",
  rockgem: "rock",
  ghostgem: "ghost",
  dragongem: "dragon",
  darkgem: "dark",
  steelgem: "steel",
  fairygem: "fairy",
};

/** Una sola vez: parten a la mitad un golpe súper efectivo de ese tipo. La Baya Chilan, cualquier golpe Normal. */
export const BAYAS_DE_RESISTENCIA: Record<string, string> = {
  occaberry: "fire",
  passhoberry: "water",
  wacanberry: "electric",
  rindoberry: "grass",
  yacheberry: "ice",
  chopleberry: "fighting",
  kebiaberry: "poison",
  shucaberry: "ground",
  cobaberry: "flying",
  payapaberry: "psychic",
  tangaberry: "bug",
  chartiberry: "rock",
  kasibberry: "ghost",
  habanberry: "dragon",
  colburberry: "dark",
  babiriberry: "steel",
  roseliberry: "fairy",
  chilanberry: "normal",
};

type Categoria = "physical" | "special" | string;

/** Lo que cambia las stats antes del calculo. */
export function factoresDeStats(objeto: string, puedeEvolucionar: boolean) {
  return {
    ataque: objeto === "choiceband" ? 1.5 : 1,
    ataqueEspecial: objeto === "choicespecs" ? 1.5 : 1,
    defensa: objeto === "eviolite" && puedeEvolucionar ? 1.5 : 1,
    defensaEspecial:
      (objeto === "assaultvest" ? 1.5 : 1) * (objeto === "eviolite" && puedeEvolucionar ? 1.5 : 1),
    velocidad: objeto === "choicescarf" ? 1.5 : 1,
  };
}

/**
 * El factor del atacante sobre el daño final, sin contar los que se gastan
 * (gemas), que el simulador lleva aparte. `usarGema` los suma para la
 * calculadora, que muestra un solo golpe.
 */
export function factorDeDano(
  objeto: string,
  tipo: string,
  categoria: Categoria,
  efectividad: number,
  usarGema = false
): number {
  let factor = 1;
  if (objeto === "lifeorb") factor *= 1.3;
  if (objeto === "expertbelt" && efectividad > 1) factor *= 1.2;
  if (objeto === "muscleband" && categoria === "physical") factor *= 1.1;
  if (objeto === "wiseglasses" && categoria === "special") factor *= 1.1;
  if (POTENCIADORES_DE_TIPO[objeto] === tipo) factor *= 1.2;
  if (usarGema && GEMAS[objeto] === tipo) factor *= 1.3;
  return factor;
}

/** Si la baya del defensor parte este golpe a la mitad. */
export function bayaResiste(objeto: string, tipo: string, efectividad: number): boolean {
  const resiste = BAYAS_DE_RESISTENCIA[objeto];
  if (!resiste || resiste !== tipo) return false;
  return tipo === "normal" || efectividad > 1;
}

/** El Globo Helio da inmunidad a Tierra hasta que lo golpean. */
export const globoProtege = (objeto: string, tipo: string) => objeto === "airballoon" && tipo === "ground";

/** Lo que el editor y los paneles muestran como efecto. Tiene que coincidir con lo que aplica el motor. */
export function describirEfecto(objeto: string): string | null {
  const fijos: Record<string, string> = {
    lifeorb: "Sube el daño un 30 %, a cambio de 1/10 de la vida por golpe",
    choiceband: "Ataque ×1.5",
    choicespecs: "Ataque Especial ×1.5",
    choicescarf: "Velocidad ×1.5",
    assaultvest: "Defensa Especial ×1.5",
    eviolite: "Defensa y Defensa Especial ×1.5 si todavía puede evolucionar",
    expertbelt: "×1.2 cuando el golpe es súper efectivo",
    muscleband: "Sube el daño físico un 10 %",
    wiseglasses: "Sube el daño especial un 10 %",
    leftovers: "Recupera 1/16 de la vida por turno",
    blacksludge: "Tipo Veneno: recupera 1/16 por turno. Otro tipo: pierde 1/8",
    shellbell: "Recupera 1/8 del daño que hace",
    sitrusberry: "Una vez, recupera 1/4 de la vida al bajar a la mitad",
    focussash: "Aguanta con 1 PS un golpe que lo tumbaría desde la vida llena",
    airballoon: "Inmune a Tierra hasta que lo golpean",
    weaknesspolicy: "Una vez, Ataque y Ataque Especial ×2 al recibir un golpe súper efectivo",
  };
  if (fijos[objeto]) return fijos[objeto];
  if (POTENCIADORES_DE_TIPO[objeto]) return "Sube un 20 % el daño de los movimientos de su tipo";
  if (GEMAS[objeto]) return "Una vez, sube un 30 % el primer golpe de su tipo";
  if (BAYAS_DE_RESISTENCIA[objeto]) {
    return objeto === "chilanberry"
      ? "Una vez, parte a la mitad un golpe de tipo Normal"
      : "Una vez, parte a la mitad un golpe súper efectivo de su tipo";
  }
  return null;
}

/** El tipo de un objeto que va atado a uno: potenciador, gema o baya de resistencia. */
export const tipoDelObjeto = (objeto: string): string | null =>
  POTENCIADORES_DE_TIPO[objeto] ?? GEMAS[objeto] ?? BAYAS_DE_RESISTENCIA[objeto] ?? null;

// Cómo se agrupan en el selector: primero los de uso general, por para qué
// sirven, y después las tres familias de un tipo cada una.
export const CATEGORIAS_DE_OBJETO: { nombre: string; claves: string[] }[] = [
  { nombre: "Elección", claves: ["choiceband", "choicespecs", "choicescarf"] },
  { nombre: "Más daño", claves: ["lifeorb", "expertbelt", "muscleband", "wiseglasses", "weaknesspolicy"] },
  { nombre: "Aguante", claves: ["assaultvest", "eviolite", "focussash", "airballoon"] },
  { nombre: "Recuperación", claves: ["leftovers", "blacksludge", "shellbell", "sitrusberry"] },
  { nombre: "Potencian un tipo", claves: Object.keys(POTENCIADORES_DE_TIPO) },
  { nombre: "Gemas", claves: Object.keys(GEMAS) },
  { nombre: "Bayas que resisten", claves: Object.keys(BAYAS_DE_RESISTENCIA) },
];
