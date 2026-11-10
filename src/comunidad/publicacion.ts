import { NOMBRE_CLIMA, NOMBRE_TERRENO } from "@/analysis/campo";
import { analizarEquipo } from "@/analysis/equipo";
import { presente } from "@/lib/coleccion";
import {
  armarMiembro,
  type MovimientoCatalogo,
  type PokemonCombate,
} from "@/team/combate";
import type { Conjunto } from "@/team/conjunto";
import { aCadena } from "@/team/formato";
import { MAXIMO_MIEMBROS, hayErrores, validarEquipo } from "@/team/validador";

// Lo que se publica de un equipo en la comunidad. Solo entran equipos completos
// y legales: el meta va a salir de aca, y uno a medio armar no dice nada.

/** Cuántos equipos puede tener publicados una persona a la vez. */
export const TOPE_EQUIPOS = 15;
/** Cuántas veces por día se puede publicar: borrar y republicar también cuenta. */
export const PUBLICACIONES_POR_DIA = 10;

const NOMBRE_MINIMO = 3;
const NOMBRE_MAXIMO = 40;

// Un nombre con un enlace es casi siempre publicidad.
const PARECE_ENLACE = /https?:\/\/|www\.|\.(com|net|org|gg|xyz)\b/i;

type Roster = Map<string, PokemonCombate>;

export type Publicacion = {
  nombre: string;
  /** El equipo entero, en el mismo formato que el enlace de compartir. */
  cadena: string;
  especies: string[];
  etiquetas: string[];
};

export function problemasParaPublicar(
  nombre: string,
  conjuntos: Conjunto[],
  porSlug: Roster,
  catalogo: MovimientoCatalogo[]
): string[] {
  const problemas: string[] = [];
  const limpio = nombre.trim();

  if (limpio.length < NOMBRE_MINIMO || limpio.length > NOMBRE_MAXIMO) {
    problemas.push(
      `El nombre tiene que tener entre ${NOMBRE_MINIMO} y ${NOMBRE_MAXIMO} caracteres.`
    );
  }
  if (PARECE_ENLACE.test(limpio)) {
    problemas.push("El nombre no puede llevar enlaces.");
  }
  if (conjuntos.length < MAXIMO_MIEMBROS) {
    problemas.push(
      `Solo se publican equipos completos: faltan ${MAXIMO_MIEMBROS - conjuntos.length}.`
    );
  }
  if (hayErrores(validarEquipo(conjuntos, porSlug, catalogo))) {
    problemas.push("El equipo tiene errores: corregilos en el armador antes de publicarlo.");
  }
  if (conjuntos.some((c) => c.movimientos.length === 0)) {
    problemas.push("Todos tienen que llevar al menos un movimiento.");
  }

  return problemas;
}

// Solo lo que se lee de los sets puestos: si nadie pone clima, no hay etiqueta
// de clima aunque la especie suela jugarlo.
export function etiquetasDe(
  conjuntos: Conjunto[],
  porSlug: Roster,
  catalogo: MovimientoCatalogo[]
): string[] {
  const miembros = conjuntos
    .map((c) => {
      const p = porSlug.get(c.slug);
      return p ? armarMiembro(p, c, catalogo) : null;
    })
    .filter(presente);

  const { campo, balance } = analizarEquipo(miembros);
  const etiquetas: string[] = [];

  if (campo.clima) etiquetas.push(NOMBRE_CLIMA[campo.clima] ?? campo.clima);
  if (campo.terreno) etiquetas.push(NOMBRE_TERRENO[campo.terreno] ?? campo.terreno);
  if (campo.espacioRaro.activo) etiquetas.push("Espacio Raro");
  if (campo.controlDeVelocidad.comos.includes("Viento Afín")) etiquetas.push("Viento Afín");
  if (balance.desbalanceado) {
    etiquetas.push(
      balance.fisicos > balance.especiales ? "Casi todo físico" : "Casi todo especial"
    );
  }
  if (conjuntos.some((c) => c.forma)) etiquetas.push("Mega");

  return etiquetas;
}

export function prepararPublicacion(
  nombre: string,
  conjuntos: Conjunto[],
  porSlug: Roster,
  catalogo: MovimientoCatalogo[]
): Publicacion {
  return {
    nombre: nombre.trim(),
    cadena: aCadena(conjuntos),
    especies: conjuntos.map((c) => c.slug),
    etiquetas: etiquetasDe(conjuntos, porSlug, catalogo),
  };
}
