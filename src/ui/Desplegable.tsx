"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

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
};

export default function Desplegable({
  etiqueta,
  titulo,
  children,
  lado = "izquierda",
  boton,
  panel,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);
  const idPanel = useId();

  const cerrar = () => {
    setAbierto(false);
    disparador.current?.focus();
  };

  useEffect(() => {
    if (!abierto) return;

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
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

  return (
    <div ref={caja} className="relative">
      <button
        ref={disparador}
        type="button"
        aria-expanded={abierto}
        aria-controls={idPanel}
        aria-label={titulo}
        onClick={() => setAbierto((v) => !v)}
        className={cx("transition-colors duration-150", boton)}
      >
        {etiqueta}
      </button>

      {abierto ? (
        <div
          id={idPanel}
          className={cx(
            "absolute top-[calc(100%+4px)] z-[var(--z-modal)] border border-linea-fuerte bg-panel shadow-[0_8px_24px_rgba(11,13,18,0.10)]",
            lado === "derecha" ? "right-0" : "left-0",
            panel
          )}
        >
          {children(cerrar)}
        </div>
      ) : null}
    </div>
  );
}
