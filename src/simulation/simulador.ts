import { NIVEL, statANivel, statFinal } from "@/engine/calculo-dano";
import type { Conjunto } from "@/team/conjunto";
import type { Stats } from "@/data/pokemon";
import { defensaContra } from "@/engine/tabla-tipos";
import { AZAR_LIBRE, type Azar } from "@/simulation/azar";

// Motor de combate uno contra uno, equipo contra equipo.
//
// Que modela: stats a nivel 50 con los 66 puntos repartidos y la naturaleza,
// los cuatro movimientos elegidos, la megaevolucion, la tabla de tipos, el
// STAB, el orden por velocidad, la variacion aleatoria de cada golpe, siete
// objetos y las dieciseis habilidades marcadas como simuladas.
//
// Que NO modela: el resto de las habilidades, estados alterados, clima,
// terreno, movimientos de apoyo, prioridad, criticos y cambios voluntarios. Es
// una comparacion entre equipos, no una prediccion de una partida real.

export type MovimientoSim = {
  clave: string;
  nombre: string;
  tipo: string;
  categoria: string;
  potencia: number;
};

export type Luchador = {
  slug: string;
  nombre: string;
  tipos: string[];
  stats: Stats;
  conjunto: Conjunto;
  movimientos: MovimientoSim[];
};

const TURNOS_MAXIMOS = 300;

type Preparado = {
  luchador: Luchador;
  psMaximo: number;
  ataque: number;
  ataqueEspecial: number;
  defensa: number;
  defensaEspecial: number;
  velocidad: number;
  tipos: string[];
  habilidad: string;
  objeto: string;
};

export function preparar(l: Luchador): Preparado {
  const c = l.conjunto;
  const stats = l.stats;

  let ataque = statFinal(stats, c, "attack");
  let defensaEspecial = statFinal(stats, c, "special_defence");
  let ataqueEspecial = statFinal(stats, c, "special_attack");

  if (c.habilidad === "hugepower" || c.habilidad === "purepower") ataque *= 2;
  if (c.objeto === "choiceband") ataque = Math.floor(ataque * 1.5);
  if (c.objeto === "choicespecs") ataqueEspecial = Math.floor(ataqueEspecial * 1.5);
  if (c.objeto === "assaultvest") defensaEspecial = Math.floor(defensaEspecial * 1.5);

  return {
    luchador: l,
    psMaximo: statFinal(stats, c, "hp"),
    ataque,
    ataqueEspecial,
    defensa: statFinal(stats, c, "defence"),
    defensaEspecial,
    velocidad: statFinal(stats, c, "speed"),
    tipos: l.tipos,
    habilidad: c.habilidad,
    objeto: c.objeto,
  };
}

// Las habilidades de inmunidad, que son las que mas cambian un combate.
const INMUNIDADES: Record<string, string> = {
  levitate: "ground",
  flashfire: "fire",
  waterabsorb: "water",
  stormdrain: "water",
  dryskin: "water",
  voltabsorb: "electric",
  lightningrod: "electric",
  motordrive: "electric",
  sapsipper: "grass",
};

const REFUERZO_CON_POCA_VIDA: Record<string, string> = {
  overgrow: "grass",
  blaze: "fire",
  torrent: "water",
  swarm: "bug",
};

export function danoDe(
  golpe: MovimientoSim,
  atacante: Preparado,
  defensor: Preparado,
  psAtacante: number,
  rollo: number
): number {
  if (INMUNIDADES[defensor.habilidad] === golpe.tipo) return 0;

  const efectividad = defensaContra(defensor.tipos, golpe.tipo);
  if (efectividad === 0) return 0;

  const fisico = golpe.categoria === "physical";
  const a = fisico ? atacante.ataque : atacante.ataqueEspecial;
  const d = fisico ? defensor.defensa : defensor.defensaEspecial;

  const base =
    Math.floor(
      Math.floor((Math.floor((2 * NIVEL) / 5 + 2) * golpe.potencia * a) / d) / 50
    ) + 2;

  let modificador = efectividad;
  if (atacante.tipos.includes(golpe.tipo)) modificador *= 1.5;

  if (
    REFUERZO_CON_POCA_VIDA[atacante.habilidad] === golpe.tipo &&
    psAtacante <= atacante.psMaximo / 3
  ) {
    modificador *= 1.5;
  }

  if (defensor.habilidad === "thickfat" && (golpe.tipo === "fire" || golpe.tipo === "ice")) {
    modificador *= 0.5;
  }
  if (defensor.habilidad === "dryskin" && golpe.tipo === "fire") modificador *= 1.25;

  if (atacante.objeto === "lifeorb") modificador *= 1.3;
  if (atacante.objeto === "expertbelt" && efectividad > 1) modificador *= 1.2;

  return Math.max(1, Math.floor(base * rollo * modificador));
}

function mejorGolpe(
  atacante: Preparado,
  defensor: Preparado,
  psAtacante: number
) {
  let mejor: MovimientoSim | null = null;
  let mejorDano = -1;
  for (const m of atacante.luchador.movimientos) {
    const d = danoDe(m, atacante, defensor, psAtacante, 0.925);
    if (d > mejorDano) {
      mejorDano = d;
      mejor = m;
    }
  }
  return mejor;
}

// Una foto del combate al final de cada turno: sirve para reproducirlo con las
// barras de vida moviendose, no solo como texto.
export type Instante = {
  turno: number;
  psA: number[];
  psB: number[];
  texto: string[];
};

export type ResultadoCombate = {
  gana: "a" | "b" | "empate";
  turnos: number;
  caidosA: number;
  caidosB: number;
  // Quien tumbo a quien, para el ranking de amenazas.
  bajas: { verdugo: string; caido: string; lado: "a" | "b" }[];
  registro: string[];
  instantes: Instante[];
  psMaximosA: number[];
  psMaximosB: number[];
};

export function simularCombate(
  equipoA: Luchador[],
  equipoB: Luchador[],
  conRegistro = false,
  azar: Azar = AZAR_LIBRE
): ResultadoCombate {
  const a = equipoA.map(preparar);
  const b = equipoB.map(preparar);
  const psA = a.map((p) => p.psMaximo);
  const psB = b.map((p) => p.psMaximo);
  const bajas: ResultadoCombate["bajas"] = [];
  const registro: string[] = [];
  const instantes: Instante[] = [];
  let textoDelTurno: string[] = [];

  let ia = 0;
  let ib = 0;
  let turnos = 0;

  const golpear = (
    atacante: Preparado,
    defensor: Preparado,
    psAtacante: number,
    psDefensor: number,
    indiceDefensor: number,
    ps: number[]
  ) => {
    const golpe = mejorGolpe(atacante, defensor, psAtacante);
    if (!golpe) return;

    const dano = danoDe(
      golpe,
      atacante,
      defensor,
      psAtacante,
      0.85 + azar.siguiente() * 0.15
    );

    let restante = psDefensor - dano;

    // La Banda Focus aguanta con 1 PS, pero solo desde la vida llena.
    if (
      restante <= 0 &&
      defensor.objeto === "focussash" &&
      psDefensor === defensor.psMaximo
    ) {
      restante = 1;
      if (conRegistro) {
        registro.push(
          `${defensor.luchador.nombre} aguanta con 1 PS gracias a la Banda Focus`
        );
      }
    }

    ps[indiceDefensor] = restante;

    if (conRegistro) {
      const linea =
        `${atacante.luchador.nombre} usa ${golpe.nombre} y hace ${dano} de daño` +
        (restante <= 0 ? `. ${defensor.luchador.nombre} cae` : "");
      registro.push(linea);
      textoDelTurno.push(linea);
    }
  };

  while (turnos < TURNOS_MAXIMOS) {
    turnos += 1;

    const activoA = a[ia];
    const activoB = b[ib];

    const primeroEsA =
      activoA.velocidad === activoB.velocidad
        ? azar.siguiente() < 0.5
        : activoA.velocidad > activoB.velocidad;

    const orden: ("a" | "b")[] = primeroEsA ? ["a", "b"] : ["b", "a"];

    for (const lado of orden) {
      if (psA[ia] <= 0 || psB[ib] <= 0) break;
      if (lado === "a") {
        golpear(activoA, activoB, psA[ia], psB[ib], ib, psB);
        if (psB[ib] <= 0) {
          bajas.push({
            verdugo: activoA.luchador.slug,
            caido: activoB.luchador.slug,
            lado: "b",
          });
        }
      } else {
        golpear(activoB, activoA, psB[ib], psA[ia], ia, psA);
        if (psA[ia] <= 0) {
          bajas.push({
            verdugo: activoB.luchador.slug,
            caido: activoA.luchador.slug,
            lado: "a",
          });
        }
      }
    }

    // Los Restos curan al final del turno, si siguen en pie.
    if (psA[ia] > 0 && a[ia].objeto === "leftovers") {
      psA[ia] = Math.min(a[ia].psMaximo, psA[ia] + Math.floor(a[ia].psMaximo / 16));
    }
    if (psB[ib] > 0 && b[ib].objeto === "leftovers") {
      psB[ib] = Math.min(b[ib].psMaximo, psB[ib] + Math.floor(b[ib].psMaximo / 16));
    }

    if (conRegistro) {
      instantes.push({
        turno: turnos,
        psA: psA.map((v) => Math.max(0, v)),
        psB: psB.map((v) => Math.max(0, v)),
        texto: textoDelTurno,
      });
      textoDelTurno = [];
    }

    while (ia < a.length && psA[ia] <= 0) ia += 1;
    while (ib < b.length && psB[ib] <= 0) ib += 1;

    if (ia >= a.length || ib >= b.length) {
      return {
        gana:
          ia >= a.length && ib >= b.length ? "empate" : ia >= a.length ? "b" : "a",
        turnos,
        caidosA: psA.filter((p) => p <= 0).length,
        caidosB: psB.filter((p) => p <= 0).length,
        bajas,
        registro,
        instantes,
        psMaximosA: a.map((p) => p.psMaximo),
        psMaximosB: b.map((p) => p.psMaximo),
      };
    }
  }

  const vivosA = psA.filter((p) => p > 0).length;
  const vivosB = psB.filter((p) => p > 0).length;
  return {
    gana: vivosA === vivosB ? "empate" : vivosA > vivosB ? "a" : "b",
    turnos,
    caidosA: psA.length - vivosA,
    caidosB: psB.length - vivosB,
    bajas,
    registro,
    instantes,
    psMaximosA: a.map((p) => p.psMaximo),
    psMaximosB: b.map((p) => p.psMaximo),
  };
}

export type ResultadoSerie = {
  combates: number;
  ganaA: number;
  ganaB: number;
  empates: number;
  turnosPromedio: number;
  caidosPromedioA: number;
  caidosPromedioB: number;
};

export function simularSerie(
  equipoA: Luchador[],
  equipoB: Luchador[],
  combates: number,
  azar: Azar = AZAR_LIBRE
): ResultadoSerie {
  let ganaA = 0;
  let ganaB = 0;
  let empates = 0;
  let turnos = 0;
  let caidosA = 0;
  let caidosB = 0;

  for (let i = 0; i < combates; i += 1) {
    const r = simularCombate(equipoA, equipoB, false, azar);
    if (r.gana === "a") ganaA += 1;
    else if (r.gana === "b") ganaB += 1;
    else empates += 1;
    turnos += r.turnos;
    caidosA += r.caidosA;
    caidosB += r.caidosB;
  }

  return {
    combates,
    ganaA,
    ganaB,
    empates,
    turnosPromedio: turnos / combates,
    caidosPromedioA: caidosA / combates,
    caidosPromedioB: caidosB / combates,
  };
}

// --- Analisis de un cara a cara ---------------------------------------------

export type Salida = {
  slug: string;
  nombre: string;
  porcentaje: number;
};

// Que tan bien le va al equipo segun con quien abre. En singles la salida es
// un solo Pokemon: se prueba a cada miembro de primero, con el resto en el
// mismo orden, y se corre una serie por cada opcion.
export function mejoresSalidas(
  equipoA: Luchador[],
  equipoB: Luchador[],
  combatesPorSalida: number
): Salida[] {
  return equipoA
    .map((l, i) => {
      const reordenado = [l, ...equipoA.filter((_, j) => j !== i)];
      const r = simularSerie(reordenado, equipoB, combatesPorSalida);
      return {
        slug: l.slug,
        nombre: l.nombre,
        porcentaje: (r.ganaA / r.combates) * 100,
      };
    })
    .toSorted((a, b) => b.porcentaje - a.porcentaje);
}

export type Impacto = {
  slug: string;
  nombre: string;
  // Cuanto cae el porcentaje de victorias si se lo saca del equipo.
  caida: number;
};

// El peso real de cada miembro: se corre la serie sin el y se mide cuanto baja
// el porcentaje. Un numero alto significa que sin ese Pokemon el equipo se cae.
export function impactoPorMiembro(
  equipoA: Luchador[],
  equipoB: Luchador[],
  combates: number
): Impacto[] {
  if (equipoA.length <= 1) return [];

  const completo = simularSerie(equipoA, equipoB, combates);
  const base = (completo.ganaA / completo.combates) * 100;

  return equipoA
    .map((l, i) => {
      const sinEl = equipoA.filter((_, j) => j !== i);
      const r = simularSerie(sinEl, equipoB, combates);
      const conMenos = (r.ganaA / r.combates) * 100;
      return { slug: l.slug, nombre: l.nombre, caida: base - conMenos };
    })
    .toSorted((a, b) => b.caida - a.caida);
}

// El veredicto de un cara a cara, con cortes fijos y a la vista.
export function veredictoDe(porcentaje: number, nombreA: string, nombreB: string) {
  if (porcentaje >= 70) return `${nombreA} domina este cruce`;
  if (porcentaje >= 57) return `${nombreA} lo tiene de su lado`;
  if (porcentaje > 43) return "Cruce parejo, lo define quien empieza";
  if (porcentaje > 30) return `${nombreB} lo tiene de su lado`;
  return `${nombreB} domina este cruce`;
}
