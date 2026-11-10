import { NOMBRE_TIPO, suma, type Stats } from "@/data/pokemon";
import { analizarEquipo, coberturaOfensiva } from "@/analysis/equipo";
import { armarMiembro, type Miembro, type MovimientoCatalogo } from "@/team/combate";
import {
  HABILIDADES_SIMULADAS,
  NATURALEZAS,
  naturalezaPorClave,
  type Conjunto,
} from "@/team/conjunto";

// Ajustes de set: con el equipo armado, lo que se puede mejorar sin cambiar a
// nadie. Por cada miembro se busca el mejor cambio de forma, de movimiento, de
// habilidad y de naturaleza. Como en el resto del motor, si no hay motivo no
// hay sugerencia: cada una dice qué gana el equipo.

export type Ajuste = {
  indice: number;
  quien: string;
  que: "Forma" | "Movimiento" | "Habilidad" | "Naturaleza";
  /** null: no sale nada, se ocupa un hueco libre. */
  antes: string | null;
  despues: string;
  motivo: string;
  conjunto: Conjunto;
};

const MAXIMO_MOVIMIENTOS = 4;
const tipos = (lista: string[]) => lista.map((t) => NOMBRE_TIPO[t] ?? t).join(", ");
const sinCubrir = (equipo: Miembro[]) =>
  new Set(coberturaOfensiva(equipo).filter((c) => c.cuantos === 0).map((c) => c.tipo));

// La mega que más total de stats suma, si el equipo todavía no usa ninguna:
// en combate se puede megaevolucionar a uno solo.
function ajusteDeForma(equipo: Miembro[], i: number): Ajuste | null {
  if (equipo.some((m) => m.conjunto.forma)) return null;
  const m = equipo[i];
  const megas = m.pokemon.formas.filter((f) => f.tipo === "mega");
  if (megas.length === 0) return null;
  const f = megas.reduce((a, b) => (suma(b.stats) > suma(a.stats) ? b : a));
  const gana = suma(f.stats) - suma(m.pokemon.stats);
  return {
    indice: i,
    quien: m.nombre,
    que: "Forma",
    antes: "Base",
    despues: f.etiqueta,
    motivo: `Suma ${gana} de total de stats y el equipo no usa ninguna mega, que es una por combate.`,
    conjunto: { ...m.conjunto, forma: f.clave, habilidad: f.habilidades[0]?.clave ?? m.conjunto.habilidad },
  };
}

// El cambio de un movimiento que más sube la sinergia. Se prueba el mejor
// ataque de cada tipo que aprende en cada hueco, y con huecos libres, sumarlo.
function ajusteDeMovimiento(equipo: Miembro[], i: number, catalogo: MovimientoCatalogo[]): Ajuste | null {
  const m = equipo[i];
  const actual = analizarEquipo(equipo).sinergia.total;
  const antesSinCubrir = sinCubrir(equipo);

  const mejorPorTipo = new Map<string, MovimientoCatalogo>();
  for (const k of m.pokemon.movimientos) {
    const mov = catalogo[k];
    if (mov.potencia <= 0 || mov.categoria === "status") continue;
    const previo = mejorPorTipo.get(mov.tipo);
    if (!previo || mov.potencia > previo.potencia) mejorPorTipo.set(mov.tipo, mov);
  }

  const lleva = m.conjunto.movimientos;
  const huecos = lleva.length < MAXIMO_MOVIMIENTOS ? [...lleva.keys(), lleva.length] : [...lleva.keys()];
  let mejor: { conjunto: Conjunto; mejora: number; sale: string | null; entra: MovimientoCatalogo } | null = null;

  for (const entra of mejorPorTipo.values()) {
    if (lleva.includes(entra.clave)) continue;
    for (const h of huecos) {
      const movimientos = [...lleva];
      movimientos[h] = entra.clave;
      const conjunto = { ...m.conjunto, movimientos };
      const otro = equipo.map((x, j) => (j === i ? armarMiembro(x.pokemon, conjunto, catalogo) : x));
      const mejora = analizarEquipo(otro).sinergia.total - actual;
      if (mejora > 0 && (!mejor || mejora > mejor.mejora)) {
        const sale = h < lleva.length ? lleva[h] : null;
        mejor = { conjunto, mejora, sale, entra };
      }
    }
  }
  if (!mejor) return null;

  const otro = equipo.map((x, j) => (j === i ? armarMiembro(x.pokemon, mejor.conjunto, catalogo) : x));
  const nuevos = [...antesSinCubrir].filter((t) => !sinCubrir(otro).has(t));
  const nombreDe = (clave: string) => catalogo.find((c) => c.clave === clave)?.nombre ?? clave;
  return {
    indice: i,
    quien: m.nombre,
    que: "Movimiento",
    antes: mejor.sale ? nombreDe(mejor.sale) : null,
    despues: mejor.entra.nombre,
    motivo:
      (nuevos.length
        ? `El equipo pasa a pegarle súper efectivo a ${tipos(nuevos)}, que nadie cubría.`
        : `Reparte mejor el daño del equipo.`) + ` +${mejor.mejora} de sinergia.`,
    conjunto: mejor.conjunto,
  };
}

// Si su habilidad no cambia nada en combate y otra de las suyas sí. Las
// inmunidades van primero: son lo que más pesa en un cruce.
function ajusteDeHabilidad(equipo: Miembro[], i: number): Ajuste | null {
  const m = equipo[i];
  const forma = m.conjunto.forma ? m.pokemon.formas.find((f) => f.clave === m.conjunto.forma) : null;
  const legales = forma?.habilidades ?? m.pokemon.habilidades;
  if (HABILIDADES_SIMULADAS[m.conjunto.habilidad]) return null;
  const orden = Object.keys(HABILIDADES_SIMULADAS);
  const mejor = legales
    .filter((h) => HABILIDADES_SIMULADAS[h.clave])
    .toSorted((a, b) => orden.indexOf(a.clave) - orden.indexOf(b.clave))[0];
  if (!mejor) return null;
  const antes = legales.find((h) => h.clave === m.conjunto.habilidad)?.nombre ?? m.conjunto.habilidad;
  return {
    indice: i,
    quien: m.nombre,
    que: "Habilidad",
    antes,
    despues: mejor.nombre,
    motivo: `${antes} no cambia nada en combate; ${mejor.nombre} sí: ${HABILIDADES_SIMULADAS[mejor.clave].toLowerCase()}.`,
    conjunto: { ...m.conjunto, habilidad: mejor.clave },
  };
}

const NOMBRE_STAT: Partial<Record<keyof Stats, string>> = {
  attack: "Ataque",
  special_attack: "At. Esp.",
  speed: "Velocidad",
};

// La naturaleza de manual: el rápido sube Velocidad, el lento sube con lo que
// pega, y los dos bajan el ataque que no usan. Los mixtos no se tocan.
function ajusteDeNaturaleza(equipo: Miembro[], i: number): Ajuste | null {
  const m = equipo[i];
  const s = m.stats;
  if (Math.abs(s.attack - s.special_attack) < 15) return null;
  const pega: keyof Stats = s.attack > s.special_attack ? "attack" : "special_attack";
  const noUsa: keyof Stats = pega === "attack" ? "special_attack" : "attack";
  const sube: keyof Stats = s.speed >= 90 ? "speed" : pega;

  const actual = naturalezaPorClave(m.conjunto.naturaleza);
  if (actual.sube === sube && actual.baja === noUsa) return null;
  const ideal = NATURALEZAS.find((n) => n.sube === sube && n.baja === noUsa);
  if (!ideal) return null;

  const porQue =
    sube === "speed"
      ? `con ${s.speed} de Velocidad base le conviene llegar primero`
      : `pega con ${NOMBRE_STAT[pega]} (${s[pega]})`;
  return {
    indice: i,
    quien: m.nombre,
    que: "Naturaleza",
    antes: actual.nombre,
    despues: ideal.nombre,
    motivo: `Sube ${NOMBRE_STAT[sube]} y baja ${NOMBRE_STAT[noUsa]}, que no usa: ${porQue}.`,
    conjunto: { ...m.conjunto, naturaleza: ideal.clave },
  };
}

// De las megas posibles se sugiere una sola, la que más suma: aplicar una
// deja a las otras afuera.
export function ajustarSets(equipo: Miembro[], catalogo: MovimientoCatalogo[]): Ajuste[] {
  const ganancia = (a: Ajuste | null) => {
    if (!a) return -1;
    const p = equipo[a.indice].pokemon;
    const f = p.formas.find((x) => x.clave === a.conjunto.forma)!;
    return suma(f.stats) - suma(p.stats);
  };
  const megas = equipo.map((_, i) => ajusteDeForma(equipo, i));
  const mega = megas.reduce<Ajuste | null>((a, b) => (ganancia(b) > ganancia(a) ? b : a), null);
  return equipo.flatMap((_, i) =>
    [
      megas[i] === mega ? mega : null,
      ajusteDeMovimiento(equipo, i, catalogo),
      ajusteDeHabilidad(equipo, i),
      ajusteDeNaturaleza(equipo, i),
    ].filter((a): a is Ajuste => a !== null)
  );
}
