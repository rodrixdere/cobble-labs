"use client";

import { useState } from "react";

import { ABREV_TIPO, NOMBRE_TIPO, TIPOS } from "@/data/pokemon";
import { etiquetaMultiplicador, multiplicador } from "@/engine/tabla-tipos";

// Colores de celda. Van lavados a proposito: la tabla tiene 324 celdas y si
// cada una grita, no se lee ninguna. Lo neutro directamente no se pinta.
function fondo(x: number): string {
  if (x === 0) return "bg-tinta text-white";
  if (x === 2) return "bg-acento-lavado text-acento-hondo";
  if (x === 0.5) return "bg-alarma-lavado text-alarma";
  return "text-tinta-tenue";
}

export default function TablaTipos() {
  const [elegido, setElegido] = useState<string | null>(null);

  const atacando = elegido
    ? TIPOS.map((d) => ({ tipo: d, x: multiplicador(elegido, d) }))
    : [];
  const defendiendo = elegido
    ? TIPOS.map((a) => ({ tipo: a, x: multiplicador(a, elegido) }))
    : [];

  const lista = (fuente: { tipo: string; x: number }[], x: number) =>
    fuente
      .filter((f) => f.x === x)
      .map((f) => NOMBRE_TIPO[f.tipo])
      .join(", ");

  return (
    <>
      <div className="flex items-center gap-2 border-b border-linea px-4 md:px-8 py-3">
        <span className="rotulo">Resaltar</span>
        <div className="flex flex-wrap gap-1">
          {TIPOS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={elegido === t}
              onClick={() => setElegido(elegido === t ? null : t)}
              className={`cifra px-2 py-[3px] text-menuda font-bold text-white transition-opacity duration-150 ${
                elegido && elegido !== t ? "opacity-35" : "opacity-100"
              }`}
              style={{ background: `var(--color-tipo-${t})` }}
            >
              {ABREV_TIPO[t]}
            </button>
          ))}
        </div>
        {elegido ? (
          <button
            type="button"
            onClick={() => setElegido(null)}
            className="ml-auto text-cuerpo text-tinta-media underline underline-offset-4 transition-colors duration-150 hover:text-tinta"
          >
            Quitar el resaltado
          </button>
        ) : null}
      </div>

      {/* La tabla son 18 por 18 y no hay pantalla angosta que la contenga:
          scrollea adentro de su caja para que la pagina nunca se corra a lo
          ancho. La leyenda baja debajo cuando no entra al lado. */}
      <div className="grid lg:grid-cols-[auto_1fr]">
        {/* `relative` no es decorativo: cada celda lleva un span .sr-only, que
            es position:absolute. Sin un ancestro posicionado se resuelven
            contra el documento y lo estiran a lo ancho aunque midan un pixel,
            asi que el overflow de esta caja no alcanzaba a contenerlos. */}
        <div className="relative min-w-0 overflow-x-auto border-b border-linea px-4 py-6 md:px-8 lg:border-b-0 lg:border-r">
        <table className="border-collapse">
          <caption className="sr-only">
            Tabla de efectividad: cada fila es el tipo que ataca y cada columna
            el tipo que defiende
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="rotulo sticky left-0 z-10 bg-panel p-0 pr-2 text-right align-bottom"
              >
                Ataca ↓
              </th>
              {TIPOS.map((d) => (
                <th key={d} scope="col" className="p-0 align-bottom">
                  <span
                    className={`cifra mx-auto block w-[40px] py-1 text-nota font-bold text-white transition-opacity duration-150 ${
                      elegido && elegido !== d ? "opacity-40" : ""
                    }`}
                    style={{ background: `var(--color-tipo-${d})` }}
                    title={NOMBRE_TIPO[d]}
                  >
                    {ABREV_TIPO[d]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIPOS.map((a) => {
              const filaActiva = elegido === a;
              return (
                <tr key={a}>
                  {/* La etiqueta de la fila queda fija al correr la tabla: son
                      18 columnas y sin esto, apenas scrolleas, no sabes que
                      tipo estas leyendo. */}
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 bg-panel py-px pr-2 text-right transition-opacity duration-150 ${
                      elegido && !filaActiva ? "opacity-40" : ""
                    }`}
                  >
                    <span
                      className="cifra inline-block w-[40px] py-[4px] text-center text-nota font-bold text-white"
                      style={{ background: `var(--color-tipo-${a})` }}
                      title={NOMBRE_TIPO[a]}
                    >
                      {ABREV_TIPO[a]}
                    </span>
                  </th>
                  {TIPOS.map((d) => {
                    const x = multiplicador(a, d);
                    const columnaActiva = elegido === d;
                    const apagada = elegido && !filaActiva && !columnaActiva;
                    return (
                      <td
                        key={d}
                        className={`cifra h-[30px] w-[40px] border border-linea text-center text-cuerpo transition-opacity duration-150 ${fondo(x)} ${
                          apagada ? "opacity-30" : ""
                        }`}
                      >
                        <span className="sr-only">
                          {NOMBRE_TIPO[a]} contra {NOMBRE_TIPO[d]}:{" "}
                        </span>
                        {x === 1 ? "" : etiquetaMultiplicador(x)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        <div className="px-4 py-6 md:px-8">
          <h3 className="rotulo border-b border-linea pb-2">Leyenda</h3>
          <dl className="mt-3 space-y-1.5 text-lectura">
            {LEYENDA.map((l) => (
              <div key={l.valor} className="flex items-center gap-3">
                <dt
                  className={`cifra grid h-[26px] w-[40px] place-items-center border border-linea text-apoyo ${l.clase}`}
                >
                  {l.valor}
                </dt>
                <dd className="text-tinta-media">{l.texto}</dd>
              </div>
            ))}
          </dl>

          {elegido ? (
            <div aria-live="polite" className="mt-8">
              <h3 className="rotulo border-b border-linea pb-2">
                {NOMBRE_TIPO[elegido]}
              </h3>
              <dl className="mt-3 space-y-1 text-lectura">
                <Renglon termino="Pega doble a" valor={lista(atacando, 2)} tono="bien" />
                <Renglon termino="Le hace poco a" valor={lista(atacando, 0.5)} tono="mal" />
                <Renglon termino="No le hace nada a" valor={lista(atacando, 0)} tono="nulo" />
              </dl>
              <dl className="mt-4 space-y-1 border-t border-linea pt-3 text-lectura">
                <Renglon termino="Le pegan doble" valor={lista(defendiendo, 2)} tono="mal" />
                <Renglon termino="Resiste" valor={lista(defendiendo, 0.5)} tono="bien" />
                <Renglon termino="Es inmune a" valor={lista(defendiendo, 0)} tono="nulo" />
              </dl>
            </div>
          ) : (
            <p className="mt-8 max-w-[46ch] text-lectura leading-relaxed text-tinta-media">
              Elegí un tipo arriba y acá aparece, en palabras, a quién le pega
              fuerte, quién lo resiste y a quién no le hace nada. La fila y la
              columna de ese tipo quedan resaltadas en la tabla.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

const LEYENDA = [
  { valor: "2", texto: "Daño doble, súper efectivo", clase: "bg-acento-lavado text-acento-hondo font-bold" },
  { valor: "½", texto: "La mitad del daño, lo resiste", clase: "bg-alarma-lavado text-alarma font-bold" },
  { valor: "0", texto: "Nada de daño, es inmune", clase: "bg-tinta text-white font-bold" },
  { valor: "", texto: "Vacío: daño normal", clase: "text-tinta-tenue" },
];

function Renglon({
  termino,
  valor,
  tono,
}: {
  termino: string;
  valor: string;
  tono: "bien" | "mal" | "nulo";
}) {
  return (
    <div className="flex gap-3">
      <dt
        className={`w-[118px] shrink-0 font-semibold ${
          tono === "bien"
            ? "text-acento-hondo"
            : tono === "mal"
              ? "text-alarma"
              : "text-tinta"
        }`}
      >
        {termino}
      </dt>
      <dd className="flex-1 text-tinta-media">{valor || "nada"}</dd>
    </div>
  );
}
