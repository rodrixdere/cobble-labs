"use client";

import { Check, Plus } from "@phosphor-icons/react";

import Retrato from "@/components/Retrato";
import { NOMBRE_TIPO } from "@/data/pokemon";
import {
  CRITERIOS,
  type Criterio,
  type Recomendacion,
  type Reemplazo,
} from "@/recommendations/motor";
import Opcion from "@/ui/Opcion";

// Las recomendaciones, justo debajo del equipo. Cada tarjeta dice por qué ese
// Pokémon mejora ESTE equipo: los motivos salen del cálculo, no de una lista
// de frases.
export default function Recomendaciones({
  recomendaciones,
  criterio,
  onCriterio,
  onAgregar,
  titulo,
  detalle,
}: {
  recomendaciones: Recomendacion[];
  criterio: Criterio;
  onCriterio: (c: Criterio) => void;
  onAgregar: (r: Recomendacion) => void;
  titulo: string;
  detalle: string;
}) {
  return (
    <section className="border-t border-linea">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 px-8 pb-4 pt-6">
        <div>
          <h2 className="font-display text-titulo">
            {titulo}
          </h2>
          <p className="mt-1 max-w-[70ch] text-lectura leading-relaxed text-tinta-media">
            {detalle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <span className="rotulo mr-1">Buscar</span>
          {CRITERIOS.map((c) => (
            <Opcion
              key={c.clave}
              puesta={criterio === c.clave}
              onElegir={() => onCriterio(c.clave)}
            >
              {c.nombre}
            </Opcion>
          ))}
        </div>
      </div>

      {recomendaciones.length === 0 ? (
        <p className="border-t border-linea px-8 py-10 text-center text-lectura text-tinta-tenue">
          Con ese criterio no hay ningún candidato que aporte algo que el equipo
          no tenga ya.
        </p>
      ) : (
        <ul className="grid grid-cols-5 gap-px border-t border-linea bg-linea">
          {recomendaciones.map((r) => (
            <li key={r.pokemon.slug} className="flex flex-col bg-panel">
              <div className="flex items-start gap-3 px-4 pt-4">
                <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center">
                  <Retrato
                    assets={r.pokemon.assets}
                    nombre={r.pokemon.nombre}
                    lado={52}
                    escalaMaxima={3}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-realce font-bold tracking-[-0.02em]">
                    {r.pokemon.nombre}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {r.pokemon.tipos.map((t) => (
                      <span
                        key={t}
                        className="cifra px-1.5 py-[2px] text-nota font-bold text-white"
                        style={{ background: `var(--color-tipo-${t})` }}
                      >
                        {NOMBRE_TIPO[t]}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="cifra shrink-0 text-right text-guia text-acento-hondo">
                  {r.puntaje}
                </span>
              </div>

              <p className="mt-2.5 px-4 text-apoyo text-tinta-tenue">
                {r.roles.slice(0, 2).join(" · ") || "Sin rol claro"}
              </p>

              <ul className="mt-3 flex-1 space-y-1.5 px-4">
                {r.razones.slice(0, 4).map((razon, i) => (
                  <li key={i} className="flex gap-1.5 text-cuerpo leading-snug text-tinta-media">
                    <Check
                      size={11}
                      weight="bold"
                      aria-hidden
                      className="mt-[3px] shrink-0 text-acento"
                    />
                    <span>{razon}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => onAgregar(r)}
                className="mt-4 flex items-center justify-center gap-1.5 border-t border-linea py-2.5 text-cuerpo font-semibold text-tinta-media transition-colors duration-150 hover:bg-acento-lavado hover:text-acento-hondo"
              >
                <Plus size={12} weight="bold" aria-hidden />
                Agregar al equipo
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Con los seis puestos, la pregunta deja de ser a quién sumar y pasa a ser qué
// cambiar. Cada fila compara la sinergia actual con la que quedaría.
export function Optimizacion({
  reemplazos,
  onCambiar,
}: {
  reemplazos: Reemplazo[];
  onCambiar: (r: Reemplazo) => void;
}) {
  if (reemplazos.length === 0) {
    return (
      <p className="border-t border-linea px-8 py-10 text-center text-lectura text-tinta-media">
        Ningún cambio de un solo Pokémon mejora la sinergia de este equipo.
        Para subirla más habría que tocar movimientos, objetos o naturalezas.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-linea border-t border-linea">
      {reemplazos.map((r) => (
        <li key={r.sale.pokemon.slug} className="flex items-center gap-5 px-8 py-3.5">
          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-10 items-center justify-center opacity-55">
              <Retrato
                assets={r.sale.pokemon.assets}
                nombre={r.sale.nombre}
                lado={36}
                escalaMaxima={2}
              />
            </span>
            <span className="w-[104px] text-lectura text-tinta-media line-through">
              {r.sale.nombre}
            </span>
          </span>

          <span aria-hidden className="text-tinta-tenue">
            →
          </span>

          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-10 items-center justify-center">
              <Retrato
                assets={r.entra.pokemon.assets}
                nombre={r.entra.pokemon.nombre}
                lado={36}
                escalaMaxima={2}
              />
            </span>
            <span className="w-[104px] text-lectura font-semibold">
              {r.entra.pokemon.nombre}
            </span>
          </span>

          <span className="min-w-0 flex-1 truncate text-cuerpo text-tinta-media">
            {r.entra.razones[0]}
          </span>

          <span className="cifra shrink-0 text-lectura font-bold text-acento-hondo">
            +{r.mejora} sinergia
          </span>

          <button
            type="button"
            onClick={() => onCambiar(r)}
            className="shrink-0 rounded-pieza border border-linea-fuerte px-3 py-1.5 text-cuerpo font-semibold text-tinta-media transition-colors duration-150 hover:border-tinta-tenue hover:text-tinta"
          >
            Hacer el cambio
          </button>
        </li>
      ))}
    </ul>
  );
}
