import { describe, expect, it } from "vitest";

import { CATALOGO, ROSTER } from "@/data/roster-combate";
import { ajustarSets } from "@/recommendations/ajustes";
import { armarMiembro, conjuntoPorDefecto } from "@/team/combate";
import { hayErrores, validarEquipo } from "@/team/validador";

describe("ajustes de set", () => {
  const porSlugA = new Map(ROSTER.map((p) => [p.slug, p]));
  const equipo = ["garchomp", "metagross", "gyarados", "gardevoir", "tyranitar", "salamence"].map((s) => {
    const p = porSlugA.get(s)!;
    return armarMiembro(p, { ...conjuntoPorDefecto(p, CATALOGO), naturaleza: "hardy" }, CATALOGO);
  });
  const ajustes = ajustarSets(equipo, CATALOGO);

  it("sugiere una sola mega aunque varios la tengan", () => {
    expect(ajustes.filter((a) => a.que === "Forma").length).toBe(1);
  });

  it("cada ajuste trae su motivo y deja un set válido", () => {
    expect(ajustes.length).toBeGreaterThan(0);
    for (const a of ajustes) {
      expect(a.motivo.length).toBeGreaterThan(10);
      const otros = equipo.map((m, i) => (i === a.indice ? a.conjunto : m.conjunto));
      expect(hayErrores(validarEquipo(otros, porSlugA, CATALOGO))).toBe(false);
    }
  });

  it("con naturaleza neutra sugiere la que corresponde", () => {
    const n = ajustes.find((a) => a.quien === "Garchomp" && a.que === "Naturaleza");
    expect(n?.conjunto.naturaleza).toBe("jolly");
  });
});
