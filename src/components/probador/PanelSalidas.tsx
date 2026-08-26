import FilaDeAnalisis from "@/components/probador/FilaDeAnalisis";
import { COMBATES_POR_SALIDA, type Cruce } from "@/simulation/cruce";
import type { IndicePokemon } from "@/team/roster";

// Con quien conviene abrir. En singles la salida es un solo Pokemon, asi que
// se prueba a cada miembro de primero dejando al resto en el mismo orden: la
// unica variable que cambia entre una fila y la otra es quien sale.

export default function PanelSalidas({
  cruce,
  indice,
}: {
  cruce: Cruce;
  indice: IndicePokemon;
}) {
  return (
    <div className="mt-5">
      <p className="text-cuerpo text-tinta-tenue">
        Cada opción se probó {COMBATES_POR_SALIDA} veces poniéndola primero y
        dejando al resto en el mismo orden.
      </p>

      <ul className="mt-3 divide-y divide-linea border-y border-linea">
        {cruce.salidas.map((s, i) => {
          const luchador = cruce.equipoA.find((l) => l.slug === s.slug);
          return (
            <FilaDeAnalisis
              key={s.slug}
              pokemon={indice.get(s.slug)}
              nombre={s.nombre}
              detalle={luchador?.movimientos.map((m) => m.nombre).join(" · ")}
              posicion={i + 1}
              proporcion={s.porcentaje}
              favorable={s.porcentaje >= 50}
              cifra={`${s.porcentaje.toFixed(0)} %`}
            />
          );
        })}
      </ul>
    </div>
  );
}
