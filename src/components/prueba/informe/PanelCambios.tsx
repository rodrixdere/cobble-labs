import type { Comparacion } from "@/simulation/prueba";
import type { Luchador } from "@/simulation/simulador";
import type { IndicePokemon } from "@/team/roster";
import Boton from "@/ui/Boton";
import { cx } from "@/ui/clases";

export type Cambio = {
  sale: string;
  entra: string;
  comparacion: Comparacion;
};

// Probar un reemplazo de verdad: se saca a uno, entra el mejor candidato para
// ese hueco y se vuelve a correr la misma prueba con la misma semilla. La
// diferencia sale de esa segunda simulacion, no de estimarla, y por eso tarda.

export default function PanelCambios({
  equipo,
  indice,
  cambio,
  corriendo,
  onProbarCambio,
}: {
  equipo: Luchador[];
  indice: IndicePokemon;
  cambio: Cambio | null;
  corriendo: boolean;
  onProbarCambio: (i: number) => void;
}) {
  const nombre = (slug: string) => indice.get(slug)?.nombre ?? slug;

  return (
    <div className="border-t border-linea px-4 md:px-8 py-6">
      <p className="text-cuerpo text-tinta-media">
        Se saca a uno, entra el mejor candidato para ese hueco y se corre la
        misma prueba con la misma semilla. El porcentaje de mejora sale de esa
        segunda simulación, no de una estimación.
      </p>

      <div className="mt-3 flex flex-wrap gap-1">
        {equipo.map((l, i) => (
          <Boton
            key={`${l.slug}-${i}`}
            variante="contorno"
            disabled={corriendo}
            onClick={() => onProbarCambio(i)}
          >
            Reemplazar a {l.nombre}
          </Boton>
        ))}
      </div>

      {cambio ? (
        <div className="mt-5 grid grid-cols-3 gap-px bg-linea">
          <Columna rotulo="Como está" valor={cambio.comparacion.antes} />
          <Columna
            rotulo={`Con ${nombre(cambio.entra)}`}
            valor={cambio.comparacion.despues}
            tono="acento"
          />
          <Columna
            rotulo="Diferencia"
            valor={cambio.comparacion.diferencia}
            tono={cambio.comparacion.diferencia >= 0 ? "acento" : "alarma"}
            conSigno
          />

          <p className="col-span-3 bg-panel px-4 py-2.5 text-center text-cuerpo text-tinta-media">
            {cambio.comparacion.lectura} Sale {nombre(cambio.sale)}, entra{" "}
            {nombre(cambio.entra)}, sobre {cambio.comparacion.combates} combates
            de cada lado.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Columna({
  rotulo,
  valor,
  tono,
  conSigno,
}: {
  rotulo: string;
  valor: number;
  tono?: "acento" | "alarma";
  conSigno?: boolean;
}) {
  return (
    <div className="bg-panel py-3 text-center">
      <p className="rotulo">{rotulo}</p>
      <p
        className={cx(
          "cifra mt-1.5 text-capitulo",
          tono === "acento" && "text-acento-hondo",
          tono === "alarma" && "text-alarma"
        )}
      >
        {conSigno && valor >= 0 ? "+" : ""}
        {valor.toFixed(1)}
        {conSigno ? "" : " %"}
      </p>
    </div>
  );
}
