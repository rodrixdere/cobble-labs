"use client";

import RejillaDefensas from "@/components/RejillaDefensas";
import { ABREV_TIPO, NOMBRE_TIPO } from "@/data/pokemon";
import { NOMBRE_CLIMA, NOMBRE_TERRENO } from "@/analysis/campo";
import type { AnalisisDeEquipo } from "@/analysis/equipo";
import type { Amenaza } from "@/recommendations/motor";

// Todo lo que se puede decir de una composición sin inventar nada: sale de la
// tabla de tipos, de las stats y de los movimientos que el equipo lleva.
export default function AnalisisEquipo({
  analisis,
  amenazas,
}: {
  analisis: AnalisisDeEquipo;
  amenazas: Amenaza[];
}) {
  const { sinergia, cobertura, defensas, compartidas, ciegos, roles, campo, balance } =
    analisis;

  return (
    <section className="border-t border-linea">
      <div className="px-4 md:px-8 pb-4 pt-6">
        <h2 className="font-display text-titulo">
          Análisis del equipo
        </h2>
      </div>

      {/* Sinergia: el número con sus partes a la vista, no una nota mágica. */}
      <div className="grid gap-px border-t border-linea bg-linea lg:grid-cols-[260px_1fr]">
        <div className="min-w-0 bg-panel px-4 py-5 text-center md:px-6">
          <p className="rotulo">Sinergia</p>
          <p className="cifra mt-2 text-heroe text-acento-hondo">
            {sinergia.total}
          </p>
          <p className="mt-3 text-cuerpo leading-relaxed text-tinta-media">
            {sinergia.lectura}
          </p>
        </div>

        <div className="min-w-0 bg-panel px-4 py-5 md:px-6">
          <ul className="space-y-2">
            {/* En angosto el nombre se queda con la primera linea entera y la
                barra con sus dos cifras bajan a la segunda. */}
            {sinergia.componentes.map((c) => (
              <li
                key={c.nombre}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:flex-nowrap"
              >
                <span className="w-full text-cuerpo text-tinta-media sm:w-[190px] sm:shrink-0">
                  {c.nombre}
                </span>
                <span className="h-[7px] min-w-0 flex-1 bg-hueco">
                  <span
                    className={`block h-full ${
                      c.valor >= 60 ? "bg-acento" : c.valor >= 35 ? "bg-ambar" : "bg-alarma"
                    }`}
                    style={{ width: `${Math.min(100, c.valor)}%` }}
                  />
                </span>
                <span className="cifra w-[38px] shrink-0 text-right text-cuerpo">
                  {Math.round(c.valor)}
                </span>
                <span className="cifra w-[58px] shrink-0 whitespace-nowrap text-right text-menuda text-tinta-tenue">
                  peso {c.peso}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-y-8 border-t border-linea px-4 md:px-8 py-6 md:grid-cols-2 md:gap-x-10 md:gap-y-0">
        <RejillaDefensas
          valores={cobertura.map((c) => ({ tipo: c.tipo, x: c.mejor }))}
          sentido="ataque"
          titulo="Cobertura ofensiva"
          pie="La mejor efectividad que el equipo consigue contra cada tipo con los movimientos cargados."
        />

        <div>
          <h3 className="rotulo border-b border-linea pb-2">Defensas del equipo</h3>
          <ul className="mt-3 grid grid-cols-3 gap-px md:grid-cols-6 bg-linea">
            {defensas.map((d) => {
              const saldo = d.resisten + d.inmunes - d.debiles;
              return (
                <li
                  key={d.tipo}
                  className="bg-panel pb-1.5 text-center"
                  title={`${d.debiles} débiles, ${d.resisten} resisten, ${d.inmunes} inmunes`}
                >
                  <span
                    className="cifra block py-[3px] text-nota font-bold text-white"
                    style={{ background: `var(--color-tipo-${d.tipo})` }}
                  >
                    {ABREV_TIPO[d.tipo]}
                  </span>
                  <span
                    className={`cifra mt-1 block text-cuerpo font-bold ${
                      saldo > 0
                        ? "text-acento-hondo"
                        : saldo < 0
                          ? "text-alarma"
                          : "text-tinta-tenue"
                    }`}
                  >
                    {saldo > 0 ? `+${saldo}` : saldo}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-apoyo text-tinta-tenue">
            Cuántos resisten menos cuántos son débiles. En rojo, los tipos por
            los que el equipo pierde el cruce.
          </p>
        </div>
      </div>

      <div className="grid gap-y-8 border-t border-linea px-4 md:px-8 py-6 md:grid-cols-2 md:gap-x-10 lg:grid-cols-3">
        <div>
          <h3 className="rotulo border-b border-linea pb-2">Lo que está flojo</h3>
          <ul className="mt-3 space-y-2 text-lectura leading-relaxed text-tinta-media">
            {compartidas.length > 0 ? (
              <li>
                Debilidad compartida a{" "}
                <span className="font-semibold text-tinta">
                  {compartidas
                    .map((c) => `${NOMBRE_TIPO[c.tipo]} (${c.debiles})`)
                    .join(", ")}
                </span>
                .
              </li>
            ) : (
              <li>Ningún tipo le pega fuerte a la mitad o más del equipo.</li>
            )}

            {ciegos.length > 0 ? (
              <li>
                Nadie le pega súper efectivo a{" "}
                <span className="font-semibold text-tinta">
                  {ciegos.map((t) => NOMBRE_TIPO[t]).join(", ")}
                </span>
                .
              </li>
            ) : (
              <li>El equipo llega a los dieciocho tipos con lo que lleva.</li>
            )}

            {balance.desbalanceado ? (
              <li>
                El daño está casi todo de un lado:{" "}
                {balance.fisicos > balance.especiales
                  ? `${balance.fisicos} físicos`
                  : `${balance.especiales} especiales`}
                . Un muro del lado contrario lo frena entero.
              </li>
            ) : null}

            {campo.controlDeVelocidad.quienes.length === 0 ? (
              <li>
                Sin control de velocidad: contra algo más rápido no hay respuesta.
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <h3 className="rotulo border-b border-linea pb-2">Roles</h3>
          <ul className="mt-3 space-y-1">
            {roles.conteo.slice(0, 8).map((r) => (
              <li key={r.rol} className="flex items-center gap-3 text-cuerpo">
                <span className="flex-1 text-tinta-media">{r.rol}</span>
                <span className="cifra text-tinta">{r.cuantos}</span>
              </li>
            ))}
          </ul>
          <p className="cifra mt-3 border-t border-linea pt-2 text-apoyo text-tinta-tenue">
            {roles.fisicos} físicos · {roles.especiales} especiales
          </p>
        </div>

        <div>
          <h3 className="rotulo border-b border-linea pb-2">Campo y velocidad</h3>
          <ul className="mt-3 space-y-2 text-lectura leading-relaxed text-tinta-media">
            <li>
              Velocidad media a nivel 50:{" "}
              <span className="cifra text-tinta">
                {Math.round(campo.velocidadMedia)}
              </span>
            </li>

            <li>
              {campo.controlDeVelocidad.quienes.length > 0 ? (
                <>
                  Control de velocidad por{" "}
                  <span className="font-semibold text-tinta">
                    {campo.controlDeVelocidad.comos.join(", ")}
                  </span>
                  .
                </>
              ) : (
                "Sin control de velocidad."
              )}
            </li>

            <li>
              {campo.clima ? (
                <>
                  Clima:{" "}
                  <span className="font-semibold text-tinta">
                    {NOMBRE_CLIMA[campo.clima] ?? campo.clima}
                  </span>
                  , que pone {campo.quienPoneElClima.join(", ")}
                  {campo.quienLoAprovecha.length > 0
                    ? ` y aprovecha ${campo.quienLoAprovecha.join(", ")}`
                    : " (nadie lo aprovecha todavía)"}
                  .
                </>
              ) : (
                "Sin estrategia de clima."
              )}
            </li>

            <li>
              {campo.terreno ? (
                <>
                  Terreno:{" "}
                  <span className="font-semibold text-tinta">
                    {NOMBRE_TERRENO[campo.terreno] ?? campo.terreno}
                  </span>
                  .
                </>
              ) : (
                "Sin terreno."
              )}
            </li>

            <li>
              {campo.espacioRaro.activo
                ? `Espacio Raro por ${campo.espacioRaro.setters.join(", ")}, con ${campo.espacioRaro.lentos} lentos que lo aprovechan.`
                : "Sin Espacio Raro."}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-linea px-4 md:px-8 py-6">
        <h3 className="rotulo border-b border-linea pb-2">
          Las amenazas más grandes
        </h3>
        {amenazas.length === 0 ? (
          <p className="mt-3 text-lectura text-tinta-media">
            Ningún Pokémon del roster le pega súper efectivo a la mitad del
            equipo.
          </p>
        ) : (
          <ul className="mt-3 grid gap-y-2 md:grid-cols-2 md:gap-x-10 lg:grid-cols-3">
            {amenazas.map((a) => (
              <li key={a.slug} className="flex items-baseline gap-3">
                <span
                  className={`cifra shrink-0 px-1.5 py-[2px] text-nota font-bold uppercase ${
                    a.nivel === "alta"
                      ? "bg-alarma text-white"
                      : "bg-ambar-lavado text-ambar"
                  }`}
                >
                  {a.nivel}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lectura font-semibold">{a.nombre}</span>
                  <span className="block text-apoyo text-tinta-media">
                    {a.motivos.join(" · ")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-apoyo leading-snug text-tinta-tenue">
          Se mide con los tipos de sus movimientos por defecto y con la
          velocidad a nivel 50. No hay datos de uso del servidor, así que esto
          es amenaza teórica, no lo que más se juega.
        </p>
      </div>
    </section>
  );
}
