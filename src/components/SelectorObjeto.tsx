"use client";

import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { useState } from "react";

import { ABREV_TIPO, NOMBRE_TIPO, TIPOS } from "@/data/pokemon";
import { CATEGORIAS_DE_OBJETO, describirEfecto, tipoDelObjeto } from "@/engine/objetos";
import { coincide, porComienzo } from "@/lib/busqueda";
import { OBJETOS_CON_EFECTO, SIN_OBJETO, objetoPorClave, type Objeto } from "@/team/conjunto";
import Desplegable from "@/ui/Desplegable";
import FilaElegible from "@/ui/FilaElegible";

// El selector de objeto, con su ícono y un buscador: con solo el nombre muchos
// se confunden. Sin buscar, van agrupados por para qué sirven, y los de un tipo
// en el orden de la tabla de tipos. Buscando, una sola lista con los que
// empiezan por lo escrito primero. Si un equipo viejo o importado trae un
// objeto sin efecto, aparece igual y aparte, para no borrarlo sin avisar.

const porClave = new Map(OBJETOS_CON_EFECTO.map((o) => [o.clave, o]));
const ordenDeTipo = (o: Objeto) => TIPOS.indexOf((tipoDelObjeto(o.clave) ?? "") as (typeof TIPOS)[number]);
const GRUPOS = CATEGORIAS_DE_OBJETO.map((c) => ({
  nombre: c.nombre,
  objetos: c.claves
    .map((k) => porClave.get(k))
    .filter((o): o is Objeto => Boolean(o))
    .toSorted((a, b) => ordenDeTipo(a) - ordenDeTipo(b)),
}));

// Lo que se puede escribir para encontrarlo: nombre, efecto y, si tiene, el tipo
const textoDe = (o: Objeto) => {
  const tipo = tipoDelObjeto(o.clave);
  return [o.nombre, describirEfecto(o.clave) ?? "", tipo ? NOMBRE_TIPO[tipo] : ""].join(" ");
};

function Icono({ clave }: { clave: string }) {
  if (clave === SIN_OBJETO.clave) return <span aria-hidden className="h-6 w-6 shrink-0" />;
  return (
    // Salen del jar con scripts/iconos-objetos.mjs: 16 px de pixel art, al doble y sin suavizar
    <img src={`/cobblemon/objetos/${clave}.png`} alt="" width={24} height={24} className="pixel h-6 w-6 shrink-0" />
  );
}

function Fila({ o, puesta, onElegir }: { o: Objeto; puesta: boolean; onElegir: () => void }) {
  const tipo = tipoDelObjeto(o.clave);
  return (
    <li>
      <FilaElegible puesta={puesta} onElegir={onElegir} holgura="apretada">
        <Icono clave={o.clave} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-cuerpo">{o.nombre}</span>
            {tipo ? (
              <span
                className="cifra shrink-0 px-1 py-[1px] text-nota font-bold text-white"
                style={{ background: `var(--color-tipo-${tipo})` }}
              >
                {ABREV_TIPO[tipo]}
              </span>
            ) : null}
          </span>
          {o.clave === SIN_OBJETO.clave ? null : (
            <span className="line-clamp-2 text-apoyo leading-snug text-tinta-media">
              {describirEfecto(o.clave) ?? "Sin efecto en la simulación"}
            </span>
          )}
        </span>
      </FilaElegible>
    </li>
  );
}

export default function SelectorObjeto({
  valor,
  onCambiar,
  titulo,
}: {
  valor: string;
  onCambiar: (clave: string) => void;
  titulo: string;
}) {
  const [busqueda, setBusqueda] = useState("");
  const actual = objetoPorClave(valor);
  const ofrecido = valor === SIN_OBJETO.clave || porClave.has(valor);
  const grupos = [
    { nombre: "", objetos: [SIN_OBJETO] },
    ...GRUPOS,
    ...(ofrecido ? [] : [{ nombre: "Sin efecto en la simulación", objetos: [actual] }]),
  ];
  const hallados = busqueda.trim()
    ? porComienzo(
        grupos.flatMap((g) => g.objetos).filter((o) => coincide(textoDe(o), busqueda)),
        (o) => o.nombre,
        busqueda
      )
    : null;

  return (
    <Desplegable
      titulo={titulo}
      enCapa
      panel="w-[320px] max-w-[calc(100vw-16px)] py-1"
      boton="flex w-full items-center gap-2 rounded-pieza border border-linea-fuerte bg-panel px-2 py-1 text-left text-cuerpo text-tinta hover:border-tinta-tenue"
      etiqueta={
        <>
          <Icono clave={actual.clave} />
          <span className="min-w-0 flex-1 truncate">{actual.nombre}</span>
          <CaretDown size={13} aria-hidden className="shrink-0 text-tinta-media" />
        </>
      }
    >
      {(cerrar) => {
        const elegir = (clave: string) => {
          onCambiar(clave);
          setBusqueda("");
          cerrar();
        };
        return (
          <>
            <div className="relative mx-2 mb-1">
              <MagnifyingGlass size={14} aria-hidden className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-tinta-media" />
              <input
                type="search"
                autoFocus
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && hallados?.[0]) {
                    e.preventDefault();
                    elegir(hallados[0].clave);
                  }
                }}
                placeholder="Nombre, efecto o tipo"
                aria-label="Buscar objeto"
                className="w-full rounded-pieza border border-linea-fuerte bg-panel py-1.5 pl-7 pr-2 text-cuerpo outline-none focus:border-acento"
              />
            </div>
            <div className="max-h-[min(340px,var(--alto-libre,340px))] overflow-y-auto overscroll-contain">
              {hallados ? (
                hallados.length ? (
                  <ul>
                    {hallados.map((o) => (
                      <Fila key={o.clave} o={o} puesta={o.clave === valor} onElegir={() => elegir(o.clave)} />
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-4 text-center text-cuerpo text-tinta-media">Ningún objeto con eso</p>
                )
              ) : (
                grupos.map((g) => (
                  <section key={g.nombre || "ninguno"} aria-label={g.nombre || undefined}>
                    {g.nombre ? <h4 className="rotulo px-3 pb-1 pt-3">{g.nombre}</h4> : null}
                    <ul>
                      {g.objetos.map((o) => (
                        <Fila key={o.clave} o={o} puesta={o.clave === valor} onElegir={() => elegir(o.clave)} />
                      ))}
                    </ul>
                  </section>
                ))
              )}
            </div>
          </>
        );
      }}
    </Desplegable>
  );
}
