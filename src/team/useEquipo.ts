"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { MovimientoCatalogo } from "@/team/combate";
import { conjuntoPorDefecto } from "@/team/combate";
import type { Conjunto } from "@/team/conjunto";
import { guardarActual, leerActual } from "@/team/almacen";
import { aCadena, desdeCadena } from "@/team/formato";
import { rehidratar, type IndicePokemon } from "@/team/roster";
import { MAXIMO_MIEMBROS } from "@/team/validador";

// El equipo que se esta armando, y las dos cosas que le pasan solas: queda
// guardado en el navegador y escrito en la direccion de la pagina.
//
// La direccion manda sobre lo guardado: quien abre un enlace compartido tiene
// que ver ESE equipo, aunque tenga otro a medio armar.

export type Equipo = {
  conjuntos: Conjunto[];
  /** Ya no entra nadie mas. */
  completo: boolean;
  /** Devuelve el motivo si no se pudo agregar, o null si entro. */
  agregar: (slug: string) => string | null;
  sumar: (conjunto: Conjunto) => void;
  quitar: (indice: number) => void;
  reemplazar: (indice: number, conjunto: Conjunto) => void;
  cargar: (conjuntos: Conjunto[]) => void;
  vaciar: () => void;
};

export function useEquipo(
  indice: IndicePokemon,
  catalogo: MovimientoCatalogo[]
): Equipo {
  const [conjuntos, setConjuntos] = useState<Conjunto[]>([]);

  // Hasta que no termine la primera lectura no se escribe nada, o el equipo
  // guardado se pisa con la lista vacia del primer render.
  const listo = useRef(false);

  // La lectura inicial pasa una sola vez en la vida de la pantalla, y por eso
  // el ref corta antes de mirar las dependencias. Sin ese corte se entra en un
  // bucle: escribir el equipo en la direccion vuelve a renderizar la pagina,
  // eso da un `indice` nuevo, y el efecto arranca de nuevo.
  //
  // Tampoco se llama a setConjuntos cuando no hay nada guardado: una lista
  // vacia nueva es un estado distinto para React y alcanza para dispararlo.
  useEffect(() => {
    if (listo.current) return;
    listo.current = true;

    const compartido = new URLSearchParams(window.location.search).get("e");
    const desdeUrl = compartido ? desdeCadena(compartido) : [];
    const inicial =
      desdeUrl.length > 0
        ? desdeUrl
        : rehidratar(leerActual(), indice, catalogo);

    if (inicial.length > 0) setConjuntos(inicial);
  }, [indice, catalogo]);

  useEffect(() => {
    if (!listo.current) return;
    guardarActual(conjuntos);

    const url = new URL(window.location.href);
    if (conjuntos.length > 0) url.searchParams.set("e", aCadena(conjuntos));
    else url.searchParams.delete("e");
    window.history.replaceState(null, "", url);
  }, [conjuntos]);

  const sumar = useCallback((conjunto: Conjunto) => {
    setConjuntos((previos) =>
      previos.length >= MAXIMO_MIEMBROS ? previos : [...previos, conjunto]
    );
  }, []);

  const agregar = useCallback(
    (slug: string) => {
      const p = indice.get(slug);
      if (!p) return "Ese Pokémon no está en el roster del servidor.";
      if (conjuntos.length >= MAXIMO_MIEMBROS) return "El equipo ya está completo.";
      if (conjuntos.some((c) => c.slug === slug))
        return "Ese Pokémon ya está en el equipo.";

      sumar(conjuntoPorDefecto(p, catalogo));
      return null;
    },
    [conjuntos, indice, catalogo, sumar]
  );

  const quitar = useCallback((i: number) => {
    setConjuntos((previos) => previos.filter((_, n) => n !== i));
  }, []);

  const reemplazar = useCallback((i: number, conjunto: Conjunto) => {
    setConjuntos((previos) => previos.map((c, n) => (n === i ? conjunto : c)));
  }, []);

  const vaciar = useCallback(() => setConjuntos([]), []);

  return {
    conjuntos,
    completo: conjuntos.length >= MAXIMO_MIEMBROS,
    agregar,
    sumar,
    quitar,
    reemplazar,
    cargar: setConjuntos,
    vaciar,
  };
}
