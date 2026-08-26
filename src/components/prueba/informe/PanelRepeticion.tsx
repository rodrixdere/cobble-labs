import RepeticionCombate from "@/components/RepeticionCombate";
import type { ResultadoPrueba } from "@/simulation/prueba";
import type { Luchador } from "@/simulation/simulador";
import type { IndicePokemon } from "@/team/roster";

// Un combate entero, turno a turno. Se guardan enteros unos pocos a proposito:
// mil combates con todos sus turnos son decenas de megabytes que nadie mira.
// De los demas quedan las estadisticas.

export default function PanelRepeticion({
  resultado,
  equipo,
  indice,
}: {
  resultado: ResultadoPrueba;
  equipo: Luchador[];
  indice: IndicePokemon;
}) {
  const guardado = resultado.repeticiones[0];
  const assetsDe = (miembros: Luchador[]) =>
    miembros.map((l) => indice.get(l.slug)?.assets ?? "");

  if (!guardado) {
    return (
      <div className="border-t border-linea px-4 md:px-8 py-6">
        <p className="py-8 text-center text-lectura text-tinta-tenue">
          No se guardó ningún combate entero.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-linea px-4 md:px-8 py-6">
      <h3 className="rotulo border-b border-linea pb-2">
        {guardado.motivo} contra {guardado.rival.nombre}
      </h3>

      <div className="mt-4">
        <RepeticionCombate
          instantes={guardado.combate.instantes}
          desenlace={
            guardado.combate.gana === "a"
              ? `Ganás en ${guardado.combate.turnos} turnos`
              : `Perdés en ${guardado.combate.turnos} turnos`
          }
          ladoA={{
            rotulo: "Tu equipo",
            nombres: equipo.map((l) => l.nombre),
            assets: assetsDe(equipo),
            psMaximos: guardado.combate.psMaximosA,
          }}
          ladoB={{
            rotulo: guardado.rival.nombre,
            nombres: guardado.rival.miembros.map((l) => l.nombre),
            assets: assetsDe(guardado.rival.miembros),
            psMaximos: guardado.combate.psMaximosB,
          }}
        />
      </div>

      <p className="mt-3 text-apoyo leading-snug text-tinta-tenue">
        Se guardan enteros unos pocos combates a propósito: mil con sus turnos
        son decenas de megabytes que nadie mira. Del resto quedan las
        estadísticas.
      </p>
    </div>
  );
}
