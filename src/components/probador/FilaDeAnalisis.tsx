import type { ReactNode } from "react";

import Retrato from "@/components/Retrato";
import type { PokemonCombate } from "@/team/combate";
import Barra from "@/ui/Barra";
import { cx } from "@/ui/clases";

// La fila de los informes del probador: retrato, nombre, barra y cifra. Salidas
// e impacto miden cosas distintas pero comparten fila para poder compararlas.

export default function FilaDeAnalisis({
  pokemon,
  nombre,
  detalle,
  posicion,
  proporcion,
  favorable,
  cifra,
}: {
  pokemon: PokemonCombate | undefined;
  nombre: string;
  /** Segunda linea bajo el nombre: los movimientos, por ejemplo. */
  detalle?: ReactNode;
  /** El puesto en la lista, cuando la lista esta ordenada. */
  posicion?: number;
  /** Cuanto se llena la barra, de 0 a 100. */
  proporcion: number;
  favorable: boolean;
  cifra: ReactNode;
}) {
  return (
    // En angosto la barra se lleva la segunda linea entera: es lo unico que
    // puede achicarse sin que la fila deje de leerse.
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:flex-nowrap sm:gap-4">
      {posicion !== undefined ? (
        <span className="cifra w-[18px] shrink-0 text-cuerpo text-tinta-tenue">
          {posicion}
        </span>
      ) : null}

      <span className="flex h-9 w-10 shrink-0 items-center justify-center">
        {pokemon ? (
          <Retrato
            assets={pokemon.assets}
            nombre={nombre}
            lado={36}
            escalaMaxima={2}
          />
        ) : null}
      </span>

      <span className="min-w-0 flex-1 sm:w-[150px] sm:flex-none">
        <span className="block truncate text-lectura font-semibold">{nombre}</span>
        {detalle ? (
          <span className="block truncate text-apoyo text-tinta-tenue">
            {detalle}
          </span>
        ) : null}
      </span>

      <Barra
        valor={proporcion}
        tono={favorable ? "acento" : "alarma"}
        etiqueta={nombre}
        ubicacion="order-last w-full sm:order-none sm:w-auto sm:flex-1"
      />

      <span
        className={cx(
          "cifra w-[66px] shrink-0 text-right text-lectura font-bold",
          favorable ? "text-acento-hondo" : "text-alarma"
        )}
      >
        {cifra}
      </span>
    </li>
  );
}
