import { indexarPor, presente } from "@/lib/coleccion";
import { statANivel } from "@/engine/calculo-dano";
import { defensaContra } from "@/engine/tabla-tipos";
import {
  conjuntoPorDefecto,
  type Miembro,
  type MovimientoCatalogo,
  type PokemonCombate,
} from "@/team/combate";

// Quien del roster le pega fuerte a medio equipo y ademas llega primero. Se
// mide con los tipos de sus movimientos y la velocidad a nivel 50: dos datos del
// jar, no una opinion sobre quien es peligroso.

export type Amenaza = {
  slug: string;
  nombre: string;
  golpeaA: number;
  masRapidoQue: number;
  nivel: "alta" | "media";
  motivos: string[];
};

export function amenazasContra(
  equipo: Miembro[],
  roster: PokemonCombate[],
  catalogo: MovimientoCatalogo[],
  cuantas = 6
): Amenaza[] {
  if (equipo.length === 0) return [];

  const velocidades = equipo.map((m) => statANivel(m.stats.speed, false));
  const porClave = indexarPor(catalogo, (m) => m.clave);

  // Con menos de la mitad del equipo hay demasiados candidatos y la lista deja
  // de decir nada.
  const minimo = Math.ceil(equipo.length / 2);

  return roster
    .map((p) => {
      const tiposDeAtaque = new Set(
        conjuntoPorDefecto(p, catalogo)
          .movimientos.map((clave) => porClave.get(clave))
          .filter(presente)
          .filter((m) => m.potencia > 0)
          .map((m) => m.tipo)
      );

      const golpeaA = equipo.filter((m) =>
        [...tiposDeAtaque].some((t) => defensaContra(m.tipos, t) >= 2)
      ).length;

      const suya = statANivel(p.stats.speed, false);

      return {
        pokemon: p,
        golpeaA,
        masRapidoQue: velocidades.filter((v) => v < suya).length,
      };
    })
    .filter((c) => c.golpeaA >= minimo)
    .map(({ pokemon, golpeaA, masRapidoQue }) => {
      const motivos = [`Pega súper efectivo a ${golpeaA} de ${equipo.length}`];
      if (masRapidoQue > 0) {
        motivos.push(`Es más rápido que ${masRapidoQue} de ${equipo.length}`);
      }

      // "Alta" es el que golpea y ademas llega primero: no te deja responder.
      const casiTodos = equipo.length - 1;

      return {
        slug: pokemon.slug,
        nombre: pokemon.nombre,
        golpeaA,
        masRapidoQue,
        nivel:
          golpeaA >= casiTodos && masRapidoQue >= casiTodos
            ? ("alta" as const)
            : ("media" as const),
        motivos,
      };
    })
    .toSorted(
      (a, b) =>
        b.golpeaA - a.golpeaA ||
        b.masRapidoQue - a.masRapidoQue ||
        a.nombre.localeCompare(b.nombre, "es")
    )
    .slice(0, cuantas);
}
