"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import Calculadora from "@/components/Calculadora";
import PruebaEquipo from "@/components/PruebaEquipo";
import ProbadorEquipos from "@/components/ProbadorEquipos";
import type { MovimientoCatalogo, PokemonCombate } from "@/team/combate";

export type { MovimientoCatalogo, PokemonCombate };

type Props = {
  roster: PokemonCombate[];
  catalogo: MovimientoCatalogo[];
};

const HERRAMIENTAS = [
  // El nombre dice lo que devuelve, un informe, para no pisarse con el
  // probador de equipos, que es la tercera y compara dos equipos entre si.
  {
    clave: "prueba",
    nombre: "Informe de mi equipo",
    bajada: "Cómo le va a tu equipo contra un pool de rivales",
  },
  {
    clave: "calculadora",
    nombre: "Calculadora de daño",
    bajada: "Un movimiento contra un objetivo, con el campo puesto",
  },
  {
    clave: "probador",
    nombre: "Probador de equipos",
    bajada: "Dos equipos cara a cara",
  },
] as const;

export default function BattleBot({ roster, catalogo }: Props) {
  const params = useSearchParams();
  const pedida = params.get("herramienta");
  const inicial = HERRAMIENTAS.some((h) => h.clave === pedida)
    ? (pedida as (typeof HERRAMIENTAS)[number]["clave"])
    : "prueba";

  const [herramienta, setHerramienta] =
    useState<(typeof HERRAMIENTAS)[number]["clave"]>(inicial);

  return (
    <div className="border-t border-linea">
      {/* Tres a lo ancho solo cuando hay lugar: en angosto los nombres no entran
          sin partirse palabra por palabra. */}
      <div className="grid gap-px bg-linea md:grid-cols-3">
        {HERRAMIENTAS.map((h) => (
          <button
            key={h.clave}
            type="button"
            aria-pressed={herramienta === h.clave}
            onClick={() => setHerramienta(h.clave)}
            // La elegida lleva la regla de 2px del acento, como la seccion activa
            // de la cabecera: el cambio de fondo solo no se ve en un telefono.
            className={`border-l-2 px-4 py-3.5 text-left transition-colors duration-150 md:border-l-0 md:border-t-2 md:px-6 md:py-4 ${
              herramienta === h.clave
                ? "border-l-acento bg-panel md:border-t-acento"
                : "border-l-transparent bg-fondo text-tinta-media hover:bg-panel hover:text-tinta md:border-t-transparent"
            }`}
          >
            <span
              className={`block font-display text-realce tracking-[-0.02em] ${
                herramienta === h.clave ? "font-bold" : "font-semibold"
              }`}
            >
              {h.nombre}
            </span>
            <span className="mt-1 block text-cuerpo text-tinta-media">
              {h.bajada}
            </span>
          </button>
        ))}
      </div>

      {herramienta === "prueba" ? (
        <PruebaEquipo roster={roster} catalogo={catalogo} />
      ) : null}
      {herramienta === "calculadora" ? (
        <Calculadora roster={roster} catalogo={catalogo} />
      ) : null}
      {herramienta === "probador" ? (
        <ProbadorEquipos roster={roster} catalogo={catalogo} />
      ) : null}
    </div>
  );
}
