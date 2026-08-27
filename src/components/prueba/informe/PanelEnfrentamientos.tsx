import EtiquetaOrigen from "@/components/prueba/informe/EtiquetaOrigen";
import type { ResultadoPrueba } from "@/simulation/prueba";
import Barra from "@/ui/Barra";

// Cada equipo del pool por separado, del peor cruce al mejor. El promedio tapa
// los cruces malos: aca se ven de a uno.
export default function PanelEnfrentamientos({
  resultado,
}: {
  resultado: ResultadoPrueba;
}) {
  return (
    <div className="border-t border-linea px-4 md:px-8 py-6">
      <p className="text-cuerpo text-tinta-tenue">
        Cada equipo rival del pool, del peor cruce al mejor.
      </p>

      <ul className="mt-3 divide-y divide-linea border-y border-linea">
        {resultado.porRival.map((r) => (
          // En angosto la barra baja a su propia linea: el resto de la fila son
          // palabras y numeros que no se pueden achicar.
          <li
            key={r.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 sm:flex-nowrap sm:gap-4"
          >
            <span className="cifra w-[52px] shrink-0 text-lectura font-bold">
              {r.porcentaje.toFixed(0)} %
            </span>

            <Barra
              valor={r.porcentaje}
              alto="fino"
              tono={r.porcentaje >= 50 ? "acento" : "alarma"}
              etiqueta={`Victorias contra ${r.nombre}`}
              ubicacion="order-last w-full sm:order-none sm:w-[90px] sm:shrink-0"
            />

            <span className="min-w-0 flex-1 truncate text-lectura sm:w-[150px] sm:flex-none">
              {r.nombre}
            </span>
            <span className="min-w-0 flex-1 text-cuerpo text-tinta-media">
              {r.arquetipo}
              <EtiquetaOrigen real={r.esDatoReal} />
            </span>
            <span className="cifra shrink-0 text-apoyo text-tinta-tenue">
              {r.ganados}/{r.combates}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
