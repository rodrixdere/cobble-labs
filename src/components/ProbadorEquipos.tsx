"use client";

import { Shuffle } from "@phosphor-icons/react";
import { useMemo, useState, useTransition } from "react";

import BuscadorFlotante from "@/components/BuscadorFlotante";
import EditorConjunto from "@/components/EditorConjunto";
import RepeticionCombate from "@/components/RepeticionCombate";
import Alineacion from "@/components/probador/Alineacion";
import Lecturas from "@/components/probador/Lecturas";
import Marcador from "@/components/probador/Marcador";
import PanelImpacto from "@/components/probador/PanelImpacto";
import PanelSalidas from "@/components/probador/PanelSalidas";
import { correrCruce, TANDAS, type Cruce } from "@/simulation/cruce";
import { veredictoDe } from "@/simulation/simulador";
import { leerActual } from "@/team/almacen";
import {
  conjuntoPorDefecto,
  type MovimientoCatalogo,
  type PokemonCombate,
} from "@/team/combate";
import type { Conjunto } from "@/team/conjunto";
import {
  armarBando,
  indexarRoster,
  rehidratar,
  type IndicePokemon,
} from "@/team/roster";
import { MAXIMO_MIEMBROS } from "@/team/validador";
import Boton from "@/ui/Boton";
import Opcion from "@/ui/Opcion";
import Pestanias, { type Pestania } from "@/ui/Pestanias";

// El cara a cara entre dos equipos. La simulacion vive en simulation/cruce y
// las partes del informe en components/probador: aca queda quien pelea contra
// quien, cuantos combates y que pestaña se esta mirando.

type Lado = "a" | "b";
type Clave = "resumen" | "salidas" | "impacto" | "repeticion";

export default function ProbadorEquipos({
  roster,
  catalogo,
}: {
  roster: PokemonCombate[];
  catalogo: MovimientoCatalogo[];
}) {
  const indice = useMemo(() => indexarRoster(roster), [roster]);

  const [equipos, setEquipos] = useState<Record<Lado, Conjunto[]>>({ a: [], b: [] });
  const [eligiendo, setEligiendo] = useState<Lado | null>(null);
  const [editando, setEditando] = useState<{ lado: Lado; indice: number } | null>(null);
  const [combates, setCombates] = useState(500);
  const [cruce, setCruce] = useState<Cruce | null>(null);
  const [pestania, setPestania] = useState<Clave>("resumen");
  const [simulando, empezar] = useTransition();

  // Cualquier cambio en los equipos invalida el cruce: dejar el informe viejo
  // en pantalla al lado de una alineacion nueva es mentir.
  const cambiarEquipo = (lado: Lado, conjuntos: Conjunto[]) => {
    setEquipos((previos) => ({ ...previos, [lado]: conjuntos }));
    setCruce(null);
  };

  const agregar = (lado: Lado, slug: string) => {
    const p = indice.get(slug);
    const actuales = equipos[lado];
    if (!p || actuales.length >= MAXIMO_MIEMBROS) return;
    if (actuales.some((c) => c.slug === slug)) return;

    cambiarEquipo(lado, [...actuales, conjuntoPorDefecto(p, catalogo)]);
    setEligiendo(null);
  };

  const cargarGuardado = () => {
    const guardado = rehidratar(leerActual(), indice, catalogo);
    if (guardado.length > 0) cambiarEquipo("a", guardado);
  };

  const rivalAlAzar = () => {
    const elegidos = new Set<string>();
    const cuantos = Math.min(MAXIMO_MIEMBROS, roster.length);
    while (elegidos.size < cuantos) {
      elegidos.add(roster[Math.floor(Math.random() * roster.length)].slug);
    }
    cambiarEquipo(
      "b",
      [...elegidos].map((s) => conjuntoPorDefecto(indice.get(s)!, catalogo))
    );
  };

  const correr = () => {
    const a = armarBando(equipos.a, indice, catalogo);
    const b = armarBando(equipos.b, indice, catalogo);
    empezar(() => {
      setCruce(correrCruce(a, b, combates));
      setPestania("resumen");
    });
  };

  const listos = equipos.a.length > 0 && equipos.b.length > 0;

  const pestanias: Pestania<Clave>[] = cruce
    ? [
        { clave: "resumen", nombre: "Resumen", contenido: () => <Lecturas cruce={cruce} /> },
        {
          clave: "salidas",
          nombre: "Salidas",
          contenido: () => <PanelSalidas cruce={cruce} indice={indice} />,
        },
        {
          clave: "impacto",
          nombre: "Impacto",
          contenido: () => <PanelImpacto cruce={cruce} indice={indice} />,
        },
        {
          clave: "repeticion",
          nombre: "Repetición",
          contenido: () => (
            <div className="mt-5">
              <RepeticionCombate
                instantes={cruce.muestra.instantes}
                desenlace={desenlaceDe(cruce)}
                ladoA={ladoPara(cruce, "a", indice)}
                ladoB={ladoPara(cruce, "b", indice)}
              />
            </div>
          ),
        },
      ]
    : [];

  return (
    <div className="px-8 py-6">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-6">
        <Alineacion
          titulo="Equipo 1"
          conjuntos={equipos.a}
          indice={indice}
          onAgregar={() => setEligiendo("a")}
          onEditar={(i) => setEditando({ lado: "a", indice: i })}
          accion={
            <Boton variante="enlace" onClick={cargarGuardado}>
              Cargar el mío
            </Boton>
          }
        />

        <div className="flex items-center">
          <span className="rotulo">contra</span>
        </div>

        <Alineacion
          titulo="Equipo 2"
          conjuntos={equipos.b}
          indice={indice}
          onAgregar={() => setEligiendo("b")}
          onEditar={(i) => setEditando({ lado: "b", indice: i })}
          accion={
            <Boton variante="enlace" onClick={rivalAlAzar}>
              <Shuffle size={12} aria-hidden />
              Rival al azar
            </Boton>
          }
        />
      </div>

      <div className="mt-7 flex items-center gap-5 border-y border-linea py-3">
        <span className="rotulo">Combates</span>
        <div className="flex gap-1">
          {TANDAS.map((t) => (
            <Opcion
              key={t}
              mono
              puesta={combates === t}
              onElegir={() => setCombates(t)}
            >
              {t}
            </Opcion>
          ))}
        </div>

        <Boton
          variante="principal"
          onClick={correr}
          disabled={!listos || simulando}
          ubicacion="ml-auto"
        >
          {simulando ? "Simulando…" : `Correr ${combates} combates`}
        </Boton>

        {!listos ? (
          <span className="text-cuerpo text-tinta-tenue">
            Poné al menos uno de cada lado
          </span>
        ) : null}
      </div>

      <div aria-live="polite" className="mt-6">
        {!cruce ? (
          <div className="py-14 text-center">
            <p className="font-display text-subtitulo">Todavía no simulaste nada</p>
            <p className="mx-auto mt-2 max-w-[64ch] text-lectura text-tinta-media">
              Armá los dos equipos, tocá cualquiera para editarle el set, y el
              motor los hace pelear. Después sale con cuál conviene abrir, qué
              miembro pesa más y cómo fue un combate turno a turno.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
              <Marcador
                rotulo="Equipo 1"
                porcentaje={cruce.porcentajeA}
                ganados={cruce.serie.ganaA}
                perdidos={cruce.serie.ganaB}
                equipo={cruce.equipoA}
                indice={indice}
                gana={cruce.porcentajeA > cruce.porcentajeB}
              />

              <div className="text-center">
                <p className="rotulo">Turnos</p>
                <p className="cifra mt-1 text-subtitulo">
                  {cruce.serie.turnosPromedio.toFixed(1)}
                </p>
              </div>

              <Marcador
                rotulo="Equipo 2"
                porcentaje={cruce.porcentajeB}
                ganados={cruce.serie.ganaB}
                perdidos={cruce.serie.ganaA}
                equipo={cruce.equipoB}
                indice={indice}
                gana={cruce.porcentajeB > cruce.porcentajeA}
                derecha
              />
            </div>

            {/* Una sola barra partida al medio: lo que le falta a cada lado
                para llegar al centro es lo que le sobra al otro. */}
            <div className="mt-4 flex h-[14px] w-full overflow-hidden">
              <div
                className="h-full bg-acento transition-[width] duration-500 ease-salida"
                style={{ width: `${cruce.porcentajeA}%` }}
              />
              <div className="h-full flex-1 bg-hueco" />
              <div
                className="h-full bg-tinta transition-[width] duration-500 ease-salida"
                style={{ width: `${cruce.porcentajeB}%` }}
              />
            </div>

            <p className="mt-3 text-center text-realce font-semibold">
              {veredictoDe(cruce.porcentajeA, "El equipo 1", "el equipo 2")}
            </p>

            <div className="mt-6">
              <Pestanias
                pestanias={pestanias}
                activa={pestania}
                onCambiar={setPestania}
              />
            </div>
          </>
        )}
      </div>

      {eligiendo ? (
        <BuscadorFlotante
          roster={roster}
          onCerrar={() => setEligiendo(null)}
          onElegir={(slug) => agregar(eligiendo, slug)}
        />
      ) : null}

      {editando && equipos[editando.lado][editando.indice] ? (
        <EditorConjunto
          pokemon={indice.get(equipos[editando.lado][editando.indice].slug)!}
          catalogo={catalogo}
          conjunto={equipos[editando.lado][editando.indice]}
          onCambiar={(c) =>
            cambiarEquipo(
              editando.lado,
              equipos[editando.lado].map((v, i) => (i === editando.indice ? c : v))
            )
          }
          onQuitar={() => {
            cambiarEquipo(
              editando.lado,
              equipos[editando.lado].filter((_, i) => i !== editando.indice)
            );
            setEditando(null);
          }}
          onCerrar={() => setEditando(null)}
        />
      ) : null}
    </div>
  );
}

function desenlaceDe(cruce: Cruce): string {
  const { muestra, equipoA, equipoB } = cruce;
  if (muestra.gana === "a") {
    return `Gana el equipo 1 en ${muestra.turnos} turnos, con ${equipoA.length - muestra.caidosA} en pie`;
  }
  if (muestra.gana === "b") {
    return `Gana el equipo 2 en ${muestra.turnos} turnos, con ${equipoB.length - muestra.caidosB} en pie`;
  }
  return "Terminó sin definirse";
}

function ladoPara(cruce: Cruce, lado: "a" | "b", indice: IndicePokemon) {
  const equipo = lado === "a" ? cruce.equipoA : cruce.equipoB;
  return {
    rotulo: lado === "a" ? "Equipo 1" : "Equipo 2",
    nombres: equipo.map((l) => l.nombre),
    assets: equipo.map((l) => indice.get(l.slug)?.assets ?? ""),
    psMaximos: lado === "a" ? cruce.muestra.psMaximosA : cruce.muestra.psMaximosB,
  };
}
