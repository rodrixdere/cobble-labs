"use client";

import { Minus, Plus, Trash } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import Retrato from "@/components/Retrato";
import type { MovimientoCatalogo, PokemonCombate } from "@/team/combate";
import {
  HABILIDADES_SIMULADAS,
  NATURALEZAS,
  OBJETOS,
  efectoDe,
  type Conjunto,
} from "@/team/conjunto";
import RepartoIvEv from "@/components/RepartoIvEv";
import Opcion from "@/ui/Opcion";
import FilaElegible from "@/ui/FilaElegible";
import Boton from "@/ui/Boton";
import Modal from "@/ui/Modal";
import {
  ABREV_TIPO,
  NIVEL_MAXIMO,
  NOMBRE_STAT,
  NOMBRE_TIPO,
} from "@/data/pokemon";

export default function EditorConjunto({
  pokemon,
  catalogo,
  conjunto,
  onCambiar,
  onQuitar,
  onCerrar,
}: {
  pokemon: PokemonCombate;
  catalogo: MovimientoCatalogo[];
  conjunto: Conjunto;
  onCambiar: (c: Conjunto) => void;
  onQuitar: () => void;
  onCerrar: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");

  const formaActiva = conjunto.forma
    ? pokemon.formas.find((m) => m.clave === conjunto.forma)
    : null;

  const tipos = formaActiva?.tipos ?? pokemon.tipos;
  const stats = formaActiva?.stats ?? pokemon.stats;
  const habilidades = formaActiva?.habilidades ?? pokemon.habilidades;

  const movimientos = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const lista = pokemon.movimientos
      .map((i) => catalogo[i])
      .toSorted((a, b) => b.potencia - a.potencia || a.nombre.localeCompare(b.nombre, "es"));
    if (!texto) return lista;
    return lista.filter((m) => m.nombre.toLowerCase().includes(texto));
  }, [pokemon.movimientos, catalogo, busqueda]);


  const alternarMovimiento = (clave: string) => {
    const puestos = conjunto.movimientos;
    if (puestos.includes(clave)) {
      onCambiar({ ...conjunto, movimientos: puestos.filter((m) => m !== clave) });
    } else if (puestos.length < 4) {
      onCambiar({ ...conjunto, movimientos: [...puestos, clave] });
    }
  };

  return (
    <Modal
      titulo={`Set de ${pokemon.nombre}`}
      ancho="hoja"
      alto
      onCerrar={onCerrar}
      cabecera={
        <span className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center">
            <Retrato
              assets={pokemon.assets}
              forma={conjunto.forma}
              nombre={pokemon.nombre}
              lado={48}
              escalaMaxima={3}
            />
          </span>
          <span>
            <span className="block font-display text-subtitulo">
              {formaActiva ? formaActiva.etiqueta : pokemon.nombre}
            </span>
            <span className="mt-1 flex gap-1">
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
        </span>
      }
      acciones={
        <Boton alarma onClick={onQuitar}>
          <Trash size={13} aria-hidden />
          Quitar del equipo
        </Boton>
      }
      pie={
        <div className="flex items-center justify-between px-6 py-3">
          <p className="text-apoyo text-tinta-tenue">
            Fórmula del juego: IVs de 0 a 31, EVs de a 4 con techo de 252 por
            stat y 510 en total, y la naturaleza sobre la stat ya calculada.
          </p>
          <Boton variante="principal" onClick={onCerrar}>
            Listo
          </Boton>
        </div>
      }
    >
      <div className="grid gap-px bg-linea lg:grid-cols-[1fr_260px_300px]">
        {/* Movimientos */}
        <section className="bg-panel px-5 py-4">
          <div className="flex items-baseline justify-between">
            <h3 className="rotulo">
              Movimientos {conjunto.movimientos.length}/4
            </h3>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar…"
              aria-label="Buscar movimiento"
              autoComplete="off"
              spellCheck={false}
              className="w-[130px] rounded-pieza border border-linea-fuerte bg-fondo px-2 py-1 text-cuerpo outline-none transition-colors duration-150 focus:border-acento"
            />
          </div>

          <ul className="mt-2 max-h-[340px] overflow-y-auto overscroll-contain">
            {movimientos.map((m) => {
              const puesto = conjunto.movimientos.includes(m.clave);
              const lleno = conjunto.movimientos.length >= 4 && !puesto;
              return (
                <li key={m.clave}>
                  <FilaElegible
                    puesta={puesto}
                    apagada={lleno}
                    holgura="apretada"
                    onElegir={() => alternarMovimiento(m.clave)}
                  >
                    <span
                      className="cifra w-[32px] shrink-0 py-[2px] text-center text-nota font-bold text-white"
                      style={{ background: `var(--color-tipo-${m.tipo})` }}
                    >
                      {ABREV_TIPO[m.tipo]}
                    </span>
                    <span className="flex-1 truncate text-cuerpo font-semibold">
                      {m.nombre}
                    </span>
                    <span className="text-menuda text-tinta-tenue">
                      {m.categoria === "physical" ? "Fís." : "Esp."}
                    </span>
                    <span className="cifra w-[28px] text-right text-cuerpo">
                      {m.potencia}
                    </span>
                  </FilaElegible>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-apoyo leading-snug text-tinta-tenue">
            Solo movimientos de daño: el motor no sabe usar los de estado.
          </p>
        </section>

        {/* Habilidad, naturaleza, objeto, mega */}
        <section className="bg-panel px-5 py-4">
          <h3 className="rotulo">Habilidad</h3>
          <ul className="mt-2 space-y-1">
            {habilidades.map((h) => {
              const elegida = conjunto.habilidad === h.clave;
              const simulada = HABILIDADES_SIMULADAS[h.clave];
              return (
                <li key={h.clave}>
                  <FilaElegible
                    puesta={elegida}
                    holgura="apretada"
                    onElegir={() =>
                      onCambiar({ ...conjunto, habilidad: h.clave })
                    }
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-cuerpo font-semibold">
                        {h.nombre}
                        {h.oculta ? (
                          <span className="cifra text-nota text-ambar">
                            OCULTA
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block text-apoyo leading-snug text-tinta-tenue">
                        {simulada ?? "No cambia la simulación"}
                      </span>
                    </span>
                  </FilaElegible>
                </li>
              );
            })}
          </ul>

          <h3 className="rotulo mt-5">Naturaleza</h3>
          <select
            value={conjunto.naturaleza}
            onChange={(e) => onCambiar({ ...conjunto, naturaleza: e.target.value })}
            aria-label="Naturaleza"
            className="mt-2 w-full rounded-pieza border border-linea-fuerte bg-panel px-2 py-1.5 text-cuerpo text-tinta outline-none transition-colors duration-150 focus:border-acento"
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

          <h3 className="rotulo mt-5">Objeto</h3>
          <select
            value={conjunto.objeto}
            onChange={(e) => onCambiar({ ...conjunto, objeto: e.target.value })}
            aria-label="Objeto"
            className="mt-2 w-full rounded-pieza border border-linea-fuerte bg-panel px-2 py-1.5 text-cuerpo text-tinta outline-none transition-colors duration-150 focus:border-acento"
          >
            {OBJETOS.map((o) => (
              <option key={o.clave} value={o.clave}>
                {o.nombre}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-apoyo leading-snug text-tinta-tenue">
            {efectoDe(conjunto.objeto) ??
              (conjunto.objeto === "ninguno"
                ? "Sin objeto"
                : "El motor todavía no aplica este objeto")}
          </p>

          {pokemon.formas.length > 0 ? (
            <>
              <h3 className="rotulo mt-5">Forma</h3>
              <div className="mt-2 flex flex-wrap gap-1">
                <Opcion
                  estilo="contorno"
                  puesta={conjunto.forma === null}
                  onElegir={() => onCambiar({ ...conjunto, forma: null, habilidad: pokemon.habilidades[0]?.clave ?? "" })}
                >
                  Base
                </Opcion>
                {pokemon.formas.map((m) => (
                  <Opcion
                    estilo="contorno"
                    key={m.clave}
                    puesta={conjunto.forma === m.clave}
                    onElegir={() =>
                      onCambiar({
                        ...conjunto,
                        forma: m.clave,
                        habilidad: m.habilidades[0]?.clave ?? "",
                      })
                    }
                  >
                    {m.etiqueta}
                  </Opcion>
                ))}
              </div>
            </>
          ) : null}
        </section>

        {/* IVs, EVs y nivel */}
        <section className="bg-panel px-5 py-4">
          <label className="mb-3 flex items-center gap-2">
            <span className="rotulo">Nivel</span>
            <input
              type="number"
              min={1}
              max={NIVEL_MAXIMO}
              value={conjunto.nivel}
              onChange={(e) =>
                onCambiar({
                  ...conjunto,
                  nivel: Math.max(1, Math.min(NIVEL_MAXIMO, Number(e.target.value) || 1)),
                })
              }
              className="cifra w-[56px] rounded-pieza border border-linea-fuerte bg-panel px-2 py-1 text-right text-cuerpo outline-none focus:border-acento"
            />
          </label>

          <RepartoIvEv base={stats} conjunto={conjunto} onCambiar={onCambiar} compacto />
        </section>
      </div>
    </Modal>
  );
}
