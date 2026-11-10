"use client";

import { ArrowsLeftRight } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import PanelCombatiente from "@/components/PanelCombatiente";
import {
  armarLuchador,
  conjuntoPorDefecto,
  type MovimientoCatalogo,
  type PokemonCombate,
} from "@/team/combate";
import type { Conjunto } from "@/team/conjunto";
import {
  CAMPO_VACIO,
  NIVEL,
  calcularDano,
  compararVelocidad,
  statFinal,
  type Campo,
  type Clima,
  type Terreno,
} from "@/engine/calculo-dano";
import { ABREV_TIPO, NOMBRE_TIPO } from "@/data/pokemon";
import { etiquetaMultiplicador } from "@/engine/tabla-tipos";
import Opcion from "@/ui/Opcion";
import FilaElegible from "@/ui/FilaElegible";

const CLIMAS: { clave: Clima; nombre: string }[] = [
  { clave: "ninguno", nombre: "Ninguno" },
  { clave: "sol", nombre: "Sol" },
  { clave: "lluvia", nombre: "Lluvia" },
  { clave: "arena", nombre: "Arena" },
  { clave: "nieve", nombre: "Nieve" },
];

const TERRENOS: { clave: Terreno; nombre: string }[] = [
  { clave: "ninguno", nombre: "Ninguno" },
  { clave: "electrico", nombre: "Eléctrico" },
  { clave: "hierba", nombre: "Hierba" },
  { clave: "bruma", nombre: "Bruma" },
  { clave: "psiquico", nombre: "Psíquico" },
];

const INTERRUPTORES: { clave: keyof Campo; nombre: string }[] = [
  { clave: "dobles", nombre: "Dobles" },
  { clave: "critico", nombre: "Crítico" },
  { clave: "ayuda", nombre: "Ayuda" },
  { clave: "pantallaFisica", nombre: "Reflejo" },
  { clave: "pantallaEspecial", nombre: "Pantalla Luz" },
  { clave: "refuerzo", nombre: "Refuerzo" },
];

export default function Calculadora({
  roster,
  catalogo,
}: {
  roster: PokemonCombate[];
  catalogo: MovimientoCatalogo[];
}) {
  const porSlug = useMemo(() => new Map(roster.map((p) => [p.slug, p])), [roster]);

  const inicial = (slug: string) => {
    const p = porSlug.get(slug) ?? roster[0];
    return conjuntoPorDefecto(p, catalogo);
  };

  const [conjA, setConjA] = useState<Conjunto>(() => inicial("charizard"));
  const [conjB, setConjB] = useState<Conjunto>(() => inicial("venusaur"));
  const [movimientoElegido, setMovimientoElegido] = useState<string | null>(null);
  const [campo, setCampo] = useState<Campo>(CAMPO_VACIO);

  const pokeA = porSlug.get(conjA.slug) ?? roster[0];
  const pokeB = porSlug.get(conjB.slug) ?? roster[1];

  const atacante = armarLuchador(pokeA, conjA, catalogo);
  const defensor = armarLuchador(pokeB, conjB, catalogo);

  const combatienteA = {
    tipos: atacante.tipos,
    stats: atacante.stats,
    puedeEvolucionar: atacante.puedeEvolucionar,
    conjunto: conjA,
  };
  const combatienteB = {
    tipos: defensor.tipos,
    stats: defensor.stats,
    puedeEvolucionar: defensor.puedeEvolucionar,
    conjunto: conjB,
  };

  // Los cuatro movimientos del set, con su resultado ya calculado.
  const resultados = useMemo(
    () =>
      atacante.movimientos.map((m) => ({
        movimiento: m,
        resultado: calcularDano(m, combatienteA, combatienteB, campo),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conjA, conjB, campo, atacante.movimientos]
  );

  const elegido =
    resultados.find((r) => r.movimiento.clave === movimientoElegido) ??
    resultados.toSorted(
      (a, b) => (b.resultado?.maximo ?? 0) - (a.resultado?.maximo ?? 0)
    )[0];

  const velocidad = compararVelocidad(atacante.stats, defensor.stats, conjA, conjB);

  const intercambiar = () => {
    setConjA(conjB);
    setConjB(conjA);
    setMovimientoElegido(null);
  };

  const cambiarPokemon = (lado: "a" | "b", slug: string) => {
    const p = porSlug.get(slug);
    if (!p) return;
    if (lado === "a") setConjA(conjuntoPorDefecto(p, catalogo));
    else setConjB(conjuntoPorDefecto(p, catalogo));
    setMovimientoElegido(null);
  };

  return (
    <>
      {/* Campo de batalla: todo lo que multiplica el daño sin ser el movimiento. */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-linea px-4 md:px-8 py-3">
        <Grupo rotulo="Clima">
          {CLIMAS.map((c) => (
            <Opcion
              key={c.clave}
              puesta={campo.clima === c.clave}
              onElegir={() => setCampo({ ...campo, clima: c.clave })}
            >
              {c.nombre}
            </Opcion>
          ))}
        </Grupo>

        <Grupo rotulo="Terreno">
          {TERRENOS.map((t) => (
            <Opcion
              key={t.clave}
              puesta={campo.terreno === t.clave}
              onElegir={() => setCampo({ ...campo, terreno: t.clave })}
            >
              {t.nombre}
            </Opcion>
          ))}
        </Grupo>

        <Grupo rotulo="Situación">
          {INTERRUPTORES.map((i) => (
            <Opcion
              key={i.clave}
              puesta={Boolean(campo[i.clave])}
              onElegir={() => setCampo({ ...campo, [i.clave]: !campo[i.clave] })}
            >
              {i.nombre}
            </Opcion>
          ))}
        </Grupo>
      </div>

      <div className="grid gap-px bg-linea lg:grid-cols-[1fr_320px_1fr]">
        <div className="bg-panel">
          <PanelCombatiente
            rotulo="Ataca"
            pokemon={pokeA}
            conjunto={conjA}
            catalogo={catalogo}
            roster={roster}
            onCambiarConjunto={setConjA}
            onCambiarPokemon={(slug) => cambiarPokemon("a", slug)}
            destacar={
              elegido?.movimiento.categoria === "physical" ? "attack" : "special_attack"
            }
          />
        </div>

        {/* El resultado, en el medio y en grande: es lo que se viene a ver. */}
        <div className="flex flex-col items-center justify-center bg-panel px-5 py-6 text-center">
          <button
            type="button"
            onClick={intercambiar}
            aria-label="Intercambiar atacante y defensor"
            className="mb-5 grid h-8 w-8 place-items-center rounded-pieza border border-linea-fuerte text-tinta-media transition-colors duration-150 hover:border-tinta-tenue hover:text-tinta"
          >
            <ArrowsLeftRight size={14} aria-hidden />
          </button>

          {!elegido?.resultado ? (
            <p className="text-lectura text-tinta-tenue">
              Elegile un movimiento de daño al atacante.
            </p>
          ) : (
            <>
              <p className="rotulo">{elegido.movimiento.nombre}</p>

              <p
                className={`cifra mt-2 text-cifra font-bold ${
                  elegido.resultado.efectividad > 1
                    ? "text-alarma"
                    : elegido.resultado.efectividad === 0
                      ? "text-tinta-tenue"
                      : "text-tinta"
                }`}
              >
                {elegido.resultado.porcentajeMin.toFixed(1)}
                <span className="text-subtitulo"> a </span>
                {elegido.resultado.porcentajeMax.toFixed(1)}
                <span className="text-subtitulo"> %</span>
              </p>

              <p className="cifra mt-2 text-cuerpo text-tinta-media">
                {elegido.resultado.minimo}-{elegido.resultado.maximo} de{" "}
                {elegido.resultado.psDefensor} PS
              </p>

              <p className="mt-3 text-cuerpo font-semibold">
                {elegido.resultado.probabilidadOHKO >= 1 ? (
                  <span className="text-alarma">Lo tumba de un golpe</span>
                ) : elegido.resultado.probabilidadOHKO > 0 ? (
                  <span className="text-alarma">
                    {(elegido.resultado.probabilidadOHKO * 100).toFixed(1)} % de
                    tumbarlo de un golpe
                  </span>
                ) : elegido.resultado.golpesParaTumbar ? (
                  <span className="text-tinta-media">
                    Lo tumba en {elegido.resultado.golpesParaTumbar} golpes
                  </span>
                ) : (
                  <span className="text-tinta-media">No le hace nada</span>
                )}
              </p>

              <p className="mt-2 text-cuerpo text-tinta-media">
                {elegido.resultado.efectividad > 1
                  ? "Súper efectivo"
                  : elegido.resultado.efectividad === 1
                    ? "Daño normal"
                    : elegido.resultado.efectividad === 0
                      ? "Sin efecto"
                      : "Poco efectivo"}{" "}
                <span className="cifra">
                  ×{etiquetaMultiplicador(elegido.resultado.efectividad)}
                </span>
              </p>

              <ul className="mt-4 flex flex-wrap justify-center gap-1">
                {elegido.resultado.modificadores.map((m) => (
                  <li
                    key={m.nombre}
                    className="cifra border border-linea bg-fondo px-1.5 py-[3px] text-menuda text-tinta-media"
                  >
                    {m.nombre} ×{m.factor}
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-6 border-t border-linea pt-4 text-apoyo leading-snug text-tinta-tenue">
            {velocidad.gana === "empate" ? (
              <>Los dos a {velocidad.va} de velocidad</>
            ) : (
              <>
                Mueve primero{" "}
                <span className="font-semibold text-tinta-media">
                  {velocidad.gana === "a" ? atacante.nombre : defensor.nombre}
                </span>{" "}
                ({Math.max(velocidad.va, velocidad.vb)} contra{" "}
                {Math.min(velocidad.va, velocidad.vb)})
              </>
            )}
          </p>
        </div>

        <div className="bg-panel">
          <PanelCombatiente
            rotulo="Recibe"
            pokemon={pokeB}
            conjunto={conjB}
            catalogo={catalogo}
            roster={roster}
            onCambiarConjunto={setConjB}
            onCambiarPokemon={(slug) => cambiarPokemon("b", slug)}
            destacar={
              elegido?.movimiento.categoria === "physical" ? "defence" : "special_defence"
            }
          />
        </div>
      </div>

      <section className="border-t border-linea px-4 md:px-8 py-6">
        <h2 className="rotulo border-b border-linea pb-2">
          {resultados.length === 1 ? "El movimiento" : `Los ${resultados.length} movimientos`} contra {defensor.nombre}
        </h2>

        {resultados.length === 0 ? (
          <p className="py-8 text-center text-lectura text-tinta-tenue">
            El atacante no tiene movimientos cargados.
          </p>
        ) : (
          // Ocho columnas alineadas: corre a lo ancho como la tabla de tipos en
          // vez de partir la fila, que es lo que deja comparar una con otra.
          <div className="overflow-x-auto">
            <ul className="mt-1 min-w-[640px] divide-y divide-linea">
              {resultados.map(({ movimiento: m, resultado: r }) => {
                const activo = elegido?.movimiento.clave === m.clave;
                return (
                  <li key={m.clave}>
                    <FilaElegible
                      puesta={activo}
                      onElegir={() => setMovimientoElegido(m.clave)}
                    >
                      <span
                        className="cifra w-[36px] shrink-0 py-[3px] text-center text-nota font-bold text-white"
                        style={{ background: `var(--color-tipo-${m.tipo})` }}
                      >
                        {ABREV_TIPO[m.tipo]}
                      </span>
                      <span className="w-[160px] shrink-0 truncate text-lectura font-semibold">
                        {m.nombre}
                      </span>
                      <span className="cifra w-[46px] shrink-0 text-apoyo text-tinta-tenue">
                        {m.potencia}
                      </span>
                      <span className="w-[62px] shrink-0 text-apoyo text-tinta-media">
                        {m.categoria === "physical" ? "Físico" : "Especial"}
                      </span>

                      <span className="h-[8px] flex-1 bg-hueco">
                        <span
                          className={`block h-full ${
                            (r?.porcentajeMax ?? 0) >= 100 ? "bg-alarma" : "bg-acento"
                          }`}
                          style={{ width: `${Math.min(100, r?.porcentajeMax ?? 0)}%` }}
                        />
                      </span>

                      <span className="cifra w-[124px] shrink-0 text-right text-cuerpo">
                        {r
                          ? `${r.porcentajeMin.toFixed(1)}-${r.porcentajeMax.toFixed(1)} %`
                          : "-"}
                      </span>
                      <span className="cifra w-[68px] shrink-0 text-right text-apoyo">
                        {r && r.probabilidadOHKO > 0 ? (
                          <span className="text-alarma">
                            {(r.probabilidadOHKO * 100).toFixed(0)} % OHKO
                          </span>
                        ) : r?.golpesParaTumbar ? (
                          <span className="text-tinta-tenue">
                            {r.golpesParaTumbar} golpes
                          </span>
                        ) : null}
                      </span>
                      <span className="cifra w-[34px] shrink-0 text-right text-apoyo text-tinta-media">
                        ×{etiquetaMultiplicador(r?.efectividad ?? 1)}
                      </span>
                    </FilaElegible>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {elegido?.resultado ? (
          <div className="mt-7">
            <h2 className="rotulo border-b border-linea pb-2">
              Las dieciséis tiradas de {elegido.movimiento.nombre}
            </h2>
            <ol className="mt-3 flex flex-wrap gap-px bg-linea">
              {elegido.resultado.tiradas.map((d, i) => (
                <li
                  key={i}
                  className={`cifra flex-1 bg-panel px-1 py-1.5 text-center text-apoyo ${
                    d >= elegido.resultado!.psDefensor
                      ? "font-bold text-alarma"
                      : "text-tinta-media"
                  }`}
                  title={`${((d / elegido.resultado!.psDefensor) * 100).toFixed(1)} %`}
                >
                  {d}
                </li>
              ))}
            </ol>
            <p className="mt-2 text-apoyo leading-snug text-tinta-tenue">
              El motor tira un número de 0,85 a 1,00 en cada golpe: estos son los
              dieciséis daños posibles. En rojo, los que tumban de una. Nivel{" "}
              {NIVEL}, IVs en 31, con los puntos, la naturaleza, el objeto y el
              campo que pusiste arriba.
            </p>
          </div>
        ) : null}
      </section>
    </>
  );
}

function Grupo({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="rotulo">{rotulo}</span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}
