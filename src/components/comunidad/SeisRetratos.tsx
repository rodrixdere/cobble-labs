import Retrato from "@/components/Retrato";
import type { IndicePokemon } from "@/team/roster";
import { cx } from "@/ui/clases";

// Los seis de un equipo de un vistazo. Un slug que ya no esta en el roster deja
// su hueco en vez de correr a los demas.

const TAMANIOS = {
  normal: { caja: "h-11 w-11", lado: 40 },
  chico: { caja: "h-8 w-8", lado: 28 },
};

export default function SeisRetratos({
  especies,
  indice,
  tamanio = "normal",
}: {
  especies: string[];
  indice: IndicePokemon;
  tamanio?: keyof typeof TAMANIOS;
}) {
  const { caja, lado } = TAMANIOS[tamanio];
  return (
    <span className="flex shrink-0 gap-1">
      {especies.map((slug, i) => {
        const p = indice.get(slug);
        return (
          <span key={`${slug}-${i}`} className={cx("grid place-items-center", caja)}>
            {p ? <Retrato assets={p.assets} nombre={p.nombre} lado={lado} escalaMaxima={2} /> : null}
          </span>
        );
      })}
    </span>
  );
}
