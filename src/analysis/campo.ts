import { statANivel } from "@/engine/calculo-dano";
import type { Miembro } from "@/team/combate";

// Estrategias de campo: clima, terreno, Espacio Raro y control de velocidad.
// Todo sale de los movimientos que el equipo lleva puestos y de las habilidades
// elegidas, no de suponer que un Pokemon "es de sol" porque suele serlo.

// Habilidades que ponen clima al entrar. Son las cuatro clasicas mas las de
// tercera generacion; si el jar suma otras, se agregan aca.
const HABILIDAD_CLIMA: Record<string, string> = {
  drought: "sun",
  drizzle: "rain",
  sandstream: "sandstorm",
  snowwarning: "snow",
  desolateland: "sun",
  primordialsea: "rain",
};

const HABILIDAD_TERRENO: Record<string, string> = {
  electricsurge: "electricterrain",
  grassysurge: "grassyterrain",
  mistysurge: "mistyterrain",
  psychicsurge: "psychicterrain",
};

// Habilidades que se aprovechan de un clima concreto.
const HABILIDAD_APROVECHA_CLIMA: Record<string, string> = {
  chlorophyll: "sun",
  solarpower: "sun",
  leafguard: "sun",
  flowergift: "sun",
  harvest: "sun",
  swiftswim: "rain",
  raindish: "rain",
  dryskin: "rain",
  hydration: "rain",
  sandrush: "sandstorm",
  sandveil: "sandstorm",
  sandforce: "sandstorm",
  slushrush: "snow",
  snowcloak: "snow",
  icebody: "snow",
};

export const NOMBRE_CLIMA: Record<string, string> = {
  sun: "Sol",
  rain: "Lluvia",
  sandstorm: "Tormenta de arena",
  snow: "Nieve",
  hail: "Granizo",
};

export const NOMBRE_TERRENO: Record<string, string> = {
  electricterrain: "Campo Eléctrico",
  grassyterrain: "Campo de Hierba",
  mistyterrain: "Campo de Niebla",
  psychicterrain: "Campo Psíquico",
};

export type EstrategiaDeCampo = {
  clima: string | null;
  quienPoneElClima: string[];
  quienLoAprovecha: string[];
  terreno: string | null;
  quienPoneElTerreno: string[];
  espacioRaro: { activo: boolean; setters: string[]; lentos: number };
  controlDeVelocidad: { quienes: string[]; comos: string[] };
  velocidadMedia: number;
};

export function analizarCampo(equipo: Miembro[]): EstrategiaDeCampo {
  const quienPoneElClima: string[] = [];
  const climas = new Set<string>();
  const quienPoneElTerreno: string[] = [];
  const terrenos = new Set<string>();
  const setters: string[] = [];
  const quienes: string[] = [];
  const comos: string[] = [];

  for (const m of equipo) {
    const porHabilidad = HABILIDAD_CLIMA[m.conjunto.habilidad];
    const porMovimiento = m.movimientos.find((x) => x.clima)?.clima ?? null;
    if (porHabilidad || porMovimiento) {
      quienPoneElClima.push(m.nombre);
      climas.add(porHabilidad ?? porMovimiento!);
    }

    const terrenoHabilidad = HABILIDAD_TERRENO[m.conjunto.habilidad];
    const terrenoMovimiento = m.movimientos.find((x) => x.terreno)?.terreno ?? null;
    if (terrenoHabilidad || terrenoMovimiento) {
      quienPoneElTerreno.push(m.nombre);
      terrenos.add(terrenoHabilidad ?? terrenoMovimiento!);
    }

    if (m.movimientos.some((x) => x.efectoDeCampo === "trickroom")) setters.push(m.nombre);

    const suControl: string[] = [];
    for (const x of m.movimientos) {
      if (x.efectoDeLado === "tailwind") suControl.push("Viento Afín");
      else if (x.efectoDeCampo === "trickroom") suControl.push("Espacio Raro");
      else if (x.estado === "par") suControl.push(x.nombre);
      else if (x.cambiosAlRival && (x.cambiosAlRival.spe ?? 0) < 0) suControl.push(x.nombre);
    }
    if (suControl.length > 0) {
      quienes.push(m.nombre);
      comos.push(...suControl);
    }
  }

  const velocidades = equipo.map((m) => statANivel(m.stats.speed, false));
  const velocidadMedia =
    velocidades.length > 0
      ? velocidades.reduce((a, b) => a + b, 0) / velocidades.length
      : 0;

  // A nivel 50, 100 de velocidad final es el punto donde un equipo deja de ser
  // rapido. Debajo de eso y con quien lo ponga, el Espacio Raro tiene sentido.
  const lentos = velocidades.filter((v) => v < 100).length;

  const clima = climas.size > 0 ? [...climas][0] : null;
  const quienLoAprovecha = clima
    ? equipo
        .filter((m) => HABILIDAD_APROVECHA_CLIMA[m.conjunto.habilidad] === clima)
        .map((m) => m.nombre)
    : [];

  return {
    clima,
    quienPoneElClima,
    quienLoAprovecha,
    terreno: terrenos.size > 0 ? [...terrenos][0] : null,
    quienPoneElTerreno,
    espacioRaro: {
      activo: setters.length > 0,
      setters,
      lentos,
    },
    controlDeVelocidad: { quienes, comos: [...new Set(comos)] },
    velocidadMedia,
  };
}

// Si el equipo tiene pinta de Espacio Raro aunque todavia no tenga quien lo
// ponga: mayoria lenta y con pegada. Sirve para recomendar un setter.
export function pareceEspacioRaro(equipo: Miembro[]): boolean {
  if (equipo.length < 3) return false;
  const lentos = equipo.filter(
    (m) => statANivel(m.stats.speed, false) < 95
  ).length;
  const pegadores = equipo.filter(
    (m) => Math.max(m.stats.attack, m.stats.special_attack) >= 100
  ).length;
  return lentos >= Math.ceil(equipo.length * 0.7) && pegadores >= 2;
}

export function aprovechaClima(habilidad: string, clima: string | null): boolean {
  if (!clima) return false;
  return HABILIDAD_APROVECHA_CLIMA[habilidad] === clima;
}

export function poneClima(habilidad: string): string | null {
  return HABILIDAD_CLIMA[habilidad] ?? null;
}

export function poneTerreno(habilidad: string): string | null {
  return HABILIDAD_TERRENO[habilidad] ?? null;
}
