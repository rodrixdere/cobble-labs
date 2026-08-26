import FilaDeAnalisis from "@/components/probador/FilaDeAnalisis";
import { COMBATES_POR_IMPACTO, type Cruce } from "@/simulation/cruce";
import type { IndicePokemon } from "@/team/roster";

// Cuanto pesa cada miembro: se corre la serie sin el y se mide cuanto baja el
// porcentaje. Una caida grande quiere decir que sin ese el equipo se cae; una
// caida negativa, que el equipo anda mejor sin el contra este rival.

// La caida se lleva a la escala de la barra multiplicando por dos: caidas de
// mas de cincuenta puntos no existen en la practica, y sin el factor todas las
// barras quedarian pegadas a la izquierda y no se distinguiria ninguna.
const ESCALA_DE_BARRA = 2;

export default function PanelImpacto({
  cruce,
  indice,
}: {
  cruce: Cruce;
  indice: IndicePokemon;
}) {
  return (
    <div className="mt-5">
      <p className="text-cuerpo text-tinta-tenue">
        Cuánto cae el porcentaje de victorias si sacás a cada uno del equipo,
        sobre {COMBATES_POR_IMPACTO} combates por prueba. Un número alto quiere
        decir que sin él el equipo se cae.
      </p>

      {cruce.impacto.length === 0 ? (
        <p className="mt-4 text-lectura text-tinta-media">
          Con un solo Pokémon no hay nada que sacar.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-linea border-y border-linea">
          {cruce.impacto.map((im) => (
            <FilaDeAnalisis
              key={im.slug}
              pokemon={indice.get(im.slug)}
              nombre={im.nombre}
              proporcion={Math.abs(im.caida) * ESCALA_DE_BARRA}
              favorable={im.caida >= 0}
              cifra={`${im.caida >= 0 ? "-" : "+"}${Math.abs(im.caida).toFixed(1)} %`}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
