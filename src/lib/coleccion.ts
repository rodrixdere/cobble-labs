// Dos ayudas sin dominio, para no repetirlas en cada pantalla.

/**
 * Filtro que ademas le saca el null y el undefined al tipo. Va en lugar del
 * `.filter(Boolean) as Cosa[]`, que compila porque se lo obliga: si el map
 * cambia, el cast miente y el error salta lejos de donde se rompio.
 */
export function presente<T>(valor: T | null | undefined): valor is T {
  return valor != null;
}

/** Indice por clave para no recorrer una lista adentro de otra. */
export function indexarPor<T, C>(items: readonly T[], clave: (item: T) => C) {
  return new Map(items.map((item) => [clave(item), item]));
}
