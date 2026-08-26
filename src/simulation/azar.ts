// Azar reproducible. El motor tira números para la variación de daño, los
// empates de velocidad y el orden de los rivales; con Math.random esas tiradas
// se pierden y una simulación no se puede volver a ver.
//
// mulberry32: 32 bits de estado, rápido y suficiente para esto. Con la misma
// semilla sale exactamente la misma serie de combates.
export type Azar = {
  semilla: number;
  siguiente: () => number;
  entero: (limite: number) => number;
  entre: (minimo: number, maximo: number) => number;
  elegir: <T>(lista: T[]) => T;
  mezclar: <T>(lista: T[]) => T[];
};

export function crearAzar(semilla: number): Azar {
  let estado = semilla >>> 0;

  const siguiente = () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const entero = (limite: number) => Math.floor(siguiente() * limite);

  return {
    semilla,
    siguiente,
    entero,
    entre: (minimo, maximo) => minimo + siguiente() * (maximo - minimo),
    elegir: (lista) => lista[entero(lista.length)],
    mezclar: (lista) => {
      const copia = [...lista];
      for (let i = copia.length - 1; i > 0; i -= 1) {
        const j = entero(i + 1);
        [copia[i], copia[j]] = [copia[j], copia[i]];
      }
      return copia;
    },
  };
}

// Una semilla legible, para poder anotarla y volver a la misma simulación.
export function semillaNueva(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

// El azar de siempre, para los llamados que no piden reproducibilidad.
export const AZAR_LIBRE: Azar = {
  semilla: -1,
  siguiente: Math.random,
  entero: (limite) => Math.floor(Math.random() * limite),
  entre: (minimo, maximo) => minimo + Math.random() * (maximo - minimo),
  elegir: (lista) => lista[Math.floor(Math.random() * lista.length)],
  mezclar: (lista) => {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  },
};
