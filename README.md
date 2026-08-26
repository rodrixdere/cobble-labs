# Cobble Labs

Herramienta de referencia competitiva para servidores de **Cobblemon**: Pokédex,
armador de equipos con recomendaciones, tabla de tipos y simulador de combates.

Los datos no salen de una API de los juegos oficiales. Salen del jar de
Cobblemon que corre el servidor y del Pokémon Showdown que el mod deja
instalado, que es lo que de verdad resuelve los combates ahí. Cuando Cobblemon
implementa una especie distinto a como está en los juegos, acá aparece como la
implementa Cobblemon.

En la configuración actual cubre 410 especies, 86 megaevoluciones y formas
regionales, y 644 movimientos.

## Qué hay adentro

**Pokédex.** Cada especie con sus stats base, habilidades, movimientos, defensas
por tipo, cobertura ofensiva y dónde aparece. Los filtros por tipo y generación
quedan en la URL, así que una búsqueda se puede compartir tal cual.

**Equipos.** Armás los seis y el sistema va diciendo qué le falta al equipo:
debilidades que comparten, tipos que nadie cubre, roles que no están. Cada
recomendación explica por qué mejora *ese* equipo, no por qué el Pokémon es
bueno en general. Se importa y exporta en formato Showdown, y el equipo entero
viaja comprimido en la dirección de la página para poder pasarlo por chat.

**Tipos.** La tabla completa, y qué le hace cada tipo a cada uno.

**Battle Bot.** Dos herramientas. El probador cruza dos equipos y corre hasta
2000 combates para decir con cuál conviene abrir y cuánto pesa cada miembro. La
prueba automática mide un equipo contra un pool de rivales y devuelve un
porcentaje reproducible: la misma semilla da exactamente la misma prueba.

**Learn.** Cómo se leen las stats, los tipos y el cálculo de daño.

## Qué NO hace

Esto importa tanto como lo anterior, porque un número sin sus límites engaña.

El simulador modela stats a nivel 50 con puntos y naturaleza, los cuatro
movimientos elegidos, megaevoluciones, tabla de tipos, STAB, orden por
velocidad, la variación aleatoria de cada golpe, siete objetos y dieciséis
habilidades. **No** modela el resto de las habilidades, estados alterados,
clima, terreno, movimientos de apoyo, prioridad, críticos ni cambios
voluntarios. Sirve para comparar equipos entre sí, no para predecir una partida.

Los objetos se pueden elegir todos, porque son los que el jugador tiene de
verdad, y la interfaz avisa cuáles no cambian la simulación.

Tampoco hay datos de uso ni de tiers, porque no son públicos. Donde haría falta
algo así se usa el total de stats base, que es un sustituto pobre y por eso pesa
poco en las cuentas. Las secciones que todavía no tienen dato real se quedan
vacías y dicen por qué, en vez de rellenarse con algo inventado.

## Correrlo local

Hace falta Node 20 o más nuevo.

```bash
npm install
```

Los datos ya están en el repo, así que con eso alcanza para levantarlo. Solo
hace falta regenerarlos si actualizás el modpack, y para eso sí necesitás una
instancia de Minecraft con Cobblemon: apuntá las dos variables a la tuya y corré
el extractor.

```bash
# bash
export COBBLEMON_JAR=".../mods/Cobblemon-fabric-1.7.3+1.21.1.jar"
export COBBLEMON_SHOWDOWN=".../showdown/data"

# PowerShell
$env:COBBLEMON_JAR = "...\mods\Cobblemon-fabric-1.7.3+1.21.1.jar"
$env:COBBLEMON_SHOWDOWN = "...\showdown\data"

npm run extraer
```

Después los retratos, que se bajan de un pack público y no necesitan la
instancia:

```bash
npm run retratos
```

Y ya:

```bash
npm run dev      # http://localhost:3001
npm test
npm run build
```

Si actualizás el modpack, corré `npm run extraer` de nuevo y queda al día. El
roster no es una lista escrita a mano sino una regla sobre las etiquetas de
Cobblemon (`GENERACIONES` en el script), que además arrastra las evoluciones: si
Ursaring entra, Ursaluna entra con él aunque sea de otra generación.

## Publicarlo

No hay nada que corra en el servidor, así que el sitio se compila a HTML y se
sirve como archivos estáticos. `next build` deja todo en `out/`.

Cada push a `main` dispara el build y el deploy en Cloudflare. Los ajustes, en
Workers & Pages, el Worker, Settings, Builds:

| | |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | la raíz del repo |

El nombre del Worker tiene que coincidir con el `name` de `wrangler.jsonc`
(`cobble-labs`) o el build falla.

Para subir a mano, sin pasar por GitHub:

```bash
npm run deploy    # compila y sube
npm run preview   # lo mismo pero local, para ver qué se va a subir
```

`wrangler.jsonc` no declara `main`, o sea que no se ejecuta código: son solo
assets, y en Cloudflare las requests a assets estáticos no se cobran.

### SEO

El sitio vive en `https://cobble-lab.com`, y esa dirección está en un solo
lugar: `src/data/sitio.ts`. De ahí salen el sitemap, el robots y la canónica.

Todas las páginas declaran canónica hacia el dominio. Hace falta porque el
mismo contenido se sirve también en `cobble-labs.rodrixdere.workers.dev`, y sin
esa señal Google elige por su cuenta cuál indexar.

`sitemap.ts` se arma del roster, no de una lista a mano: son 415 URLs y las
fichas nuevas entran solas cuando se actualiza el mod.

La tarjeta social es `public/og.png`, un PNG estático. **No** se usa la ruta
`opengraph-image` de Next: emite un archivo sin extensión y Cloudflare lo sirve
sin `Content-Type`, así que las redes no muestran la imagen. Verificado contra
el host real. El generador quedó en el taller, con las instrucciones para
rehacerla.

Las rutas de metadata llevan `export const dynamic = "force-static"`, que con
`output: "export"` es obligatorio o el build falla.

### Por qué los datos generados sí están en el repo

`src/data/pokemon.json`, `src/data/retratos.json` y `public/cobblemon/` los
generan `npm run extraer` y `npm run retratos`, pero igual se versionan. El
servidor que compila no tiene la instancia de Minecraft de donde salen, así que
sin ellos el build falla. Son unos 5 MB, y el efecto secundario es bueno: quien
clone el repo puede correrlo sin tener Cobblemon instalado.

## Cómo está organizado

```
src/
  app/          Las páginas.
  components/   Un archivo por pantalla, con subcarpeta para las grandes.
  ui/           Las primitivas: Boton, Modal, Campo, Pestanias, Barra.
  lib/          Ayudas sin dominio.

  data/         Lectura y normalización de lo que sale del jar.
  engine/       Fórmula de daño y tabla de tipos. Sin estado, sin React.
  analysis/     Qué le pasa a un equipo: coberturas, defensas, roles.
  team/         Sets, validación, guardado, importar y exportar.
  simulation/   Los motores de combate y de prueba.
  recommendations/  El motor de recomendaciones.
```

Las cuatro capas de abajo no saben nada de React ni de las de arriba, así que se
pueden probar solas. Los 77 tests corren en menos de dos segundos.

No hay base de datos ni backend: los equipos guardados viven en el
`localStorage` del navegador.

Anda de 360px para arriba. Las pantallas densas cambian de forma según el
ancho: la Pokédex va de 2 a 6 columnas, las columnas laterales se apilan, y la
tabla de tipos scrollea dentro de su caja con la etiqueta de fila fija.

## Licencia y créditos

El código de este repo va con licencia **MIT**, en `LICENSE`.

Eso cubre el código y nada más. Los datos salen de Cobblemon, que es MPL-2.0;
los retratos son del pack [dCIM](https://modrinth.com/resourcepack/dcim), que es
MIT y pide atribución; y Pokémon es marca de Nintendo, Creatures y GAME FREAK,
que ninguna licencia de acá cubre. El detalle está en `NOTICE.md`.

Cobble Labs es una herramienta de comunidad, sin relación oficial ni respaldo de
Cobblemon ni de Nintendo.
