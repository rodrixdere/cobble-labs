import { describe, expect, it } from "vitest";

import { CATALOGO, ROSTER } from "@/data/roster-combate";
import { calcularDano, compararVelocidad } from "@/engine/calculo-dano";
import { BAYAS_DE_RESISTENCIA, CATEGORIAS_DE_OBJETO, GEMAS, POTENCIADORES_DE_TIPO, describirEfecto } from "@/engine/objetos";
import { crearAzar } from "@/simulation/azar";
import { preparar, simularCombate } from "@/simulation/simulador";
import { armarLuchador, conjuntoPorDefecto } from "@/team/combate";
import { OBJETOS, OBJETOS_CON_EFECTO } from "@/team/conjunto";

// Los objetos del motor: que lo que se anuncia sea lo que se aplica, en la
// calculadora y en el simulador.

const porSlug = new Map(ROSTER.map((p) => [p.slug, p]));
const de = (slug: string) => porSlug.get(slug)!;

function luchador(slug: string, objeto = "ninguno", movimientos?: string[]) {
  const p = de(slug);
  const base = conjuntoPorDefecto(p, CATALOGO);
  return armarLuchador(p, { ...base, objeto, movimientos: movimientos ?? base.movimientos }, CATALOGO);
}

const combatiente = (slug: string, objeto = "ninguno") => {
  const l = luchador(slug, objeto);
  return { tipos: l.tipos, stats: l.stats, puedeEvolucionar: l.puedeEvolucionar, conjunto: l.conjunto };
};

describe("catálogo de objetos", () => {
  it("todo objeto con efecto existe en el jar de Cobblemon", () => {
    const claves = new Set(OBJETOS.map((o) => o.clave));
    const conEfecto = [
      ...Object.keys(POTENCIADORES_DE_TIPO),
      ...Object.keys(GEMAS),
      ...Object.keys(BAYAS_DE_RESISTENCIA),
      "lifeorb", "choiceband", "choicespecs", "choicescarf", "assaultvest", "eviolite", "expertbelt",
      "muscleband", "wiseglasses", "leftovers", "blacksludge", "shellbell", "sitrusberry", "focussash",
      "airballoon", "weaknesspolicy",
    ];
    for (const clave of conEfecto) {
      expect(claves.has(clave), clave).toBe(true);
      expect(describirEfecto(clave), clave).not.toBeNull();
    }
  });

  it("solo se ofrecen objetos con efecto en la simulación", () => {
    const ofrecidos = OBJETOS_CON_EFECTO.map((o) => o.clave);
    for (const fuera of ["pokeball", "helixfossil", "firestone", "powerweight", "razzberry", "rockyhelmet"]) {
      expect(ofrecidos, fuera).not.toContain(fuera);
    }
    expect(ofrecidos.every((clave) => describirEfecto(clave) !== null)).toBe(true);
    expect(ofrecidos).toHaveLength(69);
  });

  it("un objeto que el motor no aplica no anuncia efecto", () => {
    expect(describirEfecto("rockyhelmet")).toBeNull();
    expect(describirEfecto("quickclaw")).toBeNull();
  });
});

describe("objetos en la calculadora", () => {
  const surf = { potencia: 90, tipo: "water", categoria: "special" };

  it("el potenciador de tipo sube un 20 % solo los golpes de su tipo", () => {
    const sin = calcularDano(surf, combatiente("blastoise"), combatiente("snorlax"))!;
    const con = calcularDano(surf, combatiente("blastoise", "mysticwater"), combatiente("snorlax"))!;
    expect(con.maximo / sin.maximo).toBeCloseTo(1.2, 1);

    const trueno = { potencia: 110, tipo: "electric", categoria: "special" };
    const otroTipo = calcularDano(trueno, combatiente("blastoise", "mysticwater"), combatiente("snorlax"))!;
    const otroSin = calcularDano(trueno, combatiente("blastoise"), combatiente("snorlax"))!;
    expect(otroTipo.maximo).toBe(otroSin.maximo);
  });

  it("la baya de resistencia parte a la mitad el súper efectivo de su tipo", () => {
    const sin = calcularDano(surf, combatiente("blastoise"), combatiente("charizard"))!;
    const con = calcularDano(surf, combatiente("blastoise"), combatiente("charizard", "passhoberry"))!;
    expect(con.maximo).toBeLessThanOrEqual(Math.ceil(sin.maximo / 2) + 1);
    expect(con.maximo).toBeGreaterThan(sin.maximo / 2 - 2);
  });

  it("el Globo Helio anula Tierra", () => {
    const terremoto = { potencia: 100, tipo: "ground", categoria: "physical" };
    const r = calcularDano(terremoto, combatiente("garchomp"), combatiente("metagross", "airballoon"))!;
    expect(r.maximo).toBe(0);
  });

  it("el Mineral Evolutivo solo aguanta a quien todavía evoluciona", () => {
    const golpe = { potencia: 80, tipo: "normal", categoria: "physical" };
    const conIvysaur = calcularDano(golpe, combatiente("snorlax"), combatiente("ivysaur", "eviolite"))!;
    const sinIvysaur = calcularDano(golpe, combatiente("snorlax"), combatiente("ivysaur"))!;
    expect(conIvysaur.maximo).toBeLessThan(sinIvysaur.maximo);

    const conVenusaur = calcularDano(golpe, combatiente("snorlax"), combatiente("venusaur", "eviolite"))!;
    const sinVenusaur = calcularDano(golpe, combatiente("snorlax"), combatiente("venusaur"))!;
    expect(conVenusaur.maximo).toBe(sinVenusaur.maximo);
  });

  it("el Pañuelo Elección cuenta para ver quién pega primero", () => {
    const a = luchador("snorlax", "choicescarf");
    const b = luchador("snorlax");
    const { va, vb } = compararVelocidad(a.stats, b.stats, a.conjunto, b.conjunto);
    expect(va).toBeGreaterThan(vb);
  });
});

describe("objetos en el simulador", () => {
  it("el Pañuelo Elección sube la velocidad", () => {
    expect(preparar(luchador("snorlax", "choicescarf")).velocidad).toBeGreaterThan(
      preparar(luchador("snorlax")).velocidad
    );
  });

  it("la Vidasfera le cuesta vida a quien la lleva", () => {
    const r = simularCombate(
      [luchador("gengar", "lifeorb")],
      [luchador("snorlax")],
      true,
      crearAzar(7)
    );
    const ultimo = r.instantes[0];
    expect(ultimo.psA[0]).toBeLessThan(r.psMaximosA[0]);
  });

  it("el Lodo Negro cura a un tipo Veneno y lastima a los demás", () => {
    // Sin movimientos nadie pega: lo unico que mueve la vida es el objeto.
    const r = simularCombate(
      [luchador("gengar", "blacksludge", [])],
      [luchador("snorlax", "blacksludge", [])],
      true,
      crearAzar(3)
    );
    expect(r.gana).toBe("a");
    expect(r.instantes[0].psB[0]).toBe(r.psMaximosB[0] - Math.floor(r.psMaximosB[0] / 8));
    expect(r.instantes.at(-1)!.psA[0]).toBe(r.psMaximosA[0]);
  });

  it("la gema se gasta con el primer golpe de su tipo", () => {
    const r = simularCombate(
      [luchador("blastoise", "watergem", ["hydropump"])],
      [luchador("charizard")],
      true,
      crearAzar(11)
    );
    expect(r.registro.filter((l) => l.includes("gasta su gema"))).toHaveLength(1);
  });
});

describe("categorías del selector", () => {
  it("cada objeto con efecto está en una sola categoría", () => {
    const enCategorias = CATEGORIAS_DE_OBJETO.flatMap((c) => c.claves);
    expect(new Set(enCategorias).size).toBe(enCategorias.length);
    expect(enCategorias.toSorted()).toEqual(OBJETOS_CON_EFECTO.map((o) => o.clave).toSorted());
  });
});
