import { NOMBRE_STAT, ORDEN_STATS, STAT_MAXIMA, suma, type Stats } from "@/data/pokemon";

// Las barras se miden contra la stat mas alta que existe en el roster, no
// contra el 255 teorico: asi un 135 de ataque se ve como lo que es, cerca del
// techo real del servidor. El color es el del tipo principal, que es lo que le
// da a cada ficha su propia temperatura sin pintar la seccion entera.
export default function BarrasStats({
  stats,
  tipo,
  comparar,
}: {
  stats: Stats;
  tipo: string;
  comparar?: Stats;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between border-b border-linea pb-2">
        <h3 className="rotulo">Stats base</h3>
        <p className="cifra text-lectura">
          <span className="rotulo mr-2">Total</span>
          {suma(stats)}
          {comparar ? (
            <span className="ml-2 text-acento-hondo">
              {suma(stats) - suma(comparar) > 0 ? "+" : ""}
              {suma(stats) - suma(comparar)}
            </span>
          ) : null}
        </p>
      </div>

      <dl className="mt-3 space-y-2">
        {ORDEN_STATS.map((clave) => {
          const valor = stats[clave];
          const previo = comparar?.[clave];
          const diferencia = previo === undefined ? 0 : valor - previo;
          return (
            <div key={clave} className="flex items-center gap-3">
              <dt className="w-[86px] shrink-0 text-cuerpo text-tinta-media">
                {NOMBRE_STAT[clave]}
              </dt>
              <dd className="cifra w-[42px] shrink-0 text-lectura tabular-nums">
                {valor}
              </dd>
              <dd className="h-[6px] flex-1 bg-hueco">
                <div
                  className="h-full transition-[width] duration-300 ease-salida"
                  style={{
                    width: `${Math.round((valor / STAT_MAXIMA) * 100)}%`,
                    background: `var(--color-tipo-${tipo})`,
                  }}
                />
              </dd>
              <dd className="cifra w-[36px] shrink-0 text-right text-apoyo">
                {diferencia !== 0 ? (
                  <span
                    className={
                      diferencia > 0 ? "text-acento-hondo" : "text-tinta-tenue"
                    }
                  >
                    {diferencia > 0 ? "+" : ""}
                    {diferencia}
                  </span>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
