import type { ResultadoPrueba } from "@/simulation/prueba";

// Quien te tumbo y cuanto aporto cada uno de los tuyos. Las dos listas salen de
// las bajas acumuladas de TODOS los combates, no de los pocos que quedan
// guardados enteros, y por eso el pie lo aclara.
export default function PanelAmenazas({
  resultado,
}: {
  resultado: ResultadoPrueba;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-10 border-t border-linea px-8 py-6">
      <div>
        <h3 className="rotulo border-b border-linea pb-2">
          Los que más te tumbaron
        </h3>

        {resultado.amenazas.length === 0 ? (
          <p className="mt-3 text-lectura text-tinta-media">
            Nadie te tumbó a nadie en toda la prueba.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-linea">
            {resultado.amenazas.map((a) => (
              <li
                key={a.slug}
                className="flex items-center justify-between py-2 text-lectura"
              >
                <span className="min-w-0 truncate">{a.nombre}</span>
                <span className="cifra shrink-0 text-cuerpo text-alarma">
                  {a.bajas}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="rotulo border-b border-linea pb-2">Cómo rindió cada uno</h3>

        <ul className="mt-2 divide-y divide-linea">
          {resultado.porMiembro
            .toSorted((a, b) => b.bajas - a.bajas)
            .map((m) => (
              <li
                key={m.slug}
                className="flex items-center justify-between py-2 text-lectura"
              >
                <span className="min-w-0 truncate">{m.nombre}</span>
                <span className="cifra shrink-0 text-cuerpo">
                  <span className="text-acento-hondo">{m.bajas}</span>
                  <span className="text-tinta-tenue"> tumbados · </span>
                  <span className="text-alarma">{m.caidas}</span>
                  <span className="text-tinta-tenue"> caídas</span>
                </span>
              </li>
            ))}
        </ul>

        <p className="mt-2 text-apoyo leading-snug text-tinta-tenue">
          Contado sobre los {resultado.combates} combates, no sobre los pocos que
          quedan guardados enteros.
        </p>
      </div>
    </div>
  );
}
