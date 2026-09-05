import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import FichaPokemon, { type Forma } from "@/components/FichaPokemon";
import type { MovimientoFicha } from "@/components/ListaMovimientos";
import { metaDe } from "@/data/meta";
import {
  NOMBRE_CRECIMIENTO,
  NOMBRE_GRUPO_HUEVO,
  ABREV_STAT,
  NOMBRE_TIPO,
  POKEMON,
  destinosDeEvolucion,
  generacionDe,
  habilidadesUnicas,
  legible,
  porSlug,
  TIPOS,
  type Habilidad,
} from "@/data/pokemon";
import { fichaMovimiento, habilidad, movimiento } from "@/data/textos";
import {
  evolucionesDe,
  lugaresDe,
  textoDeCiclos,
  textoDeGenero,
} from "@/data/mundo";
import { mejorAtaqueContraTipo } from "@/engine/tabla-tipos";

export function generateStaticParams() {
  return POKEMON.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = porSlug(slug);
  if (!p) return { title: "No encontrado" };

  // La descripcion del juego es la mejor que hay, pero muchas no dicen nada de
  // lo que la gente busca. Se le antepone el dato duro: tipos y numero.
  const tipos = p.tipos.map((t) => NOMBRE_TIPO[t]).join(" y ");
  const resumen = `${p.nombre} en Cobblemon: tipo ${tipos}, stats base, habilidades, movimientos y dónde aparece.`;

  return {
    title: p.nombre,
    description: p.descripcion ? `${resumen} ${p.descripcion}`.slice(0, 300) : resumen,
    alternates: { canonical: `/pokemon/${p.slug}` },
    openGraph: {
      type: "article",
      title: `${p.nombre} · Cobble Labs`,
      description: resumen,
      url: `/pokemon/${p.slug}`,
      images: [{ url: `/cobblemon/retratos/${p.assets}.png` }],
    },
  };
}

// De donde sale cada movimiento que no se aprende subiendo de nivel.
const VIAS: Record<string, string> = {
  tm: "MT",
  tutor: "Tutor",
  egg: "Huevo",
  special: "Especial",
  legacy: "Antiguo",
};

function conTextos(h: Habilidad) {
  const t = habilidad(h.nombre);
  return { nombre: t.nombre, desc: t.desc, oculta: h.oculta };
}

export default async function Ficha({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = porSlug(slug);
  if (!p) notFound();

  // Los movimientos se resuelven en el servidor: al cliente le llega el nombre
  // y la descripcion ya en espaniol, no el diccionario de 120 KB.
  const movimientos: MovimientoFicha[] = [];

  for (const m of p.movimientosPorNivel) {
    const ficha = fichaMovimiento(m.nombre);
    if (!ficha) continue;
    const texto = movimiento(m.nombre);
    movimientos.push({
      clave: m.nombre,
      nombre: texto.nombre,
      desc: texto.desc,
      fuente: `Nivel ${m.nivel}`,
      grupo: "Nivel",
      nivel: m.nivel,
      ...ficha,
    });
  }

  for (const entrada of p.otrosMovimientos) {
    const corte = entrada.indexOf(":");
    const via = corte === -1 ? "otros" : entrada.slice(0, corte);
    const clave = corte === -1 ? entrada : entrada.slice(corte + 1);
    const ficha = fichaMovimiento(clave);
    if (!ficha) continue;
    const texto = movimiento(clave);
    movimientos.push({
      clave,
      nombre: texto.nombre,
      desc: texto.desc,
      fuente: VIAS[via] ?? "Otro",
      grupo: VIAS[via] ?? "Otro",
      nivel: 999,
      ...ficha,
    });
  }

  movimientos.sort((a, b) => a.nivel - b.nivel || a.nombre.localeCompare(b.nombre, "es"));

  // Cobertura: los tipos de los movimientos que hacen daño. Los de estado no
  // cuentan, porque no pegan.
  const coberturaDe = (lista: MovimientoFicha[]) => {
    const tipos = [...new Set(lista.filter((m) => m.potencia > 0).map((m) => m.tipo))];
    return TIPOS.map((t) => ({ tipo: t, x: mejorAtaqueContraTipo(tipos, t) }));
  };

  const cobertura = {
    nivel: coberturaDe(movimientos.filter((m) => m.grupo === "Nivel")),
    todos: coberturaDe(movimientos),
  };

  // La forma base más las otras que tenga: megaevoluciones y regionales.
  const formas: Forma[] = [
    {
      clave: "base",
      etiqueta: "Base",
      nombre: p.nombre,
      tipos: p.tipos,
      stats: p.stats,
      habilidades: habilidadesUnicas(p).map(conTextos),
    },
    ...p.formas.map((f) => ({
      clave: f.nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      etiqueta: f.etiqueta,
      // "Mega Garchomp", "Marowak de Alola", y para el resto de formas el
      // nombre pegado: "Giratina Origin", "Arceus Fire", "Rotom Heat".
      nombre:
        f.tipo === "mega"
          ? `${f.etiqueta} ${p.nombre}`
          : f.tipo === "regional"
            ? `${p.nombre} de ${f.etiqueta}`
            : `${p.nombre} ${f.etiqueta}`,
      tipos: f.tipos,
      stats: f.stats,
      habilidades: f.habilidades.map(conTextos),
    })),
  ];

  const evs = Object.entries(p.evYield)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${v} ${ABREV_STAT[k]}`)
    .join(", ");

  const evoluciones = destinosDeEvolucion(p);

  const enElJuego = {
    evoluciones: evolucionesDe(p),
    preEvolucion: p.preEvolucion,
    crianza: [
      { rotulo: "Género", valor: textoDeGenero(p.generoMacho) },
      {
        rotulo: "Grupos huevo",
        valor:
          p.gruposHuevo.map((g) => NOMBRE_GRUPO_HUEVO[g] ?? legible(g)).join(", ") || "-",
      },
      { rotulo: "Ciclos de huevo", valor: textoDeCiclos(p.ciclosHuevo) },
      {
        rotulo: "Amistad base",
        valor: p.amistadBase !== null ? String(p.amistadBase) : "-",
      },
    ],
    captura: [
      { rotulo: "Tasa de captura", valor: String(p.tasaCaptura) },
      {
        rotulo: "Experiencia base",
        valor: p.expBase !== null ? String(p.expBase) : "-",
      },
      {
        rotulo: "Crecimiento",
        valor: NOMBRE_CRECIMIENTO[p.grupoExperiencia] ?? legible(p.grupoExperiencia),
      },
      { rotulo: "EV que da", valor: evs || "-" },
    ],
    lugares: lugaresDe(p),
  };

  const identidad = [
    { rotulo: "Altura", valor: `${p.alturaM.toFixed(1)} m` },
    { rotulo: "Peso", valor: `${p.pesoKg.toFixed(1)} kg` },
    { rotulo: "Captura", valor: String(p.tasaCaptura) },
    {
      rotulo: "Crecimiento",
      valor: NOMBRE_CRECIMIENTO[p.grupoExperiencia] ?? legible(p.grupoExperiencia),
    },
    { rotulo: "EV que da", valor: evs || "-" },
    {
      rotulo: "Grupos huevo",
      valor: p.gruposHuevo.map((g) => NOMBRE_GRUPO_HUEVO[g] ?? legible(g)).join(", ") || "-",
    },
    { rotulo: "Evoluciona a", valor: evoluciones.join(", ") || "-" },
  ];

  return (
    <main className="mx-auto max-w-[1400px] hoja">
      <nav aria-label="Migas de pan" className="px-4 md:px-8 pt-5">
        <Link
          href="/"
          className="-my-1 inline-block py-1 text-cuerpo text-tinta-media transition-colors duration-150 hover:text-tinta"
        >
          Pokédex
        </Link>
        <span aria-hidden className="px-2 text-tinta-tenue">
          /
        </span>
        <span className="text-cuerpo text-tinta-tenue">{p.nombre}</span>
        <span className="sr-only">
          Tipos: {p.tipos.map((t) => NOMBRE_TIPO[t]).join(", ")}
        </span>
      </nav>

      <div className="mt-4">
        <FichaPokemon
          dex={p.dex}
          generacion={generacionDe(p)}
          nombre={p.nombre}
          assets={p.assets}
          descripcion={p.descripcion}
          formas={formas}
          movimientos={movimientos}
          cobertura={cobertura}
          meta={metaDe(p.slug)}
          identidad={identidad}
          enElJuego={enElJuego}
        />
      </div>
    </main>
  );
}
