import type { Conjunto } from "@/team/conjunto";
import { evDe, ivDe, multiplicadorNaturaleza, objetoPorClave } from "@/team/conjunto";
import type { Stats } from "@/data/pokemon";
import { defensaContra } from "@/engine/tabla-tipos";
import { GEMAS, bayaResiste, factorDeDano, factoresDeStats, globoProtege } from "@/engine/objetos";

// Calculo de daño con la formula estandar de quinta generacion en adelante, que
// es la que corre el Showdown que resuelve los combates del servidor.
//
// El orden de los factores importa y es el del juego: daño base, clima,
// critico, tirada aleatoria, STAB, tipos y despues el resto. Cada paso trunca,
// por eso se calculan las dieciseis tiradas una por una en vez de sacar un
// minimo y un maximo por regla de tres.
export const NIVEL = 50;

export type Clima = "ninguno" | "sol" | "lluvia" | "arena" | "nieve";
export type Terreno = "ninguno" | "electrico" | "hierba" | "bruma" | "psiquico";

export type Campo = {
  clima: Clima;
  terreno: Terreno;
  critico: boolean;
  dobles: boolean;
  ayuda: boolean;
  pantallaFisica: boolean;
  pantallaEspecial: boolean;
  refuerzo: boolean;
};

export const CAMPO_VACIO: Campo = {
  clima: "ninguno",
  terreno: "ninguno",
  critico: false,
  dobles: false,
  ayuda: false,
  pantallaFisica: false,
  pantallaEspecial: false,
  refuerzo: false,
};

// La formula de los juegos, con IV y EV. Es la misma que usa Cobblemon.
//
//   PS    = floor((2*base + IV + floor(EV/4)) * nivel/100) + nivel + 10
//   resto = floor((2*base + IV + floor(EV/4)) * nivel/100) + 5, por naturaleza
export function statConIvEv(
  base: number,
  esPS: boolean,
  { iv = 31, ev = 0, nivel = NIVEL }: { iv?: number; ev?: number; nivel?: number } = {}
): number {
  const comun = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * nivel) / 100);
  return esPS ? comun + nivel + 10 : comun + 5;
}

// Atajo para cuando no hay set: IVs perfectos, sin EVs, nivel 50. Es el
// supuesto de cualquier calculadora competitiva.
export function statANivel(base: number, esPS: boolean, ev = 0): number {
  return statConIvEv(base, esPS, { iv: 31, ev, nivel: NIVEL });
}

// La stat con la que pelea de verdad: base, mas puntos, con la naturaleza
// aplicada al final. Es el numero que se muestra en el editor de set.
export function statFinal(
  base: Stats,
  conjunto: Conjunto,
  clave: keyof Stats
): number {
  const opciones = {
    iv: ivDe(conjunto, clave),
    ev: evDe(conjunto, clave),
    nivel: conjunto.nivel,
  };
  if (clave === "hp") return statConIvEv(base.hp, true, opciones);
  return Math.floor(
    statConIvEv(base[clave], false, opciones) * multiplicadorNaturaleza(conjunto, clave)
  );
}

export type Golpe = {
  potencia: number;
  tipo: string;
  categoria: string;
};

export type Combatiente = {
  tipos: string[];
  stats: Stats;
  /** Para el Mineral Evolutivo. Si falta, se toma como que no. */
  puedeEvolucionar?: boolean;
  conjunto?: Conjunto;
};

export type Resultado = {
  tiradas: number[];
  minimo: number;
  maximo: number;
  porcentajeMin: number;
  porcentajeMax: number;
  efectividad: number;
  stab: boolean;
  psDefensor: number;
  golpesParaTumbar: number | null;
  probabilidadOHKO: number;
  modificadores: { nombre: string; factor: number }[];
};

function factorClima(clima: Clima, tipo: string): number {
  if (clima === "sol") return tipo === "fire" ? 1.5 : tipo === "water" ? 0.5 : 1;
  if (clima === "lluvia") return tipo === "water" ? 1.5 : tipo === "fire" ? 0.5 : 1;
  return 1;
}

function factorTerreno(terreno: Terreno, tipo: string): number {
  if (terreno === "electrico" && tipo === "electric") return 1.3;
  if (terreno === "hierba" && tipo === "grass") return 1.3;
  if (terreno === "psiquico" && tipo === "psychic") return 1.3;
  if (terreno === "bruma" && tipo === "dragon") return 0.5;
  return 1;
}

export function calcularDano(
  golpe: Golpe,
  atacante: Combatiente,
  defensor: Combatiente,
  campo: Campo = CAMPO_VACIO
): Resultado | null {
  if (golpe.categoria === "status" || golpe.potencia <= 0) return null;

  const fisico = golpe.categoria === "physical";
  const conjA = atacante.conjunto;
  const conjB = defensor.conjunto;

  const claveAtaque: keyof Stats = fisico ? "attack" : "special_attack";
  const claveDefensa: keyof Stats = fisico ? "defence" : "special_defence";

  let ataque = conjA
    ? statFinal(atacante.stats, conjA, claveAtaque)
    : statANivel(atacante.stats[claveAtaque], false);

  let defensa = conjB
    ? statFinal(defensor.stats, conjB, claveDefensa)
    : statANivel(defensor.stats[claveDefensa], false);

  const psDefensor = conjB
    ? statFinal(defensor.stats, conjB, "hp")
    : statANivel(defensor.stats.hp, true);

  const modificadores: { nombre: string; factor: number }[] = [];

  // Objetos y habilidades que tocan las stats antes del calculo. La tabla es
  // la de engine/objetos, la misma que usa el simulador.
  const statsA = factoresDeStats(conjA?.objeto ?? "ninguno", atacante.puedeEvolucionar ?? false);
  const statsB = factoresDeStats(conjB?.objeto ?? "ninguno", defensor.puedeEvolucionar ?? false);
  const factorObjetoAtaque = fisico ? statsA.ataque : statsA.ataqueEspecial;
  if (conjA && factorObjetoAtaque !== 1) {
    ataque = Math.floor(ataque * factorObjetoAtaque);
    modificadores.push({ nombre: objetoPorClave(conjA.objeto).nombre, factor: factorObjetoAtaque });
  }
  if (conjA && (conjA.habilidad === "hugepower" || conjA.habilidad === "purepower") && fisico) {
    ataque *= 2;
    modificadores.push({ nombre: "Poder Bruto", factor: 2 });
  }
  const factorObjetoDefensa = fisico ? statsB.defensa : statsB.defensaEspecial;
  if (conjB && factorObjetoDefensa !== 1) {
    defensa = Math.floor(defensa * factorObjetoDefensa);
    modificadores.push({ nombre: objetoPorClave(conjB.objeto).nombre, factor: factorObjetoDefensa });
  }
  if (campo.clima === "arena" && !fisico && defensor.tipos.includes("rock")) {
    defensa = Math.floor(defensa * 1.5);
    modificadores.push({ nombre: "Arena", factor: 1.5 });
  }
  if (campo.clima === "nieve" && fisico && defensor.tipos.includes("ice")) {
    defensa = Math.floor(defensa * 1.5);
    modificadores.push({ nombre: "Nieve", factor: 1.5 });
  }

  const base =
    Math.floor(
      Math.floor(
        (Math.floor((2 * NIVEL) / 5 + 2) * golpe.potencia * ataque) / defensa
      ) / 50
    ) + 2;

  const efectividad = defensaContra(defensor.tipos, golpe.tipo);
  const stab = atacante.tipos.includes(golpe.tipo);

  const clima = factorClima(campo.clima, golpe.tipo);
  if (clima !== 1) {
    modificadores.push({ nombre: campo.clima === "sol" ? "Sol" : "Lluvia", factor: clima });
  }
  const terreno = factorTerreno(campo.terreno, golpe.tipo);
  if (terreno !== 1) modificadores.push({ nombre: "Terreno", factor: terreno });
  if (stab) modificadores.push({ nombre: "STAB", factor: 1.5 });
  if (campo.critico) modificadores.push({ nombre: "Crítico", factor: 1.5 });
  if (campo.ayuda) modificadores.push({ nombre: "Ayuda", factor: 1.5 });
  if (campo.dobles) modificadores.push({ nombre: "Dobles", factor: 0.75 });
  if (campo.refuerzo) modificadores.push({ nombre: "Refuerzo", factor: 0.75 });

  const pantalla = fisico ? campo.pantallaFisica : campo.pantallaEspecial;
  const factorPantalla = pantalla && !campo.critico ? (campo.dobles ? 0.667 : 0.5) : 1;
  if (factorPantalla !== 1) {
    modificadores.push({
      nombre: fisico ? "Reflejo" : "Pantalla Luz",
      factor: factorPantalla,
    });
  }

  // Un solo golpe: la gema y la baya cuentan como si todavia estuvieran.
  let factorObjetoDano = conjA
    ? factorDeDano(conjA.objeto, golpe.tipo, golpe.categoria, efectividad, GEMAS[conjA.objeto] === golpe.tipo)
    : 1;
  if (conjA && factorObjetoDano !== 1) {
    modificadores.push({ nombre: objetoPorClave(conjA.objeto).nombre, factor: factorObjetoDano });
  }
  if (conjB && bayaResiste(conjB.objeto, golpe.tipo, efectividad)) {
    factorObjetoDano *= 0.5;
    modificadores.push({ nombre: objetoPorClave(conjB.objeto).nombre, factor: 0.5 });
  }

  let factorHabilidadDefensa = 1;
  if (conjB?.habilidad === "thickfat" && (golpe.tipo === "fire" || golpe.tipo === "ice")) {
    factorHabilidadDefensa = 0.5;
    modificadores.push({ nombre: "Sebo", factor: 0.5 });
  }
  const inmunidad = conjB ? INMUNIDAD_POR_HABILIDAD[conjB.habilidad] : undefined;
  const anulado = inmunidad === golpe.tipo || (conjB ? globoProtege(conjB.objeto, golpe.tipo) : false);

  // Las dieciseis tiradas del motor, de 0,85 a 1,00.
  const tiradas: number[] = [];
  for (let r = 85; r <= 100; r += 1) {
    if (anulado || efectividad === 0) {
      tiradas.push(0);
      continue;
    }
    let d = base;
    d = Math.floor(d * clima * terreno);
    if (campo.critico) d = Math.floor(d * 1.5);
    d = Math.floor((d * r) / 100);
    if (stab) d = Math.floor(d * 1.5);
    d = Math.floor(d * efectividad);
    if (campo.ayuda) d = Math.floor(d * 1.5);
    if (campo.dobles) d = Math.floor(d * 0.75);
    if (campo.refuerzo) d = Math.floor(d * 0.75);
    d = Math.floor(d * factorPantalla);
    d = Math.floor(d * factorObjetoDano);
    d = Math.floor(d * factorHabilidadDefensa);
    tiradas.push(Math.max(1, d));
  }

  const minimo = tiradas[0];
  const maximo = tiradas[tiradas.length - 1];
  const ohko = tiradas.filter((d) => d >= psDefensor).length / tiradas.length;

  return {
    tiradas,
    minimo,
    maximo,
    porcentajeMin: (minimo / psDefensor) * 100,
    porcentajeMax: (maximo / psDefensor) * 100,
    efectividad: anulado ? 0 : efectividad,
    stab,
    psDefensor,
    golpesParaTumbar: maximo > 0 ? Math.ceil(psDefensor / maximo) : null,
    probabilidadOHKO: ohko,
    modificadores,
  };
}

export const INMUNIDAD_POR_HABILIDAD: Record<string, string> = {
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

export function compararVelocidad(
  a: Stats,
  b: Stats,
  conjA?: Conjunto,
  conjB?: Conjunto
) {
  // El Pañuelo Elección cuenta: es lo que decide quien pega primero.
  const va = conjA
    ? Math.floor(statFinal(a, conjA, "speed") * factoresDeStats(conjA.objeto, false).velocidad)
    : statANivel(a.speed, false);
  const vb = conjB
    ? Math.floor(statFinal(b, conjB, "speed") * factoresDeStats(conjB.objeto, false).velocidad)
    : statANivel(b.speed, false);
  return { va, vb, gana: va === vb ? "empate" : va > vb ? "a" : "b" };
}
