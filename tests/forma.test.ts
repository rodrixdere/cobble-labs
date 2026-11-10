import { describe, expect, it } from "vitest";

import { CATALOGO, ROSTER } from "@/data/roster-combate";
import { conjuntoPorDefecto, nombreConForma } from "@/team/combate";
import { exportarEquipo, importarEquipo } from "@/team/formato";

describe("nombre con la forma", () => {
  it("las megas llevan el nombre de la especie", () => {
    expect(nombreConForma("Venusaur", { tipo: "mega", etiqueta: "Mega" })).toBe("Mega Venusaur");
    expect(nombreConForma("Charizard", { tipo: "mega", etiqueta: "Mega X" })).toBe("Mega Charizard X");
    expect(nombreConForma("Marowak", { tipo: "regional", etiqueta: "Alola" })).toBe("Marowak de Alola");
  });

  it("una mega exportada se vuelve a importar con su forma", () => {
    const porSlug = new Map(ROSTER.map((p) => [p.slug, p]));
    for (const slug of ["venusaur", "charizard", "garchomp"]) {
      const p = porSlug.get(slug)!;
      for (const f of p.formas.filter((x) => x.tipo === "mega")) {
        const conjunto = { ...conjuntoPorDefecto(p, CATALOGO), forma: f.clave, habilidad: f.habilidades[0].clave };
        const texto = exportarEquipo([conjunto], porSlug, CATALOGO);
        const { conjuntos } = importarEquipo(texto, ROSTER, CATALOGO);
        expect(conjuntos[0]?.forma).toBe(f.clave);
      }
    }
  });
});
