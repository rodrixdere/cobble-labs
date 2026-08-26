import { TIPOS } from "@/data/pokemon";

type Tipo = (typeof TIPOS)[number];

// Tabla de efectividad de gen 6 en adelante, que es la que implementa
// Cobblemon. Se guarda por tipo atacante y solo lo que no es neutral: todo lo
// que no figura vale 1x.
const ATAQUE: Record<string, { doble?: string[]; mitad?: string[]; nulo?: string[] }> = {
  normal: { mitad: ["rock", "steel"], nulo: ["ghost"] },
  fire: { doble: ["grass", "ice", "bug", "steel"], mitad: ["fire", "water", "rock", "dragon"] },
  water: { doble: ["fire", "ground", "rock"], mitad: ["water", "grass", "dragon"] },
  electric: { doble: ["water", "flying"], mitad: ["electric", "grass", "dragon"], nulo: ["ground"] },
  grass: {
    doble: ["water", "ground", "rock"],
    mitad: ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"],
  },
  ice: { doble: ["grass", "ground", "flying", "dragon"], mitad: ["fire", "water", "ice", "steel"] },
  fighting: {
    doble: ["normal", "ice", "rock", "dark", "steel"],
    mitad: ["poison", "flying", "psychic", "bug", "fairy"],
    nulo: ["ghost"],
  },
  poison: { doble: ["grass", "fairy"], mitad: ["poison", "ground", "rock", "ghost"], nulo: ["steel"] },
  ground: {
    doble: ["fire", "electric", "poison", "rock", "steel"],
    mitad: ["grass", "bug"],
    nulo: ["flying"],
  },
  flying: { doble: ["grass", "fighting", "bug"], mitad: ["electric", "rock", "steel"] },
  psychic: { doble: ["fighting", "poison"], mitad: ["psychic", "steel"], nulo: ["dark"] },
  bug: {
    doble: ["grass", "psychic", "dark"],
    mitad: ["fire", "fighting", "poison", "flying", "ghost", "steel", "fairy"],
  },
  rock: { doble: ["fire", "ice", "flying", "bug"], mitad: ["fighting", "ground", "steel"] },
  ghost: { doble: ["psychic", "ghost"], mitad: ["dark"], nulo: ["normal"] },
  dragon: { doble: ["dragon"], mitad: ["steel"], nulo: ["fairy"] },
  dark: { doble: ["psychic", "ghost"], mitad: ["fighting", "dark", "fairy"] },
  steel: { doble: ["ice", "rock", "fairy"], mitad: ["fire", "water", "electric", "steel"] },
  fairy: { doble: ["fighting", "dragon", "dark"], mitad: ["fire", "poison", "steel"] },
};

export function multiplicador(atacante: string, defensor: string): number {
  const fila = ATAQUE[atacante];
  if (!fila) return 1;
  if (fila.nulo?.includes(defensor)) return 0;
  if (fila.doble?.includes(defensor)) return 2;
  if (fila.mitad?.includes(defensor)) return 0.5;
  return 1;
}

// Lo que recibe un Pokemon de cada tipo de ataque, multiplicando sus uno o dos
// tipos. Un Skarmory (acero, volador) recibe 4x de electrico y 0x de tierra.
export function defensaContra(tipos: string[], atacante: string): number {
  return tipos.reduce((acc, t) => acc * multiplicador(atacante, t), 1);
}

export function etiquetaMultiplicador(x: number): string {
  if (x === 0) return "0";
  if (x === 0.25) return "¼";
  if (x === 0.5) return "½";
  if (x === 1) return "1";
  return `${x}`;
}

export const TODOS_LOS_TIPOS = TIPOS;
export type { Tipo };

// Los 18 multiplicadores que recibe un Pokemon, en el orden de la tabla. Es lo
// que alimenta la rejilla de defensas de la ficha y el analisis del equipo.
export function defensasDe(tipos: string[]) {
  return TIPOS.map((t) => ({ tipo: t, x: defensaContra(tipos, t) }));
}

// El mejor multiplicador que consigue un conjunto de tipos de ataque contra un
// defensor. Con esto se arma la cobertura ofensiva: no importa cuantos
// movimientos de fuego tenga, importa si alguno pega x2.
export function mejorAtaqueContra(
  tiposDeAtaque: string[],
  defensor: string[]
): number {
  let mejor = 0;
  for (const a of tiposDeAtaque) {
    const x = defensor.reduce((acc, d) => acc * multiplicador(a, d), 1);
    if (x > mejor) mejor = x;
  }
  return mejor;
}

// Contra un tipo suelto, que es como se muestra la cobertura por tipo.
export function mejorAtaqueContraTipo(
  tiposDeAtaque: string[],
  defensor: string
): number {
  return mejorAtaqueContra(tiposDeAtaque, [defensor]);
}
