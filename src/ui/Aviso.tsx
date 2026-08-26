import { Warning } from "@phosphor-icons/react";
import type { ReactNode } from "react";

import { cx } from "@/ui/clases";

// La franja de mensaje que cruza la hoja. Tres tonos:
//
//   dato   -> salio bien o hay novedad ("Enlace copiado")
//   reparo -> anda pero algo no cierra
//   error  -> algo mal que impide seguir
//
// Con aria-live porque aparecen despues de una accion, sin mover el foco.
type Tono = "dato" | "reparo" | "error";

const POR_TONO: Record<Tono, string> = {
  dato: "bg-acento-lavado text-acento-hondo",
  reparo: "bg-ambar-lavado text-ambar",
  error: "bg-alarma-lavado text-alarma",
};

export default function Aviso({
  tono = "dato",
  children,
  ubicacion,
}: {
  tono?: Tono;
  children: ReactNode;
  ubicacion?: string;
}) {
  return (
    <p
      aria-live="polite"
      className={cx(
        "flex items-center gap-2 border-b border-linea px-4 md:px-8 py-2 text-cuerpo",
        POR_TONO[tono],
        ubicacion
      )}
    >
      {tono === "error" ? <Warning size={12} weight="bold" aria-hidden /> : null}
      {children}
    </p>
  );
}
