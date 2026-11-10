// La búsqueda de todos los buscadores del sitio: Pokédex, armador, objetos y
// movimientos. Se compara por el comienzo de cada palabra, no por cualquier
// letra suelta: "f" trae Fearow y no Butterfree, y "baya zi" trae Baya Zidra.

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const palabras = (texto: string) => normalizar(texto).split(/[^a-z0-9ñ]+/).filter(Boolean);

/** Cada palabra de la consulta tiene que ser el comienzo de alguna palabra del texto. */
export function coincide(texto: string, consulta: string): boolean {
  const buscadas = palabras(consulta);
  if (buscadas.length === 0) return true;
  const propias = palabras(texto);
  return buscadas.every((b) => propias.some((p) => p.startsWith(b)));
}

/** Primero los que empiezan con la consulta, después los que la tienen en otra palabra. */
export function porComienzo<T>(lista: T[], nombre: (x: T) => string, consulta: string): T[] {
  const q = normalizar(consulta);
  return lista.toSorted((a, b) => Number(!normalizar(nombre(a)).startsWith(q)) - Number(!normalizar(nombre(b)).startsWith(q)));
}

/** "6", "06" y "006" encuentran al número 6 de la Pokédex. */
export function coincideNumero(dex: number, consulta: string): boolean {
  const q = consulta.trim();
  return /^\d+$/.test(q) && (Number(q) === dex || String(dex).padStart(3, "0").startsWith(q));
}
