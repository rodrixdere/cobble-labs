import { describe, expect, it } from "vitest";

import { CATALOGO, ROSTER } from "@/data/roster-combate";
import {
  NIVEL,
  calcularDano,
  compararVelocidad,
  statANivel,
  statConIvEv,
  statFinal,
} from "@/engine/calculo-dano";
import { defensaContra, multiplicador } from "@/engine/tabla-tipos";
import { analizarEquipo, coberturaOfensiva, debilidadesCompartidas } from "@/analysis/equipo";
import { analizarCampo } from "@/analysis/campo";
import { rolesDe } from "@/analysis/roles";
import { armarMiembro, conjuntoPorDefecto } from "@/team/combate";
import { conjuntoVacio } from "@/team/conjunto";
import { validarEquipo, hayErrores } from "@/team/validador";
import { aCadena, desdeCadena, exportarEquipo, importarEquipo } from "@/team/formato";
import { amenazasContra, recomendar } from "@/recommendations/motor";

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

describe("tabla de tipos", () => {
  it("aplica los casos simples", () => {
    expect(multiplicador("fire", "grass")).toBe(2);
    expect(multiplicador("water", "fire")).toBe(2);
    expect(multiplicador("normal", "ghost")).toBe(0);
    expect(multiplicador("electric", "ground")).toBe(0);
  });

  it("multiplica los dos tipos del defensor", () => {
    // Gyarados es Agua y Volador: Eléctrico le pega x2 por cada uno.
    expect(defensaContra(["water", "flying"], "electric")).toBe(4);
    // Venusaur es Planta y Veneno: los dos resisten Planta.
    expect(defensaContra(["grass", "poison"], "grass")).toBe(0.25);
    // Skarmory es Acero y Volador: la inmunidad manda sobre el x2.
    expect(defensaContra(["steel", "flying"], "ground")).toBe(0);
  });
});

describe("stats a nivel 50", () => {
  it("calcula PS y el resto con la fórmula del juego", () => {
    // Venusaur: 80 de PS base -> 155 a nivel 50 con IV 31 y sin EVs.
    expect(statANivel(80, true)).toBe(155);
    // 100 de una stat normal -> 120.
    expect(statANivel(100, false)).toBe(120);
  });

  it("coincide con los valores conocidos a nivel 100", () => {
    // Un 100 de base con 31 de IV y 252 de EV a nivel 100 da 299.
    expect(statConIvEv(100, false, { iv: 31, ev: 252, nivel: 100 })).toBe(299);
    // Blissey, con 255 de PS base, llega a 714: es el caso más citado de la
    // fórmula y sirve de control de que los PS se calculan distinto.
    expect(statConIvEv(255, true, { iv: 31, ev: 252, nivel: 100 })).toBe(714);
  });

  it("aplica la naturaleza sobre la stat ya calculada", () => {
    const base = de("charizard").stats;
    const neutra = { ...conjuntoVacio("charizard"), naturaleza: "serious" };
    const timida = { ...conjuntoVacio("charizard"), naturaleza: "timid" };
    // Timid sube Velocidad y baja Ataque.
    expect(statFinal(base, timida, "speed")).toBe(
      Math.floor(statFinal(base, neutra, "speed") * 1.1)
    );
    expect(statFinal(base, timida, "attack")).toBe(
      Math.floor(statFinal(base, neutra, "attack") * 0.9)
    );
  });

  it("los EVs suman de a uno cada cuatro puntos", () => {
    const base = de("charizard").stats;
    const conEvs = { ...conjuntoVacio("charizard"), evs: { speed: 252 } };
    const sinEvs = conjuntoVacio("charizard");
    // 252 EVs son 63 al numerador, y a nivel 50 eso son 32 puntos de stat.
    expect(statFinal(base, conEvs, "speed")).toBe(
      statFinal(base, sinEvs, "speed") + 32
    );
  });

  it("los IVs bajos restan", () => {
    const base = de("charizard").stats;
    const perfecto = conjuntoVacio("charizard");
    const cero = { ...perfecto, ivs: { ...perfecto.ivs, speed: 0 } };
    expect(statFinal(base, cero, "speed")).toBeLessThan(
      statFinal(base, perfecto, "speed")
    );
  });

  it("el nivel cambia la stat", () => {
    const base = de("charizard").stats;
    const cincuenta = conjuntoVacio("charizard");
    const cien = { ...cincuenta, nivel: 100 };
    expect(statFinal(base, cien, "speed")).toBeGreaterThan(
      statFinal(base, cincuenta, "speed")
    );
  });
});

describe("cálculo de daño", () => {
  const charizard = { tipos: ["fire", "flying"], stats: de("charizard").stats };
  const venusaur = { tipos: ["grass", "poison"], stats: de("venusaur").stats };

  it("devuelve las dieciséis tiradas ordenadas", () => {
    const r = calcularDano(
      { potencia: 90, tipo: "fire", categoria: "special" },
      charizard,
      venusaur
    );
    expect(r).not.toBeNull();
    expect(r!.tiradas).toHaveLength(16);
    expect(r!.minimo).toBe(r!.tiradas[0]);
    expect(r!.maximo).toBe(r!.tiradas[15]);
    expect(r!.minimo).toBeLessThanOrEqual(r!.maximo);
  });

  it("aplica STAB y efectividad", () => {
    const conStab = calcularDano(
      { potencia: 90, tipo: "fire", categoria: "special" },
      charizard,
      venusaur
    )!;
    const sinStab = calcularDano(
      { potencia: 90, tipo: "ice", categoria: "special" },
      charizard,
      venusaur
    )!;
    // Los dos pegan x2 a Venusaur, pero Fuego lleva STAB.
    expect(conStab.stab).toBe(true);
    expect(sinStab.stab).toBe(false);
    expect(conStab.maximo).toBeGreaterThan(sinStab.maximo);
  });

  it("no hace nada cuando el tipo es inmune", () => {
    const r = calcularDano(
      { potencia: 100, tipo: "ground", categoria: "physical" },
      { tipos: ["ground"], stats: de("golem").stats },
      { tipos: ["steel", "flying"], stats: de("skarmory").stats }
    )!;
    expect(r.efectividad).toBe(0);
    expect(r.maximo).toBe(0);
  });

  it("el clima multiplica lo que corresponde", () => {
    const golpe = { potencia: 90, tipo: "fire", categoria: "special" };
    const normal = calcularDano(golpe, charizard, venusaur)!;
    const conSol = calcularDano(golpe, charizard, venusaur, {
      clima: "sol",
      terreno: "ninguno",
      critico: false,
      dobles: false,
      ayuda: false,
      pantallaFisica: false,
      pantallaEspecial: false,
      refuerzo: false,
    })!;
    expect(conSol.maximo).toBeGreaterThan(normal.maximo);
  });

  it("calcula la probabilidad de tumbar de un golpe", () => {
    const r = calcularDano(
      { potencia: 150, tipo: "fire", categoria: "special" },
      charizard,
      venusaur
    )!;
    expect(r.probabilidadOHKO).toBeGreaterThan(0);
    expect(r.probabilidadOHKO).toBeLessThanOrEqual(1);
  });
});

describe("orden de velocidad", () => {
  it("gana el más rápido a nivel 50", () => {
    const r = compararVelocidad(de("charizard").stats, de("venusaur").stats);
    expect(r.gana).toBe("a");
    expect(r.va).toBeGreaterThan(r.vb);
  });
});

describe("validación del equipo", () => {
  it("acepta un equipo legal", () => {
    const equipo = ["charizard", "blastoise"].map((s) =>
      conjuntoPorDefecto(de(s), CATALOGO)
    );
    expect(hayErrores(validarEquipo(equipo, porSlug, CATALOGO))).toBe(false);
  });

  it("rechaza Pokémon duplicados", () => {
    const uno = conjuntoPorDefecto(de("charizard"), CATALOGO);
    const fallas = validarEquipo([uno, { ...uno }], porSlug, CATALOGO);
    expect(fallas.some((f) => f.regla === "duplicado")).toBe(true);
  });

  it("rechaza objetos duplicados", () => {
    const a = { ...conjuntoPorDefecto(de("charizard"), CATALOGO), objeto: "lifeorb" };
    const b = { ...conjuntoPorDefecto(de("blastoise"), CATALOGO), objeto: "lifeorb" };
    const fallas = validarEquipo([a, b], porSlug, CATALOGO);
    expect(fallas.some((f) => f.regla === "objeto-duplicado")).toBe(true);
  });

  it("rechaza un movimiento que la especie no aprende", () => {
    const c = { ...conjuntoPorDefecto(de("charizard"), CATALOGO) };
    c.movimientos = [...c.movimientos.slice(0, 3), "hydrocannon"];
    const fallas = validarEquipo([c], porSlug, CATALOGO);
    expect(fallas.some((f) => f.regla === "movimiento-ilegal")).toBe(true);
  });

  it("rechaza pasarse del total de EVs", () => {
    const c = {
      ...conjuntoPorDefecto(de("charizard"), CATALOGO),
      evs: { speed: 252, special_attack: 252, hp: 252 },
    };
    const fallas = validarEquipo([c], porSlug, CATALOGO);
    expect(fallas.some((f) => f.regla === "evs")).toBe(true);
  });

  it("rechaza pasarse de EVs en una sola stat", () => {
    const c = {
      ...conjuntoPorDefecto(de("charizard"), CATALOGO),
      evs: { speed: 300 },
    };
    const fallas = validarEquipo([c], porSlug, CATALOGO);
    expect(fallas.some((f) => f.regla === "ev-stat")).toBe(true);
  });

  it("rechaza un IV fuera de rango", () => {
    const base = conjuntoPorDefecto(de("charizard"), CATALOGO);
    const c = { ...base, ivs: { ...base.ivs, speed: 40 } };
    const fallas = validarEquipo([c], porSlug, CATALOGO);
    expect(fallas.some((f) => f.regla === "iv-stat")).toBe(true);
  });

  it("rechaza una habilidad que no es suya", () => {
    const c = { ...conjuntoPorDefecto(de("charizard"), CATALOGO), habilidad: "levitate" };
    const fallas = validarEquipo([c], porSlug, CATALOGO);
    expect(fallas.some((f) => f.regla === "habilidad")).toBe(true);
  });
});

describe("importar y exportar", () => {
  it("un equipo exportado se vuelve a importar igual", () => {
    const original = ["charizard", "blastoise", "tyranitar"].map((s) =>
      conjuntoPorDefecto(de(s), CATALOGO)
    );
    const texto = exportarEquipo(original, porSlug, CATALOGO);
    const { conjuntos, problemas } = importarEquipo(texto, ROSTER, CATALOGO);

    expect(problemas).toEqual([]);
    expect(conjuntos).toHaveLength(3);
    expect(conjuntos.map((c) => c.slug)).toEqual(original.map((c) => c.slug));
    expect(conjuntos[0].movimientos).toEqual(original[0].movimientos);
  });

  it("avisa cuando el texto trae algo que no existe", () => {
    const { problemas } = importarEquipo("Pikachu\n- Movimiento Inventado", ROSTER, CATALOGO);
    expect(problemas.length).toBeGreaterThan(0);
  });

  it("el equipo compartido por enlace vuelve entero", () => {
    const original = ["gardevoir", "metagross"].map((s) => ({
      ...conjuntoPorDefecto(de(s), CATALOGO),
      objeto: "lifeorb",
      naturaleza: "timid",
      nivel: 100,
      evs: { speed: 252, special_attack: 252 },
      ivs: { ...conjuntoPorDefecto(de(s), CATALOGO).ivs, attack: 0 },
    }));
    const vuelto = desdeCadena(aCadena(original));
    expect(vuelto).toHaveLength(2);
    expect(vuelto[0].objeto).toBe("lifeorb");
    expect(vuelto[0].naturaleza).toBe("timid");
    expect(vuelto[0].nivel).toBe(100);
    expect(vuelto[0].evs.speed).toBe(252);
    expect(vuelto[0].ivs.attack).toBe(0);
    expect(vuelto[0].movimientos).toEqual(original[0].movimientos);
  });
});

describe("análisis del equipo", () => {
  it("detecta la debilidad compartida", () => {
    // Charizard, Blastoise y Gyarados: los tres sufren Eléctrico.
    const equipo = ["charizard", "blastoise", "gyarados"].map(miembro);
    const compartidas = debilidadesCompartidas(equipo);
    const electrico = compartidas.find((c) => c.tipo === "electric");
    expect(electrico).toBeDefined();
    expect(electrico!.debiles).toBe(3);
  });

  it("la cobertura sale de los movimientos cargados", () => {
    const equipo = [miembro("charizard")];
    const cobertura = coberturaOfensiva(equipo);
    expect(cobertura).toHaveLength(18);
    const contraPlanta = cobertura.find((c) => c.tipo === "grass")!;
    // Charizard lleva movimientos de Fuego por defecto.
    expect(contraPlanta.mejor).toBeGreaterThanOrEqual(2);
  });

  it("la sinergia entra en el rango y trae sus componentes", () => {
    const equipo = ["charizard", "blastoise", "tyranitar"].map(miembro);
    const { sinergia } = analizarEquipo(equipo);
    expect(sinergia.total).toBeGreaterThanOrEqual(0);
    expect(sinergia.total).toBeLessThanOrEqual(100);
    expect(sinergia.componentes.length).toBe(5);
    const pesos = sinergia.componentes.reduce((a, c) => a + c.peso, 0);
    expect(pesos).toBeCloseTo(1, 5);
  });

  it("detecta roles a partir de las stats", () => {
    const roles = rolesDe(miembro("snorlax"));
    expect(roles.length).toBeGreaterThan(0);
  });

  it("no inventa clima cuando nadie lo pone", () => {
    const campo = analizarCampo([miembro("charizard")]);
    expect(campo.clima).toBeNull();
  });

  it("detecta el clima cuando la habilidad lo pone", () => {
    const p = de("tyranitar");
    const conjunto = { ...conjuntoPorDefecto(p, CATALOGO), habilidad: "sandstream" };
    const campo = analizarCampo([armarMiembro(p, conjunto, CATALOGO)]);
    expect(campo.clima).toBe("sandstorm");
  });
});

describe("recomendaciones", () => {
  const equipo = ["charizard", "blastoise", "tyranitar"].map(miembro);

  it("nunca recomienda a alguien que ya está en el equipo", () => {
    const r = recomendar(equipo, ROSTER, CATALOGO, "general", 5);
    const slugs = r.map((x) => x.pokemon.slug);
    for (const m of equipo) expect(slugs).not.toContain(m.pokemon.slug);
  });

  it("cada recomendación trae al menos un motivo", () => {
    const r = recomendar(equipo, ROSTER, CATALOGO, "general", 5);
    expect(r.length).toBeGreaterThan(0);
    for (const x of r) expect(x.razones.length).toBeGreaterThan(0);
  });

  it("el puntaje va de 0 a 100 y baja en orden", () => {
    const r = recomendar(equipo, ROSTER, CATALOGO, "general", 5);
    for (const x of r) {
      expect(x.puntaje).toBeGreaterThan(0);
      expect(x.puntaje).toBeLessThanOrEqual(100);
    }
    expect(r[0].puntaje).toBeGreaterThanOrEqual(r[r.length - 1].puntaje);
  });

  it("no devuelve cinco veces el mismo tipo", () => {
    const r = recomendar(equipo, ROSTER, CATALOGO, "general", 5);
    const primeros = r.map((x) => x.pokemon.tipos[0]);
    expect(new Set(primeros).size).toBeGreaterThan(1);
  });

  it("con criterio de velocidad prioriza a quien la controla", () => {
    const r = recomendar(equipo, ROSTER, CATALOGO, "velocidad", 5);
    const razones = r.flatMap((x) => x.razones).join(" ");
    expect(razones.toLowerCase()).toContain("control de velocidad");
  });

  it("las amenazas le pegan de verdad a medio equipo", () => {
    const amenazas = amenazasContra(equipo, ROSTER, CATALOGO, 5);
    for (const a of amenazas) {
      expect(a.golpeaA).toBeGreaterThanOrEqual(Math.ceil(equipo.length / 2));
    }
  });

  it("con el equipo vacío contesta y lo aclara", () => {
    const r = recomendar([], ROSTER, CATALOGO, "general", 5);
    expect(r).toHaveLength(5);
    expect(r[0].razones.join(" ")).toContain("vacío");
  });
});
