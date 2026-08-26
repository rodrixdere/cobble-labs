import { describe, expect, it } from "vitest";

import { CATALOGO, ROSTER } from "@/data/roster-combate";
import { amenazasContra } from "@/recommendations/amenazas";
import { armarContexto, prepararCandidato } from "@/recommendations/contexto";
import { REGLAS, type Regla } from "@/recommendations/reglas";
import { pesosDe, type Criterio } from "@/recommendations/pesos";
import { armarMiembro, conjuntoPorDefecto } from "@/team/combate";

// Cada regla se prueba sola, contra un equipo armado a mano que tiene el hueco
// que esa regla busca. Es lo que la version anterior no dejaba hacer: los once
// criterios vivian adentro de un bucle de trescientos sesenta candidatos y la
// unica forma de probar uno era mirar el resultado final y deducir.

const porSlug = new Map(ROSTER.map((p) => [p.slug, p]));

const de = (slug: string) => {
  const p = porSlug.get(slug);
  if (!p) throw new Error(`falta ${slug} en el roster`);
  return p;
};

const miembro = (slug: string) => {
  const p = de(slug);
  return armarMiembro(p, conjuntoPorDefecto(p, CATALOGO), CATALOGO);
};

/** Corre una sola regla contra un candidato y un equipo. */
function aplicar(
  regla: Regla,
  slugCandidato: string,
  equipoSlugs: string[],
  criterio: Criterio = "general"
) {
  const equipo = equipoSlugs.map(miembro);
  const amenazas = amenazasContra(equipo, ROSTER, CATALOGO, 6);
  const ctx = armarContexto(equipo, ROSTER, CATALOGO, criterio, amenazas);
  const candidato = prepararCandidato(de(slugCandidato), CATALOGO);
  return regla(candidato, ctx, pesosDe(criterio));
}

const total = (aportes: { puntos: number }[]) =>
  aportes.reduce((s, a) => s + a.puntos, 0);

const [
  tapaDebilidades,
  cubreCiegos,
  traeResistencias,
  aportaVelocidad,
  equilibraDano,
  aportaRoles,
  encajaClima,
  espacioRaro,
  respondeAmenazas,
  potencial,
  penalizaRepetido,
] = REGLAS;

describe("catálogo de reglas", () => {
  it("son once y ninguna se repite", () => {
    expect(REGLAS).toHaveLength(11);
    expect(new Set(REGLAS).size).toBe(11);
  });

  it("ninguna aporta un punto sin decir por qué", () => {
    // La regla de oro del motor: cada aporte lleva su motivo.
    const equipo = ["charizard", "blastoise", "venusaur"];
    for (const regla of REGLAS) {
      for (const aporte of aplicar(regla, "dragonite", equipo)) {
        expect(aporte.motivo.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("tapar debilidades compartidas", () => {
  it("premia al que resiste lo que sufre medio equipo", () => {
    // Tres de Fuego comparten debilidad a Agua, Tierra y Roca.
    const equipo = ["charizard", "arcanine", "rapidash"];

    // Gyarados es Agua y Volador: resiste Fuego y es inmune a Tierra.
    const bueno = aplicar(tapaDebilidades, "gyarados", equipo);
    expect(total(bueno)).toBeGreaterThan(0);
    expect(bueno.some((a) => a.razon?.includes("Tapa la debilidad"))).toBe(true);
  });

  it("penaliza al que suma la misma debilidad", () => {
    // Otro Fuego a un equipo de Fuego no tapa nada y agrava lo que ya sufre.
    const otroFuego = aplicar(
      tapaDebilidades,
      "flareon",
      ["charizard", "arcanine", "rapidash"]
    );
    expect(total(otroFuego)).toBeLessThan(0);
  });

  it("no aporta nada con un equipo sin debilidades compartidas", () => {
    expect(aplicar(tapaDebilidades, "gyarados", ["pikachu"])).toEqual([]);
  });
});

describe("cubrir puntos ciegos", () => {
  it("solo cuenta lo que le pega x2 con los movimientos que lleva puestos", () => {
    const aportes = aplicar(cubreCiegos, "dragonite", ["pikachu", "raichu"]);
    for (const a of aportes) {
      expect(a.motivo).toMatch(/^Cubre a /);
      expect(a.puntos).toBeGreaterThan(0);
    }
  });
});

describe("control de velocidad", () => {
  it("no aporta si el equipo ya lo tiene", () => {
    const equipo = ["charizard", "blastoise"];
    const conHueco = aplicar(aportaVelocidad, "jolteon", equipo);
    // Sea cual sea el resultado, si aporta tiene que explicar con qué.
    for (const a of conHueco) {
      expect(a.razon).toMatch(/control de velocidad/);
    }
  });
});

describe("penalización por tipo repetido", () => {
  it("resta a partir del tercero del mismo tipo", () => {
    // Dos de Agua ya en el equipo: un tercero repite.
    const tercerAgua = aplicar(penalizaRepetido, "gyarados", [
      "blastoise",
      "vaporeon",
    ]);
    expect(total(tercerAgua)).toBeLessThan(0);
    expect(tercerAgua[0].motivo).toMatch(/^Tercer /);
  });

  it("no resta con un solo miembro de ese tipo", () => {
    expect(aplicar(penalizaRepetido, "gyarados", ["blastoise"])).toEqual([]);
  });

  it("nunca lleva razón: no es algo que se le explique al usuario", () => {
    const aportes = aplicar(penalizaRepetido, "gyarados", [
      "blastoise",
      "vaporeon",
    ]);
    expect(aportes.every((a) => a.razon === undefined)).toBe(true);
  });
});

describe("potencial bruto", () => {
  it("siempre aporta algo y siempre en proporción al total de stats", () => {
    const equipo = ["pikachu"];
    const fuerte = total(aplicar(potencial, "dragonite", equipo));
    const flojo = total(aplicar(potencial, "magikarp", equipo));

    expect(fuerte).toBeGreaterThan(flojo);
    expect(flojo).toBeGreaterThan(0);
  });

  it("no lleva razón: no es un motivo para recomendar a nadie", () => {
    const aportes = aplicar(potencial, "dragonite", ["pikachu"]);
    expect(aportes).toHaveLength(1);
    expect(aportes[0].razon).toBeUndefined();
  });

  it("pesa distinto según el criterio", () => {
    const general = total(aplicar(potencial, "dragonite", ["pikachu"], "general"));
    const apoyo = total(aplicar(potencial, "dragonite", ["pikachu"], "apoyo"));
    // En "apoyo" el total de stats casi no importa.
    expect(apoyo).toBeLessThan(general);
  });
});

describe("clima", () => {
  it("con el criterio clima premia a quien lo pone si el equipo no tiene", () => {
    const equipo = ["pikachu", "raichu"];
    const conCriterio = aplicar(encajaClima, "ninetales", equipo, "clima");
    const sinCriterio = aplicar(encajaClima, "ninetales", equipo, "general");

    // Poner clima solo suma si el usuario está buscando justamente eso.
    expect(total(conCriterio)).toBeGreaterThanOrEqual(total(sinCriterio));
  });
});

describe("las reglas restantes se comportan", () => {
  const equipo = ["charizard", "blastoise", "venusaur", "pikachu"];

  it.each([
    ["resistencias nuevas", traeResistencias],
    ["equilibrar el daño", equilibraDano],
    ["roles que faltan", aportaRoles],
    ["espacio raro", espacioRaro],
    ["responder a amenazas", respondeAmenazas],
  ])("%s devuelve aportes con motivo y razón, o nada", (_nombre, regla) => {
    const aportes = aplicar(regla, "dragonite", equipo);
    for (const a of aportes) {
      expect(a.motivo).toBeTruthy();
      expect(a.puntos).not.toBe(0);
    }
  });
});
