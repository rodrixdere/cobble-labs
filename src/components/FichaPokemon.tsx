"use client";

import { useState } from "react";

import BarrasStats from "@/components/BarrasStats";
import ListaMovimientos, {
  type MovimientoFicha,
} from "@/components/ListaMovimientos";
import CalculadoraStats from "@/components/CalculadoraStats";
import EnElJuego from "@/components/EnElJuego";
import RejillaDefensas from "@/components/RejillaDefensas";
import Retrato from "@/components/Retrato";
import { NOMBRE_TIPO, type Stats } from "@/data/pokemon";
import type { Meta } from "@/data/meta";
import { defensasDe } from "@/engine/tabla-tipos";
import type { EvolucionLegible, LugarDeAparicion } from "@/data/mundo";
import Opcion from "@/ui/Opcion";
import Pestanias from "@/ui/Pestanias";

export type Forma = {
  clave: string;
  etiqueta: string;
  nombre: string;
  tipos: string[];
  stats: Stats;
  habilidades: { nombre: string; desc: string; oculta: boolean }[];
};

type Props = {
  dex: number;
  generacion: number;
  nombre: string;
  assets: string;
  descripcion: string;
  formas: Forma[];
  movimientos: MovimientoFicha[];
  cobertura: {
    nivel: { tipo: string; x: number }[];
    todos: { tipo: string; x: number }[];
  };
  meta: Meta | null;
  identidad: { rotulo: string; valor: string }[];
  enElJuego: {
    evoluciones: EvolucionLegible[];
    preEvolucion: string | null;
    crianza: { rotulo: string; valor: string }[];
    captura: { rotulo: string; valor: string }[];
    lugares: LugarDeAparicion[];
  };
};

type Pestania = "stats" | "movimientos" | "habilidades" | "juego";

// De donde salen los movimientos con los que se calcula la cobertura. Por MT
// casi todos llegan a casi todo, asi que "todos" dice bastante menos de lo que
// parece y por eso el pie lo aclara.
const ORIGENES_DE_COBERTURA = [
  { clave: "nivel", nombre: "Por nivel" },
  { clave: "todos", nombre: "Todos" },
] as const;

const PIE_DE_COBERTURA: Record<"nivel" | "todos", string> = {
  nivel:
    "La mejor efectividad que consigue contra cada tipo con los movimientos que aprende subiendo de nivel.",
  todos:
    "Contando también MT, tutor, huevo y especiales. Casi todos llegan a todo por MT, así que dice menos de lo que parece.",
};

export default function FichaPokemon({
  dex,
  generacion,
  nombre,
  assets,
  descripcion,
  formas,
  movimientos,
  cobertura,
  meta,
  identidad,
  enElJuego,
}: Props) {
  const [formaActiva, setFormaActiva] = useState("base");
  const [origenCobertura, setOrigenCobertura] = useState<"nivel" | "todos">(
    "nivel"
  );
  const [pestania, setPestania] = useState<Pestania>("stats");

  const base = formas[0];
  const forma = formas.find((f) => f.clave === formaActiva) ?? base;
  const defensas = defensasDe(forma.tipos);

  return (
    <>
      {/* Cabecera: el retrato sobre un campo tenido por el tipo principal, y al
          lado la identidad. Es la unica zona con color de tipo de fondo, y va
          en degradado suave, nunca como bloque plano. */}
      <div className="grid border-b border-linea md:grid-cols-[320px_1fr]">
        <div
          className="flex items-center justify-center border-r border-linea py-8"
          style={{
            background: `radial-gradient(circle at 50% 45%, color-mix(in oklch, var(--color-tipo-${forma.tipos[0]}) 26%, transparent), transparent 72%)`,
          }}
        >
          <Retrato
            assets={assets}
            forma={forma.clave === "base" ? null : forma.clave}
            nombre={nombre}
            lado={204}
            escalaMaxima={8}
            prioritario
          />
        </div>

        <div className="flex flex-col justify-center px-4 md:px-8 py-7">
          <p className="cifra text-apoyo text-tinta-tenue">
            Nº {String(dex).padStart(3, "0")} · Gen {generacion}
          </p>

          <h1 className="mt-1.5 font-display text-heroe">
            {forma.nombre}
          </h1>

          <div className="mt-3.5 flex items-center gap-2">
            {forma.tipos.map((t) => (
              <span
                key={t}
                className="cifra px-2.5 py-[3px] text-menuda font-bold uppercase tracking-[0.08em] text-white"
                style={{ background: `var(--color-tipo-${t})` }}
              >
                {NOMBRE_TIPO[t]}
              </span>
            ))}

            {formas.length > 1 ? (
              <span className="ml-3 flex items-center gap-px rounded-pieza border border-linea-fuerte p-px">
                {formas.map((f) => (
                  <button
                    key={f.clave}
                    type="button"
                    aria-pressed={formaActiva === f.clave}
                    onClick={() => setFormaActiva(f.clave)}
                    className={`rounded-[9px] px-2.5 py-1 text-cuerpo transition-colors duration-150 ${
                      formaActiva === f.clave
                        ? "bg-tinta font-semibold text-white"
                        : "text-tinta-media hover:bg-hueco hover:text-tinta"
                    }`}
                  >
                    {f.etiqueta}
                  </button>
                ))}
              </span>
            ) : null}
          </div>

          {descripcion ? (
            <p className="mt-4 max-w-[68ch] text-lectura leading-relaxed text-tinta-media">
              {descripcion}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid md:grid-cols-[320px_1fr]">
        {/* Columna de identidad: datos duros, uno por linea, sin tarjetas. */}
        <aside className="border-r border-linea px-6 py-6">
          {meta ? (
            <div className="mb-6 grid grid-cols-2 gap-px bg-linea">
              <div className="bg-panel py-3 text-center">
                <p className="rotulo">Tier</p>
                <p className="cifra mt-1 text-capitulo text-acento-hondo">
                  {meta.tier}
                </p>
              </div>
              <div className="bg-panel py-3 text-center">
                <p className="rotulo">Uso</p>
                <p className="cifra mt-1 text-capitulo">
                  {meta.uso}
                  <span className="text-realce text-tinta-tenue"> %</span>
                </p>
              </div>
            </div>
          ) : null}

          <dl className="divide-y divide-linea border-y border-linea">
            {identidad.map((d) => (
              <div key={d.rotulo} className="flex items-baseline gap-3 py-2">
                <dt className="rotulo w-[104px] shrink-0">{d.rotulo}</dt>
                <dd className="cifra flex-1 text-right text-cuerpo">
                  {d.valor}
                </dd>
              </div>
            ))}
          </dl>

          {meta ? (
            <div className="mt-6">
              <h3 className="rotulo border-b border-linea pb-2">
                Sets sugeridos
              </h3>
              <ul className="mt-2">
                {meta.builds.map((b) => (
                  <li key={b.nombre}>
                    <button
                      type="button"
                      onClick={() => setFormaActiva(b.forma)}
                      className={`flex w-full items-center justify-between gap-2 border-l-2 py-[6px] pl-2.5 pr-1 text-left text-cuerpo transition-colors duration-150 ${
                        formaActiva === b.forma
                          ? "border-l-acento text-tinta"
                          : "border-l-transparent text-tinta-media hover:bg-hueco hover:text-tinta"
                      }`}
                    >
                      {b.nombre}
                      {b.forma !== "base" ? (
                        <span className="cifra text-nota uppercase text-ambar">
                          {formas.find((f) => f.clave === b.forma)?.etiqueta ?? ""}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-apoyo leading-snug text-tinta-tenue">
                Cada set indica sobre qué forma se arma. El detalle de objeto,
                naturaleza y movimientos no está publicado.
              </p>
            </div>
          ) : null}
        </aside>

        <section className="px-4 md:px-8 py-6">
          <Pestanias
            activa={pestania}
            onCambiar={setPestania}
            pestanias={[
              {
                clave: "stats",
                nombre: "Stats",
                contenido: () => (
                  <div className="mt-6 grid gap-x-10 gap-y-9 lg:grid-cols-2">
                    <BarrasStats
                      stats={forma.stats}
                      tipo={forma.tipos[0]}
                      comparar={forma.clave === "base" ? undefined : base.stats}
                    />
                    <RejillaDefensas
                      valores={defensas}
                      titulo="Defensas por tipo"
                      pie="Lo que recibe de cada tipo de ataque, ya multiplicados sus dos tipos."
                    />
                    <div className="col-span-2">
                      <CalculadoraStats
                        slug={
                          forma.clave === "base"
                            ? nombre.toLowerCase()
                            : forma.clave
                        }
                        base={forma.stats}
                        tipo={forma.tipos[0]}
                      />
                    </div>
                  </div>
                ),
              },
              {
                clave: "movimientos",
                nombre: "Movimientos",
                contenido: () => (
                  <div className="mt-6 space-y-8">
                    <RejillaDefensas
                      valores={cobertura[origenCobertura]}
                      sentido="ataque"
                      titulo="Cobertura ofensiva"
                      pie={PIE_DE_COBERTURA[origenCobertura]}
                      acciones={
                        <span className="flex items-center gap-1">
                          {ORIGENES_DE_COBERTURA.map((o) => (
                            <Opcion
                              key={o.clave}
                              puesta={origenCobertura === o.clave}
                              onElegir={() => setOrigenCobertura(o.clave)}
                            >
                              {o.nombre}
                            </Opcion>
                          ))}
                        </span>
                      }
                    />
                    <ListaMovimientos movimientos={movimientos} />
                  </div>
                ),
              },
              {
                clave: "habilidades",
                nombre: "Habilidades",
                contenido: () => (
                  <ul className="mt-6 divide-y divide-linea border-y border-linea">
                    {forma.habilidades.map((h) => (
                      <li key={h.nombre} className="py-3.5">
                        <p className="flex items-center gap-2 text-realce font-semibold">
                          {h.nombre}
                          {h.oculta ? (
                            <span className="cifra bg-ambar-lavado px-1.5 py-[2px] text-nota font-bold uppercase tracking-[0.08em] text-ambar">
                              Oculta
                            </span>
                          ) : null}
                        </p>
                        {h.desc ? (
                          <p className="mt-1 max-w-[74ch] text-lectura leading-relaxed text-tinta-media">
                            {h.desc}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ),
              },
              {
                clave: "juego",
                nombre: "En el juego",
                contenido: () => <EnElJuego {...enElJuego} />,
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}
