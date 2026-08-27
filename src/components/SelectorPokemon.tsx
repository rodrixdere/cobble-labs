"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import Retrato from "@/components/Retrato";
import type { PokemonCombate } from "@/team/combate";

// Buscador desplegable de Pokemon, compartido por la calculadora y el probador
// de equipos. Muestra los primeros cuarenta hasta que se escribe algo: la lista
// entera son 366 y no hace falta pintarla para elegir uno.
//
// Colgado del boton que lo abre, salvo cuando cae sobre un velo: ahi va
// centrado, porque no hay boton del que colgarse.
const UBICACION = {
  izquierda: "left-8",
  derecha: "right-8",
  centrada: "left-1/2 -translate-x-1/2",
};
export default function SelectorPokemon({
  roster,
  onElegir,
  onCerrar,
  alineacion = "izquierda",
}: {
  roster: PokemonCombate[];
  onElegir: (slug: string) => void;
  onCerrar: () => void;
  alineacion?: keyof typeof UBICACION;
}) {
  const [busqueda, setBusqueda] = useState("");

  const candidatos = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return roster.slice(0, 40);
    return roster
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(texto) ||
          String(p.dex).padStart(3, "0").includes(texto)
      )
      .slice(0, 40);
  }, [roster, busqueda]);

  return (
    <div
      className={`absolute z-20 mt-2 w-[min(320px,calc(100vw-4rem))] border border-linea-fuerte bg-panel shadow-[0_8px_24px_rgb(11_13_18/0.08)] ${UBICACION[alineacion]}`}
    >
      <label className="flex items-center gap-2 border-b border-linea px-3 py-2">
        <MagnifyingGlass size={14} aria-hidden className="text-tinta-tenue" />
        <span className="sr-only">Buscar Pokémon</span>
        <input
          type="search"
          autoFocus
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCerrar();
          }}
          placeholder="Buscar…"
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-transparent text-left text-lectura outline-none placeholder:text-tinta-tenue"
        />
      </label>

      {candidatos.length === 0 ? (
        <p className="px-3 py-8 text-center text-cuerpo text-tinta-tenue">
          Ninguno se llama así.
        </p>
      ) : (
        <ul className="max-h-[320px] overflow-y-auto overscroll-contain">
          {candidatos.map((p) => (
            <li key={p.slug}>
              <button
                type="button"
                onClick={() => onElegir(p.slug)}
                className="flex w-full items-center gap-3 px-3 py-1.5 text-left transition-colors duration-150 hover:bg-hueco"
              >
                <span className="flex h-8 w-9 items-center justify-center">
                  <Retrato
                    assets={p.assets}
                    nombre={p.nombre}
                    lado={32}
                    escalaMaxima={2}
                  />
                </span>
                <span className="flex-1 text-lectura">{p.nombre}</span>
                <span className="cifra text-apoyo text-tinta-tenue">{p.total}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
