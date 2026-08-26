// Cuanto vale cada cosa que puede aportar un candidato.
//
// Elegir un criterio no cambia la cuenta: cambia cuanto pesa cada parte de la
// cuenta. Por eso hay una sola tabla base y cada criterio la corre en los pocos
// pesos que le importan, en vez de tener ocho formulas distintas que despues
// hay que mantener en paralelo.

export type Criterio =
  | "general"
  | "ofensivo"
  | "defensivo"
  | "velocidad"
  | "apoyo"
  | "amenazas"
  | "clima"
  | "espacioraro";

export const CRITERIOS: { clave: Criterio; nombre: string }[] = [
  { clave: "general", nombre: "Lo mejor en general" },
  { clave: "ofensivo", nombre: "Ofensivo" },
  { clave: "defensivo", nombre: "Defensivo" },
  { clave: "velocidad", nombre: "Control de velocidad" },
  { clave: "apoyo", nombre: "Apoyo" },
  { clave: "amenazas", nombre: "Contra las amenazas" },
  { clave: "clima", nombre: "Clima" },
  { clave: "espacioraro", nombre: "Espacio Raro" },
];

export type Pesos = {
  debilidades: number;
  ciegos: number;
  resistencias: number;
  velocidad: number;
  balance: number;
  roles: number;
  clima: number;
  espacioRaro: number;
  amenazas: number;
  potencial: number;
  penalizacionDebilidad: number;
  penalizacionRedundancia: number;
};

const BASE: Pesos = {
  debilidades: 10,
  ciegos: 7,
  resistencias: 3,
  velocidad: 12,
  balance: 8,
  roles: 6,
  clima: 10,
  espacioRaro: 10,
  amenazas: 8,
  potencial: 7,
  penalizacionDebilidad: 8,
  penalizacionRedundancia: 6,
};

const POR_CRITERIO: Record<Criterio, Partial<Pesos>> = {
  general: {},
  ofensivo: { ciegos: 16, amenazas: 12, potencial: 8, debilidades: 5 },
  defensivo: { debilidades: 18, resistencias: 8, penalizacionDebilidad: 14, ciegos: 3 },
  velocidad: { velocidad: 30, ciegos: 4, debilidades: 5 },
  apoyo: { roles: 18, velocidad: 16, potencial: 1 },
  amenazas: { amenazas: 24, debilidades: 12, ciegos: 4 },
  clima: { clima: 30, velocidad: 6 },
  espacioraro: { espacioRaro: 30, velocidad: 2 },
};

export function pesosDe(criterio: Criterio): Pesos {
  return { ...BASE, ...POR_CRITERIO[criterio] };
}
