import medidas from "@/data/retratos.json";

const TABLA = medidas as Record<string, number[]>;

/**
 * El retrato de una forma se guarda como `{assets}_{clave}`. Si esa forma no
 * tiene icono propio en el pack, se cae al de la especie: mejor el Pokemon
 * correcto con su cara de siempre que un hueco vacio.
 */
export function assetsDeForma(assets: string, forma?: string | null): string {
  if (!forma) return assets;
  const conForma = `${assets}_${forma}`;
  return conForma in TABLA ? conForma : assets;
}

// Los retratos son pixel art de entre 14 y 51 px de lado, cada uno con su
// propia medida. Escalarlos todos a la misma caja les rompe la grilla de
// pixeles y borra la diferencia de tamanio entre un Voltorb y un Wailord, asi
// que se agrandan por un factor entero hasta acercarse al lado pedido.
export function medidaRetrato(
  assets: string,
  ladoObjetivo: number,
  escalaMaxima: number
): { ancho: number; alto: number } | null {
  const medida = TABLA[assets];
  if (!medida) return null;
  const [ancho, alto] = medida;
  const escala = Math.max(
    1,
    Math.min(escalaMaxima, Math.floor(ladoObjetivo / Math.max(ancho, alto)))
  );
  return { ancho: ancho * escala, alto: alto * escala };
}
