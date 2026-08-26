"use client";

import { useEffect } from "react";

import SelectorPokemon from "@/components/SelectorPokemon";
import type { PokemonCombate } from "@/team/combate";

// El buscador sobre un velo, como se abre desde el armador y el probador. No usa
// Modal porque no es un panel con cabecera: es una lista que cae.
//
// Escucha Escape aparte, porque el velo no se puede clickear con el teclado.

export default function BuscadorFlotante({
  roster,
  onElegir,
  onCerrar,
}: {
  roster: PokemonCombate[];
  onElegir: (slug: string) => void;
  onCerrar: () => void;
}) {
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-[var(--z-velo)] flex items-start justify-center pt-[10vh]">
      <div
        aria-hidden
        onClick={onCerrar}
        className="absolute inset-0 bg-tinta/25"
      />
      <div className="relative z-[var(--z-modal)]">
        <SelectorPokemon
          roster={roster}
          onCerrar={onCerrar}
          onElegir={onElegir}
        />
      </div>
    </div>
  );
}
