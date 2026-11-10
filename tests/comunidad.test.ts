import { describe, expect, it } from "vitest";

import { NOMBRE_CLIMA } from "@/analysis/campo";
import {
  etiquetasDe,
  prepararPublicacion,
  problemasParaPublicar,
} from "@/comunidad/publicacion";
import { CATALOGO, ROSTER } from "@/data/roster-combate";
import { conjuntoPorDefecto } from "@/team/combate";
import { desdeCadena } from "@/team/formato";

const porSlug = new Map(ROSTER.map((p) => [p.slug, p]));
const conjunto = (slug: string) => {
  const p = porSlug.get(slug);
  if (!p) throw new Error(`falta ${slug} en el roster`);
  return conjuntoPorDefecto(p, CATALOGO);
};

const SEIS = ["charizard", "blastoise", "venusaur", "gengar", "dragonite", "snorlax"];
const completo = () => SEIS.map(conjunto);
const problemas = (nombre: string, equipo = completo()) =>
  problemasParaPublicar(nombre, equipo, porSlug, CATALOGO);

describe("publicar en la comunidad", () => {
  it("acepta un equipo completo y legal", () => {
    expect(problemas("Equipo de prueba")).toEqual([]);
  });

  it("rechaza un equipo incompleto y dice cuántos faltan", () => {
    expect(problemas("Equipo de prueba", completo().slice(0, 4)).join(" ")).toContain(
      "faltan 2"
    );
  });

  it("rechaza un equipo con errores del validador", () => {
    const equipo = completo();
    equipo[5] = { ...equipo[0] };
    expect(problemas("Equipo de prueba", equipo).join(" ")).toContain("errores");
  });

  it("rechaza a quien no lleva movimientos", () => {
    const equipo = completo();
    equipo[2] = { ...equipo[2], movimientos: [] };
    expect(problemas("Equipo de prueba", equipo).join(" ")).toContain("movimiento");
  });

  it("rechaza nombres cortos, largos o con enlaces", () => {
    expect(problemas("ab")).not.toEqual([]);
    expect(problemas("x".repeat(41))).not.toEqual([]);
    expect(problemas("Mirá mi canal www.algo.com")).not.toEqual([]);
    expect(problemas("Visitá https://algo")).not.toEqual([]);
  });

  it("lo publicado vuelve al mismo equipo", () => {
    const publicacion = prepararPublicacion("  Equipo de prueba ", completo(), porSlug, CATALOGO);
    expect(publicacion.nombre).toBe("Equipo de prueba");
    expect(publicacion.especies).toEqual(SEIS);
    expect(desdeCadena(publicacion.cadena)).toEqual(completo());
  });
});

describe("etiquetas automáticas", () => {
  it("marca el clima que pone una habilidad del equipo", () => {
    const equipo = completo();
    equipo[5] = { ...conjunto("tyranitar"), habilidad: "sandstream" };
    expect(etiquetasDe(equipo, porSlug, CATALOGO)).toContain("Tormenta de arena");
  });

  it("no pone clima si nadie lo pone", () => {
    const climas = Object.values(NOMBRE_CLIMA);
    const etiquetas = etiquetasDe([conjunto("charizard")], porSlug, CATALOGO);
    expect(etiquetas.filter((e) => climas.includes(e))).toEqual([]);
  });

  it("marca la mega cuando alguien la lleva", () => {
    const p = porSlug.get("charizard")!;
    const forma = p.formas[0]?.clave;
    expect(forma, "Charizard tiene que traer sus megas del jar").toBeDefined();
    const equipo = [{ ...conjunto("charizard"), forma: forma! }];
    expect(etiquetasDe(equipo, porSlug, CATALOGO)).toContain("Mega");
  });
});
