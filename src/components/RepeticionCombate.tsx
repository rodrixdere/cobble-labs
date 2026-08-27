"use client";

import { ArrowCounterClockwise, Pause, Play, SkipForward } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import Retrato from "@/components/Retrato";
import type { Instante } from "@/simulation/simulador";

export type LadoRepeticion = {
  rotulo: string;
  nombres: string[];
  assets: string[];
  psMaximos: number[];
};

// Reproductor del combate: las barras de vida de los dos equipos turno a turno,
// con lo que pasó en cada uno. El combate ya está resuelto: esto solo recorre
// las fotos que dejó el motor.
export default function RepeticionCombate({
  instantes,
  ladoA,
  ladoB,
  desenlace,
}: {
  instantes: Instante[];
  ladoA: LadoRepeticion;
  ladoB: LadoRepeticion;
  desenlace: string;
}) {
  const [turno, setTurno] = useState(0);
  const [corriendo, setCorriendo] = useState(false);

  const ultimo = instantes.length - 1;
  const actual = instantes[Math.min(turno, ultimo)];

  useEffect(() => {
    if (!corriendo) return;
    if (turno >= ultimo) {
      setCorriendo(false);
      return;
    }
    const id = setTimeout(() => setTurno((t) => t + 1), 700);
    return () => clearTimeout(id);
  }, [corriendo, turno, ultimo]);

  if (instantes.length === 0) {
    return (
      <p className="py-10 text-center text-lectura text-tinta-tenue">
        No se guardó ningún combate para reproducir.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-px bg-linea">
        <Alineacion lado={ladoA} ps={actual.psA} />
        <Alineacion lado={ladoB} ps={actual.psB} />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setTurno(0);
            setCorriendo(false);
          }}
          aria-label="Volver al principio"
          className="grid h-8 w-8 place-items-center rounded-pieza border border-linea-fuerte text-tinta-media transition-colors duration-150 hover:border-tinta-tenue hover:text-tinta"
        >
          <ArrowCounterClockwise size={13} aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => {
            if (turno >= ultimo) setTurno(0);
            setCorriendo((v) => !v);
          }}
          aria-label={corriendo ? "Pausar" : "Reproducir"}
          className="grid h-8 w-8 place-items-center rounded-pieza bg-acento text-white transition-colors duration-150 hover:bg-acento-hondo"
        >
          {corriendo ? (
            <Pause size={13} weight="fill" aria-hidden />
          ) : (
            <Play size={13} weight="fill" aria-hidden />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setCorriendo(false);
            setTurno((t) => Math.min(ultimo, t + 1));
          }}
          aria-label="Turno siguiente"
          className="grid h-8 w-8 place-items-center rounded-pieza border border-linea-fuerte text-tinta-media transition-colors duration-150 hover:border-tinta-tenue hover:text-tinta"
        >
          <SkipForward size={13} aria-hidden />
        </button>

        <label className="flex flex-1 items-center gap-3">
          <span className="sr-only">Turno</span>
          <input
            type="range"
            min={0}
            max={ultimo}
            value={Math.min(turno, ultimo)}
            onChange={(e) => {
              setCorriendo(false);
              setTurno(Number(e.target.value));
            }}
            className="h-6 flex-1 accent-acento"
          />
        </label>

        <span className="cifra w-[74px] shrink-0 text-right text-apoyo text-tinta-media">
          Turno {actual.turno}/{instantes[ultimo].turno}
        </span>
      </div>

      <div className="mt-4 border-t border-linea pt-3">
        {actual.texto.length === 0 ? (
          <p className="text-lectura text-tinta-tenue">Sin novedades en este turno.</p>
        ) : (
          <ul className="space-y-1">
            {actual.texto.map((linea, i) => (
              <li key={i} className="text-lectura text-tinta-media">
                {linea}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 border-t border-linea pt-3 text-lectura font-semibold">
        {desenlace}
      </p>
    </div>
  );
}

function Alineacion({ lado, ps }: { lado: LadoRepeticion; ps: number[] }) {
  return (
    <div className="bg-panel px-4 py-3">
      <p className="rotulo">{lado.rotulo}</p>
      <ul className="mt-2 space-y-1.5">
        {lado.nombres.map((nombre, i) => {
          const vida = ps[i] ?? 0;
          const maximo = lado.psMaximos[i] ?? 1;
          const porcentaje = Math.max(0, (vida / maximo) * 100);
          return (
            <li key={`${nombre}-${i}`} className="flex items-center gap-2">
              <span className="flex h-6 w-7 shrink-0 items-center justify-center">
                <Retrato assets={lado.assets[i]} nombre={nombre} lado={24} escalaMaxima={2} />
              </span>
              <span
                className={`w-[92px] shrink-0 truncate text-apoyo ${
                  porcentaje === 0 ? "text-tinta-tenue line-through" : "text-tinta-media"
                }`}
              >
                {nombre}
              </span>
              <span className="h-[7px] flex-1 bg-hueco">
                <span
                  className={`block h-full transition-[width] duration-300 ease-salida ${
                    porcentaje > 50
                      ? "bg-acento"
                      : porcentaje > 20
                        ? "bg-ambar"
                        : "bg-alarma"
                  }`}
                  style={{ width: `${porcentaje}%` }}
                />
              </span>
              <span className="cifra w-[34px] shrink-0 text-right text-menuda text-tinta-tenue">
                {Math.round(porcentaje)} %
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
