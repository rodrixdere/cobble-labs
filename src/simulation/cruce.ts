import {
  impactoPorMiembro,
  mejoresSalidas,
  simularCombate,
  simularSerie,
  type Impacto,
  type Luchador,
  type ResultadoCombate,
  type ResultadoSerie,
  type Salida,
} from "@/simulation/simulador";

// Un cruce completo entre dos equipos: la serie principal mas los tres analisis
// que la acompañan. Va aca y no en el componente porque es simulacion, no
// pantalla, y asi se puede probar sin montar React.

// Los analisis secundarios van con menos combates: son una serie por cada
// salida y otra por cada miembro que se saca. Con los numeros de la serie
// principal tardarian de mas sin cambiar la conclusion.
export const COMBATES_POR_SALIDA = 150;
export const COMBATES_POR_IMPACTO = 200;

/** Las tandas que se ofrecen. Mas de dos mil no cambia la lectura. */
export const TANDAS = [200, 500, 1000, 2000];

export type Cruce = {
  serie: ResultadoSerie;
  salidas: Salida[];
  impacto: Impacto[];
  /** Un combate guardado entero, para poder reproducirlo turno a turno. */
  muestra: ResultadoCombate;
  equipoA: Luchador[];
  equipoB: Luchador[];
  porcentajeA: number;
  porcentajeB: number;
};

export function correrCruce(
  equipoA: Luchador[],
  equipoB: Luchador[],
  combates: number
): Cruce {
  const serie = simularSerie(equipoA, equipoB, combates);

  return {
    serie,
    salidas: mejoresSalidas(equipoA, equipoB, COMBATES_POR_SALIDA),
    impacto: impactoPorMiembro(equipoA, equipoB, COMBATES_POR_IMPACTO),
    muestra: simularCombate(equipoA, equipoB, true),
    equipoA,
    equipoB,
    porcentajeA: (serie.ganaA / serie.combates) * 100,
    porcentajeB: (serie.ganaB / serie.combates) * 100,
  };
}
