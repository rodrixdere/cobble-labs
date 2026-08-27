import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "@/ui/clases";

// Las cinco formas que toma un boton. Si algo no entra en ninguna, casi siempre
// es una celda que se puede clickear, y esa se estila donde vive.
//
//   principal -> la accion de la pantalla. Una sola por pantalla.
//   contorno  -> accion real pero secundaria
//   plano     -> las de la barra de acciones, que son muchas
//   enlace    -> accion menor dentro de un texto
//   icono     -> solo simbolo, con aria-label obligatorio
export type Variante = "principal" | "contorno" | "plano" | "enlace" | "icono";

const POR_VARIANTE: Record<Variante, string> = {
  principal:
    "rounded-pieza bg-acento px-4 py-2 text-lectura font-semibold text-white hover:bg-acento-hondo",
  contorno:
    "rounded-pieza border border-linea-fuerte px-3 py-1.5 text-cuerpo font-semibold text-tinta-media hover:border-tinta-tenue hover:text-tinta",
  plano:
    "rounded-pieza px-2.5 py-1.5 text-cuerpo text-tinta-media hover:bg-hueco hover:text-tinta disabled:hover:bg-transparent",
  enlace:
    "py-1 text-cuerpo text-tinta-media underline underline-offset-4 hover:text-tinta",
  icono:
    "grid place-items-center rounded-pieza text-tinta-media hover:bg-hueco hover:text-tinta",
};

// Rojo solo al pasar por encima: en reposo no tiene por que gritar.
const ALARMA: Record<Variante, string> = {
  principal: "bg-alarma hover:bg-alarma",
  contorno: "hover:border-alarma hover:text-alarma",
  plano: "hover:text-alarma",
  enlace: "hover:text-alarma",
  icono: "hover:text-alarma",
};

// Ninguna baja de 24px: abajo de eso no se le pega con el dedo.
const MEDIDA_ICONO = { chico: "h-6 w-6", medio: "h-7 w-7", grande: "h-8 w-8" };

type Comunes = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  children: ReactNode;
  /** Rojo al pasar por encima, para quitar y borrar. */
  alarma?: boolean;
  /** Clases de posicion (`ml-auto`, `w-full`, `mt-3`). No de estilo. */
  ubicacion?: string;
};

type Props = Comunes &
  (
    | { variante: "icono"; medida?: keyof typeof MEDIDA_ICONO; "aria-label": string }
    | { variante?: Exclude<Variante, "icono">; medida?: never; "aria-label"?: string }
  );

export default function Boton({
  variante = "plano",
  medida = "medio",
  alarma,
  ubicacion,
  children,
  ...resto
}: Props) {
  return (
    <button
      type="button"
      {...resto}
      className={cx(
        "inline-flex items-center gap-1.5 transition-colors duration-150 disabled:opacity-40",
        POR_VARIANTE[variante],
        variante === "icono" && MEDIDA_ICONO[medida],
        alarma && ALARMA[variante],
        ubicacion
      )}
    >
      {children}
    </button>
  );
}
