"use client";

import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useDeferredValue, useMemo, useState } from "react";

import CeldaPokemon from "@/components/CeldaPokemon";
import { NOMBRE_TIPO, TIPOS, type PokemonEnRejilla } from "@/data/pokemon";
import Opcion from "@/ui/Opcion";
import FilaElegible from "@/ui/FilaElegible";

type Orden = "dex" | "total" | "nombre";

const ORDENES: { clave: Orden; nombre: string }[] = [
  { clave: "dex", nombre: "Nº" },
  { clave: "total", nombre: "Total" },
  { clave: "nombre", nombre: "A-Z" },
];

function lista(valor: string | null): string[] {
  return valor ? valor.split(",").filter(Boolean) : [];
}

export default function Explorador({
  pokemon,
}: {
  pokemon: PokemonEnRejilla[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  // El estado vive en la URL para que un filtro compartido en Discord llegue
  // filtrado. El texto del buscador se guarda ademas en estado local: escribir
  // no puede depender de un round trip del router.
  const consultaUrl = params.get("q") ?? "";
  const [consulta, setConsulta] = useState(consultaUrl);
  const consultaLenta = useDeferredValue(consulta);

  // Las generaciones que existen de verdad en el roster, no una lista fija.
  const generaciones = useMemo(
    () => [...new Set(pokemon.map((p) => p.generacion))].filter(Boolean).toSorted((a, b) => a - b),
    [pokemon]
  );

  const tiposElegidos = useMemo(() => lista(params.get("tipo")), [params]);
  const gensElegidas = useMemo(() => lista(params.get("gen")).map(Number), [params]);
  const orden = (params.get("orden") as Orden) ?? "dex";

  const escribirUrl = useCallback(
    (cambios: Record<string, string | null>) => {
      const siguiente = new URLSearchParams(params.toString());
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor) siguiente.set(clave, valor);
        else siguiente.delete(clave);
      }
      const cadena = siguiente.toString();
      router.replace(cadena ? `/?${cadena}` : "/", { scroll: false });
    },
    [params, router]
  );

  const alternar = useCallback(
    (clave: "tipo" | "gen", valor: string) => {
      const actuales = lista(params.get(clave));
      const siguientes = actuales.includes(valor)
        ? actuales.filter((v) => v !== valor)
        : [...actuales, valor];
      escribirUrl({ [clave]: siguientes.join(",") || null });
    },
    [params, escribirUrl]
  );

  // Los conteos por tipo se calculan sobre el texto y la generacion, pero no
  // sobre los tipos ya elegidos: asi la lista sigue diciendo cuantos hay de
  // cada tipo mientras se combinan filtros.
  const previos = useMemo(() => {
    const texto = consultaLenta.trim().toLowerCase();
    return pokemon.filter((p) => {
      if (gensElegidas.length && !gensElegidas.includes(p.generacion)) return false;
      if (!texto) return true;
      return (
        p.nombre.toLowerCase().includes(texto) ||
        String(p.dex).padStart(3, "0").includes(texto)
      );
    });
  }, [pokemon, consultaLenta, gensElegidas]);

  const conteoPorTipo = useMemo(() => {
    const cuenta: Record<string, number> = {};
    for (const p of previos) for (const t of p.tipos) cuenta[t] = (cuenta[t] ?? 0) + 1;
    return cuenta;
  }, [previos]);

  const resultado = useMemo(() => {
    const filtrados = tiposElegidos.length
      ? previos.filter((p) => p.tipos.some((t) => tiposElegidos.includes(t)))
      : previos;

    if (orden === "dex") return filtrados;
    return filtrados.toSorted((a, b) =>
      orden === "total"
        ? b.total - a.total
        : a.nombre.localeCompare(b.nombre, "es")
    );
  }, [previos, tiposElegidos, orden]);

  const hayFiltros =
    consulta.length > 0 || tiposElegidos.length > 0 || gensElegidas.length > 0;

  const limpiar = () => {
    setConsulta("");
    router.replace("/", { scroll: false });
  };

  return (
    <div className="grid grid-cols-[248px_1fr] border-t border-linea">
      <aside className="sticky top-[var(--alto-cabecera)] h-[calc(100dvh-var(--alto-cabecera))] overflow-y-auto border-r border-linea px-5 py-5">
        <label className="relative block">
          <span className="sr-only">Buscar por nombre o número</span>
          <MagnifyingGlass
            size={15}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tinta-tenue"
          />
          <input
            type="search"
            name="buscar"
            autoComplete="off"
            spellCheck={false}
            value={consulta}
            onChange={(e) => {
              setConsulta(e.target.value);
              escribirUrl({ q: e.target.value || null });
            }}
            placeholder="Charizard, 006…"
            className="w-full rounded-pieza border border-linea-fuerte bg-fondo py-2 pl-9 pr-3 text-lectura outline-none transition-colors duration-150 placeholder:text-tinta-tenue focus:border-acento"
          />
        </label>

        <h2 className="rotulo mt-7">Generación</h2>
        <div className="mt-2.5 flex flex-wrap gap-1">
          {generaciones.map((g) => {
            const activa = gensElegidas.includes(g);
            return (
              <Opcion
                key={g}
                estilo="contorno"
                puesta={activa}
                onElegir={() => alternar("gen", String(g))}
                ubicacion="min-w-[52px] flex-1 justify-center"
              >
                Gen {g}
              </Opcion>
            );
          })}
        </div>

        <h2 className="rotulo mt-7">Tipo</h2>
        <ul className="mt-2">
          {TIPOS.map((t) => {
            const activo = tiposElegidos.includes(t);
            const cuenta = conteoPorTipo[t] ?? 0;
            return (
              <li key={t}>
                <FilaElegible
                  puesta={activo}
                  holgura="apretada"
                  onElegir={() => alternar("tipo", t)}
                >
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0"
                    style={{ background: `var(--color-tipo-${t})` }}
                  />
                  <span className="flex-1 truncate text-lectura">
                    {NOMBRE_TIPO[t]}
                  </span>
                  <span className="cifra text-apoyo text-tinta-tenue">
                    {cuenta}
                  </span>
                </FilaElegible>
              </li>
            );
          })}
        </ul>

        {hayFiltros ? (
          <button
            type="button"
            onClick={limpiar}
            className="mt-5 w-full rounded-pieza border border-linea-fuerte py-1.5 text-cuerpo font-semibold text-tinta-media transition-colors duration-150 hover:border-tinta-tenue hover:text-tinta"
          >
            Limpiar filtros
          </button>
        ) : null}
      </aside>

      <section>
        <div className="flex items-center justify-between border-b border-linea px-5 py-2.5">
          <p aria-live="polite" className="cifra text-apoyo text-tinta-media">
            {resultado.length}{" "}
            <span className="text-tinta-tenue">de {pokemon.length}</span>
          </p>

          <div className="flex items-center gap-1">
            <span className="rotulo mr-1">Orden</span>
            {ORDENES.map((o) => (
              <Opcion
                key={o.clave}
                puesta={orden === o.clave}
                onElegir={() =>
                  escribirUrl({ orden: o.clave === "dex" ? null : o.clave })
                }
              >
                {o.nombre}
              </Opcion>
            ))}
          </div>
        </div>

        {resultado.length === 0 ? (
          <div className="px-5 py-28 text-center">
            <p className="font-display text-lg font-bold tracking-[-0.02em]">
              Nada con esos filtros
            </p>
            <p className="mx-auto mt-2 max-w-[42ch] text-lectura leading-relaxed text-tinta-media">
              Probá con menos tipos, otra generación, o revisá cómo escribiste
              el nombre.
            </p>
            <button
              type="button"
              onClick={limpiar}
              className="mt-5 rounded-pieza border border-linea-fuerte px-3 py-1.5 text-cuerpo font-semibold text-tinta-media transition-colors duration-150 hover:border-tinta-tenue hover:text-tinta"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-6 gap-px bg-linea">
            {resultado.map((p) => (
              <li
                key={p.slug}
                className="[contain-intrinsic-size:auto_208px] [content-visibility:auto]"
              >
                <CeldaPokemon p={p} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
