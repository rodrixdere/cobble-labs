import { olvidarSesion } from "@/comunidad/sesion";
import type { EquipoPublicado, ListaDeEquipos } from "@/comunidad/tipos";
import { DATOS_URL, MODO_LOCAL } from "@/data/sitio";

// Lo que el sitio le pide a la comunidad. Leer va a los archivos publicos; solo
// publicar, borrar y la cuenta pasan por el Worker.

export class ErrorDeApi extends Error {
  estado: number;
  problemas: string[];

  constructor(estado: number, mensaje: string, problemas: string[] = []) {
    super(mensaje);
    this.estado = estado;
    this.problemas = problemas;
  }
}

export function mensajeDeError(e: unknown): string {
  return e instanceof ErrorDeApi ? e.message : "Algo falló. Probá de nuevo.";
}

export async function llamarApi<T>(metodo: "GET" | "POST" | "DELETE", ruta: string, cuerpo?: unknown): Promise<T> {
  const respuesta = await fetch(ruta, {
    method: metodo,
    headers: cuerpo === undefined ? undefined : { "content-type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    // La sesion del navegador quedo vieja: la cookie ya no sirve.
    if (respuesta.status === 401) olvidarSesion();
    throw new ErrorDeApi(respuesta.status, datos.error ?? "Algo falló. Probá de nuevo.", datos.problemas);
  }
  return datos;
}

export function publicarEquipo(nombre: string, cadena: string, turnstile: string) {
  return llamarApi<{ id: string }>("POST", "/api/equipos", { nombre, cadena, turnstile });
}

export function borrarEquipoPublicado(id: string) {
  return llamarApi("DELETE", `/api/equipos/${id}`);
}

export async function salirDeLaCuenta(): Promise<void> {
  try {
    await llamarApi("POST", "/api/salir");
  } finally {
    olvidarSesion();
  }
}

export async function borrarCuenta(confirmacion: string): Promise<void> {
  await llamarApi("DELETE", "/api/cuenta", { confirmacion });
  olvidarSesion();
}

export async function leerArchivoPublico<T>(clave: string): Promise<T | null> {
  const respuesta = await fetch(`${DATOS_URL}/${clave}`);
  if (respuesta.status === 404) return null;
  if (!respuesta.ok) throw new ErrorDeApi(respuesta.status, "No se pudieron cargar los equipos.");
  return respuesta.json();
}

export const leerRecientes = () => leerArchivoPublico<ListaDeEquipos>("equipos/recientes.json");
export const leerPorEspecie = (slug: string) =>
  leerArchivoPublico<ListaDeEquipos>(`equipos/especie/${slug}.json`);
export const leerDeAutor = (id: string) => leerArchivoPublico<ListaDeEquipos>(`autores/${id}.json`);
export const leerEquipo = (id: string) => leerArchivoPublico<EquipoPublicado>(`equipos/${id}.json`);

// Adonde volver despues de entrar. Solo rutas propias: una direccion de afuera
// convertiria el login en un trampolin a cualquier sitio.
const VOLVER = "cobble-labs:volver";
const POR_DEFECTO = "/comunidad";

export function irAEntrar(nombreDePrueba = "Entrenador de prueba"): void {
  try {
    sessionStorage.setItem(VOLVER, window.location.pathname + window.location.search);
  } catch {
    // Sin almacenamiento se vuelve a la comunidad.
  }
  window.location.href = MODO_LOCAL
    ? `/api/auth/prueba?nombre=${encodeURIComponent(nombreDePrueba)}`
    : "/api/auth/discord";
}

export function adondeVolver(): string {
  try {
    const destino = sessionStorage.getItem(VOLVER);
    sessionStorage.removeItem(VOLVER);
    return destino?.startsWith("/") && !destino.startsWith("//") ? destino : POR_DEFECTO;
  } catch {
    return POR_DEFECTO;
  }
}
