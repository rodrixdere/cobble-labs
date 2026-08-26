import Link from "next/link";

import { NOMBRE_RAREZA, NOMBRE_CONTEXTO } from "@/data/mundo";
import type { EvolucionLegible, LugarDeAparicion } from "@/data/mundo";

// Todo lo que la ficha sabe del Pokémon fuera del combate: cómo evoluciona,
// cómo se cría y dónde aparece. Sale del jar del servidor, incluido el
// spawn_pool_world, que es el archivo con el que el servidor decide qué sale
// en cada bioma.
export default function EnElJuego({
  evoluciones,
  preEvolucion,
  crianza,
  captura,
  lugares,
}: {
  evoluciones: EvolucionLegible[];
  preEvolucion: string | null;
  crianza: { rotulo: string; valor: string }[];
  captura: { rotulo: string; valor: string }[];
  lugares: LugarDeAparicion[];
}) {
  return (
    <div className="mt-6 space-y-8">
      <section>
        <h3 className="rotulo border-b border-linea pb-2">Evolución</h3>

        {preEvolucion || evoluciones.length > 0 ? (
          <div className="mt-3 space-y-2">
            {preEvolucion ? (
              <p className="text-lectura text-tinta-media">
                Evoluciona de{" "}
                <Enlace slug={preEvolucion}>
                  {preEvolucion.replace(/^./, (c) => c.toUpperCase())}
                </Enlace>
                .
              </p>
            ) : null}

            {evoluciones.map((e, i) => (
              <p key={i} className="text-lectura text-tinta-media">
                {e.desde ? (
                  <span className="font-semibold text-tinta">
                    La forma de {e.desde} evoluciona
                  </span>
                ) : (
                  "Evoluciona"
                )}{" "}
                a <Enlace slug={e.slug}>{e.a}</Enlace>{" "}
                <span className="text-tinta-tenue">
                  {e.como.toLowerCase()}
                  {e.detalles.length > 0 ? ` ${e.detalles.join(", ")}` : ""}
                </span>
                .
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-lectura text-tinta-media">
            No evoluciona ni viene de ninguna evolución.
          </p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-x-10">
        <section>
          <h3 className="rotulo border-b border-linea pb-2">Crianza</h3>
          <dl className="mt-2 divide-y divide-linea">
            {crianza.map((d) => (
              <div key={d.rotulo} className="flex items-baseline gap-3 py-2">
                <dt className="w-[130px] shrink-0 text-cuerpo text-tinta-media">
                  {d.rotulo}
                </dt>
                <dd className="flex-1 text-right text-cuerpo">{d.valor}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h3 className="rotulo border-b border-linea pb-2">Captura y crecimiento</h3>
          <dl className="mt-2 divide-y divide-linea">
            {captura.map((d) => (
              <div key={d.rotulo} className="flex items-baseline gap-3 py-2">
                <dt className="w-[130px] shrink-0 text-cuerpo text-tinta-media">
                  {d.rotulo}
                </dt>
                <dd className="flex-1 text-right text-cuerpo">{d.valor}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section>
        <h3 className="rotulo border-b border-linea pb-2">Dónde aparece</h3>

        {lugares.length === 0 ? (
          <p className="mt-3 max-w-[70ch] text-lectura leading-relaxed text-tinta-media">
            No aparece en el mundo por su cuenta. Se consigue evolucionando,
            criando o por algún otro medio que el archivo de apariciones no
            cubre.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-linea border-y border-linea">
            {lugares.map((l, i) => (
              <li key={i} className="flex items-baseline gap-4 py-2.5">
                <span
                  className={`cifra w-[86px] shrink-0 px-1.5 py-[2px] text-center text-nota font-bold uppercase ${
                    l.rareza === "common"
                      ? "bg-acento-lavado text-acento-hondo"
                      : l.rareza === "uncommon"
                        ? "bg-hueco text-tinta-media"
                        : "bg-ambar-lavado text-ambar"
                  }`}
                >
                  {NOMBRE_RAREZA[l.rareza] ?? l.rareza}
                </span>

                <span className="flex-1 text-lectura text-tinta-media">
                  {l.biomas.join(", ")}
                </span>

                <span className="cifra shrink-0 text-apoyo text-tinta-tenue">
                  {l.contexto ? NOMBRE_CONTEXTO[l.contexto] ?? l.contexto : ""}
                  {l.soloDeNoche ? " · De noche" : ""}
                  {l.nivel ? ` · Nv ${l.nivel}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-apoyo leading-snug text-tinta-tenue">
          Sale del spawn_pool_world del jar, que es el archivo con el que el
          servidor decide qué aparece en cada bioma. La rareza es el bucket que
          usa Cobblemon, no una estimación nuestra.
        </p>
      </section>
    </div>
  );
}

function Enlace({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <Link
      href={`/pokemon/${slug}`}
      className="font-semibold text-acento-hondo underline underline-offset-4 transition-colors duration-150 hover:text-tinta"
    >
      {children}
    </Link>
  );
}
