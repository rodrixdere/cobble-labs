import { NOMBRE_TIPO } from "@/data/pokemon";
import { statANivel } from "@/engine/calculo-dano";
import { defensaContra, multiplicador } from "@/engine/tabla-tipos";
import { aprovechaClima, poneClima } from "@/analysis/campo";
import { esControlDeVelocidad } from "@/analysis/roles";
import type { MovimientoCatalogo, PokemonCombate } from "@/team/combate";
import type { Candidato, Contexto } from "@/recommendations/contexto";
import type { Pesos } from "@/recommendations/pesos";

// Las once reglas que puntuan a un candidato. Cada una contesta una pregunta
// sola y devuelve lo que aporta, con el motivo pegado al numero. Si no aporta
// nada devuelve vacio: si no hay motivo, no hay punto.
//
// Para sumar una: escribir la funcion y agregarla a REGLAS. `recomendar` no se
// toca, solo las recorre.

export type Aporte = {
  /** Lo que se ve en el desglose de puntos. */
  motivo: string;
  puntos: number;
  /** La frase que explica el aporte en la tarjeta. Puede no haber. */
  razon?: string;
};

export type Regla = (
  candidato: Candidato,
  ctx: Contexto,
  pesos: Pesos
) => Aporte[];

// --- Defensa -----------------------------------------------------------------

// Resistir lo que el equipo entero sufre vale mucho; sumar la misma debilidad
// resta. La inmunidad vale una vez y media porque no deja pasar nada.
const tapaDebilidadesCompartidas: Regla = ({ miembro }, ctx, pesos) => {
  const aportes: Aporte[] = [];
  const tapa: string[] = [];

  for (const d of ctx.compartidas) {
    const defensa = defensaContra(miembro.tipos, d.tipo);

    if (defensa < 1) {
      aportes.push({
        motivo: `Resiste ${NOMBRE_TIPO[d.tipo]}`,
        puntos: pesos.debilidades * d.debiles * (defensa === 0 ? 1.5 : 1),
      });
      tapa.push(NOMBRE_TIPO[d.tipo]);
    } else if (defensa > 1) {
      aportes.push({
        motivo: `Suma otra debilidad a ${NOMBRE_TIPO[d.tipo]}`,
        puntos: -pesos.penalizacionDebilidad,
      });
    }
  }

  if (tapa.length > 0) {
    aportes[0].razon = `Tapa la debilidad compartida a ${tapa.join(", ")}`;
  }
  return aportes;
};

const traeResistenciasNuevas: Regla = ({ miembro }, ctx, pesos) => {
  const nuevas = ctx.sinResistencia.filter(
    (t) => defensaContra(miembro.tipos, t) < 1
  );
  if (nuevas.length === 0) return [];

  return [
    {
      motivo: "Resistencias nuevas",
      puntos: pesos.resistencias * nuevas.length,
      razon: `Primera resistencia del equipo a ${nuevas.map((t) => NOMBRE_TIPO[t]).join(", ")}`,
    },
  ];
};

// --- Ataque ------------------------------------------------------------------

// Cubierto es pegarle x2 con un movimiento que lleva puesto, no con uno que
// podria aprender.
const cubrePuntosCiegos: Regla = ({ miembro }, ctx, pesos) => {
  const aportes: Aporte[] = [];
  const cubre: string[] = [];

  for (const t of ctx.ciegos) {
    const mejor = miembro.movimientos.reduce(
      (acc, m) => (m.potencia > 0 ? Math.max(acc, multiplicador(m.tipo, t)) : acc),
      0
    );
    if (mejor >= 2) {
      aportes.push({ motivo: `Cubre a ${NOMBRE_TIPO[t]}`, puntos: pesos.ciegos });
      cubre.push(NOMBRE_TIPO[t]);
    }
  }

  if (cubre.length > 0) {
    aportes[0].razon = `Le pega fuerte a ${cubre.join(", ")}, que nadie cubría`;
  }
  return aportes;
};

const equilibraElDano: Regla = ({ pokemon }, ctx, pesos) => {
  if (!ctx.balance.desbalanceado) return [];

  const esEspecial = pokemon.stats.special_attack > pokemon.stats.attack;
  const faltaEspecial = ctx.balance.fisicos > ctx.balance.especiales;
  if (esEspecial !== faltaEspecial) return [];

  return [
    {
      motivo: "Equilibra el daño",
      puntos: pesos.balance,
      razon: faltaEspecial
        ? "Suma daño especial a un equipo casi todo físico"
        : "Suma daño físico a un equipo casi todo especial",
    },
  ];
};

// --- Lo que el equipo no sabe hacer ------------------------------------------

export function movimientoDeVelocidad(
  p: PokemonCombate,
  catalogo: MovimientoCatalogo[]
): MovimientoCatalogo | null {
  for (const i of p.movimientos) {
    if (esControlDeVelocidad(catalogo[i])) return catalogo[i];
  }
  return null;
}

const aportaControlDeVelocidad: Regla = ({ pokemon }, ctx, pesos) => {
  if (ctx.analisis.campo.controlDeVelocidad.quienes.length > 0) return [];

  const movimiento = movimientoDeVelocidad(pokemon, ctx.catalogo);
  if (!movimiento) return [];

  return [
    {
      motivo: "Aporta control de velocidad",
      puntos: pesos.velocidad,
      razon: `Puede aprender ${movimiento.nombre} y el equipo no tiene control de velocidad`,
    },
  ];
};

// Hasta dos roles nuevos: cualquier Pokemon toca de refilon media docena.
const MAXIMO_ROLES_QUE_CUENTAN = 2;

const aportaRolesQueFaltan: Regla = ({ roles }, ctx, pesos) => {
  const nuevos = roles.filter((r) => !ctx.rolesDelEquipo.has(r));
  if (nuevos.length === 0) return [];

  return [
    {
      motivo: "Roles nuevos",
      puntos: pesos.roles * Math.min(MAXIMO_ROLES_QUE_CUENTAN, nuevos.length),
      razon: `Aporta un rol que falta: ${nuevos.slice(0, MAXIMO_ROLES_QUE_CUENTAN).join(", ")}`,
    },
  ];
};

// --- Estrategias de campo ----------------------------------------------------

const encajaConElClima: Regla = ({ conjunto }, ctx, pesos) => {
  const clima = ctx.analisis.campo.clima;

  if (clima) {
    if (!aprovechaClima(conjunto.habilidad, clima)) return [];
    return [
      {
        motivo: "Aprovecha el clima",
        puntos: pesos.clima,
        razon: "Su habilidad se aprovecha del clima que ya pone el equipo",
      },
    ];
  }

  // Sin clima puesto, poner uno solo suma si el usuario esta buscando
  // justamente eso: si no, arruinaria un equipo que no lo juega.
  if (ctx.criterio !== "clima" || !poneClima(conjunto.habilidad)) return [];
  return [
    {
      motivo: "Pone clima",
      puntos: pesos.clima,
      razon: "Pone clima al entrar, y el equipo todavía no tiene ninguno",
    },
  ];
};

// Bajo Espacio Raro la velocidad se invierte, asi que se busca lento y con
// pegada. Los cortes son los del formato: menos de 95 de velocidad a nivel 50 es
// lento, y con 100 de ataque ya golpeas.
const VELOCIDAD_DE_LENTO = 95;
const ATAQUE_QUE_PEGA = 100;

const sirveParaEspacioRaro: Regla = ({ pokemon }, ctx, pesos) => {
  if (!ctx.buscaEspacioRaro) return [];

  const puestoYa = ctx.analisis.campo.espacioRaro.activo;
  const puedePonerlo = pokemon.movimientos.some(
    (i) => ctx.catalogo[i].efectoDeCampo === "trickroom"
  );

  if (!puestoYa && puedePonerlo) {
    return [
      {
        motivo: "Puede poner Espacio Raro",
        puntos: pesos.espacioRaro,
        razon: "El equipo es lento y este puede poner Espacio Raro",
      },
    ];
  }

  const lento = statANivel(pokemon.stats.speed, false) < VELOCIDAD_DE_LENTO;
  const pega =
    Math.max(pokemon.stats.attack, pokemon.stats.special_attack) >= ATAQUE_QUE_PEGA;

  if (puestoYa && lento && pega) {
    return [
      {
        motivo: "Pega bajo Espacio Raro",
        // Vale menos que ponerlo: aprovecharlo sirve solo si alguien lo pone.
        puntos: pesos.espacioRaro * 0.7,
        razon: "Lento y con pegada: aprovecha el Espacio Raro del equipo",
      },
    ];
  }

  return [];
};

// --- Amenazas ----------------------------------------------------------------

// Responder es aguantarle los golpes Y poder castigarla. Con una sola de las
// dos no alcanza: o la aguantas sin hacer nada, o le pegas pero caes primero.
const MAXIMO_AMENAZAS_QUE_CUENTAN = 3;

const respondeAAmenazas: Regla = ({ miembro }, ctx, pesos) => {
  const responde = ctx.amenazas.filter((a) => {
    const amenaza = ctx.roster.find((p) => p.slug === a.slug);
    if (!amenaza) return false;

    const leAguanta = amenaza.tipos.every(
      (t) => defensaContra(miembro.tipos, t) <= 1
    );
    const laCastiga = miembro.movimientos.some(
      (m) => m.potencia > 0 && defensaContra(amenaza.tipos, m.tipo) >= 2
    );
    return leAguanta && laCastiga;
  });

  if (responde.length === 0) return [];

  return [
    {
      motivo: "Responde a amenazas",
      puntos: pesos.amenazas * Math.min(MAXIMO_AMENAZAS_QUE_CUENTAN, responde.length),
      razon: `Aguanta y castiga a ${responde.slice(0, 2).map((a) => a.nombre).join(", ")}`,
    },
  ];
};

// --- Los dos ajustes finales -------------------------------------------------

// El total de stats es un sustituto pobre de "que tan viable es" y pesa poco por
// eso. Sin razon: no es un motivo, solo desempata entre candidatos parejos.
const TOTAL_MAXIMO = 720;

const potencialBruto: Regla = ({ pokemon }, _ctx, pesos) => [
  {
    motivo: "Total de stats base",
    puntos: (pokemon.total / TOTAL_MAXIMO) * pesos.potencial * 10,
  },
];

// Dos del mismo tipo pasa. El tercero es un equipo que se cae entero con un solo
// movimiento del rival.
const REPETICIONES_TOLERADAS = 2;

const penalizaTipoRepetido: Regla = ({ miembro }, ctx, pesos) =>
  miembro.tipos
    .filter((t) => (ctx.vecesPorTipo[t] ?? 0) >= REPETICIONES_TOLERADAS)
    .map((t) => ({
      motivo: `Tercer ${NOMBRE_TIPO[t]} del equipo`,
      puntos: -pesos.penalizacionRedundancia,
    }));

export const REGLAS: Regla[] = [
  tapaDebilidadesCompartidas,
  cubrePuntosCiegos,
  traeResistenciasNuevas,
  aportaControlDeVelocidad,
  equilibraElDano,
  aportaRolesQueFaltan,
  encajaConElClima,
  sirveParaEspacioRaro,
  respondeAAmenazas,
  potencialBruto,
  penalizaTipoRepetido,
];
