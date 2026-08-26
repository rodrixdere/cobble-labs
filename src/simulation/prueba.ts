import { statANivel } from "@/engine/calculo-dano";
import type { MovimientoCatalogo, PokemonCombate } from "@/team/combate";
import type { Conjunto } from "@/team/conjunto";
import { crearAzar, type Azar } from "@/simulation/azar";
import {
  RECETAS,
  desdeEquipoPropio,
  generarAleatorioLegal,
  generarPorArquetipo,
  sinRestringidos,
  type EquipoRival,
} from "@/simulation/generadores";
import {
  simularCombate,
  type Luchador,
  type ResultadoCombate,
} from "@/simulation/simulador";

// Prueba automática del equipo.
//
// Corre N combates contra un pool de rivales, repartiendo las batallas entre
// las fuentes elegidas, sin repetir rival hasta agotar el pool, y rotando la
// salida para que las N batallas no sean la misma batalla N veces. Todo con
// una semilla: la misma semilla devuelve exactamente la misma prueba.
//
// Ninguna cifra de este archivo sale de otro lado que no sean los combates
// simulados.

export const TAMANOS = [
  { combates: 10, nombre: "Rápida" },
  { combates: 50, nombre: "Estándar corta" },
  { combates: 100, nombre: "Estándar" },
  { combates: 250, nombre: "Seria" },
  { combates: 500, nombre: "Profunda" },
  { combates: 1000, nombre: "Masiva" },
];

export type Fuentes = {
  arquetipos: boolean;
  aleatorios: boolean;
  propios: boolean;
  // Deja afuera a los que el jar marca como legendary, mythical o restricted.
  sinRestringidos: boolean;
};

export const FUENTES_POR_DEFECTO: Fuentes = {
  arquetipos: true,
  aleatorios: true,
  propios: false,
  sinRestringidos: true,
};

export type EquipoPropioGuardado = { nombre: string; miembros: Conjunto[] };

export type RegistroCombate = {
  indice: number;
  rivalId: string;
  rivalNombre: string;
  origen: EquipoRival["origen"];
  arquetipo: string;
  gano: boolean;
  empate: boolean;
  turnos: number;
  sobrevivientes: number;
  salida: string;
};

export type PorArquetipo = {
  arquetipo: string;
  origen: EquipoRival["origen"];
  esDatoReal: boolean;
  combates: number;
  ganados: number;
  porcentaje: number;
};

export type PorMiembro = {
  slug: string;
  nombre: string;
  bajas: number;
  caidas: number;
  comoSalida: number;
  ganadosComoSalida: number;
  porcentajeComoSalida: number | null;
};

export type Amenaza = {
  slug: string;
  nombre: string;
  bajas: number;
};

export type PorRival = {
  id: string;
  nombre: string;
  arquetipo: string;
  esDatoReal: boolean;
  combates: number;
  ganados: number;
  porcentaje: number;
};

export type Cuarteto = {
  slugs: string[];
  nombres: string[];
  combates: number;
  porcentaje: number;
};

export type RepeticionGuardada = {
  motivo: string;
  rival: EquipoRival;
  combate: ResultadoCombate;
};

export type ResultadoPrueba = {
  semilla: number;
  combates: number;
  ganados: number;
  perdidos: number;
  empatados: number;
  porcentaje: number;
  turnosPromedio: number;
  sobrevivientesPromedio: number;
  distribucion: { fuente: string; combates: number; equipos: number }[];
  porArquetipo: PorArquetipo[];
  porRival: PorRival[];
  porMiembro: PorMiembro[];
  amenazas: Amenaza[];
  cuartetos: Cuarteto[];
  repeticiones: RepeticionGuardada[];
  registros: RegistroCombate[];
  faseExtra: { arquetipo: string; combates: number; porcentaje: number } | null;
  rivalesUsados: EquipoRival[];
};

// --- Armado del pool ---------------------------------------------------------

export function armarPool(
  fuentes: Fuentes,
  roster: PokemonCombate[],
  catalogo: MovimientoCatalogo[],
  azar: Azar,
  propios: EquipoPropioGuardado[],
  porSlug: Map<string, PokemonCombate>
): EquipoRival[] {
  const pool: EquipoRival[] = [];
  const usable = fuentes.sinRestringidos ? sinRestringidos(roster) : roster;

  if (fuentes.arquetipos) {
    // Dos de cada arquetipo: distintos entre sí, misma identidad.
    RECETAS.forEach((receta) => {
      for (let i = 0; i < 2; i += 1) {
        pool.push(generarPorArquetipo(receta, usable, catalogo, azar, i));
      }
    });
  }

  if (fuentes.aleatorios) {
    for (let i = 0; i < 8; i += 1) {
      pool.push(
        generarAleatorioLegal(
          usable,
          catalogo,
          azar,
          i,
          i % 2 === 0 ? "competitivo" : "casual"
        )
      );
    }
  }

  if (fuentes.propios) {
    propios.forEach((e, i) => {
      const rival = desdeEquipoPropio(e.nombre, e.miembros, porSlug, catalogo, i);
      if (rival) pool.push(rival);
    });
  }

  return pool;
}

// --- La prueba ---------------------------------------------------------------

function repartir(
  combates: number,
  pool: EquipoRival[]
): { fuente: string; combates: number; equipos: number }[] {
  const porOrigen = new Map<string, number>();
  for (const r of pool) porOrigen.set(r.origen, (porOrigen.get(r.origen) ?? 0) + 1);

  const total = pool.length;
  const nombres: Record<string, string> = {
    arquetipo: "Arquetipos generados",
    aleatorio: "Aleatorios legales",
    propio: "Tus equipos guardados",
  };

  return [...porOrigen.entries()].map(([origen, equipos]) => ({
    fuente: nombres[origen] ?? origen,
    combates: Math.round((equipos / total) * combates),
    equipos,
  }));
}

// Las bajas se acumulan de TODOS los combates, no solo de los que quedan
// guardados enteros: son cuatro números por combate y es lo que permite decir
// quién nos tumbó y cuánto aportó cada uno.
type Acumulador = {
  bajasPropias: Map<string, number>;
  caidasPropias: Map<string, number>;
  bajasRivales: Map<string, { nombre: string; bajas: number }>;
};

function correrTanda(
  equipo: Luchador[],
  rivales: EquipoRival[],
  combates: number,
  azar: Azar,
  registros: RegistroCombate[],
  desde: number,
  guardarRepeticion: (motivo: string, rival: EquipoRival, r: ResultadoCombate) => void,
  acumulador: Acumulador
) {
  if (rivales.length === 0) return;

  // Orden barajado del pool, y cuando se agota se vuelve a barajar: así nadie
  // se repite hasta que todos jugaron.
  let orden = azar.mezclar(rivales);
  let siguiente = 0;

  for (let i = 0; i < combates; i += 1) {
    if (siguiente >= orden.length) {
      orden = azar.mezclar(rivales);
      siguiente = 0;
    }
    const rival = orden[siguiente];
    siguiente += 1;

    // Rotar la salida: es la variabilidad que más cambia un combate de
    // singles, y sin esto las N batallas contra el mismo rival son idénticas.
    const posicion = i % equipo.length;
    const alineacion = [
      equipo[posicion],
      ...equipo.filter((_, j) => j !== posicion),
    ];

    const guardar = registros.length < 2 || i === 0;
    const r = simularCombate(alineacion, rival.miembros, guardar, azar);

    const gano = r.gana === "a";
    registros.push({
      indice: desde + i,
      rivalId: rival.id,
      rivalNombre: rival.nombre,
      origen: rival.origen,
      arquetipo: rival.arquetipo,
      gano,
      empate: r.gana === "empate",
      turnos: r.turnos,
      sobrevivientes: equipo.length - r.caidosA,
      salida: alineacion[0].slug,
    });

    for (const baja of r.bajas) {
      if (baja.lado === "b") {
        acumulador.bajasPropias.set(
          baja.verdugo,
          (acumulador.bajasPropias.get(baja.verdugo) ?? 0) + 1
        );
      } else {
        acumulador.caidasPropias.set(
          baja.caido,
          (acumulador.caidasPropias.get(baja.caido) ?? 0) + 1
        );
        const nombre =
          rival.miembros.find((l) => l.slug === baja.verdugo)?.nombre ?? baja.verdugo;
        const previo = acumulador.bajasRivales.get(baja.verdugo);
        if (previo) previo.bajas += 1;
        else acumulador.bajasRivales.set(baja.verdugo, { nombre, bajas: 1 });
      }
    }

    if (guardar) {
      guardarRepeticion(i === 0 ? "El primer combate" : "Otro combate completo", rival, r);
    }
  }
}

export function probarEquipo(
  equipo: Luchador[],
  pool: EquipoRival[],
  combates: number,
  semilla: number,
  adaptativo = true
): ResultadoPrueba {
  const azar = crearAzar(semilla);
  const registros: RegistroCombate[] = [];
  const repeticiones: RepeticionGuardada[] = [];

  // Se guardan pocas repeticiones a propósito: mil combates con sus turnos son
  // decenas de megabytes en memoria y no se miran.
  const guardarRepeticion = (motivo: string, rival: EquipoRival, r: ResultadoCombate) => {
    if (repeticiones.length >= 4) return;
    repeticiones.push({ motivo, rival, combate: r });
  };

  const acumulador: Acumulador = {
    bajasPropias: new Map(),
    caidasPropias: new Map(),
    bajasRivales: new Map(),
  };

  correrTanda(equipo, pool, combates, azar, registros, 0, guardarRepeticion, acumulador);

  // Fase adaptativa: si hay un arquetipo donde el equipo se cae, se le dedican
  // más combates para que el número no dependa de dos partidas sueltas.
  let faseExtra: ResultadoPrueba["faseExtra"] = null;
  const resumenInicial = agruparPorArquetipo(registros, pool);
  const flojo = resumenInicial
    .filter((a) => a.combates >= 4)
    .toSorted((x, y) => x.porcentaje - y.porcentaje)[0];

  if (adaptativo && flojo && flojo.porcentaje < 45) {
    const rivalesDelArquetipo = pool.filter((r) => r.arquetipo === flojo.arquetipo);
    const extra = Math.max(10, Math.round(combates * 0.25));
    const antes = registros.length;
    correrTanda(
      equipo,
      rivalesDelArquetipo,
      extra,
      azar,
      registros,
      antes,
      guardarRepeticion,
      acumulador
    );

    const nuevos = registros.slice(antes);
    faseExtra = {
      arquetipo: flojo.arquetipo,
      combates: extra,
      porcentaje: (nuevos.filter((r) => r.gano).length / nuevos.length) * 100,
    };
  }

  const ganados = registros.filter((r) => r.gano).length;
  const empatados = registros.filter((r) => r.empate).length;

  return {
    semilla,
    combates: registros.length,
    ganados,
    perdidos: registros.length - ganados - empatados,
    empatados,
    porcentaje: (ganados / registros.length) * 100,
    turnosPromedio:
      registros.reduce((a, r) => a + r.turnos, 0) / registros.length,
    sobrevivientesPromedio:
      registros.reduce((a, r) => a + r.sobrevivientes, 0) / registros.length,
    distribucion: repartir(combates, pool),
    porArquetipo: agruparPorArquetipo(registros, pool),
    porRival: agruparPorRival(registros, pool),
    porMiembro: agruparPorMiembro(registros, equipo, acumulador),
    amenazas: [...acumulador.bajasRivales.entries()]
      .map(([slug, v]) => ({ slug, ...v }))
      .toSorted((a, b) => b.bajas - a.bajas)
      .slice(0, 8),
    cuartetos: [],
    repeticiones,
    registros,
    faseExtra,
    rivalesUsados: pool,
  };
}

function agruparPorArquetipo(
  registros: RegistroCombate[],
  pool: EquipoRival[]
): PorArquetipo[] {
  const mapa = new Map<string, { origen: EquipoRival["origen"]; combates: number; ganados: number }>();

  for (const r of registros) {
    const previo = mapa.get(r.arquetipo) ?? { origen: r.origen, combates: 0, ganados: 0 };
    previo.combates += 1;
    if (r.gano) previo.ganados += 1;
    mapa.set(r.arquetipo, previo);
  }

  return [...mapa.entries()]
    .map(([arquetipo, v]) => ({
      arquetipo,
      origen: v.origen,
      esDatoReal: pool.find((p) => p.arquetipo === arquetipo)?.esDatoReal ?? false,
      combates: v.combates,
      ganados: v.ganados,
      porcentaje: (v.ganados / v.combates) * 100,
    }))
    .toSorted((a, b) => b.porcentaje - a.porcentaje);
}

function agruparPorRival(
  registros: RegistroCombate[],
  pool: EquipoRival[]
): PorRival[] {
  const mapa = new Map<string, { combates: number; ganados: number }>();
  for (const r of registros) {
    const previo = mapa.get(r.rivalId) ?? { combates: 0, ganados: 0 };
    previo.combates += 1;
    if (r.gano) previo.ganados += 1;
    mapa.set(r.rivalId, previo);
  }

  return [...mapa.entries()]
    .map(([id, v]) => {
      const rival = pool.find((p) => p.id === id);
      return {
        id,
        nombre: rival?.nombre ?? id,
        arquetipo: rival?.arquetipo ?? "",
        esDatoReal: rival?.esDatoReal ?? false,
        combates: v.combates,
        ganados: v.ganados,
        porcentaje: (v.ganados / v.combates) * 100,
      };
    })
    .toSorted((a, b) => a.porcentaje - b.porcentaje);
}

function agruparPorMiembro(
  registros: RegistroCombate[],
  equipo: Luchador[],
  acumulador: Acumulador
): PorMiembro[] {
  const bajas = acumulador.bajasPropias;
  const caidas = acumulador.caidasPropias;

  return equipo.map((l) => {
    const suyos = registros.filter((r) => r.salida === l.slug);
    const ganados = suyos.filter((r) => r.gano).length;
    return {
      slug: l.slug,
      nombre: l.nombre,
      bajas: bajas.get(l.slug) ?? 0,
      caidas: caidas.get(l.slug) ?? 0,
      comoSalida: suyos.length,
      ganadosComoSalida: ganados,
      porcentajeComoSalida: suyos.length > 0 ? (ganados / suyos.length) * 100 : null,
    };
  });
}

// La letra sale del porcentaje, con cortes fijos y a la vista: no es el tier
// de nadie, es una etiqueta para leer el número de un vistazo.
export function letraDe(porcentaje: number): string {
  if (porcentaje >= 65) return "S";
  if (porcentaje >= 55) return "A";
  if (porcentaje >= 45) return "B";
  if (porcentaje >= 35) return "C";
  return "D";
}

// --- Los mejores cuatro ------------------------------------------------------

// En singles entran los seis, así que "los mejores cuatro" no sale de la
// prueba: se mide aparte, corriendo cada subconjunto de cuatro contra una
// muestra del pool.
export function mejoresCuartetos(
  equipo: Luchador[],
  pool: EquipoRival[],
  combatesPorCuarteto: number,
  semilla: number
): Cuarteto[] {
  if (equipo.length < 5 || pool.length === 0) return [];

  const azar = crearAzar(semilla + 1);
  const muestra = azar.mezclar(pool).slice(0, Math.min(6, pool.length));
  const salidas: Cuarteto[] = [];

  const combinaciones: number[][] = [];
  for (let a = 0; a < equipo.length; a += 1)
    for (let b = a + 1; b < equipo.length; b += 1)
      for (let c = b + 1; c < equipo.length; c += 1)
        for (let d = c + 1; d < equipo.length; d += 1) combinaciones.push([a, b, c, d]);

  for (const indices of combinaciones) {
    const cuarteto = indices.map((i) => equipo[i]);
    let ganados = 0;
    let jugados = 0;

    for (const rival of muestra) {
      for (let i = 0; i < combatesPorCuarteto; i += 1) {
        const posicion = i % cuarteto.length;
        const alineacion = [
          cuarteto[posicion],
          ...cuarteto.filter((_, j) => j !== posicion),
        ];
        const r = simularCombate(alineacion, rival.miembros, false, azar);
        if (r.gana === "a") ganados += 1;
        jugados += 1;
      }
    }

    salidas.push({
      slugs: cuarteto.map((l) => l.slug),
      nombres: cuarteto.map((l) => l.nombre),
      combates: jugados,
      porcentaje: (ganados / jugados) * 100,
    });
  }

  return salidas.toSorted((a, b) => b.porcentaje - a.porcentaje);
}

// --- Comparar dos versiones del equipo ---------------------------------------

export type Comparacion = {
  antes: number;
  despues: number;
  diferencia: number;
  combates: number;
  significativo: boolean;
  lectura: string;
};

// Dos porcentajes sobre muestras finitas no se comparan a ojo. Se usa el error
// estándar de una proporción: si la diferencia no supera dos veces el error
// combinado, no hay evidencia de mejora y se dice.
export function compararPruebas(
  antes: ResultadoPrueba,
  despues: ResultadoPrueba
): Comparacion {
  const pa = antes.ganados / antes.combates;
  const pb = despues.ganados / despues.combates;
  const error = Math.sqrt(
    (pa * (1 - pa)) / antes.combates + (pb * (1 - pb)) / despues.combates
  );
  const diferencia = (pb - pa) * 100;
  const significativo = Math.abs(pb - pa) > 2 * error;

  return {
    antes: pa * 100,
    despues: pb * 100,
    diferencia,
    combates: Math.min(antes.combates, despues.combates),
    significativo,
    lectura: significativo
      ? diferencia > 0
        ? "La simulación respalda que es una mejora."
        : "La simulación respalda que es un retroceso."
      : "La diferencia entra dentro del margen de la muestra: no alcanza para decir que sea mejor.",
  };
}

// --- Por qué perdemos --------------------------------------------------------

export type Diagnostico = { problema: string; motivos: string[] };

export function diagnosticar(
  resultado: ResultadoPrueba,
  equipo: Luchador[]
): Diagnostico | null {
  const peor = resultado.porArquetipo
    .filter((a) => a.combates >= 4)
    .toSorted((a, b) => a.porcentaje - b.porcentaje)[0];

  if (!peor || peor.porcentaje >= 50) return null;

  const motivos: string[] = [];
  const rival = resultado.rivalesUsados.find((r) => r.arquetipo === peor.arquetipo);

  if (rival) {
    const velocidadRival =
      rival.miembros.reduce((a, l) => a + statANivel(l.stats.speed, false), 0) /
      rival.miembros.length;
    const masLentos = equipo.filter(
      (l) => statANivel(l.stats.speed, false) < velocidadRival
    ).length;

    if (masLentos >= Math.ceil(equipo.length / 2)) {
      motivos.push(
        `${masLentos} de ${equipo.length} son más lentos que la media de esos equipos (${Math.round(velocidadRival)}).`
      );
    }
    motivos.push(`Su plan es: ${rival.estrategia.toLowerCase()}`);
  }

  const flojos = resultado.porMiembro
    .filter((m) => m.porcentajeComoSalida !== null && m.porcentajeComoSalida < 40)
    .map((m) => m.nombre);
  if (flojos.length > 0) {
    motivos.push(`Abrir con ${flojos.join(", ")} baja el porcentaje por debajo del 40 %.`);
  }

  if (resultado.turnosPromedio < 7) {
    motivos.push(
      `Los combates duran ${resultado.turnosPromedio.toFixed(1)} turnos: no hay tiempo de recuperar un mal cruce.`
    );
  }

  return {
    problema: `El equipo sufre contra ${peor.arquetipo} (${peor.porcentaje.toFixed(0)} % en ${peor.combates} combates).`,
    motivos,
  };
}
