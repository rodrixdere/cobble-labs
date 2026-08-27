"use client";

import { useMemo, useState } from "react";

import { ABREV_TIPO, NOMBRE_TIPO } from "@/data/pokemon";

export type MovimientoFicha = {
  clave: string;
  nombre: string;
  desc: string;
  fuente: string;
  grupo: string;
  nivel: number;
  tipo: string;
  categoria: string;
  potencia: number;
  precision: number | null;
  pp: number;
};

const CATEGORIAS = [
  { clave: "physical", nombre: "Físico" },
  { clave: "special", nombre: "Especial" },
  { clave: "status", nombre: "Estado" },
];

export default function ListaMovimientos({
  movimientos,
}: {
  movimientos: MovimientoFicha[];
}) {
  const [grupo, setGrupo] = useState("todos");
  const [categoria, setCategoria] = useState("todas");

  const grupos = useMemo(() => {
    const vistos = new Map<string, number>();
    for (const m of movimientos) vistos.set(m.grupo, (vistos.get(m.grupo) ?? 0) + 1);
    return [...vistos.entries()];
  }, [movimientos]);

  const visibles = useMemo(
    () =>
      movimientos.filter(
        (m) =>
          (grupo === "todos" || m.grupo === grupo) &&
          (categoria === "todas" || m.categoria === categoria)
      ),
    [movimientos, grupo, categoria]
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-linea pb-3">
        <h3 className="rotulo">
          {visibles.length} movimiento{visibles.length === 1 ? "" : "s"}
        </h3>

        <div className="flex flex-wrap items-center gap-1">
          <Filtro
            activo={grupo === "todos"}
            onClick={() => setGrupo("todos")}
            texto="Todos"
          />
          {grupos.map(([nombre, cuantos]) => (
            <Filtro
              key={nombre}
              activo={grupo === nombre}
              onClick={() => setGrupo(nombre)}
              texto={`${nombre} ${cuantos}`}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1 lg:ml-auto">
          <Filtro
            activo={categoria === "todas"}
            onClick={() => setCategoria("todas")}
            texto="Toda categoría"
          />
          {CATEGORIAS.map((c) => (
            <Filtro
              key={c.clave}
              activo={categoria === c.clave}
              onClick={() => setCategoria(c.clave)}
              texto={c.nombre}
            />
          ))}
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="py-12 text-center text-lectura text-tinta-tenue">
          No aprende movimientos de esa categoría por esa vía.
        </p>
      ) : (
        // Siete columnas: en angosto la tabla corre a lo ancho en vez de
        // apretar los numeros hasta que dejen de compararse.
        <div className="overflow-x-auto">
          <table className="mt-1 w-full min-w-[520px] text-left">
            <caption className="sr-only">
              Movimientos que puede aprender, con su tipo, categoría, potencia,
              precisión y PP
            </caption>
            <thead>
              <tr className="border-b border-linea">
                {["Movimiento", "Tipo", "Cat.", "Pot.", "Prec.", "PP", "Vía"].map(
                  (encabezado, i) => (
                    <th
                      key={encabezado}
                      scope="col"
                      className={`rotulo py-2 font-normal ${i === 0 ? "" : "text-right"}`}
                    >
                      {encabezado}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {visibles.map((m) => (
                <tr
                  key={`${m.grupo}-${m.clave}`}
                  className="border-b border-linea align-top last:border-b-0"
                >
                  <th scope="row" className="max-w-[26rem] py-2 pr-4 font-normal">
                    <span className="block text-lectura font-semibold">
                      {m.nombre}
                    </span>
                    {m.desc ? (
                      <span className="mt-0.5 block text-cuerpo leading-snug text-tinta-media">
                        {m.desc}
                      </span>
                    ) : null}
                  </th>
                  <td className="py-2 text-right">
                    <span
                      className="cifra inline-block px-1.5 py-[2px] text-nota font-bold text-white"
                      style={{ background: `var(--color-tipo-${m.tipo})` }}
                      title={NOMBRE_TIPO[m.tipo]}
                    >
                      {ABREV_TIPO[m.tipo]}
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 text-right text-cuerpo text-tinta-media">
                    {CATEGORIAS.find((c) => c.clave === m.categoria)?.nombre}
                  </td>
                  <td className="cifra py-2.5 pl-3 text-right text-cuerpo">
                    {m.potencia > 0 ? m.potencia : "-"}
                  </td>
                  <td className="cifra py-2.5 pl-3 text-right text-cuerpo text-tinta-media">
                    {m.precision === null ? "-" : m.precision}
                  </td>
                  <td className="cifra py-2.5 pl-3 text-right text-cuerpo text-tinta-media">
                    {m.pp}
                  </td>
                  <td className="py-2.5 pl-3 text-right text-cuerpo text-tinta-tenue">
                    {m.fuente}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Filtro({
  activo,
  onClick,
  texto,
}: {
  activo: boolean;
  onClick: () => void;
  texto: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`rounded-pieza px-2 py-1 text-cuerpo transition-colors duration-150 ${
        activo
          ? "bg-tinta font-semibold text-white"
          : "text-tinta-media hover:bg-hueco hover:text-tinta"
      }`}
    >
      {texto}
    </button>
  );
}
