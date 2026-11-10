import Retrato from "@/components/Retrato";
import type { MovimientoCatalogo } from "@/team/combate";
import { NATURALEZAS, objetoPorClave } from "@/team/conjunto";
import { desdeCadena } from "@/team/formato";
import type { IndicePokemon } from "@/team/roster";

// Los seis sets completos, para ver un equipo por dentro sin cargarlo en el
// armador: habilidad, objeto, naturaleza y los cuatro movimientos.

type Props = { cadena: string; indice: IndicePokemon; catalogo: MovimientoCatalogo[] };

export default function SetsDelEquipo({ cadena, indice, catalogo }: Props) {
  const nombreMovimiento = (clave: string) => catalogo.find((m) => m.clave === clave)?.nombre ?? clave;

  return (
    <ul className="grid gap-px bg-linea sm:grid-cols-2 lg:grid-cols-3">
      {desdeCadena(cadena).map((c, i) => {
        const p = indice.get(c.slug);
        if (!p) return null;

        const forma = c.forma ? p.formas.find((f) => f.clave === c.forma) : null;
        const habilidad = (forma?.habilidades ?? p.habilidades).find((h) => h.clave === c.habilidad);
        const objeto = objetoPorClave(c.objeto);
        const naturaleza = NATURALEZAS.find((n) => n.clave === c.naturaleza);

        return (
          <li key={`${c.slug}-${i}`} className="flex gap-3 bg-panel px-4 py-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center">
              <Retrato assets={p.assets} forma={c.forma} nombre={p.nombre} lado={44} escalaMaxima={3} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-lectura font-semibold">
                {forma ? `${p.nombre} (${forma.etiqueta})` : p.nombre}
              </span>
              <span className="block truncate text-apoyo text-tinta-media">
                {habilidad?.nombre ?? "Sin habilidad"}
                {objeto.clave === "ninguno" ? "" : `, ${objeto.nombre}`}
              </span>
              {naturaleza ? (
                <span className="block truncate text-apoyo text-tinta-tenue">{naturaleza.nombre}</span>
              ) : null}
              <ul className="mt-1.5 space-y-0.5">
                {c.movimientos.map((m) => (
                  <li key={m} className="truncate text-cuerpo">
                    {nombreMovimiento(m)}
                  </li>
                ))}
              </ul>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
