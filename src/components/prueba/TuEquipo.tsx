import { ArrowsClockwise } from "@phosphor-icons/react";

import Retrato from "@/components/Retrato";
import { NOMBRE_TIPO } from "@/data/pokemon";
import type { Luchador } from "@/simulation/simulador";
import type { IndicePokemon } from "@/team/roster";
import Boton from "@/ui/Boton";

// El equipo que se va a probar, en una tira de seis. No se edita desde aca: el
// set se toca en Equipos, y este panel solo muestra con que se esta corriendo.

export default function TuEquipo({
  equipo,
  indice,
  onRecargar,
}: {
  equipo: Luchador[];
  indice: IndicePokemon;
  onRecargar: () => void;
}) {
  return (
    <div className="bg-panel px-4 md:px-8 py-6">
      <div className="flex items-baseline justify-between border-b border-linea pb-2">
        <h2 className="rotulo">Tu equipo</h2>
        <Boton variante="enlace" onClick={onRecargar}>
          <ArrowsClockwise size={12} aria-hidden />
          Volver a cargarlo del armador
        </Boton>
      </div>

      {equipo.length === 0 ? (
        <p className="py-10 text-center text-lectura text-tinta-media">
          No hay ningún equipo armado. Andá a Equipos, armá uno y volvé con el
          botón <span className="font-semibold">Probar mi equipo</span>.
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-3 gap-px md:grid-cols-6 bg-linea">
          {equipo.map((l, i) => {
            const p = indice.get(l.slug);
            return (
              <li
                key={`${l.slug}-${i}`}
                className="bg-panel px-2 py-3 text-center"
              >
                {p ? (
                  <Retrato
                    assets={p.assets}
                    forma={l.conjunto.forma}
                    nombre={l.nombre}
                    lado={44}
                    escalaMaxima={3}
                  />
                ) : null}
                <span className="mt-1 block truncate text-apoyo font-semibold">
                  {l.nombre}
                </span>
                <span className="block truncate text-menuda text-tinta-tenue">
                  {l.tipos.map((t) => NOMBRE_TIPO[t]).join(" · ")}
                </span>
                <span className="cifra mt-0.5 block text-nota text-tinta-tenue">
                  {l.movimientos.length}/4 mov
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
