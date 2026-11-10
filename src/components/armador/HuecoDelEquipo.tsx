"use client";

import { X } from "@phosphor-icons/react";

import Retrato from "@/components/Retrato";
import { ABREV_STAT, NOMBRE_TIPO, ORDEN_STATS } from "@/data/pokemon";
import { statFinal } from "@/engine/calculo-dano";
import type { PokemonCombate } from "@/team/combate";
import { NATURALEZAS, objetoPorClave, type Conjunto } from "@/team/conjunto";
import type { Falla } from "@/team/validador";
import Boton from "@/ui/Boton";
import { cx } from "@/ui/clases";
import { nombreConForma } from "@/team/combate";

// Uno de los seis huecos. Muestra el set entero de un vistazo para no tener que
// abrir el editor: forma, tipos, habilidad, objeto, naturaleza y stats finales.

const ALTO = "h-[210px]";

export function HuecoVacio({ onElegir }: { onElegir: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onElegir}
        className={cx(
          "flex w-full flex-col items-center justify-center gap-2 bg-panel",
          "text-tinta-tenue transition-colors duration-150 hover:bg-hueco hover:text-tinta",
          ALTO
        )}
      >
        <span aria-hidden className="text-titulo">
          +
        </span>
        <span className="rotulo">Agregar</span>
      </button>
    </li>
  );
}

type Props = {
  pokemon: PokemonCombate;
  conjunto: Conjunto;
  fallas: Falla[];
  onEditar: () => void;
  onQuitar: () => void;
};

export default function HuecoDelEquipo({
  pokemon,
  conjunto,
  fallas,
  onEditar,
  onQuitar,
}: Props) {
  // Con una mega puesta, todo sale de la forma y no de la especie base.
  const forma = conjunto.forma
    ? pokemon.formas.find((f) => f.clave === conjunto.forma)
    : null;

  const base = forma?.stats ?? pokemon.stats;
  const tipos = forma?.tipos ?? pokemon.tipos;
  const habilidad = (forma?.habilidades ?? pokemon.habilidades).find(
    (h) => h.clave === conjunto.habilidad
  );
  const objeto = objetoPorClave(conjunto.objeto);
  const naturaleza = NATURALEZAS.find((n) => n.clave === conjunto.naturaleza);
  const peor = fallas[0];

  return (
    <li className="relative flex flex-col bg-panel">
      <div className="flex items-center justify-between px-3 pt-2.5">
        <span className="cifra text-menuda text-tinta-tenue">N.º 50</span>
        <span className="flex gap-1">
          <Boton onClick={onEditar} ubicacion="px-1.5 py-0.5">
            Editar
          </Boton>
          <Boton
            variante="icono"
            medida="chico"
            alarma
            aria-label={`Quitar a ${pokemon.nombre}`}
            onClick={onQuitar}
          >
            <X size={11} weight="bold" aria-hidden />
          </Boton>
        </span>
      </div>

      <button
        type="button"
        onClick={onEditar}
        className="flex flex-1 flex-col items-center px-3 pb-3 pt-1 text-center"
      >
        <Retrato
          assets={pokemon.assets}
          forma={conjunto.forma}
          nombre={pokemon.nombre}
          lado={62}
          escalaMaxima={4}
        />

        <span className="mt-1.5 max-w-full truncate font-display text-realce font-bold">
          {nombreConForma(pokemon.nombre, forma)}
        </span>

        <span className="mt-1 flex gap-1">
          {tipos.map((t) => (
            <span
              key={t}
              className="cifra px-1 py-[1px] text-nota font-bold text-white"
              style={{ background: `var(--color-tipo-${t})` }}
            >
              {NOMBRE_TIPO[t]}
            </span>
          ))}
        </span>

        <span className="mt-2 block w-full truncate text-apoyo text-tinta-media">
          {habilidad?.nombre ?? "Sin habilidad"}
        </span>
        <span className="block w-full truncate text-apoyo text-tinta-tenue">
          {objeto.clave === "ninguno" ? "Sin objeto" : objeto.nombre}
          {naturaleza ? ` · ${naturaleza.nombre}` : ""}
        </span>

        <span className="mt-2 grid w-full grid-cols-3 gap-x-1 gap-y-0.5">
          {ORDEN_STATS.map((clave) => (
            <span key={clave} className="cifra text-nota text-tinta-tenue">
              {ABREV_STAT[clave]} {statFinal(base, conjunto, clave)}
            </span>
          ))}
        </span>

        <span className="cifra mt-1.5 text-menuda text-tinta-tenue">
          {conjunto.movimientos.length}/4 movimientos
        </span>
      </button>

      {/* Solo la falla mas grave: en un hueco de este tamaño una lista de
          problemas no se lee, y el detalle completo esta en el editor. */}
      {peor ? (
        <span
          className={cx(
            "block px-3 pb-2 text-menuda leading-snug",
            fallas.some((f) => f.gravedad === "error")
              ? "text-alarma"
              : "text-ambar"
          )}
        >
          {peor.mensaje}
        </span>
      ) : null}

      <span aria-hidden className="flex h-[3px]">
        {tipos.map((t) => (
          <span
            key={t}
            className="flex-1"
            style={{ background: `var(--color-tipo-${t})` }}
          />
        ))}
      </span>
    </li>
  );
}
