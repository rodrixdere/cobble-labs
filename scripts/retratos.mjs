// Deja un retrato PNG por cada Pokemon del roster en public/cobblemon/retratos.
//
// Antes esto se hacia renderizando los 366 modelos 3D en un Chromium sin
// ventana. El render corria por CPU y la placa integrada usa RAM del sistema
// como VRAM: la tanda agotaba la memoria y se llevaba puesta la sesion de
// Windows. Nunca completo una corrida.
//
// Ahora los iconos se bajan ya dibujados de dCIM, un pack de iconos de
// Cobblemon con licencia MIT que cubre la Pokedex nacional entera. Sus
// carpetas usan la misma clave que el jar ("0001_bulbasaur"), asi que casan
// uno a uno con el campo `assets` del roster. No abre navegador, no toca la
// GPU y termina en segundos.
//
// Uso:  node scripts/retratos.mjs
import { createRequire } from "node:module";
import { mkdir, writeFile, rm, stat } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const AdmZip = require("adm-zip");

// Version fijada a proposito: si el pack cambia, se actualiza acá y se vuelve a
// correr, en vez de que una build tome iconos distintos sin que nadie lo pida.
const PACK_URL =
  "https://cdn.modrinth.com/data/fOzKqjMA/versions/oTpUSp6D/dCIM%201.0.4.zip";
const CACHE = path.resolve(".cache/dcim-1.0.4.zip");
const SALIDA = path.resolve("public/cobblemon/retratos");
const MEDIDAS = path.resolve("src/data/retratos.json");
const RAIZ = "assets/cobblemon/textures/entity_icon/";

const roster = require("../src/data/pokemon.json");

async function existe(ruta) {
  try {
    await stat(ruta);
    return true;
  } catch {
    return false;
  }
}

async function bajarPack() {
  if (await existe(CACHE)) return;
  console.log("Bajando el pack de iconos (12 MB, una sola vez)");
  const r = await fetch(PACK_URL);
  if (!r.ok) throw new Error(`El pack respondio ${r.status}`);
  await mkdir(path.dirname(CACHE), { recursive: true });
  await writeFile(CACHE, Buffer.from(await r.arrayBuffer()));
}

// El alto y el ancho salen del IHDR, que en un PNG siempre arranca en el byte
// 16. Se guardan para que la ficha reserve el hueco exacto y escale el icono
// por un factor entero, que es lo que mantiene el pixel art nitido.
function medidas(buf) {
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

// El pack trae, por carpeta, la forma base mas shiny, sexos y variantes
// regionales. Para el retrato queremos la base: primero el nombre pelado, y si
// no esta, el macho. Los cuatro que no siguen la convencion (Venusaur,
// Vileplume, Mr. Mime y Ho-Oh) caen en el nombre mas corto que no sea shiny.
function elegirBase(archivos, nombre) {
  const base = archivos.filter((a) => !a.nombre.includes("_shiny"));
  const preferidos = [`${nombre}.png`, `${nombre}_male.png`, `${nombre}_female.png`];
  for (const p of preferidos) {
    const hit = base.find((a) => a.nombre === p);
    if (hit) return hit;
  }
  return base.sort((a, b) => a.nombre.length - b.nombre.length)[0] ?? null;
}

// La clave con la que la web nombra a una forma. Tiene que dar igual que la de
// roster-combate.ts o el retrato no se encuentra.
const claveDeForma = (nombre) => nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-");

// El jar dice "blaze-breed" donde el pack dice "blaze", y separa con guion
// donde el pack separa con guion bajo.
const normalizar = (aspecto) => aspecto.replace(/-breed$/, "").replace(/-/g, "_");

// dCIM 1.0.4 guardo el Sandslash de Alola como "n.png": el nombre quedo
// truncado a su ultima letra. Se reconoce porque mide lo mismo que su version
// shiny (25x24) y no como la forma base (29x30).
const MAL_NOMBRADOS = { "0028_sandslash": { alolan: "n.png" } };

// El icono de una forma no se busca por nombre sino por aspecto, porque el pack
// nombra los archivos con su propio criterio y no siempre coincide con la
// carpeta. Se queda con el que tenga todos los aspectos pedidos y nada de
// sobra: entre "tauros_paldean_aqua" y "tauros_paldean_blaze", el aspecto
// desempata.
function elegirForma(archivos, aspectos, carpeta) {
  const piezas = (aspectos ?? []).map(normalizar).filter(Boolean);
  if (piezas.length === 0) return null;

  const candidatos = archivos
    .filter((a) => !a.nombre.includes("_shiny"))
    .map((a) => ({ a, tokens: a.nombre.replace(/\.png$/, "").split("_") }))
    .filter(({ tokens }) =>
      piezas.every((p) => p.split("_").every((t) => tokens.includes(t)))
    )
    .sort((x, y) => x.tokens.length - y.tokens.length);

  if (candidatos.length > 0) return candidatos[0].a;

  const rescate = MAL_NOMBRADOS[carpeta]?.[piezas[0]];
  return rescate ? (archivos.find((a) => a.nombre === rescate) ?? null) : null;
}

async function main() {
  await bajarPack();

  const zip = new AdmZip(CACHE);
  const porCarpeta = new Map();
  // El numero de Pokedex es lo unico que el jar y el pack escriben igual
  // siempre. Sirve de respaldo cuando el resto de la clave no coincide: el jar
  // dice "0866_mrrime" y el pack "0866_mr_rime". Los 1025 prefijos del pack son
  // unicos, asi que buscar por numero no puede traer al Pokemon equivocado.
  const porDex = new Map();

  for (const e of zip.getEntries()) {
    if (e.isDirectory) continue;
    if (!e.entryName.startsWith(RAIZ) || !e.entryName.endsWith(".png")) continue;
    const resto = e.entryName.slice(RAIZ.length).split("/");
    if (resto.length !== 2) continue;
    const [carpeta, nombre] = resto;

    // El zip lista cada archivo dos veces; la primera aparicion alcanza.
    if (!porCarpeta.has(carpeta)) porCarpeta.set(carpeta, []);
    const lista = porCarpeta.get(carpeta);
    if (!lista.some((a) => a.nombre === nombre)) lista.push({ nombre, e });

    porDex.set(carpeta.slice(0, 4), carpeta);
  }

  await rm(SALIDA, { recursive: true, force: true });
  await mkdir(SALIDA, { recursive: true });

  const sinIcono = [];
  const tabla = {};
  let escritos = 0;
  let formas = 0;
  let bytes = 0;

  // Guarda el PNG y anota su medida, que la web usa para reservar el hueco.
  async function guardar(clave, entrada) {
    const datos = entrada.e.getData();
    await writeFile(path.join(SALIDA, `${clave}.png`), datos);
    tabla[clave] = medidas(datos);
    bytes += datos.length;
  }

  for (const p of roster) {
    // Primero por la clave del jar; si el pack la escribe distinto, por numero.
    const carpeta = porCarpeta.has(p.assets)
      ? p.assets
      : porDex.get(p.assets.slice(0, 4));

    const archivos = carpeta ? porCarpeta.get(carpeta) : null;
    if (!archivos) {
      sinIcono.push(p.nombre);
      continue;
    }

    // El nombre pelado sale de la carpeta que se termino usando, no de la clave
    // del jar: si cayo por numero, el archivo de adentro sigue la convencion
    // del pack y no la del jar.
    const elegido = elegirBase(archivos, carpeta.split("_").slice(1).join("_"));
    if (!elegido) {
      sinIcono.push(p.nombre);
      continue;
    }
    await guardar(p.assets, elegido);
    escritos++;

    // Megaevoluciones y formas regionales. Van con la misma clave que usa la
    // web para la forma, asi que el retrato se resuelve sin tabla aparte.
    for (const f of p.formas ?? []) {
      const suyo = elegirForma(archivos, f.aspectos, carpeta);
      if (!suyo) {
        sinIcono.push(`${p.nombre} ${f.etiqueta}`);
        continue;
      }
      await guardar(`${p.assets}_${claveDeForma(f.nombre)}`, suyo);
      formas++;
    }
  }

  await writeFile(MEDIDAS, `${JSON.stringify(tabla)}
`);

  const totalFormas = roster.reduce((n, p) => n + (p.formas?.length ?? 0), 0);
  console.log(`  ${escritos}/${roster.length} especies`);
  console.log(`  ${formas}/${totalFormas} formas (megas y regionales)`);
  console.log(`  ${Math.round(bytes / 1024)} KB en total`);
  if (sinIcono.length) {
    console.log(`  sin icono: ${sinIcono.join(", ")}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
