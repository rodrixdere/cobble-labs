import Retrato from "@/components/Retrato";
import type { Luchador } from "@/simulation/simulador";
import type { IndicePokemon } from "@/team/roster";
import { cx } from "@/ui/clases";

// El porcentaje de victorias de un bando, con su alineacion abajo. El que va a
// la derecha se alinea al reves para que los dos marcadores se lean hacia el
// centro, donde esta el promedio de turnos.

export default function Marcador({
  rotulo,
  porcentaje,
  ganados,
  perdidos,
  equipo,
  indice,
  gana,
  derecha,
}: {
  rotulo: string;
  porcentaje: number;
  ganados: number;
  perdidos: number;
  equipo: Luchador[];
  indice: IndicePokemon;
  gana: boolean;
  derecha?: boolean;
}) {
  return (
    <div className={derecha ? "text-right" : undefined}>
      <p className="rotulo">{rotulo}</p>
      <p
        className={cx(
          "cifra mt-1.5 text-cifra font-bold",
          gana ? "text-acento-hondo" : "text-tinta"
        )}
      >
        {porcentaje.toFixed(1)} %
      </p>
      <p className="cifra mt-1.5 text-apoyo text-tinta-tenue">
        {ganados}G · {perdidos}P
      </p>

      <ul className={cx("mt-2 flex gap-1", derecha && "justify-end")}>
        {equipo.map((l, i) => {
          const p = indice.get(l.slug);
          return (
            <li
              key={`${l.slug}-${i}`}
              className="flex h-8 w-8 items-center justify-center"
            >
              {p ? (
                <Retrato
                  assets={p.assets}
                  forma={l.conjunto.forma}
                  nombre={l.nombre}
                  lado={30}
                  escalaMaxima={2}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
