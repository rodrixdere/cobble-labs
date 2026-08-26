import { presente } from "@/lib/coleccion";
import { IV_MAXIMO, NIVEL_COMPETITIVO, NOMBRE_STAT, ORDEN_STATS, type Stats } from "@/data/pokemon";
import {
  IVS_PERFECTOS,
  NATURALEZAS,
  OBJETOS,
  evDe,
  ivDe,
  objetoPorClave,
  type Conjunto,
} from "@/team/conjunto";
import type { MovimientoCatalogo, PokemonCombate } from "@/team/combate";

// Importar y exportar equipos en texto. El formato es el de Pokémon Showdown,
// que es el que la gente ya copia y pega, con los nombres en español que usa el
// servidor. Lo que se exporta se vuelve a importar sin perder nada.
//
// Ejemplo de una entrada:
//
//   Charizard @ Vidasfera
//   Ability: Mar Llamas
//   Level: 50
//   Timid Nature
//   Points: 32 AtEsp / 32 Vel / 2 PS
//   - Lanzallamas
//   - Vendaval
//   ...

const CLAVE_POR_STAT: Record<string, keyof Stats> = {
  PS: "hp",
  Atq: "attack",
  Def: "defence",
  AtEsp: "special_attack",
  DefEsp: "special_defence",
  Vel: "speed",
};

const ABREV: Record<keyof Stats, string> = {
  hp: "PS",
  attack: "Atq",
  defence: "Def",
  special_attack: "AtEsp",
  special_defence: "DefEsp",
  speed: "Vel",
};

export function exportarEquipo(
  conjuntos: Conjunto[],
  porSlug: Map<string, PokemonCombate>,
  catalogo: MovimientoCatalogo[]
): string {
  const bloques: string[] = [];

  for (const c of conjuntos) {
    const p = porSlug.get(c.slug);
    if (!p) continue;

    const mega = c.forma ? p.formas.find((m) => m.clave === c.forma) : null;
    const nombre = mega ? mega.etiqueta : p.nombre;
    const objeto = objetoPorClave(c.objeto);
    const habilidad = (mega?.habilidades ?? p.habilidades).find(
      (h) => h.clave === c.habilidad
    );
    const naturaleza = NATURALEZAS.find((n) => n.clave === c.naturaleza);

    const lineas: string[] = [];
    lineas.push(
      objeto.clave === "ninguno" ? nombre : `${nombre} @ ${objeto.nombre}`
    );
    if (habilidad) lineas.push(`Ability: ${habilidad.nombre}`);
    lineas.push(`Level: ${c.nivel}`);
    if (naturaleza) lineas.push(`${naturaleza.nombre} Nature`);

    const evs = ORDEN_STATS.filter((k) => evDe(c, k) > 0)
      .map((k) => `${evDe(c, k)} ${ABREV[k]}`)
      .join(" / ");
    if (evs) lineas.push(`EVs: ${evs}`);

    // Los IVs solo se escriben cuando no son perfectos, como en Showdown.
    const ivs = ORDEN_STATS.filter((k) => ivDe(c, k) !== IV_MAXIMO)
      .map((k) => `${ivDe(c, k)} ${ABREV[k]}`)
      .join(" / ");
    if (ivs) lineas.push(`IVs: ${ivs}`);

    for (const clave of c.movimientos) {
      const m = catalogo.find((x) => x.clave === clave);
      lineas.push(`- ${m?.nombre ?? clave}`);
    }

    bloques.push(lineas.join("\n"));
  }

  return bloques.join("\n\n");
}

export type ResultadoImportacion = {
  conjuntos: Conjunto[];
  problemas: string[];
};

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function importarEquipo(
  texto: string,
  roster: PokemonCombate[],
  catalogo: MovimientoCatalogo[]
): ResultadoImportacion {
  const problemas: string[] = [];
  const conjuntos: Conjunto[] = [];

  const porNombre = new Map(roster.map((p) => [normalizar(p.nombre), p]));
  const movimientoPorNombre = new Map(
    catalogo.map((m) => [normalizar(m.nombre), m])
  );

  const bloques = texto
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  for (const bloque of bloques) {
    const lineas = bloque.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lineas.length === 0) continue;

    const cabecera = lineas[0];
    const [ladoIzquierdo, ladoObjeto] = cabecera.split("@").map((x) => x.trim());
    // "Mega Charizard Y" o "Charizard (M)" o "Charizard"
    const nombreCrudo = ladoIzquierdo.replace(/\(.*?\)/g, "").trim();

    let pokemon = porNombre.get(normalizar(nombreCrudo));
    let forma: string | null = null;

    if (!pokemon && /^mega\s+/i.test(nombreCrudo)) {
      const sinMega = nombreCrudo.replace(/^mega\s+/i, "").trim();
      const base = sinMega.replace(/\s+[XY]$/i, "").trim();
      pokemon = porNombre.get(normalizar(base));
      if (pokemon) {
        const sufijo = sinMega.slice(base.length).trim().toLowerCase();
        const buscada = pokemon.formas.find((m) =>
          sufijo ? m.clave.endsWith(sufijo) : true
        );
        forma = buscada?.clave ?? pokemon.formas[0]?.clave ?? null;
      }
    }

    if (!pokemon) {
      problemas.push(`No se reconoce "${nombreCrudo}": no está en el roster.`);
      continue;
    }

    const conjunto: Conjunto = {
      slug: pokemon.slug,
      nivel: NIVEL_COMPETITIVO,
      movimientos: [],
      habilidad: pokemon.habilidades[0]?.clave ?? "",
      naturaleza: "serious",
      objeto: "ninguno",
      ivs: { ...IVS_PERFECTOS },
      evs: {},
      forma,
    };

    if (ladoObjeto) {
      const objeto = OBJETOS.find(
        (o) => normalizar(o.nombre) === normalizar(ladoObjeto)
      );
      if (objeto) conjunto.objeto = objeto.clave;
      else problemas.push(`${pokemon.nombre}: no se reconoce el objeto "${ladoObjeto}".`);
    }

    for (const linea of lineas.slice(1)) {
      if (/^ability:/i.test(linea)) {
        const valor = linea.split(":")[1].trim();
        const h = pokemon.habilidades.find(
          (x) => normalizar(x.nombre) === normalizar(valor)
        );
        if (h) conjunto.habilidad = h.clave;
        else problemas.push(`${pokemon.nombre}: no tiene la habilidad "${valor}".`);
        continue;
      }

      if (/nature$/i.test(linea)) {
        const valor = linea.replace(/nature$/i, "").trim();
        const n = NATURALEZAS.find((x) => normalizar(x.nombre) === normalizar(valor));
        if (n) conjunto.naturaleza = n.clave;
        else problemas.push(`${pokemon.nombre}: no se reconoce la naturaleza "${valor}".`);
        continue;
      }

      if (/^level:/i.test(linea)) {
        const numero = Number(linea.split(":")[1]);
        if (Number.isFinite(numero)) conjunto.nivel = numero;
        continue;
      }

      if (/^(evs|ivs|points):/i.test(linea)) {
        const esIv = /^ivs:/i.test(linea);
        const valor = linea.split(":")[1] ?? "";
        for (const parte of valor.split("/")) {
          const [cantidad, etiqueta] = parte.trim().split(/\s+/);
          const clave = CLAVE_POR_STAT[etiqueta] ?? CLAVE_POR_STAT[etiqueta?.toUpperCase()];
          const numero = Number(cantidad);
          if (!clave || !Number.isFinite(numero)) continue;
          if (esIv) conjunto.ivs[clave] = numero;
          else conjunto.evs[clave] = numero;
        }
        continue;
      }

      if (linea.startsWith("-")) {
        const valor = linea.slice(1).trim();
        const m = movimientoPorNombre.get(normalizar(valor));
        if (!m) {
          problemas.push(`${pokemon.nombre}: no se reconoce el movimiento "${valor}".`);
          continue;
        }
        const loAprende = pokemon.movimientos.some((i) => catalogo[i].clave === m.clave);
        if (!loAprende) {
          problemas.push(`${pokemon.nombre} no aprende ${m.nombre}.`);
          continue;
        }
        conjunto.movimientos.push(m.clave);
      }
    }

    conjuntos.push(conjunto);
  }

  if (conjuntos.length > 6) {
    problemas.push("El texto trae más de seis Pokémon: se importaron los primeros seis.");
  }

  return { conjuntos: conjuntos.slice(0, 6), problemas };
}

// Compartir: el equipo entero comprimido en la dirección de la página.
export function aCadena(conjuntos: Conjunto[]): string {
  return conjuntos
    .map((c) => {
      const evs = ORDEN_STATS.filter((k) => evDe(c, k) > 0)
        .map((k) => `${k}:${evDe(c, k)}`)
        .join(".");
      const ivs = ORDEN_STATS.filter((k) => ivDe(c, k) !== IV_MAXIMO)
        .map((k) => `${k}:${ivDe(c, k)}`)
        .join(".");
      return [
        c.slug,
        c.forma ?? "",
        c.habilidad,
        c.naturaleza,
        c.objeto,
        c.movimientos.join("."),
        evs,
        ivs,
        String(c.nivel),
      ].join("|");
    })
    .join("~");
}

export function desdeCadena(cadena: string): Conjunto[] {
  if (!cadena) return [];
  return cadena
    .split("~")
    .map((parte) => {
      const [slug, forma, habilidad, naturaleza, objeto, movimientos, evs, ivs, nivel] =
        parte.split("|");
      if (!slug) return null;

      const leerReparto = (crudo: string | undefined) => {
        const salida: Conjunto["evs"] = {};
        for (const par of (crudo ?? "").split(".").filter(Boolean)) {
          const [clave, valor] = par.split(":");
          const numero = Number(valor);
          if (clave && Number.isFinite(numero)) salida[clave as keyof Stats] = numero;
        }
        return salida;
      };

      return {
        slug,
        nivel: Number(nivel) || NIVEL_COMPETITIVO,
        forma: forma || null,
        habilidad: habilidad ?? "",
        naturaleza: naturaleza || "serious",
        objeto: objeto || "ninguno",
        movimientos: (movimientos ?? "").split(".").filter(Boolean),
        evs: leerReparto(evs),
        ivs: { ...IVS_PERFECTOS, ...leerReparto(ivs) },
      } satisfies Conjunto;
    })
    .filter(presente);
}

export { NOMBRE_STAT };
