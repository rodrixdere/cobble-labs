import { cx } from "@/ui/clases";

// Una de las tres fuentes de rivales. La etiqueta no es decoracion: arquetipos y
// aleatorios los arma el sitio, los guardados son del usuario, y quien lee el
// resultado tiene que saber contra que peleo.

export default function FuenteDeRivales({
  puesta,
  onCambiar,
  nombre,
  detalle,
  origen,
  deshabilitada,
}: {
  puesta: boolean;
  onCambiar: () => void;
  nombre: string;
  detalle: string;
  origen: "real" | "generado";
  deshabilitada?: boolean;
}) {
  return (
    <li>
      <label
        className={cx(
          "flex items-start gap-2.5",
          deshabilitada && "opacity-45"
        )}
      >
        <input
          type="checkbox"
          checked={puesta && !deshabilitada}
          disabled={deshabilitada}
          onChange={onCambiar}
          className="mt-1 accent-acento"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-lectura font-semibold">{nombre}</span>
            <span
              className={cx(
                "cifra px-1.5 py-[1px] text-nota uppercase",
                origen === "real"
                  ? "bg-acento-lavado text-acento-hondo"
                  : "bg-hueco text-tinta-tenue"
              )}
            >
              {origen === "real" ? "dato real" : "generado"}
            </span>
          </span>
          <span className="mt-0.5 block text-apoyo leading-snug text-tinta-media">
            {detalle}
          </span>
        </span>
      </label>
    </li>
  );
}
