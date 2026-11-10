// Copia del jar de Cobblemon el ícono de cada objeto de src/data/objetos.json a
// public/cobblemon/objetos/<clave>.png. El jar los guarda con guion bajo
// (choice_band) y las claves no lo llevan (choiceband): se comparan sin él.
//
//   node scripts/iconos-objetos.mjs

import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const AdmZip = require("adm-zip");

const rutas = JSON.parse(await readFile(path.resolve("scripts/rutas.local.json"), "utf8").catch(() => "{}"));
const JAR = process.env.COBBLEMON_JAR ?? rutas.jar;
if (!JAR) throw new Error("Falta la ruta al jar: COBBLEMON_JAR o scripts/rutas.local.json");

const objetos = JSON.parse(await readFile("src/data/objetos.json", "utf8"));
const SALIDA = "public/cobblemon/objetos";

const porNombre = new Map();
for (const e of new AdmZip(JAR).getEntries()) {
  const m = e.entryName.match(/^assets\/cobblemon\/textures\/item\/(?:.+\/)?([^/]+)\.png$/);
  if (m && !porNombre.has(m[1].replace(/_/g, ""))) porNombre.set(m[1].replace(/_/g, ""), e);
}

await mkdir(SALIDA, { recursive: true });
const faltan = [];
for (const o of objetos) {
  const e = porNombre.get(o.clave);
  if (!e) { faltan.push(o.clave); continue; }
  await writeFile(path.join(SALIDA, `${o.clave}.png`), e.getData());
}
console.log(`${objetos.length - faltan.length} de ${objetos.length} íconos en ${SALIDA}`);
if (faltan.length) console.log(`Sin ícono en el jar: ${faltan.join(", ")}`);
