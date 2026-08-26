import type { ReactNode } from "react";

import { cx } from "@/ui/clases";

// La fila de una lista que se elige: movimientos, habilidades, tipos. Lo puesto
// se marca con la regla de la izquierda, no con un fondo macizo.

export default function FilaElegible({
  puesta,
  onElegir,
  children,
  apagada,
  /** Espaciado vertical: las listas largas van mas apretadas. */
  holgura = "normal",
}: {
  puesta: boolean;
  onElegir: () => void;
  children: ReactNode;
  /** Con los cuatro movimientos puestos: se apaga y ademas no responde. */
  apagada?: boolean;
  holgura?: "apretada" | "normal";
}) {
  return (
    <button
      type="button"
      disabled={apagada}
      aria-pressed={puesta}
      onClick={onElegir}
      className={cx(
        "flex w-full items-center gap-2.5 border-l-2 pl-2.5 pr-1 text-left transition-colors duration-150",
        holgura === "apretada" ? "py-[5px]" : "py-2.5",
        puesta
          ? "border-l-acento bg-acento-lavado"
          : "border-l-transparent hover:bg-hueco",
        apagada && "opacity-35"
      )}
    >
      {children}
    </button>
  );
}
