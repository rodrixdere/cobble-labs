"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, useId, useRef, type ReactNode } from "react";

import Boton from "@/ui/Boton";
import { cx } from "@/ui/clases";

// Va sobre <dialog> nativo: showModal() ya trae foco atrapado, Escape y fondo
// inerte. Hecho con un div hay que escribir las tres cosas a mano.

type Props = {
  /** Siempre hace falta: es lo que nombra al dialogo para un lector de pantalla. */
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  /** Ancho del panel. `hoja` es para los que tienen que respirar. */
  ancho?: "angosto" | "medio" | "hoja";
  /** Deja el panel a lo alto y con scroll propio, para el editor de set. */
  alto?: boolean;
  /** Cabecera propia en vez del titulo, para el retrato y los tipos del editor. */
  cabecera?: ReactNode;
  /** Acciones extra al lado del boton de cerrar. */
  acciones?: ReactNode;
  /** Pie fijo abajo de todo, fuera del area que scrollea. */
  pie?: ReactNode;
};

// Ancho deseado con techo en el viewport: en un telefono el panel ocupa lo que
// haya menos un margen, y nunca empuja la pagina a lo ancho.
const ANCHOS = {
  angosto: "w-[calc(100vw-2rem)] max-w-[440px]",
  medio: "w-[calc(100vw-2rem)] max-w-[720px]",
  hoja: "w-[calc(100vw-2rem)] max-w-[1000px]",
};

export default function Modal({
  titulo,
  onCerrar,
  children,
  ancho = "medio",
  alto,
  cabecera,
  acciones,
  pie,
}: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const el = dialogo.current;
    if (!el || el.open) return;
    el.showModal();
    // El navegador no siempre bloquea el scroll del fondo: lo fijamos nosotros.
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, []);

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={idTitulo}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      onClick={(e) => {
        if (e.target === dialogo.current) onCerrar();
      }}
      className={cx(
        "m-0 max-h-[88vh] translate-x-[-50%] overflow-visible bg-transparent p-0",
        "fixed left-1/2 top-[8vh] backdrop:bg-tinta/25",
        alto && "top-[6vh]"
      )}
    >
      <div
        className={cx(
          "flex max-h-[88vh] flex-col border border-linea-fuerte bg-panel",
          "[overscroll-behavior:contain]",
          ANCHOS[ancho]
        )}
      >
        <div className="flex shrink-0 items-center gap-4 border-b border-linea px-5 py-3">
          {cabecera ?? (
            <h2 id={idTitulo} className="font-display text-guia">
              {titulo}
            </h2>
          )}
          {cabecera ? (
            <span id={idTitulo} className="sr-only">
              {titulo}
            </span>
          ) : null}

          <span className="ml-auto flex shrink-0 items-center gap-1">
            {acciones}
            <Boton variante="icono" aria-label="Cerrar" onClick={onCerrar}>
              <X size={14} weight="bold" aria-hidden />
            </Boton>
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {pie ? (
          <div className="shrink-0 border-t border-linea">{pie}</div>
        ) : null}
      </div>
    </dialog>
  );
}
