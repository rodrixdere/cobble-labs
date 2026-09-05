// Saca del jar de Cobblemon los datos de los Pokemon que entran en el roster y
// los deja en src/data/pokemon.json, que es lo que consume la web.
//
// Ya no se extrae ningun asset. Los modelos .geo.json, las animaciones Bedrock
// y las texturas UV los leia el visor 3D, que fue eliminado: eran los 18 MB de
// public/cobblemon, donde ahora solo viven los retratos que baja el otro
// script.
//
// El jar es la fuente de verdad porque es exactamente lo que corre el servidor:
// cualquier API externa (PokeAPI y compañia) tiene los datos de los juegos
// oficiales, que no son los mismos que Cobblemon implementa.
//
// Uso:  node scripts/extraer-cobblemon.mjs
import { createRequire } from "node:module";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const AdmZip = require("adm-zip");

// Las rutas apuntan a una instancia de Minecraft, o sea a algo que cambia en
// cada maquina. Salen del entorno, o de scripts/rutas.local.json, que no se
// versiona. Ninguna ruta personal vive en el repo.
async function rutasLocales() {
  try {
    return JSON.parse(
      await readFile(path.resolve("scripts/rutas.local.json"), "utf8")
    );
  } catch {
    return {};
  }
}

const locales = await rutasLocales();

const JAR = process.env.COBBLEMON_JAR ?? locales.jar;

// El Pokemon Showdown que Cobblemon deja instalado en la instancia. Es el motor
// con el que el servidor resuelve los combates, asi que tipo, categoria y
// potencia de cada movimiento salen de ahi.
const SHOWDOWN = process.env.COBBLEMON_SHOWDOWN ?? locales.showdown;

if (!JAR || !SHOWDOWN) {
  console.error(
    [
      "Faltan las rutas a la instancia de Cobblemon.",
      "",
      "Poné COBBLEMON_JAR y COBBLEMON_SHOWDOWN en el entorno, o creá",
      "scripts/rutas.local.json con:",
      "",
      '  { "jar": ".../mods/Cobblemon-fabric-X.jar", "showdown": ".../showdown/data" }',
    ].join("\n")
  );
  process.exit(1);
}

const DATOS = path.resolve("src/data");

// El roster del servidor. Hoy es una regla sobre las etiquetas de Cobblemon;
// cuando haya una lista concreta, se reemplaza por esa lista y nada mas cambia.
const GENERACIONES = new Set(["gen1", "gen2", "gen3", "gen4"]);

function esSemilla(especie) {
  if (!especie.implemented) return false;
  const etiquetas = especie.labels ?? [];
  return etiquetas.some((l) => GENERACIONES.has(l));
}

// El roster no es "las tres primeras generaciones" sino todo lo que se puede
// tener en el servidor partiendo de ellas. Ursaring es de gen 2 y evoluciona a
// Ursaluna, que es de gen 8: si Ursaring esta, Ursaluna tambien.
//
// Se recorre el grafo de evoluciones en los dos sentidos, hacia lo que
// evoluciona y hacia sus bebes, hasta que no entra nadie nuevo.
function cerrarPorEvolucion(todas) {
  // Los nombres del jar traen apostrofos y puntos ("Farfetch'd", "Mr. Mime")
  // pero los resultados de evolucion vienen sin ellos ("sirfetchd"), asi que
  // hay que comparar en limpio o la mitad de las cadenas se corta.
  const limpiar = (n) => n.toLowerCase().replace(/[^a-z0-9]/g, "");

  const porNombre = new Map(todas.map((e) => [limpiar(e.name), e]));
  const dentro = new Set(todas.filter(esSemilla).map((e) => limpiar(e.name)));

  let crecio = true;
  while (crecio) {
    crecio = false;

    for (const nombre of [...dentro]) {
      const especie = porNombre.get(nombre);
      if (!especie) continue;

      const vecinos = [];

      // Las evoluciones de la forma base.
      for (const ev of especie.evolutions ?? []) {
        if (ev.result) vecinos.push(limpiar(ev.result.split(" ")[0]));
      }

      // Y las de cada forma regional, que son distintas: Farfetch'd de Galar
      // evoluciona a Sirfetch'd y el Farfetch'd normal no evoluciona a nada.
      // Los resultados vienen como "weezing galarian", con la especie primero.
      for (const forma of especie.forms ?? []) {
        for (const ev of forma.evolutions ?? []) {
          if (ev.result) vecinos.push(limpiar(ev.result.split(" ")[0]));
        }
        if (forma.preEvolution) {
          vecinos.push(limpiar(forma.preEvolution.split(" ")[0]));
        }
      }

      if (especie.preEvolution) {
        vecinos.push(limpiar(especie.preEvolution.split(" ")[0]));
      }

      for (const vecino of vecinos) {
        const otra = porNombre.get(vecino);
        if (!otra || !otra.implemented || dentro.has(vecino)) continue;
        dentro.add(vecino);
        crecio = true;
      }
    }
  }

  return dentro;
}

// El jar trae el idioma completo del mod: nombre y descripcion de cada especie,
// movimiento y habilidad, en el mismo espaniol que ve el jugador dentro del
// juego. Es la unica fuente de texto que no hay que inventar ni traducir.
function leerIdioma(zip) {
  const entrada = zip.getEntry("assets/cobblemon/lang/es_es.json");
  if (!entrada) throw new Error("el jar no trae assets/cobblemon/lang/es_es.json");
  return JSON.parse(entrada.getData().toString("utf8"));
}

// Los biomas de evolucion regional vienen como un tag propio
// ("#cobblemon:evolution/regional/koffing_galarbiome") que apunta a biomas de
// verdad. Sin resolverlo, la ficha diria "en" y nada mas.
function leerTagsDeBioma(zip) {
  const tags = new Map();

  for (const e of zip.getEntries()) {
    if (e.isDirectory) continue;
    if (!e.entryName.includes("tags/worldgen/biome/")) continue;
    if (!e.entryName.endsWith(".json")) continue;

    const ruta = e.entryName
      .replace("data/cobblemon/tags/worldgen/biome/", "")
      .replace(/\.json$/, "");

    try {
      const datos = JSON.parse(e.getData().toString("utf8"));
      tags.set(`#cobblemon:${ruta}`, datos.values ?? []);
    } catch {
      // Un tag roto no vale la pena romper la extraccion.
    }
  }

  return tags;
}

// Las apariciones salen de spawn_pool_world: es donde el servidor decide que
// sale cada Pokemon, con su rareza, su rango de nivel y sus biomas.
function leerApariciones(zip) {
  const porEspecie = new Map();

  for (const e of zip.getEntries()) {
    if (e.isDirectory) continue;
    if (!e.entryName.includes("spawn_pool_world/")) continue;
    if (!e.entryName.endsWith(".json")) continue;

    let datos;
    try {
      datos = JSON.parse(e.getData().toString("utf8"));
    } catch {
      continue;
    }
    if (datos.enabled === false) continue;

    for (const spawn of datos.spawns ?? []) {
      if (spawn.type && spawn.type !== "pokemon") continue;
      const especie = String(spawn.pokemon ?? "").split(" ")[0].toLowerCase();
      if (!especie) continue;

      const condicion = spawn.condition ?? {};
      const lista = porEspecie.get(especie) ?? [];
      lista.push({
        rareza: spawn.bucket ?? "common",
        nivel: spawn.level ?? null,
        peso: spawn.weight ?? null,
        contexto: spawn.spawnablePositionType ?? null,
        biomas: condicion.biomes ?? [],
        luzMinima: condicion.minSkyLight ?? null,
        luzMaxima: condicion.maxSkyLight ?? null,
        // Cobblemon usa timeRange para el momento del dia.
        momento: spawn.condition?.timeRange ?? null,
        clima: condicion.isRaining === true ? "lluvia" : condicion.isThundering === true ? "tormenta" : null,
      });
      porEspecie.set(especie, lista);
    }
  }

  return porEspecie;
}

function textoDe(idioma, clave) {
  const valor = idioma[clave];
  return typeof valor === "string" && valor.length > 0 ? valor : null;
}

// Las otras formas de una especie: megaevoluciones y variantes regionales.
// Viven dentro del propio JSON de la especie y cada una puede cambiar tipos,
// stats o habilidad; lo que no cambia se hereda de la forma base.
//
// Gmax se descarta: no trae nada distinto de lo que la ficha muestra.
const TIPOS_DE_FORMA = [
  { prefijo: "mega", tipo: "mega" },
  { prefijo: "alolan", tipo: "regional", etiqueta: "Alola" },
  { prefijo: "galarian", tipo: "regional", etiqueta: "Galar" },
  { prefijo: "hisuian", tipo: "regional", etiqueta: "Hisui" },
  { prefijo: "paldean", tipo: "regional", etiqueta: "Paldea" },
];

// Cambia el tag de evolucion por los biomas a los que apunta.
function resolverEvolucion(ev, tagsDeBioma) {
  const requisitos = (ev.requirements ?? []).map((r) => {
    if (r.variant !== "biome" || typeof r.biomeCondition !== "string") return r;

    const valores = tagsDeBioma.get(r.biomeCondition);
    if (!valores || valores.length === 0) return r;

    return { ...r, biomas: valores };
  });

  return { ...ev, requirements: requisitos };
}

// Los aspectos que solo cambian el aspecto visual o donde aparece, nunca los
// datos de combate. Se descartan antes de mirar nada mas.
const ASPECTOS_COSMETICOS = [
  "gmax",
  "region-bias-",
  "character-",
  "partner-",
  // Los gorros y comidas que agrega mega_showdown: cambian el sombrero y nada
  // mas. Los Pikachu de disfraz no entran aca porque esos si cambian habilidad.
  "cosmetic_item-",
];

// Formas que el jar trae pero que no se consiguen en el servidor. Rodrigo
// confirmo que Ursaluna Luna Carmesi no esta, asi que mostrarla seria prometer
// algo que no existe. Si algun dia se habilita, se saca de aca y vuelve sola.
const FORMAS_FUERA = new Map([
  ["ursaluna", ["Bloodmoon"]],
  // Los Pikachu de disfraz cambian Estatica por Pararrayos, asi que no son
  // cosmeticos del todo, pero no se consiguen en el servidor y ensucian la
  // ficha con seis entradas sin retrato propio.
  ["pikachu", ["Cosplay", "Rock-Star", "Pop-Star", "PhD", "Libre", "Belle"]],
]);

function claseDeForma(aspectos) {
  for (const a of aspectos) {
    const encontrado = TIPOS_DE_FORMA.find((t) => a.startsWith(t.prefijo));
    if (encontrado) return encontrado;
  }

  // Cualquier otra forma entra igual, con su nombre por etiqueta: Rotom Heat,
  // Giratina Origin, Shaymin Sky, las de Arceus. Antes se descartaban por no
  // ser mega ni regional, y son formas de combate como cualquier otra. Lo que
  // no cambia tipos, stats ni habilidad lo filtra quien llama.
  return { tipo: "otra" };
}

let TAGS_DE_BIOMA = new Map();

function formasDe(especie) {
  return (especie.forms ?? [])
    .map((forma) => {
      const aspectos = forma.aspects ?? [];
      if (aspectos.some((a) => ASPECTOS_COSMETICOS.some((c) => a.startsWith(c)))) {
        return null;
      }
      if (FORMAS_FUERA.get(especie.name.toLowerCase())?.includes(forma.name)) {
        return null;
      }

      const clase = claseDeForma(aspectos);
      if (!clase) return null;

      const tipos = [
        forma.primaryType ?? especie.primaryType,
        forma.secondaryType ?? especie.secondaryType,
      ].filter(Boolean);

      // Una forma que no cambia ni tipos ni stats ni habilidad no aporta nada.
      const cambiaTipos =
        tipos.join("/") !==
        [especie.primaryType, especie.secondaryType].filter(Boolean).join("/");
      // Se compara el contenido y no si el campo viene: los Pikachu de disfraz
      // declaran stats y habilidades identicas a las del base, asi que "trae
      // baseStats" no alcanza para decir que cambian algo.
      const igual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
      const cambiaStats =
        Boolean(forma.baseStats) && !igual(forma.baseStats, especie.baseStats);
      const cambiaHabilidad =
        Boolean(forma.abilities) && !igual(forma.abilities, especie.abilities);
      if (!cambiaTipos && !cambiaStats && !cambiaHabilidad) return null;

      return {
        nombre: forma.name,
        tipo: clase.tipo,
        // "Mega", "Mega X", "Alola", "Galar"...
        etiqueta:
          clase.tipo === "mega"
            ? forma.name.replace(/^Mega-?/, "Mega ").trim()
            : (clase.etiqueta ?? forma.name),
        aspectos,
        tipos,
        stats: forma.baseStats ?? especie.baseStats,
        habilidades: (forma.abilities ?? especie.abilities ?? []).map((a) => ({
          nombre: a.replace(/^h:/, ""),
          oculta: a.startsWith("h:"),
        })),
        // Una forma regional puede evolucionar a otra cosa que la base.
        evoluciones: (forma.evolutions ?? [])
          .map((ev) => resolverEvolucion(ev, TAGS_DE_BIOMA))
          .map((ev) => ({
          a: ev.result?.split(" ")[0] ?? null,
          aspecto: ev.result?.split(" ")[1] ?? null,
          variante: ev.variant ?? null,
          requisitos: ev.requirements ?? [],
          contexto: ev.requiredContext ?? null,
        })),
      };
    })
    .filter(Boolean);
}

// "0001_bulbasaur" es como Cobblemon nombra la carpeta de assets de cada uno.
// Cobblemon deja que otros mods toquen sus especies con species_additions: ahi
// se marca implementada una especie que el mod base trae apagada, y se agregan
// formas. El servidor arma su roster asi, con mega_showdown habilitando los
// legendarios y zamega poniendo las megas de Legends Z-A. Leyendo solo el jar
// de Cobblemon el sitio muestra menos de lo que el servidor tiene.
//
// Se recorren todos los jars de la carpeta de mods, no una lista escrita: el
// dia que el servidor sume otro addon, entra solo.
async function aplicarAdiciones(especies, carpetaMods) {
  const limpiar = (n) => String(n).toLowerCase().replace(/[^a-z0-9]/g, "");
  const porNombre = new Map(especies.map((e) => [limpiar(e.name), e]));

  const jars = (await readdir(carpetaMods))
    .filter((n) => n.endsWith(".jar") && n !== path.basename(JAR))
    .sort();

  const resumen = [];

  for (const nombre of jars) {
    let entradas;
    try {
      entradas = new AdmZip(path.join(carpetaMods, nombre)).getEntries();
    } catch {
      continue;
    }

    let habilitadas = 0;
    let formas = 0;

    for (const e of entradas) {
      if (!e.entryName.startsWith("data/cobblemon/species_additions/")) continue;
      if (!e.entryName.endsWith(".json")) continue;

      let adicion;
      try {
        adicion = JSON.parse(e.getData().toString("utf8"));
      } catch {
        continue;
      }

      const objetivo = String(adicion.target ?? "").split(":").pop();
      const especie = porNombre.get(limpiar(objetivo));
      if (!especie) continue;

      if (adicion.implemented === true && !especie.implemented) {
        especie.implemented = true;
        habilitadas += 1;
      }

      for (const forma of adicion.forms ?? []) {
        especie.forms ??= [];
        if (especie.forms.some((f) => f.name === forma.name)) continue;
        especie.forms.push(forma);
        formas += 1;
      }
    }

    if (habilitadas || formas) {
      resumen.push({ mod: nombre, habilitadas, formas });
    }
  }

  return resumen;
}

function carpetaAssets(especie) {
  const n = String(especie.nationalPokedexNumber).padStart(4, "0");
  return `${n}_${especie.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
}

async function main() {
  console.log(`Leyendo ${path.basename(JAR)}`);
  const zip = new AdmZip(JAR);
  const entradas = zip.getEntries();

  // --- 1) Datos de especie ---
  const todas = [];
  for (const e of entradas) {
    if (!e.entryName.startsWith("data/cobblemon/species/")) continue;
    if (!e.entryName.endsWith(".json")) continue;
    todas.push(JSON.parse(e.getData().toString("utf8")));
  }

  const adiciones = await aplicarAdiciones(todas, path.dirname(JAR));
  for (const a of adiciones) {
    console.log(
      `  ${a.mod}: ${a.habilitadas} especies habilitadas, ${a.formas} formas`
    );
  }

  const dentro = cerrarPorEvolucion(todas);
  const especies = todas.filter((e) =>
    dentro.has(e.name.toLowerCase().replace(/[^a-z0-9]/g, ""))
  );
  especies.sort((a, b) => a.nationalPokedexNumber - b.nationalPokedexNumber);

  const semillas = todas.filter(esSemilla).length;
  console.log(
    `  ${especies.length} especies en el roster ` +
      `(${semillas} de ${[...GENERACIONES].join(", ")} y ${especies.length - semillas} que entran por evolucion)`
  );

  const idioma = leerIdioma(zip);
  const apariciones = leerApariciones(zip);
  const tagsDeBioma = leerTagsDeBioma(zip);
  TAGS_DE_BIOMA = tagsDeBioma;
  console.log(`  ${apariciones.size} especies con apariciones en el mundo`);

  // --- 2) El JSON que consume la web ---
  // Se guarda solo lo que la interfaz usa. El jar trae comportamiento de IA,
  // hitboxes y drops que no pintan nada en una ficha y pesan en el bundle.
  const compacto = especies.map((e) => ({
    dex: e.nationalPokedexNumber,
    nombre: e.name,
    slug: e.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    assets: carpetaAssets(e),
    tipos: [e.primaryType, e.secondaryType].filter(Boolean),
    stats: e.baseStats,
    // "h:" marca la habilidad oculta.
    habilidades: (e.abilities ?? []).map((a) => ({
      nombre: a.replace(/^h:/, ""),
      oculta: a.startsWith("h:"),
    })),
    gruposHuevo: e.eggGroups ?? [],
    alturaM: e.height / 10,
    pesoKg: e.weight / 10,
    tasaCaptura: e.catchRate,
    grupoExperiencia: e.experienceGroup,
    evYield: e.evYield,
    etiquetas: e.labels ?? [],
    // "12:razorleaf" -> nivel 12, razorleaf. Los que no traen nivel son
    // huevo, MT o tutor, y se guardan aparte.
    movimientosPorNivel: (e.moves ?? [])
      .filter((m) => /^\d+:/.test(m))
      .map((m) => {
        const [nivel, nombre] = m.split(":");
        return { nivel: Number(nivel), nombre };
      })
      .sort((a, b) => a.nivel - b.nivel),
    otrosMovimientos: (e.moves ?? []).filter((m) => !/^\d+:/.test(m)),
    // Como evoluciona: la via (subir de nivel, piedra, intercambio), lo que
    // hace falta y el objeto concreto cuando lo hay.
    evoluciones: (e.evolutions ?? []).map((ev) => resolverEvolucion(ev, tagsDeBioma)).map((ev) => ({
      a: ev.result?.split(" ")[0] ?? null,
      // "weezing galarian": la especie y, cuando hay, la forma a la que llega.
      aspecto: ev.result?.split(" ")[1] ?? null,
      variante: ev.variant ?? null,
      requisitos: ev.requirements ?? [],
      contexto: ev.requiredContext ?? null,
    })),
    preEvolucion: e.preEvolution?.split(" ")[0] ?? null,
    // Crianza y captura, todo del jar.
    generoMacho: e.maleRatio ?? null,
    ciclosHuevo: e.eggCycles ?? null,
    amistadBase: e.baseFriendship ?? null,
    expBase: e.baseExperienceYield ?? null,
    apariciones: apariciones.get(e.name.toLowerCase()) ?? [],
    descripcion: (e.pokedex ?? [])
      .map((clave) => textoDe(idioma, clave))
      .filter(Boolean)
      .join(" "),
    formas: formasDe(e),
  }));

  // --- 3) Nombre y descripcion de cada movimiento y habilidad ---
  // Solo los que alguien del roster puede aprender o tener: el idioma completo
  // cubre las nueve generaciones y son 1.888 movimientos, la mayoria de
  // Pokemon que no estan en el servidor.
  const movimientosUsados = new Set();
  const habilidadesUsadas = new Set();
  for (const p of compacto) {
    for (const m of p.movimientosPorNivel) movimientosUsados.add(m.nombre);
    for (const m of p.otrosMovimientos) movimientosUsados.add(m.slice(m.indexOf(":") + 1));
    for (const h of p.habilidades) habilidadesUsadas.add(h.nombre);
    for (const f of p.formas) for (const h of f.habilidades) habilidadesUsadas.add(h.nombre);
  }

  const diccionario = (claves, prefijo) => {
    const salida = {};
    for (const clave of [...claves].sort()) {
      const nombre = textoDe(idioma, `${prefijo}.${clave}`);
      if (!nombre) continue;
      salida[clave] = {
        nombre,
        desc: textoDe(idioma, `${prefijo}.${clave}.desc`) ?? "",
      };
    }
    return salida;
  };

  const textos = {
    movimientos: diccionario(movimientosUsados, "cobblemon.move"),
    habilidades: diccionario(habilidadesUsadas, "cobblemon.ability"),
  };

  // --- 4) Ficha tecnica de cada movimiento, desde Showdown ---
  const showdown = require(`${SHOWDOWN}/moves.js`);
  const catalogo = showdown.Moves ?? showdown.default ?? showdown;
  const fichas = {};
  let sinFicha = 0;
  for (const clave of movimientosUsados) {
    const m = catalogo[clave];
    if (!m) {
      sinFicha += 1;
      continue;
    }
    const banderas = m.flags ?? {};
    fichas[clave] = {
      tipo: m.type.toLowerCase(),
      categoria: m.category.toLowerCase(), // physical | special | status
      potencia: m.basePower ?? 0,
      // Showdown marca "no falla" con true en vez de un numero.
      precision: m.accuracy === true ? null : m.accuracy,
      pp: m.pp ?? 0,
      prioridad: m.priority ?? 0,
      // A quien apunta: normal, allAdjacentFoes, allAdjacent, self, allySide,
      // all... Es lo que hace falta para dobles y para el reparto de daño.
      objetivo: m.target ?? "normal",
      protegible: Boolean(banderas.protect),
      contacto: Boolean(banderas.contact),
      sonido: Boolean(banderas.sound),
      // Efectos que el motor puede aplicar sin interpretar codigo.
      estado: m.status ?? null,
      volatil: m.volatileStatus ?? null,
      cambiosPropios: m.boosts ?? null,
      secundario: m.secondary
        ? {
            probabilidad: m.secondary.chance ?? 100,
            estado: m.secondary.status ?? null,
            cambios: m.secondary.boosts ?? null,
            volatil: m.secondary.volatileStatus ?? null,
          }
        : null,
      cambiosAlUsar: m.self?.boosts ?? null,
      drenaje: m.drain ?? null,
      retroceso: m.recoil ?? null,
      multiGolpe: m.multihit ?? null,
      efectoDeLado: m.sideCondition ?? null,
      efectoDeCampo: m.pseudoWeather ?? null,
      clima: m.weather ?? null,
      terreno: m.terrain ?? null,
      curacion: m.heal ?? null,
    };
  }
  textos.fichas = fichas;

  // --- 4b) Objetos: los que existen en Cobblemon y ademas Showdown conoce ---
  // La lista del jar trae 950 claves (pokeballs, bayas, cosmeticos); las que
  // cruzan con Showdown son las que pesan en combate.
  const catalogoObjetos = (() => {
    const mod = require(`${SHOWDOWN}/items.js`);
    return mod.Items ?? mod.default ?? mod;
  })();

  const objetos = [];
  for (const clave of Object.keys(idioma)) {
    if (!clave.startsWith("item.cobblemon.")) continue;
    if (clave.endsWith(".desc") || clave.includes(".tooltip")) continue;
    const cola = clave.slice("item.cobblemon.".length);
    if (cola.includes(".")) continue;
    const claveShowdown = cola.replace(/_/g, "");
    const ficha = catalogoObjetos[claveShowdown];
    if (!ficha) continue;

    objetos.push({
      clave: claveShowdown,
      nombre: idioma[clave],
      desc: textoDe(idioma, `${clave}.desc`) ?? "",
      // Lo que el motor puede leer sin interpretar el codigo de Showdown.
      megaPara: ficha.megaEvolves ?? null,
      esBaya: Boolean(ficha.isBerry),
    });
  }
  objetos.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  // --- 5) Las 25 naturalezas, con la stat que suben y la que bajan ---
  const naturalezas = require(`${SHOWDOWN}/natures.js`);
  const tablaNaturalezas = naturalezas.Natures ?? naturalezas.default ?? naturalezas;
  textos.naturalezas = Object.entries(tablaNaturalezas).map(([clave, n]) => ({
    clave,
    nombre: n.name,
    sube: n.plus ?? null,
    baja: n.minus ?? null,
  }));

  await mkdir(DATOS, { recursive: true });
  await writeFile(
    path.join(DATOS, "pokemon.json"),
    JSON.stringify(compacto, null, 2)
  );
  await writeFile(
    path.join(DATOS, "textos.json"),
    JSON.stringify(textos, null, 2)
  );
  await writeFile(
    path.join(DATOS, "objetos.json"),
    JSON.stringify(objetos, null, 2)
  );

  const porTipo = {};
  for (const p of compacto) for (const t of p.tipos) porTipo[t] = (porTipo[t] ?? 0) + 1;
  console.log(`\nListo: ${compacto.length} en src/data/pokemon.json`);
  console.log(`Tipos: ${Object.keys(porTipo).length}`);
  const megas = compacto.reduce(
    (a, p) => a + p.formas.filter((f) => f.tipo === "mega").length,
    0
  );
  const regionales = compacto.reduce(
    (a, p) => a + p.formas.filter((f) => f.tipo === "regional").length,
    0
  );
  const otras = compacto.reduce(
    (a, p) => a + p.formas.filter((f) => f.tipo === "otra").length,
    0
  );
  console.log(
    `Formas: ${megas} megas, ${regionales} regionales y ${otras} otras ` +
      `(Origin, Sky, las de Arceus, las de Rotom)`
  );
  console.log(`Con descripcion: ${compacto.filter((p) => p.descripcion).length}`);
  console.log(
    `Con apariciones: ${compacto.filter((p) => p.apariciones.length > 0).length} ` +
      `(${compacto.reduce((a, p) => a + p.apariciones.length, 0)} lugares)`
  );
  console.log(
    `Textos: ${Object.keys(textos.movimientos).length} movimientos, ` +
      `${Object.keys(textos.habilidades).length} habilidades`
  );
  console.log(
    `Fichas de Showdown: ${Object.keys(fichas).length} movimientos` +
      (sinFicha ? ` (${sinFicha} sin ficha)` : "")
  );
  console.log(`Naturalezas: ${textos.naturalezas.length}`);
  console.log(`Objetos de combate: ${objetos.length}`);
}

main().catch((e) => {
  console.error("Fallo la extraccion:", e.message);
  process.exit(1);
});
