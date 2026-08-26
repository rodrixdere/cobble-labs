import type { ReactNode } from "react";

import { cx } from "@/ui/clases";

// Un valor que se prende y apaga dentro de un grupo: filtros, criterios,
// combates. Es un boton con estado, no de accion, y por eso lleva aria-pressed.
//
//   solida   -> elegir uno de pocos, y el elegido se ve macizo
//   contorno -> filtros que se acumulan, donde el acento marca lo prendido
type Estilo = "solida" | "contorno";

const APAGADA: Record<Estilo, string> = {
  solida: "text-tinta-media hover:bg-hueco hover:text-tinta",
  contorno:
    "border border-linea-fuerte text-tinta-media hover:border-tinta-tenue hover:text-tinta",
};

const PRENDIDA: Record<Estilo, string> = {
  solida: "bg-tinta font-semibold text-white",
  contorno: "border border-acento bg-acento-lavado font-semibold text-acento-hondo",
};

type Props = {
  puesta: boolean;
  onElegir: () => void;
  children: ReactNode;
  estilo?: Estilo;
  /** Cifras en mono y tabular, para que no bailen al cambiar. */
  mono?: boolean;
  /** Clases de posicion (`flex-1`, `min-w-[52px]`). No de estilo. */
  ubicacion?: string;
};

export default function Opcion({
  puesta,
  onElegir,
  children,
  estilo = "solida",
  mono,
  ubicacion,
}: Props) {
  return (
    <button
      type="button"
      aria-pressed={puesta}
      onClick={onElegir}
      className={cx(
        "rounded-pieza px-2.5 py-1 text-cuerpo transition-colors duration-150",
        puesta ? PRENDIDA[estilo] : APAGADA[estilo],
        mono && "cifra",
        ubicacion
      )}
    >
      {children}
    </button>
  );
}
