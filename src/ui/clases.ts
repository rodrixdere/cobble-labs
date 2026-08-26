// Junta clases salteando las vacias y las condicionales que no aplican, para
// no tener que armar plantillas con ternarios adentro del JSX.
export function cx(...partes: (string | false | null | undefined)[]): string {
  return partes.filter(Boolean).join(" ");
}
