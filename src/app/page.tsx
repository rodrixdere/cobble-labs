import { Suspense } from "react";

import Explorador from "@/components/Explorador";
import { POKEMON, paraRejilla } from "@/data/pokemon";
import { TOTAL_MOVIMIENTOS } from "@/data/textos";

const rejilla = POKEMON.map(paraRejilla);
const CON_FORMAS = rejilla.filter((p) => p.formas > 0).length;

const CIFRAS = [
  { valor: POKEMON.length, rotulo: "especies" },
  { valor: CON_FORMAS, rotulo: "con formas" },
  { valor: TOTAL_MOVIMIENTOS, rotulo: "movimientos" },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-[1400px] hoja">
      <div className="flex items-end justify-between gap-10 px-8 pb-6 pt-9">
        <div>
          <h1 className="font-display text-portada">
            Pokédex
          </h1>
          <p className="mt-3 max-w-[54ch] text-realce leading-relaxed text-tinta-media">
            Todo lo que el servidor tiene habilitado, leído del mismo jar de
            Cobblemon que corre. Stats base, habilidades, movimientos, formas
            regionales y megaevoluciones.
          </p>
        </div>

        <dl className="flex shrink-0 gap-8 pb-1">
          {CIFRAS.map((c) => (
            <div key={c.rotulo}>
              <dt className="rotulo">{c.rotulo}</dt>
              <dd className="cifra mt-1.5 text-capitulo">
                {c.valor}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <Suspense
        fallback={
          <div className="border-t border-linea px-8 py-28 text-center text-lectura text-tinta-tenue">
            Cargando el índice…
          </div>
        }
      >
        <Explorador pokemon={rejilla} />
      </Suspense>
    </main>
  );
}
