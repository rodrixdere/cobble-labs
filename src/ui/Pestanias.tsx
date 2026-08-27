"use client";

import { useId, useRef, type ReactNode } from "react";

import { cx } from "@/ui/clases";

// La tira de pestañas, con semantica tablist / tab / tabpanel y flechas.
//
// El contenido va como funcion y no como JSX armado: asi solo se calcula el
// panel visible. Varios son informes de simulacion caros.

export type Pestania<C extends string> = {
  clave: C;
  nombre: string;
  contenido: () => ReactNode;
};

type Props<C extends string> = {
  pestanias: readonly Pestania<C>[];
  activa: C;
  onCambiar: (clave: C) => void;
};

export default function Pestanias<C extends string>({
  pestanias,
  activa,
  onCambiar,
}: Props<C>) {
  const base = useId();
  const tira = useRef<HTMLDivElement>(null);

  const idTab = (clave: C) => `${base}-tab-${clave}`;
  const idPanel = (clave: C) => `${base}-panel-${clave}`;

  // Flechas para moverse entre pestañas, con vuelta al principio. Inicio y Fin
  // saltan a los extremos, que es lo que hace cualquier tablist nativo.
  const mover = (tecla: string) => {
    const saltos: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    const actual = pestanias.findIndex((p) => p.clave === activa);
    let destino: number;
    if (tecla === "Home") destino = 0;
    else if (tecla === "End") destino = pestanias.length - 1;
    else if (tecla in saltos)
      destino = (actual + saltos[tecla] + pestanias.length) % pestanias.length;
    else return false;

    onCambiar(pestanias[destino].clave);
    tira.current
      ?.querySelectorAll<HTMLButtonElement>("[role=tab]")
      [destino]?.focus();
    return true;
  };

  const visible = pestanias.find((p) => p.clave === activa);

  return (
    <>
      <div
        ref={tira}
        role="tablist"
        onKeyDown={(e) => {
          if (mover(e.key)) e.preventDefault();
        }}
        // Corre a lo ancho antes que partir una pestaña en dos lineas. El margen
        // negativo deja aire para que el foco no se recorte en los extremos.
        className="tira -mx-1 flex items-center gap-1 border-b border-linea px-1 pb-3"
      >
        {pestanias.map((p) => {
          const puesta = p.clave === activa;
          return (
            <button
              key={p.clave}
              type="button"
              role="tab"
              id={idTab(p.clave)}
              aria-selected={puesta}
              aria-controls={idPanel(p.clave)}
              tabIndex={puesta ? 0 : -1}
              onClick={() => onCambiar(p.clave)}
              className={cx(
                "shrink-0 whitespace-nowrap rounded-pieza px-3 py-1.5 text-lectura transition-colors duration-150",
                puesta
                  ? "bg-hueco font-semibold text-tinta"
                  : "text-tinta-media hover:bg-hueco hover:text-tinta"
              )}
            >
              {p.nombre}
            </button>
          );
        })}
      </div>

      {visible ? (
        <div
          role="tabpanel"
          id={idPanel(visible.clave)}
          aria-labelledby={idTab(visible.clave)}
          tabIndex={0}
        >
          {visible.contenido()}
        </div>
      ) : null}
    </>
  );
}
