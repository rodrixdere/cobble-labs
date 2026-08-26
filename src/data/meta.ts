// Datos competitivos que NO salen del jar.
//
// El jar tiene stats, tipos, habilidades y movimientos, pero no tiene tier ni
// porcentaje de uso: eso depende de lo que la gente juega en el servidor, y el
// servidor no lo publica. Lo unico cargado aca es lo que Rodri paso a mano.
//
// La regla de la casa: si un Pokemon no esta en esta tabla, la ficha no muestra
// modulo de meta. Nunca se rellena con un tier inventado.
export type Meta = {
  tier: string;
  uso: number;
  builds: { nombre: string; forma: "base" | "mega" }[];
};

export const META: Record<string, Meta> = {
  venusaur: {
    tier: "S",
    uso: 10.5,
    builds: [
      { nombre: "Sun Sweeper", forma: "base" },
      { nombre: "Bulky Support", forma: "base" },
      { nombre: "Trick Room Attacker", forma: "base" },
      { nombre: "Sleep Lead", forma: "base" },
      { nombre: "Mega Thick Fat", forma: "mega" },
      { nombre: "Mega Sun Tank", forma: "mega" },
    ],
  },
};

export function metaDe(slug: string): Meta | null {
  return META[slug] ?? null;
}

export const POKEMON_CON_META = Object.keys(META).length;
