// La direccion canonica del sitio, en un solo lugar. La usan la metadata, el
// sitemap y el robots. El sitio tambien responde en cobble-labs.rodrixdere
// .workers.dev, pero esa no es la que se publica.
export const SITIO = "https://cobble-lab.com";

// Las secciones fijas, con la prioridad que se le declara a Google. La Pokédex
// va primero porque es la portada y la que mas se busca.
export const SECCIONES = [
  { ruta: "/", prioridad: 1 },
  { ruta: "/equipos", prioridad: 0.9 },
  { ruta: "/tipos", prioridad: 0.8 },
  { ruta: "/battle-bot", prioridad: 0.8 },
  { ruta: "/learn", prioridad: 0.7 },
] as const;

// El identificador de Google Analytics 4. Vacío no carga nada: así el sitio en
// local y cualquier clon del repo no mandan datos. El ID es público de por sí,
// viaja en el HTML de la página, por eso va acá y no en una variable de entorno.
export const ANALITICA_GA = "";

// La comunidad (cuentas y equipos publicados) existe solo en la prueba local
// hasta que el backend se publique. `npm run api` la prende al construir.
export const COMUNIDAD_ACTIVA = process.env.NEXT_PUBLIC_COMUNIDAD === "1";

/** Login de prueba en vez de Discord. Nunca en el build de produccion. */
export const MODO_LOCAL = process.env.NEXT_PUBLIC_MODO_LOCAL === "1";

// De donde se leen las listas de la comunidad: el dominio de R2 en produccion,
// y el propio Worker en la prueba local.
export const DATOS_URL = process.env.NEXT_PUBLIC_DATOS_URL ?? "https://datos.cobble-lab.com";

/** La clave publica del widget de Turnstile. */
export const TURNSTILE_SITEKEY = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY ?? "";
