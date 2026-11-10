import { describe, expect, it } from "vitest";

import { CATALOGO, ROSTER } from "@/data/roster-combate";
import { armarLuchador, conjuntoPorDefecto } from "@/team/combate";
import { crearAzar } from "@/simulation/azar";
import {
  RECETAS,
  generarAleatorioLegal,
  generarPorArquetipo,
  esRestringido,
} from "@/simulation/generadores";
import { hayErrores, validarEquipo } from "@/team/validador";
import {
  armarPool,
  compararPruebas,
  mejoresCuartetos,
  probarEquipo,
} from "@/simulation/prueba";
import { simularCombate } from "@/simulation/simulador";

const porSlug = new Map(ROSTER.map((p) => [p.slug, p]));
const luchador = (slug: string) => {
  const p = porSlug.get(slug)!;
  return armarLuchador(p, conjuntoPorDefecto(p, CATALOGO), CATALOGO);
};
const EQUIPO = ["charizard", "blastoise", "tyranitar", "gardevoir", "metagross", "snorlax"].map(
  luchador
);

describe("azar reproducible", () => {
  it("la misma semilla da la misma serie", () => {
    const a = crearAzar(1234);
    const b = crearAzar(1234);
    const serieA = Array.from({ length: 20 }, () => a.siguiente());
    const serieB = Array.from({ length: 20 }, () => b.siguiente());
    expect(serieA).toEqual(serieB);
  });

  it("semillas distintas dan series distintas", () => {
    const a = crearAzar(1);
    const b = crearAzar(2);
    expect(a.siguiente()).not.toBe(b.siguiente());
  });

  it("el combate con la misma semilla sale igual", () => {
    const uno = simularCombate(EQUIPO, EQUIPO.toReversed(), true, crearAzar(99));
    const dos = simularCombate(EQUIPO, EQUIPO.toReversed(), true, crearAzar(99));
    expect(uno.gana).toBe(dos.gana);
    expect(uno.turnos).toBe(dos.turnos);
    expect(uno.registro).toEqual(dos.registro);
  });
});

describe("generadores de rivales", () => {
  const azar = crearAzar(7);

  it("el equipo de Espacio Raro lo puede poner de verdad", () => {
    const receta = RECETAS.find((r) => r.clave === "espacio-raro")!;
    const equipo = generarPorArquetipo(receta, ROSTER, CATALOGO, azar, 0);
    const puedenPonerlo = equipo.miembros.filter((l) => {
      const p = porSlug.get(l.slug)!;
      return p.movimientos.some((i) => CATALOGO[i].clave === "trickroom");
    });
    expect(puedenPonerlo.length).toBeGreaterThan(0);
    expect(equipo.miembros).toHaveLength(6);
  });

  it("el equipo de sol tiene quien lo ponga", () => {
    const receta = RECETAS.find((r) => r.clave === "sol")!;
    const equipo = generarPorArquetipo(receta, ROSTER, CATALOGO, azar, 0);
    const ponen = equipo.miembros.filter((l) => {
      const p = porSlug.get(l.slug)!;
      return (
        p.habilidades.some((h) => h.clave === "drought") ||
        p.movimientos.some((i) => CATALOGO[i].clave === "sunnyday")
      );
    });
    expect(ponen.length).toBeGreaterThan(0);
  });

  it("ningún equipo generado repite Pokémon", () => {
    for (const receta of RECETAS) {
      const equipo = generarPorArquetipo(receta, ROSTER, CATALOGO, crearAzar(11), 0);
      const slugs = equipo.miembros.map((l) => l.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("los generados quedan marcados como dato generado", () => {
    const equipo = generarAleatorioLegal(ROSTER, CATALOGO, azar, 0);
    expect(equipo.esDatoReal).toBe(false);
    expect(equipo.miembros).toHaveLength(6);
  });

  it("todos los miembros generados llevan movimientos", () => {
    const equipo = generarAleatorioLegal(ROSTER, CATALOGO, crearAzar(3), 0);
    for (const l of equipo.miembros) {
      expect(l.movimientos.length).toBeGreaterThan(0);
    }
  });
});

describe("prueba del equipo", () => {
  const pool = armarPool(
    { arquetipos: true, aleatorios: true, propios: false, sinRestringidos: true },
    ROSTER,
    CATALOGO,
    crearAzar(42),
    [],
    porSlug
  );

  it("arma un pool con arquetipos y aleatorios", () => {
    expect(pool.length).toBe(RECETAS.length * 2 + 8);
    expect(pool.every((r) => r.miembros.length === 6)).toBe(true);
  });

  it("corre la cantidad de combates pedida", () => {
    const r = probarEquipo(EQUIPO, pool, 30, 5, false);
    expect(r.combates).toBe(30);
    expect(r.ganados + r.perdidos + r.empatados).toBe(30);
    expect(r.porcentaje).toBeGreaterThanOrEqual(0);
    expect(r.porcentaje).toBeLessThanOrEqual(100);
  });

  it("la misma semilla devuelve la misma prueba", () => {
    const uno = probarEquipo(EQUIPO, pool, 40, 777, false);
    const dos = probarEquipo(EQUIPO, pool, 40, 777, false);
    expect(uno.ganados).toBe(dos.ganados);
    expect(uno.registros.map((x) => x.rivalId)).toEqual(
      dos.registros.map((x) => x.rivalId)
    );
  });

  it("no pelea siempre contra el mismo rival", () => {
    const r = probarEquipo(EQUIPO, pool, 40, 5, false);
    const rivales = new Set(r.registros.map((x) => x.rivalId));
    expect(rivales.size).toBeGreaterThan(5);
  });

  it("no repite rival dos veces seguidas mientras queden otros", () => {
    const r = probarEquipo(EQUIPO, pool, 40, 5, false);
    let seguidos = 0;
    for (let i = 1; i < r.registros.length; i += 1) {
      if (r.registros[i].rivalId === r.registros[i - 1].rivalId) seguidos += 1;
    }
    expect(seguidos).toBe(0);
  });

  it("rota la salida entre los seis", () => {
    const r = probarEquipo(EQUIPO, pool, 30, 5, false);
    const salidas = new Set(r.registros.map((x) => x.salida));
    expect(salidas.size).toBe(6);
  });

  it("agrupa por arquetipo con las cuentas cuadradas", () => {
    const r = probarEquipo(EQUIPO, pool, 60, 5, false);
    const suma = r.porArquetipo.reduce((a, x) => a + x.combates, 0);
    expect(suma).toBe(r.combates);
    for (const a of r.porArquetipo) {
      expect(a.ganados).toBeLessThanOrEqual(a.combates);
    }
  });

  it("guarda pocas repeticiones, no todas", () => {
    const r = probarEquipo(EQUIPO, pool, 100, 5, false);
    expect(r.repeticiones.length).toBeGreaterThan(0);
    expect(r.repeticiones.length).toBeLessThanOrEqual(4);
  });

  it("la fase adaptativa suma combates contra el peor arquetipo", () => {
    const r = probarEquipo(EQUIPO, pool, 40, 5, true);
    if (r.faseExtra) {
      expect(r.combates).toBeGreaterThan(40);
      expect(r.faseExtra.combates).toBeGreaterThan(0);
    }
  });

  it("los mejores cuatro son los quince subconjuntos", () => {
    const cuartetos = mejoresCuartetos(EQUIPO, pool, 2, 5);
    expect(cuartetos).toHaveLength(15);
    for (const c of cuartetos) {
      expect(c.slugs).toHaveLength(4);
      expect(c.combates).toBeGreaterThan(0);
    }
  });
});

describe("comparación de dos pruebas", () => {
  const pool = armarPool(
    { arquetipos: true, aleatorios: false, propios: false, sinRestringidos: true },
    ROSTER,
    CATALOGO,
    crearAzar(1),
    [],
    porSlug
  );

  it("dos pruebas idénticas no son una mejora", () => {
    const a = probarEquipo(EQUIPO, pool, 60, 21, false);
    const b = probarEquipo(EQUIPO, pool, 60, 21, false);
    const c = compararPruebas(a, b);
    expect(c.diferencia).toBe(0);
    expect(c.significativo).toBe(false);
    expect(c.lectura).toContain("margen");
  });

  it("una diferencia grande sí se marca como significativa", () => {
    const fuerte = probarEquipo(EQUIPO, pool, 80, 3, false);
    const flojo = probarEquipo(
      ["caterpie", "weedle", "magikarp", "sunkern", "azurill", "igglybuff"]
        .filter((s) => porSlug.has(s))
        .map(luchador),
      pool,
      80,
      3,
      false
    );
    const c = compararPruebas(flojo, fuerte);
    expect(c.diferencia).toBeGreaterThan(0);
    expect(c.significativo).toBe(true);
  });
});

describe("reglas de los equipos del bot", () => {
  // Con los legendarios permitidos, que es el caso donde las reglas pesan
  const rivales = [1, 2, 3, 4, 5].flatMap((semilla) =>
    armarPool(
      { arquetipos: true, aleatorios: true, propios: false, sinRestringidos: false },
      ROSTER,
      CATALOGO,
      crearAzar(semilla),
      [],
      porSlug
    )
  );

  it("solo elige la última etapa de cada línea", () => {
    for (const r of rivales) {
      expect(r.miembros.filter((m) => porSlug.get(m.slug)!.puedeEvolucionar)).toEqual([]);
    }
  });

  it("lleva como mucho un legendario", () => {
    for (const r of rivales) {
      expect(r.miembros.filter((m) => esRestringido(porSlug.get(m.slug)!)).length).toBeLessThanOrEqual(1);
    }
  });

  it("lleva como mucho una mega y el equipo es válido", () => {
    for (const r of rivales) {
      expect(r.conjuntos.filter((c) => c.forma).length).toBeLessThanOrEqual(1);
      expect(hayErrores(validarEquipo(r.conjuntos, porSlug, CATALOGO))).toBe(false);
    }
  });

  it("si alguno tiene mega, la usa", () => {
    expect(rivales.some((r) => r.conjuntos.some((c) => c.forma))).toBe(true);
  });

  it("sin legendarios permitidos no entra ninguno", () => {
    const pool = armarPool(
      { arquetipos: true, aleatorios: true, propios: false, sinRestringidos: true },
      ROSTER, CATALOGO, crearAzar(9), [], porSlug
    );
    expect(pool.flatMap((r) => r.miembros).some((m) => esRestringido(porSlug.get(m.slug)!))).toBe(false);
  });
});
