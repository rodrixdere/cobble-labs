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
