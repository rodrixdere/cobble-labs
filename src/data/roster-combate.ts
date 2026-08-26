import { POKEMON, generacionDe, habilidadesUnicas, suma } from "@/data/pokemon";
import { fichaMovimiento, habilidad, movimiento } from "@/data/textos";
import type { MovimientoCatalogo, PokemonCombate } from "@/team/combate";

// La única fuente del roster de combate. La arman el Team Builder y el Battle
// Bot desde acá: si hubiera dos copias, una quedaría vieja.
//
// Los movimientos van en un catálogo único y cada Pokémon guarda índices. La
// ficha completa repetida por especie serían megabytes en el cliente.

const catalogo: MovimientoCatalogo[] = [];
const indicePorClave = new Map<string, number>();

function indiceDe(clave: string): number | null {
  const ficha = fichaMovimiento(clave);
  if (!ficha) return null;

  const existente = indicePorClave.get(clave);
  if (existente !== undefined) return existente;

  const indice = catalogo.length;
  indicePorClave.set(clave, indice);
  catalogo.push({
    clave,
    nombre: movimiento(clave).nombre,
    tipo: ficha.tipo,
    categoria: ficha.categoria,
    potencia: ficha.potencia,
    precision: ficha.precision,
    pp: ficha.pp,
    prioridad: ficha.prioridad,
    objetivo: ficha.objetivo,
    estado: ficha.estado,
    efectoDeLado: ficha.efectoDeLado,
    efectoDeCampo: ficha.efectoDeCampo,
    clima: ficha.clima,
    terreno: ficha.terreno,
    cambiosPropios: ficha.cambiosPropios ?? ficha.cambiosAlUsar ?? null,
    cambiosAlRival: ficha.secundario?.cambios ?? null,
  });
  return indice;
}

export const ROSTER: PokemonCombate[] = POKEMON.map((p) => {
  const claves = new Set<string>();
  for (const m of p.movimientosPorNivel) claves.add(m.nombre);
  for (const m of p.otrosMovimientos) claves.add(m.slice(m.indexOf(":") + 1));

  const movimientos: number[] = [];
  for (const clave of claves) {
    const indice = indiceDe(clave);
    if (indice !== null) movimientos.push(indice);
  }

  return {
    slug: p.slug,
    nombre: p.nombre,
    assets: p.assets,
    dex: p.dex,
    tipos: p.tipos,
    stats: p.stats,
    total: suma(p.stats),
    generacion: generacionDe(p),
    etiquetas: p.etiquetas,
    habilidades: habilidadesUnicas(p).map((h) => ({
      clave: h.nombre,
      nombre: habilidad(h.nombre).nombre,
      oculta: h.oculta,
    })),
    formas: p.formas.map((f) => ({
      clave: f.nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      tipo: f.tipo,
      etiqueta: f.etiqueta,
      tipos: f.tipos,
      stats: f.stats,
      habilidades: f.habilidades.map((h) => ({
        clave: h.nombre,
        nombre: habilidad(h.nombre).nombre,
        oculta: h.oculta,
      })),
    })),
    movimientos,
  };
});

export const CATALOGO: MovimientoCatalogo[] = catalogo;
