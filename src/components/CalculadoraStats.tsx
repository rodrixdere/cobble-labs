"use client";

import { useState } from "react";

import RepartoIvEv from "@/components/RepartoIvEv";
import {
  NIVEL_COMPETITIVO,
  NIVEL_MAXIMO,
  NOMBRE_STAT,
  ORDEN_STATS,
  type Stats,
} from "@/data/pokemon";
import { statConIvEv } from "@/engine/calculo-dano";
import { NATURALEZAS, conjuntoVacio, type Conjunto } from "@/team/conjunto";

// Calculadora de stats con la fórmula de los juegos: nivel, IVs, EVs y
// naturaleza. Además del valor con el reparto elegido muestra el mínimo y el
// máximo posibles a ese nivel, que es lo que dice cuánto margen hay.
export default function CalculadoraStats({
  slug,
  base,
  tipo,
}: {
  slug: string;
  base: Stats;
  tipo: string;
}) {
  const [conjunto, setConjunto] = useState<Conjunto>(() => conjuntoVacio(slug));

  const naturaleza = NATURALEZAS.find((n) => n.clave === conjunto.naturaleza);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3 border-b border-linea pb-3">
        <h3 className="rotulo">Calculadora de stats</h3>

        <label className="flex items-center gap-2">
          <span className="rotulo">Nivel</span>
          <input
            type="number"
            min={1}
            max={NIVEL_MAXIMO}
            value={conjunto.nivel}
            onChange={(e) =>
              setConjunto({
                ...conjunto,
                nivel: Math.max(1, Math.min(NIVEL_MAXIMO, Number(e.target.value) || 1)),
              })
            }
            className="cifra w-[58px] rounded-pieza border border-linea-fuerte bg-panel px-2 py-1 text-right text-cuerpo outline-none focus:border-acento"
          />
        </label>

        <span className="flex items-center gap-1">
          {[NIVEL_COMPETITIVO, NIVEL_MAXIMO].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={conjunto.nivel === n}
              onClick={() => setConjunto({ ...conjunto, nivel: n })}
              className={`cifra rounded-pieza px-2 py-1.5 text-apoyo transition-colors duration-150 ${
                conjunto.nivel === n
                  ? "bg-tinta font-semibold text-white"
                  : "text-tinta-media hover:bg-hueco hover:text-tinta"
              }`}
            >
              Nv {n}
            </button>
          ))}
        </span>

        <label className="flex min-w-0 items-center gap-2">
          <span className="rotulo shrink-0">Naturaleza</span>
          <select
            value={conjunto.naturaleza}
            onChange={(e) => setConjunto({ ...conjunto, naturaleza: e.target.value })}
            className="min-w-0 rounded-pieza border border-linea-fuerte bg-panel px-2 py-1 text-cuerpo outline-none focus:border-acento"
          >
            {NATURALEZAS.map((n) => (
              <option key={n.clave} value={n.clave}>
                {n.nombre}
                {n.sube && n.baja
                  ? ` (+${NOMBRE_STAT[n.sube]} / -${NOMBRE_STAT[n.baja]})`
                  : " (neutra)"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-y-8 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-0">
        <RepartoIvEv base={base} conjunto={conjunto} onCambiar={setConjunto} />

        <div className="min-w-0">
          <h4 className="rotulo border-b border-linea pb-2">
            Margen a nivel {conjunto.nivel}
          </h4>
          <ul className="mt-3 space-y-2.5">
            {ORDEN_STATS.map((clave) => {
              const esPS = clave === "hp";
              const minimo = statConIvEv(base[clave], esPS, {
                iv: 0,
                ev: 0,
                nivel: conjunto.nivel,
              });
              const maximo = statConIvEv(base[clave], esPS, {
                iv: 31,
                ev: 252,
                nivel: conjunto.nivel,
              });
              const conNaturaleza = esPS
                ? maximo
                : Math.floor(maximo * (naturaleza?.sube === clave ? 1.1 : 1));

              return (
                <li key={clave}>
                  <div className="flex items-baseline justify-between text-cuerpo">
                    <span className="text-tinta-media">{NOMBRE_STAT[clave]}</span>
                    <span className="cifra text-tinta-tenue">
                      {minimo} <span className="text-menuda">a</span>{" "}
                      <span className="text-tinta">{conNaturaleza}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-[6px] w-full bg-hueco">
                    <div
                      className="h-full"
                      style={{
                        width: `${(minimo / conNaturaleza) * 100}%`,
                        background: `var(--color-tipo-${tipo})`,
                        opacity: 0.45,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-4 text-apoyo leading-relaxed text-tinta-tenue">
            El mínimo es con 0 de IV y 0 de EV; el máximo, con 31 de IV, 252 de
            EV y la naturaleza a favor cuando corresponde. Entre esos dos
            números está todo lo que un mismo Pokémon puede llegar a ser.
          </p>
        </div>
      </div>
    </div>
  );
}
