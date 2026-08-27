"use client";

import {
  ABREV_STAT,
  EV_MAXIMO_POR_STAT,
  EV_TOTAL_MAXIMO,
  IV_MAXIMO,
  NOMBRE_STAT,
  ORDEN_STATS,
  type Stats,
} from "@/data/pokemon";
import { statFinal } from "@/engine/calculo-dano";
import { evDe, evsLibres, evsUsados, ivDe, type Conjunto } from "@/team/conjunto";

// Reparto de IVs y EVs, como en el juego: 31 de IV por stat y 252 de EV por
// stat con un techo de 510 en total. No hay ningún sistema inventado acá.
//
// Los repartos rápidos son los tres que se usan siempre: máximo en dos stats y
// el resto de sobra, que es lo que permite el techo de 510.
const REPARTOS: { nombre: string; evs: Conjunto["evs"] }[] = [
  { nombre: "Físico veloz", evs: { attack: 252, speed: 252, hp: 4 } },
  { nombre: "Especial veloz", evs: { special_attack: 252, speed: 252, hp: 4 } },
  { nombre: "Muro físico", evs: { hp: 252, defence: 252, special_defence: 4 } },
  { nombre: "Muro especial", evs: { hp: 252, special_defence: 252, defence: 4 } },
];

export default function RepartoIvEv({
  base,
  conjunto,
  onCambiar,
  compacto,
}: {
  base: Stats;
  conjunto: Conjunto;
  onCambiar: (c: Conjunto) => void;
  compacto?: boolean;
}) {
  const usados = evsUsados(conjunto);
  const libres = evsLibres(conjunto);

  const cambiarEv = (clave: keyof Stats, valor: number) => {
    const limpio = Math.max(0, Math.min(EV_MAXIMO_POR_STAT, Math.round(valor) || 0));
    const otros = usados - evDe(conjunto, clave);
    const permitido = Math.min(limpio, EV_TOTAL_MAXIMO - otros);
    onCambiar({ ...conjunto, evs: { ...conjunto.evs, [clave]: permitido } });
  };

  const cambiarIv = (clave: keyof Stats, valor: number) => {
    const limpio = Math.max(0, Math.min(IV_MAXIMO, Math.round(valor) || 0));
    onCambiar({ ...conjunto, ivs: { ...conjunto.ivs, [clave]: limpio } });
  };

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between border-b border-linea pb-2">
        <h3 className="rotulo">IVs y EVs</h3>
        <span className="cifra text-cuerpo">
          <span className={libres === 0 ? "text-acento-hondo" : ""}>{usados}</span>
          <span className="text-tinta-tenue"> / {EV_TOTAL_MAXIMO} EV</span>
        </span>
      </div>

      {/* Abajo de 310 la columna del deslizador se queda sin ancho util y el
          control deja de poder agarrarse, asi que la tabla corre a lo ancho. */}
      <div className="overflow-x-auto">
        <table className="mt-3 w-full min-w-[310px]">
          <thead>
            <tr>
              <th scope="col" className="rotulo pb-1 text-left font-normal">
                Stat
              </th>
              <th scope="col" className="rotulo pb-1 text-right font-normal">
                Base
              </th>
              <th scope="col" className="rotulo pb-1 text-right font-normal">
                IV
              </th>
              <th scope="col" className="rotulo pb-1 text-right font-normal">
                EV
              </th>
              {compacto ? null : (
                <th scope="col" className="rotulo pb-1 font-normal">
                  <span className="sr-only">Reparto</span>
                </th>
              )}
              <th scope="col" className="rotulo pb-1 text-right font-normal">
                Final
              </th>
            </tr>
          </thead>
          <tbody>
            {ORDEN_STATS.map((clave) => {
              const iv = ivDe(conjunto, clave);
              const ev = evDe(conjunto, clave);
              const final = statFinal(base, conjunto, clave);

              return (
                <tr key={clave}>
                  <th scope="row" className="py-[3px] text-left text-cuerpo font-normal text-tinta-media">
                    {compacto ? ABREV_STAT[clave] : NOMBRE_STAT[clave]}
                  </th>
                  <td className="cifra py-[3px] pr-2 text-right text-apoyo text-tinta-tenue">
                    {base[clave]}
                  </td>
                  <td className="py-[3px] pr-2 text-right">
                    <input
                      type="number"
                      min={0}
                      max={IV_MAXIMO}
                      value={iv}
                      onChange={(e) => cambiarIv(clave, Number(e.target.value))}
                      aria-label={`IV de ${NOMBRE_STAT[clave]}`}
                      className="cifra w-[42px] rounded-pieza border border-linea-fuerte bg-panel px-1 py-1 text-right text-apoyo outline-none focus:border-acento"
                    />
                  </td>
                  <td className="py-[3px] pr-2 text-right">
                    <input
                      type="number"
                      min={0}
                      max={EV_MAXIMO_POR_STAT}
                      step={4}
                      value={ev}
                      onChange={(e) => cambiarEv(clave, Number(e.target.value))}
                      aria-label={`EV de ${NOMBRE_STAT[clave]}`}
                      className="cifra w-[48px] rounded-pieza border border-linea-fuerte bg-panel px-1 py-1 text-right text-apoyo outline-none focus:border-acento"
                    />
                  </td>
                  {compacto ? null : (
                    <td className="w-full px-2 py-[3px]">
                      <input
                        type="range"
                        min={0}
                        max={EV_MAXIMO_POR_STAT}
                        step={4}
                        value={ev}
                        onChange={(e) => cambiarEv(clave, Number(e.target.value))}
                        aria-label={`Repartir EV de ${NOMBRE_STAT[clave]}`}
                        className="h-6 w-full accent-acento"
                      />
                    </td>
                  )}
                  <td className="cifra py-[3px] text-right text-cuerpo font-semibold">
                    {final}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1">
        {REPARTOS.map((r) => (
          <button
            key={r.nombre}
            type="button"
            onClick={() => onCambiar({ ...conjunto, evs: { ...r.evs } })}
            className="rounded-pieza border border-linea-fuerte px-2 py-1 text-apoyo text-tinta-media transition-colors duration-150 hover:border-tinta-tenue hover:text-tinta"
          >
            {r.nombre}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onCambiar({ ...conjunto, evs: {} })}
          className="rounded-pieza border border-linea-fuerte px-2 py-1 text-apoyo text-tinta-media transition-colors duration-150 hover:border-tinta-tenue hover:text-tinta"
        >
          Sin EVs
        </button>
      </div>

      <p className="mt-2 text-apoyo leading-snug text-tinta-tenue">
        Los EVs suben de a 4 porque cada 4 dan un punto de stat. El techo es{" "}
        {EV_MAXIMO_POR_STAT} por stat y {EV_TOTAL_MAXIMO} en total, como en el
        juego.
      </p>
    </div>
  );
}
