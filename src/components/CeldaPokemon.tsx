import Link from "next/link";

import Retrato from "@/components/Retrato";
import { NOMBRE_TIPO, type PokemonEnRejilla } from "@/data/pokemon";

// Una entrada del indice. No es una tarjeta: no tiene borde propio, ni radio,
// ni sombra. La linea que la separa es la de la rejilla, compartida con las
// vecinas, y el color de tipo entra como una franja de 3px al pie en vez de
// como pildora. Con 366 celdas eso es la diferencia entre un indice y una
// pared de tarjetas iguales.
export default function CeldaPokemon({ p }: { p: PokemonEnRejilla }) {
  return (
    <Link
      href={`/pokemon/${p.slug}`}
      className="group relative flex h-[208px] flex-col bg-panel transition-colors duration-150 hover:bg-hueco focus-visible:z-10"
    >
      <span className="flex items-baseline justify-between px-3 pt-2.5">
        <span className="cifra text-menuda text-tinta-tenue">
          {String(p.dex).padStart(3, "0")}
        </span>
        <span className="cifra text-menuda text-tinta-tenue">{p.total}</span>
      </span>

      <span className="flex flex-1 items-center justify-center">
        <Retrato
          assets={p.assets}
          nombre={p.nombre}
          lado={104}
          escalaMaxima={6}
          className="transition-transform duration-150 ease-salida group-hover:-translate-y-1"
        />
      </span>

      <span className="px-3 pb-3.5">
        <span className="block truncate font-display text-realce font-bold tracking-[-0.02em]">
          {p.nombre}
        </span>
        <span className="mt-0.5 block truncate text-apoyo text-tinta-media">
          {p.tipos.map((t) => NOMBRE_TIPO[t]).join(" · ")}
          {p.formas > 0 ? (
            <span className="cifra ml-1.5 text-menuda text-ambar">
              +{p.formas}
            </span>
          ) : null}
        </span>
      </span>

      <span aria-hidden className="flex h-[3px]">
        {p.tipos.map((t) => (
          <span
            key={t}
            className="flex-1"
            style={{ background: `var(--color-tipo-${t})` }}
          />
        ))}
      </span>
    </Link>
  );
}
