"use client";

import { Plus } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import Retrato from "@/components/Retrato";
import { NOMBRE_TIPO } from "@/data/pokemon";
import { objetoPorClave, type Conjunto } from "@/team/conjunto";
import type { IndicePokemon } from "@/team/roster";
import { MAXIMO_MIEMBROS } from "@/team/validador";

// Uno de los dos bandos del cruce. Es la version chica del hueco del armador:
// entran seis en tres columnas, asi que solo se muestra lo que se distingue a
// ese tamaño (retrato, nombre, objeto y cuantos movimientos lleva).

const ALTO = "h-[112px]";

export default function Alineacion({
  titulo,
  conjuntos,
  indice,
  onAgregar,
  onEditar,
  accion,
}: {
  titulo: string;
  conjuntos: Conjunto[];
  indice: IndicePokemon;
  onAgregar: () => void;
  onEditar: (i: number) => void;
  accion: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-linea pb-2">
        <h2 className="rotulo">
          {titulo} · {conjuntos.length}/{MAXIMO_MIEMBROS}
        </h2>
        {accion}
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-px bg-linea sm:grid-cols-3">
        {Array.from({ length: MAXIMO_MIEMBROS }, (_, i) => {
          const c = conjuntos[i];
          const p = c ? indice.get(c.slug) : undefined;

          if (!c || !p) {
            return (
              <li key={`hueco-${i}`}>
                <button
                  type="button"
                  onClick={onAgregar}
                  aria-label={`Agregar al hueco ${i + 1} de ${titulo}`}
                  className={`grid w-full place-items-center bg-panel text-tinta-tenue transition-colors duration-150 hover:bg-hueco hover:text-tinta ${ALTO}`}
                >
                  <Plus size={15} aria-hidden />
                </button>
              </li>
            );
          }

          const forma = c.forma ? p.formas.find((f) => f.clave === c.forma) : null;
          const objeto = objetoPorClave(c.objeto);

          return (
            <li key={c.slug} className="relative bg-panel">
              <button
                type="button"
                onClick={() => onEditar(i)}
                className={`flex w-full flex-col items-center justify-center gap-0.5 px-1 transition-colors duration-150 hover:bg-hueco ${ALTO}`}
              >
                <Retrato
                  assets={p.assets}
                  forma={c.forma}
                  nombre={p.nombre}
                  lado={44}
                  escalaMaxima={3}
                />
                <span className="max-w-full truncate text-apoyo font-semibold">
                  {forma ? forma.etiqueta : p.nombre}
                </span>
                <span className="max-w-full truncate text-menuda text-tinta-tenue">
                  {objeto.clave === "ninguno" ? "Sin objeto" : objeto.nombre}
                </span>
                <span className="cifra text-nota text-tinta-tenue">
                  {c.movimientos.length}/4 mov
                </span>
              </button>

              <span aria-hidden className="absolute inset-x-0 bottom-0 flex h-[3px]">
                {(forma?.tipos ?? p.tipos).map((t) => (
                  <span
                    key={t}
                    className="flex-1"
                    style={{ background: `var(--color-tipo-${t})` }}
                    title={NOMBRE_TIPO[t]}
                  />
                ))}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
