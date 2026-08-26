import { cx } from "@/ui/clases";

// La barra de proporcion de stats, salidas, impacto y repeticion. Lo unico que
// cambia entre una y otra es el alto.
//
// Lleva role="meter" con sus valores: la cifra esta al lado, pero la barra
// tambien tiene que decir cuanto vale por si sola.

type Tono = "acento" | "alarma" | "tinta";

const RELLENO: Record<Tono, string> = {
  acento: "bg-acento",
  alarma: "bg-alarma",
  tinta: "bg-tinta",
};

const ALTOS = { fino: "h-[6px]", medio: "h-[7px]", grueso: "h-[8px]" };

export default function Barra({
  valor,
  tono = "acento",
  alto = "medio",
  etiqueta,
  ubicacion,
}: {
  /** De 0 a 100. Se recorta, que un dato fuera de rango no desborde el track. */
  valor: number;
  tono?: Tono;
  alto?: keyof typeof ALTOS;
  etiqueta?: string;
  ubicacion?: string;
}) {
  const acotado = Math.max(0, Math.min(100, valor));

  return (
    <span
      role="meter"
      aria-valuenow={Math.round(acotado)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={etiqueta}
      className={cx("block bg-hueco", ALTOS[alto], ubicacion)}
    >
      <span
        className={cx("block h-full transition-[width] duration-500 ease-salida", RELLENO[tono])}
        style={{ width: `${acotado}%` }}
      />
    </span>
  );
}
