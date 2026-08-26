import { Warning } from "@phosphor-icons/react";

import EtiquetaOrigen from "@/components/prueba/informe/EtiquetaOrigen";
import type { Diagnostico, ResultadoPrueba } from "@/simulation/prueba";
import { cx } from "@/ui/clases";

// Contra que tipo de equipo le fue bien y contra cual mal, y por que. Es la
// primera pestaña porque contesta la pregunta con la que uno corre la prueba.

const COLUMNAS = ["Arquetipo", "Combates", "Ganados", "Victorias"];

export default function PanelResumen({
  resultado,
  diagnostico,
}: {
  resultado: ResultadoPrueba;
  diagnostico: Diagnostico | null;
}) {
  return (
    <div className="grid gap-x-10 lg:grid-cols-2 border-t border-linea px-4 md:px-8 py-6">
      <div>
        <h3 className="rotulo border-b border-linea pb-2">
          Contra cada tipo de equipo
        </h3>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="border-b border-linea">
              {COLUMNAS.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={cx("rotulo py-1.5 font-normal", i > 0 && "text-right")}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resultado.porArquetipo.map((a) => (
              <tr key={a.arquetipo} className="border-b border-linea last:border-0">
                <th scope="row" className="py-1.5 font-normal">
                  <span className="text-lectura">{a.arquetipo}</span>
                  <EtiquetaOrigen real={a.esDatoReal} />
                </th>
                <td className="cifra py-1.5 text-right text-cuerpo text-tinta-media">
                  {a.combates}
                </td>
                <td className="cifra py-1.5 text-right text-cuerpo text-tinta-media">
                  {a.ganados}
                </td>
                <td
                  className={cx(
                    "cifra py-1.5 text-right text-lectura font-bold",
                    a.porcentaje >= 50 ? "text-acento-hondo" : "text-alarma"
                  )}
                >
                  {a.porcentaje.toFixed(0)} %
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        {diagnostico ? (
          <>
            <h3 className="rotulo border-b border-linea pb-2">Por qué se pierde</h3>
            <p className="mt-3 text-realce font-semibold">{diagnostico.problema}</p>
            <ul className="mt-2 space-y-1.5">
              {diagnostico.motivos.map((m) => (
                <li key={m} className="flex gap-2 text-lectura text-tinta-media">
                  <Warning
                    size={12}
                    aria-hidden
                    className="mt-1 shrink-0 text-ambar"
                  />
                  {m}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h3 className="rotulo border-b border-linea pb-2">Lectura</h3>
            <p className="mt-3 text-lectura text-tinta-media">
              No hay ningún arquetipo donde el equipo baje del 50 % con
              suficientes combates encima. El reparto está parejo.
            </p>
          </>
        )}

        {/* Lo que el numero NO dice, al lado del numero y no escondido en un
            pie de pagina: la letra es una etiqueta, no un tier. */}
        <p className="mt-5 border-t border-linea pt-4 text-cuerpo text-tinta-tenue">
          La letra sale del porcentaje: S desde 65, A desde 55, B desde 45, C
          desde 35, D abajo. El motor no modela estados, clima en combate,
          prioridad ni cambios: esto compara equipos entre sí, no predice una
          partida del servidor.
        </p>
      </div>
    </div>
  );
}
