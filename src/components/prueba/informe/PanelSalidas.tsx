import type { Cuarteto, ResultadoPrueba } from "@/simulation/prueba";
import Barra from "@/ui/Barra";

// Con cual conviene abrir, y cual es el mejor subconjunto de cuatro.
//
// Los cuartetos se miden aparte y no salen de esta prueba: en singles entran los
// seis, asi que cada cuarteto tuvo que pelear sus propios combates.

export default function PanelSalidas({
  resultado,
  cuartetos,
}: {
  resultado: ResultadoPrueba;
  cuartetos: Cuarteto[];
}) {
  // Los que nunca salieron primero van al fondo: un null no es un cero.
  const porSalida = resultado.porMiembro.toSorted(
    (a, b) => (b.porcentajeComoSalida ?? -1) - (a.porcentajeComoSalida ?? -1)
  );

  return (
    <div className="grid gap-x-10 lg:grid-cols-2 border-t border-linea px-4 md:px-8 py-6">
      <div>
        <h3 className="rotulo border-b border-linea pb-2">
          Con cuál conviene abrir
        </h3>

        <ul className="mt-2 divide-y divide-linea">
          {porSalida.map((m) => (
            <li key={m.slug} className="flex items-center gap-3 py-2">
              <span className="min-w-0 flex-1 truncate text-lectura">
                {m.nombre}
              </span>
              <span className="cifra shrink-0 text-apoyo text-tinta-tenue">
                {m.comoSalida} salidas
              </span>

              <Barra
                valor={m.porcentajeComoSalida ?? 0}
                alto="fino"
                tono={(m.porcentajeComoSalida ?? 0) >= 50 ? "acento" : "alarma"}
                etiqueta={`Victorias abriendo con ${m.nombre}`}
                ubicacion="w-[80px] shrink-0"
              />

              <span className="cifra w-[44px] shrink-0 text-right text-cuerpo">
                {m.porcentajeComoSalida === null
                  ? "-"
                  : `${m.porcentajeComoSalida.toFixed(0)} %`}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="rotulo border-b border-linea pb-2">Los mejores cuatro</h3>

        {cuartetos.length === 0 ? (
          <p className="mt-3 text-lectura text-tinta-media">
            Hacen falta al menos cinco para que haya cuartetos que comparar.
          </p>
        ) : (
          <>
            <ul className="mt-2 divide-y divide-linea">
              {cuartetos.map((c) => (
                <li
                  key={c.slugs.join("-")}
                  className="flex items-center gap-3 py-2 text-cuerpo"
                >
                  <span className="min-w-0 flex-1 truncate text-tinta-media">
                    {c.nombres.join(", ")}
                  </span>
                  <span className="cifra shrink-0 text-apoyo text-tinta-tenue">
                    {c.combates}
                  </span>
                  <span className="cifra w-[44px] shrink-0 text-right font-bold">
                    {c.porcentaje.toFixed(0)} %
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-2 text-apoyo leading-snug text-tinta-tenue">
              En singles entran los seis, así que esto se mide aparte: cada
              cuarteto peleó sus propios combates contra una muestra del pool.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
