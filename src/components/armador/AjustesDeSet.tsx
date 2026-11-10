import type { Ajuste } from "@/recommendations/ajustes";

// Lo que se puede mejorar sin cambiar a nadie: forma, movimientos, habilidad y
// naturaleza de cada miembro, cada uno con su motivo y un botón para aplicarlo.

export default function AjustesDeSet({
  ajustes,
  onAplicar,
}: {
  ajustes: Ajuste[];
  onAplicar: (a: Ajuste) => void;
}) {
  return (
    <div className="border-t border-linea">
      <div className="px-4 md:px-8 pb-3 pt-6">
        <h3 className="font-display text-subtitulo">Ajustes de set</h3>
        <p className="mt-1 max-w-[70ch] text-lectura text-tinta-media">
          Sin cambiar a nadie: la forma, los movimientos, la habilidad y la naturaleza de cada uno.
        </p>
      </div>
      {ajustes.length === 0 ? (
        <p className="border-t border-linea px-4 md:px-8 py-8 text-center text-lectura text-tinta-media">
          Los sets ya están en lo que este análisis sabe mejorar.
        </p>
      ) : (
        <ul className="divide-y divide-linea border-t border-linea">
          {ajustes.map((a) => (
            <li
              key={`${a.indice}-${a.que}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3.5 md:flex-nowrap md:px-8"
            >
              <span className="w-full text-lectura font-semibold md:w-[150px] md:shrink-0 md:truncate">{a.quien}</span>
              <span className="rotulo md:w-[96px] md:shrink-0">{a.que}</span>
              <span className="min-w-0 text-lectura md:w-[260px] md:shrink-0">
                {a.antes ? (
                  <span className="text-tinta-media line-through">{a.antes}</span>
                ) : (
                  <span className="text-tinta-media">Hueco libre</span>
                )}
                <span aria-hidden className="px-1.5 text-tinta-tenue">→</span>
                <span className="sr-only"> por </span>
                <span className="font-semibold">{a.despues}</span>
              </span>
              <span className="min-w-0 basis-full text-cuerpo leading-snug text-tinta-media md:flex-1 md:basis-auto">
                {a.motivo}
              </span>
              <button
                type="button"
                onClick={() => onAplicar(a)}
                className="ml-auto shrink-0 rounded-pieza border border-linea-fuerte px-3 py-1.5 text-cuerpo font-semibold text-tinta-media transition-colors duration-150 hover:border-tinta-tenue hover:text-tinta md:ml-0"
              >
                Aplicar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
