import { ABREV_TIPO, NOMBRE_TIPO } from "@/data/pokemon";
import { etiquetaMultiplicador } from "@/engine/tabla-tipos";

// Los 18 tipos con lo que le hacen a este Pokemon. Lo neutro se apaga a
// proposito: la rejilla existe para que salten a la vista el x4 y el x0, no
// para leer dieciocho veces "x1".
export default function RejillaDefensas({
  valores,
  titulo,
  pie,
  acciones,
  sentido = "defensa",
}: {
  valores: { tipo: string; x: number }[];
  titulo: string;
  pie?: string;
  acciones?: React.ReactNode;
  // En defensa un x2 es malo y en cobertura es bueno: el color se da vuelta.
  sentido?: "defensa" | "ataque";
}) {
  const bueno = sentido === "ataque" ? "text-acento-hondo" : "text-alarma";
  const malo = sentido === "ataque" ? "text-tinta-tenue" : "text-acento-hondo";
  return (
    <div>
      <div className="flex items-center justify-between border-b border-linea pb-2">
        <h3 className="rotulo">{titulo}</h3>
        {acciones}
      </div>

      <ul className="mt-3 grid grid-cols-6 gap-px bg-linea">
        {valores.map(({ tipo, x }) => (
          <li
            key={tipo}
            className={`bg-panel px-1 pb-1.5 pt-0 text-center ${
              x === 1 ? "opacity-45" : ""
            }`}
          >
            <span
              className="cifra block py-[3px] text-nota font-bold text-white"
              style={{ background: `var(--color-tipo-${tipo})` }}
              title={NOMBRE_TIPO[tipo]}
            >
              {ABREV_TIPO[tipo]}
            </span>
            <span
              className={`cifra mt-1 block text-cuerpo ${
                x > 1
                  ? `font-bold ${bueno}`
                  : x < 1 && x > 0
                    ? `font-bold ${malo}`
                    : x === 0
                      ? "font-bold text-tinta"
                      : "text-tinta-tenue"
              }`}
            >
              {etiquetaMultiplicador(x)}
              <span className="text-nota">×</span>
            </span>
          </li>
        ))}
      </ul>

      {pie ? <p className="mt-2 text-apoyo text-tinta-tenue">{pie}</p> : null}
    </div>
  );
}
