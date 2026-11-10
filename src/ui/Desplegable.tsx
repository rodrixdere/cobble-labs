"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { cx } from "@/ui/clases";

// Un boton que abre un panel: el menu de la cabecera y el filtro de tipos.
// Cierra con Escape y con un clic afuera, y devuelve el foco al boton, que son
// las tres cosas que se olvidan cuando cada pantalla se arma el suyo.

type Props = {
  /** Lo que se ve en el boton. */
  etiqueta: ReactNode;
  /** Para lectores de pantalla cuando la etiqueta es solo un icono. */
  titulo: string;
  children: (cerrar: () => void) => ReactNode;
  /** De que lado se ancla el panel. */
  lado?: "izquierda" | "derecha";
  /** Clases del boton. */
  boton?: string;
  /** Clases del panel. */
  panel?: string;
  /** El panel va en la capa superior (popover nativo), encima de todo: dentro
      de un modal o de una columna con scroll no lo recorta nada ni cambia el
      tamaño de lo que lo contiene. */
  enCapa?: boolean;
};

// Ubica el panel en capa bajo el boton, o arriba si abajo no entra. Deja en
// --alto-libre cuanto alto le queda, para que la lista de adentro se ajuste.
function ubicar(panel: HTMLElement, boton: HTMLElement) {
  const r = boton.getBoundingClientRect();
  const margen = 8;
  const abajo = innerHeight - r.bottom - margen;
  const arriba = r.top - margen;
  const haciaAbajo = abajo >= 280 || abajo >= arriba;
  panel.style.setProperty("--alto-libre", `${Math.max(140, (haciaAbajo ? abajo : arriba) - 64)}px`);
  panel.style.left = `${Math.min(Math.max(margen, r.left), innerWidth - panel.offsetWidth - margen)}px`;
  panel.style.top = haciaAbajo ? `${r.bottom + 4}px` : `${r.top - 4 - panel.offsetHeight}px`;
}

export default function Desplegable({
  etiqueta,
  titulo,
  children,
  lado = "izquierda",
  boton,
  panel,
  enCapa = false,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);
  const flotante = useRef<HTMLDivElement>(null);
  const idPanel = useId();

  const cerrar = () => {
    setAbierto(false);
    disparador.current?.focus();
  };

  useEffect(() => {
    if (!abierto) return;

    // preventDefault: si el desplegable esta dentro de un modal, Escape cierra
    // solo el desplegable y no el modal entero.
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      cerrar();
    };
    // pointerdown y no click: si no, un clic que abre otro desplegable cierra
    // este recien despues de que el otro se abrio, y parpadean los dos.
    const alApuntar = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };

    document.addEventListener("keydown", alTeclear);
    document.addEventListener("pointerdown", alApuntar);
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.removeEventListener("pointerdown", alApuntar);
    };
  }, [abierto]);

  // En capa: se muestra como popover y sigue al boton si la pagina o el modal scrollean
  useLayoutEffect(() => {
    const el = flotante.current;
    const btn = disparador.current;
    if (!enCapa || !abierto || !el || !btn) return;
    el.showPopover();
    const seguir = () => ubicar(el, btn);
    seguir();
    // El autoFocus de React corre antes de que el popover se vea, y ahi no toma
    el.querySelector("input")?.focus();
    const observador = new ResizeObserver(seguir);
    observador.observe(el);
    addEventListener("scroll", seguir, true);
    addEventListener("resize", seguir);
    return () => {
      observador.disconnect();
      removeEventListener("scroll", seguir, true);
      removeEventListener("resize", seguir);
    };
  }, [enCapa, abierto]);

  return (
    <div ref={caja} className="relative">
      <button
        ref={disparador}
        type="button"
        aria-expanded={abierto}
        aria-controls={idPanel}
        onClick={() => setAbierto((v) => !v)}
        className={cx("transition-colors duration-150", boton)}
      >
        {/* El nombre accesible incluye lo que se ve: un aria-label lo taparia */}
        <span className="sr-only">{titulo}, </span>
        {etiqueta}
      </button>

      {abierto ? (
        <div
          id={idPanel}
          ref={flotante}
          popover={enCapa ? "manual" : undefined}
          className={cx(
            "border border-linea-fuerte bg-panel shadow-[0_8px_24px_rgba(11,13,18,0.10)]",
            enCapa
              ? "fixed inset-auto m-0 p-0 text-tinta"
              : cx(
                  "absolute top-[calc(100%+4px)] z-[var(--z-modal)]",
                  lado === "derecha" ? "right-0" : "left-0"
                ),
            panel
          )}
        >
          {children(cerrar)}
        </div>
      ) : null}
    </div>
  );
}
