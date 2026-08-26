import { TIPOS, type Stats } from "@/data/pokemon";
import { defensaContra, multiplicador } from "@/engine/tabla-tipos";
import type { Miembro } from "@/team/combate";
import { analizarCampo, type EstrategiaDeCampo } from "@/analysis/campo";
import { analizarRoles, type ResumenDeRoles } from "@/analysis/roles";

// El analisis completo de una composicion. Todo se calcula sobre los sets
// puestos: los movimientos que el equipo lleva de verdad, no sus tipos.

export type CoberturaPorTipo = { tipo: string; mejor: number; cuantos: number };

// Que le hace el equipo a cada tipo, con los movimientos cargados. Un tipo
// esta cubierto si alguien le pega al menos x2.
export function coberturaOfensiva(equipo: Miembro[]): CoberturaPorTipo[] {
  return TIPOS.map((defensor) => {
    let mejor = 0;
    let cuantos = 0;

    for (const m of equipo) {
      let mejorDelMiembro = 0;
      for (const mov of m.movimientos) {
        if (mov.potencia <= 0) continue;
        const x = multiplicador(mov.tipo, defensor);
        if (x > mejorDelMiembro) mejorDelMiembro = x;
      }
      if (mejorDelMiembro >= 2) cuantos += 1;
      if (mejorDelMiembro > mejor) mejor = mejorDelMiembro;
    }

    return { tipo: defensor, mejor, cuantos };
  });
}

export type DefensaPorTipo = {
  tipo: string;
  debiles: number;
  resisten: number;
  inmunes: number;
};

export function defensasDelEquipo(equipo: Miembro[]): DefensaPorTipo[] {
  return TIPOS.map((atacante) => {
    let debiles = 0;
    let resisten = 0;
    let inmunes = 0;

    for (const m of equipo) {
      const x = defensaContra(m.tipos, atacante);
      if (x === 0) inmunes += 1;
      else if (x > 1) debiles += 1;
      else if (x < 1) resisten += 1;
    }

    return { tipo: atacante, debiles, resisten, inmunes };
  });
}

export function debilidadesCompartidas(
  equipo: Miembro[],
  minimo = 2
): DefensaPorTipo[] {
  return defensasDelEquipo(equipo)
    .filter((d) => d.debiles >= minimo && d.debiles > d.resisten + d.inmunes)
    .toSorted((a, b) => b.debiles - a.debiles);
}

export function puntosCiegos(equipo: Miembro[]): string[] {
  if (equipo.length === 0) return [];
  return coberturaOfensiva(equipo)
    .filter((c) => c.cuantos === 0)
    .map((c) => c.tipo);
}

export type BalanceOfensivo = {
  fisicos: number;
  especiales: number;
  mixtos: number;
  desbalanceado: boolean;
};

export function balanceOfensivo(equipo: Miembro[]): BalanceOfensivo {
  let fisicos = 0;
  let especiales = 0;
  let mixtos = 0;

  for (const m of equipo) {
    const conDanio = m.movimientos.filter((x) => x.potencia > 0);
    const f = conDanio.filter((x) => x.categoria === "physical").length;
    const e = conDanio.filter((x) => x.categoria === "special").length;
    if (f > 0 && e > 0 && Math.abs(f - e) <= 1) mixtos += 1;
    else if (f >= e) fisicos += 1;
    else especiales += 1;
  }

  const total = equipo.length;
  const desbalanceado =
    total >= 4 && (fisicos >= total - 1 || especiales >= total - 1);

  return { fisicos, especiales, mixtos, desbalanceado };
}

export type Sinergia = {
  total: number;
  componentes: { nombre: string; valor: number; peso: number }[];
  lectura: string;
};

// Los pesos son configurables a proposito: estan aca arriba y no escondidos en
// la cuenta. Suman 1.
export const PESOS_DE_SINERGIA = {
  cobertura: 0.25,
  defensa: 0.25,
  balance: 0.15,
  velocidad: 0.2,
  variedad: 0.15,
};

export function calcularSinergia(equipo: Miembro[]): Sinergia {
  if (equipo.length === 0) {
    return { total: 0, componentes: [], lectura: "Todavía no hay equipo." };
  }

  const cobertura = coberturaOfensiva(equipo);
  const cubiertos = cobertura.filter((c) => c.cuantos > 0).length;
  const puntajeCobertura = (cubiertos / TIPOS.length) * 100;

  const defensas = defensasDelEquipo(equipo);
  const criticas = defensas.filter((d) => d.debiles >= Math.ceil(equipo.length / 2));
  const conResistencia = defensas.filter((d) => d.resisten + d.inmunes > 0).length;
  const puntajeDefensa = Math.max(
    0,
    (conResistencia / TIPOS.length) * 100 - criticas.length * 12
  );

  const balance = balanceOfensivo(equipo);
  const puntajeBalance = balance.desbalanceado ? 45 : 85;

  const campo = analizarCampo(equipo);
  const puntajeVelocidad =
    campo.controlDeVelocidad.quienes.length >= 2
      ? 100
      : campo.controlDeVelocidad.quienes.length === 1
        ? 70
        : 30;

  const roles = analizarRoles(equipo);
  const puntajeVariedad = Math.min(100, roles.conteo.length * 14);

  const componentes = [
    { nombre: "Cobertura ofensiva", valor: puntajeCobertura, peso: PESOS_DE_SINERGIA.cobertura },
    { nombre: "Solidez defensiva", valor: puntajeDefensa, peso: PESOS_DE_SINERGIA.defensa },
    { nombre: "Balance físico y especial", valor: puntajeBalance, peso: PESOS_DE_SINERGIA.balance },
    { nombre: "Control de velocidad", valor: puntajeVelocidad, peso: PESOS_DE_SINERGIA.velocidad },
    { nombre: "Variedad de roles", valor: puntajeVariedad, peso: PESOS_DE_SINERGIA.variedad },
  ];

  const total = Math.round(
    componentes.reduce((a, c) => a + c.valor * c.peso, 0)
  );

  const fuerte = componentes.toSorted((a, b) => b.valor - a.valor)[0];
  const flojo = componentes.toSorted((a, b) => a.valor - b.valor)[0];

  return {
    total,
    componentes,
    lectura:
      componentes.length > 0
        ? `Lo mejor del equipo es ${fuerte.nombre.toLowerCase()}; lo que más lo frena es ${flojo.nombre.toLowerCase()}.`
        : "",
  };
}

export type AnalisisDeEquipo = {
  cobertura: CoberturaPorTipo[];
  defensas: DefensaPorTipo[];
  compartidas: DefensaPorTipo[];
  ciegos: string[];
  balance: BalanceOfensivo;
  roles: ResumenDeRoles;
  campo: EstrategiaDeCampo;
  sinergia: Sinergia;
};

export function analizarEquipo(equipo: Miembro[]): AnalisisDeEquipo {
  return {
    cobertura: coberturaOfensiva(equipo),
    defensas: defensasDelEquipo(equipo),
    compartidas: debilidadesCompartidas(equipo),
    ciegos: puntosCiegos(equipo),
    balance: balanceOfensivo(equipo),
    roles: analizarRoles(equipo),
    campo: analizarCampo(equipo),
    sinergia: calcularSinergia(equipo),
  };
}

// La stat mas alta de un miembro, que se usa para leer de que vive.
export function statPrincipal(stats: Stats): keyof Stats {
  return (Object.entries(stats).toSorted((a, b) => b[1] - a[1])[0][0] ??
    "hp") as keyof Stats;
}
