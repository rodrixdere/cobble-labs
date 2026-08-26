"use client";

import { ArrowsClockwise, Minus, Plus } from "@phosphor-icons/react";
import { useState } from "react";

import Retrato from "@/components/Retrato";
import SelectorPokemon from "@/components/SelectorPokemon";
import type { MovimientoCatalogo, PokemonCombate } from "@/team/combate";
import {
  HABILIDADES_SIMULADAS,
  NATURALEZAS,
  OBJETOS,
  efectoDe,
  type Conjunto,
} from "@/team/conjunto";
import RepartoIvEv from "@/components/RepartoIvEv";
import { statFinal } from "@/engine/calculo-dano";
import {
  ABREV_STAT,
  ABREV_TIPO,
  NIVEL_MAXIMO,
  NOMBRE_TIPO,
  ORDEN_STATS,
  type Stats,
} from "@/data/pokemon";

// El lado de la calculadora: quien es, con que set pelea y con que stats
// termina. Es el mismo panel para el que ataca y para el que recibe.
export default function PanelCombatiente({
  rotulo,
  pokemon,
  conjunto,
  catalogo,
  roster,
  onCambiarConjunto,
  onCambiarPokemon,
  destacar,
}: {
  rotulo: string;
  pokemon: PokemonCombate;
  conjunto: Conjunto;
  catalogo: MovimientoCatalogo[];
  roster: PokemonCombate[];
  onCambiarConjunto: (c: Conjunto) => void;
  onCambiarPokemon: (slug: string) => void;
  destacar?: string;
}) {
  const [cambiando, setCambiando] = useState(false);
  const [repartiendo, setRepartiendo] = useState(false);

  const mega = conjunto.forma
    ? pokemon.formas.find((m) => m.clave === conjunto.forma)
    : null;
  const tipos = mega?.tipos ?? pokemon.tipos;
  const base: Stats = mega?.stats ?? pokemon.stats;
  const habilidades = mega?.habilidades ?? pokemon.habilidades;

  const movimientos = pokemon.movimientos
    .map((i) => catalogo[i])
    .toSorted((a, b) => b.potencia - a.potencia || a.nombre.localeCompare(b.nombre, "es"));

  const maximaStat = Math.max(...ORDEN_STATS.map((c) => statFinal(base, conjunto, c)));

  const cambiarMovimiento = (indice: number, clave: string) => {
    const siguientes = [...conjunto.movimientos];
    if (clave === "") siguientes.splice(indice, 1);
    else siguientes[indice] = clave;
    onCambiarConjunto({ ...conjunto, movimientos: siguientes.filter(Boolean) });
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-3 border-b border-linea px-5 py-3">
        <span className="rotulo">{rotulo}</span>
        <span aria-hidden className="ml-auto flex h-[3px] w-16">
          {tipos.map((t) => (
            <span
              key={t}
              className="flex-1"
              style={{ background: `var(--color-tipo-${t})` }}
            />
          ))}
        </span>
      </div>

      <div className="flex items-center gap-4 px-5 py-4">
        <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center">
          <Retrato
            assets={pokemon.assets}
            nombre={pokemon.nombre}
            lado={68}
            escalaMaxima={4}
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-subtitulo">
            {mega ? mega.etiqueta : pokemon.nombre}
          </span>
          <span className="mt-2 flex gap-1">
            {tipos.map((t) => (
              <span
                key={t}
                className="cifra px-1.5 py-[2px] text-nota font-bold text-white"
                style={{ background: `var(--color-tipo-${t})` }}
              >
                {NOMBRE_TIPO[t]}
              </span>
            ))}
          </span>
        </span>

        <button
          type="button"
          onClick={() => setCambiando((v) => !v)}
          aria-expanded={cambiando}
          aria-label={`Cambiar ${rotulo.toLowerCase()}`}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-pieza border border-linea-fuerte text-tinta-media transition-colors duration-150 hover:border-tinta-tenue hover:text-tinta"
        >
          <ArrowsClockwise size={14} aria-hidden />
        </button>
      </div>

      {cambiando ? (
        <SelectorPokemon
          roster={roster}
          onCerrar={() => setCambiando(false)}
          onElegir={(slug) => {
            onCambiarPokemon(slug);
            setCambiando(false);
          }}
        />
      ) : null}

      <div className="grid grid-cols-3 gap-2 px-5">
        <Campo etiqueta="Naturaleza">
          <select
            value={conjunto.naturaleza}
            onChange={(e) =>
              onCambiarConjunto({ ...conjunto, naturaleza: e.target.value })
            }
            aria-label={`Naturaleza de ${pokemon.nombre}`}
            className="w-full rounded-pieza border border-linea-fuerte bg-panel px-2 py-1.5 text-cuerpo text-tinta outline-none transition-colors duration-150 focus:border-acento"
          >
            {NATURALEZAS.map((n) => (
              <option key={n.clave} value={n.clave}>
                {n.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Habilidad">
          <select
            value={conjunto.habilidad}
            onChange={(e) =>
              onCambiarConjunto({ ...conjunto, habilidad: e.target.value })
            }
            aria-label={`Habilidad de ${pokemon.nombre}`}
            className="w-full rounded-pieza border border-linea-fuerte bg-panel px-2 py-1.5 text-cuerpo text-tinta outline-none transition-colors duration-150 focus:border-acento"
          >
            {habilidades.map((h) => (
              <option key={h.clave} value={h.clave}>
                {h.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Objeto">
          <select
            value={conjunto.objeto}
            onChange={(e) => onCambiarConjunto({ ...conjunto, objeto: e.target.value })}
            aria-label={`Objeto de ${pokemon.nombre}`}
            className="w-full rounded-pieza border border-linea-fuerte bg-panel px-2 py-1.5 text-cuerpo text-tinta outline-none transition-colors duration-150 focus:border-acento"
          >
            {OBJETOS.map((o) => (
              <option key={o.clave} value={o.clave}>
                {o.nombre}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <p className="mt-1.5 px-5 text-apoyo leading-snug text-tinta-tenue">
        {HABILIDADES_SIMULADAS[conjunto.habilidad] ?? "La habilidad no entra en el cálculo"}
        {conjunto.objeto !== "ninguno"
          ? ` · ${efectoDe(conjunto.objeto) ?? "objeto sin efecto en el cálculo"}`
          : ""}
      </p>

      {pokemon.formas.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1 px-5">
          <span className="rotulo mr-1">Forma</span>
          <Mini
            activa={conjunto.forma === null}
            onClick={() =>
              onCambiarConjunto({
                ...conjunto,
                forma: null,
                habilidad: pokemon.habilidades[0]?.clave ?? "",
              })
            }
          >
            Base
          </Mini>
          {pokemon.formas.map((m) => (
            <Mini
              key={m.clave}
              activa={conjunto.forma === m.clave}
              onClick={() =>
                onCambiarConjunto({
                  ...conjunto,
                  forma: m.clave,
                  habilidad: m.habilidades[0]?.clave ?? "",
                })
              }
            >
              {m.etiqueta}
            </Mini>
          ))}
        </div>
      ) : null}

      <div className="mt-4 px-5">
        <h4 className="rotulo">Movimientos</h4>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => {
            const clave = conjunto.movimientos[i] ?? "";
            const m = movimientos.find((x) => x.clave === clave);
            return (
              <span key={i} className="flex items-center gap-1.5">
                {m ? (
                  <span
                    aria-hidden
                    className="cifra w-[32px] shrink-0 py-[3px] text-center text-nota font-bold text-white"
                    style={{ background: `var(--color-tipo-${m.tipo})` }}
                  >
                    {ABREV_TIPO[m.tipo]}
                  </span>
                ) : (
                  <span aria-hidden className="w-[32px] shrink-0" />
                )}
                <select
                  value={clave}
                  onChange={(e) => cambiarMovimiento(i, e.target.value)}
                  aria-label={`Movimiento ${i + 1} de ${pokemon.nombre}`}
                  className="min-w-0 flex-1 rounded-pieza border border-linea-fuerte bg-panel px-2 py-1.5 text-cuerpo text-tinta outline-none transition-colors duration-150 focus:border-acento"
                >
                  <option value="">Vacío</option>
                  {movimientos.map((x) => (
                    <option key={x.clave} value={x.clave}>
                      {x.nombre} · {x.potencia}
                    </option>
                  ))}
                </select>
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-4 border-t border-linea px-5 py-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <span className="rotulo">Nivel</span>
            <input
              type="number"
              min={1}
              max={NIVEL_MAXIMO}
              value={conjunto.nivel}
              onChange={(e) =>
                onCambiarConjunto({
                  ...conjunto,
                  nivel: Math.max(1, Math.min(NIVEL_MAXIMO, Number(e.target.value) || 1)),
                })
              }
              className="cifra w-[52px] rounded-pieza border border-linea-fuerte bg-panel px-2 py-1 text-right text-cuerpo outline-none focus:border-acento"
            />
          </label>
          <button
            type="button"
            onClick={() => setRepartiendo((v) => !v)}
            aria-expanded={repartiendo}
            className="text-apoyo text-tinta-media underline underline-offset-4 transition-colors duration-150 hover:text-tinta"
          >
            {repartiendo ? "Ocultar IVs y EVs" : "Editar IVs y EVs"}
          </button>
        </div>

        {repartiendo ? (
          <div className="mt-3">
            <RepartoIvEv
              base={base}
              conjunto={conjunto}
              onCambiar={onCambiarConjunto}
              compacto
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-1">
            {ORDEN_STATS.map((clave) => {
              const valor = statFinal(base, conjunto, clave);
              const resaltada = destacar === clave;
              return (
                <li key={clave} className="flex items-center gap-2">
                  <span
                    className={`w-[42px] shrink-0 text-apoyo ${
                      resaltada ? "font-bold text-tinta" : "text-tinta-media"
                    }`}
                  >
                    {ABREV_STAT[clave]}
                  </span>
                  <span className="h-[6px] flex-1 bg-hueco">
                    <span
                      className={`block h-full ${resaltada ? "bg-acento" : "bg-linea-fuerte"}`}
                      style={{ width: `${(valor / maximaStat) * 100}%` }}
                    />
                  </span>
                  <span
                    className={`cifra w-[32px] shrink-0 text-right text-cuerpo ${
                      resaltada ? "font-bold" : ""
                    }`}
                  >
                    {valor}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Campo({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="rotulo mb-1 block">{etiqueta}</span>
      {children}
    </label>
  );
}

function Mini({
  activa,
  onClick,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      onClick={onClick}
      className={`rounded-pieza border px-2 py-1 text-apoyo transition-colors duration-150 ${
        activa
          ? "border-acento bg-acento-lavado font-semibold text-acento-hondo"
          : "border-linea-fuerte text-tinta-media hover:border-tinta-tenue hover:text-tinta"
      }`}
    >
      {children}
    </button>
  );
}
