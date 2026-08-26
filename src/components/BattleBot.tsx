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
  {
    clave: "prueba",
    nombre: "Probar mi equipo",
    bajada: "Tu equipo contra un pool de rivales, con informe completo",
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
      <div className="flex items-stretch gap-px bg-linea">
        {HERRAMIENTAS.map((h) => (
          <button
            key={h.clave}
            type="button"
            aria-pressed={herramienta === h.clave}
            onClick={() => setHerramienta(h.clave)}
            className={`flex-1 px-6 py-4 text-left transition-colors duration-150 ${
              herramienta === h.clave
                ? "bg-panel"
                : "bg-fondo text-tinta-media hover:bg-panel hover:text-tinta"
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
