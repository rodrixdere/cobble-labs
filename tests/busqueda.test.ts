import { describe, expect, it } from "vitest";

import { coincide, coincideNumero, porComienzo } from "@/lib/busqueda";

describe("búsqueda por comienzo de palabra", () => {
  it("una letra trae los que empiezan con ella y no los que solo la contienen", () => {
    expect(coincide("Fearow", "f")).toBe(true);
    expect(coincide("Butterfree", "f")).toBe(false);
  });

  it("cada palabra buscada empieza alguna palabra del nombre", () => {
    expect(coincide("Baya Zidra", "baya zi")).toBe(true);
    expect(coincide("Pañuelo Elección", "elec")).toBe(true);
    expect(coincide("Mr. Mime", "mr m")).toBe(true);
    expect(coincide("Charizard", "ard")).toBe(false);
  });

  it("los que empiezan por lo escrito van primero", () => {
    const orden = porComienzo(["Pañuelo de Seda", "Seguro Debilidad"], (x) => x, "se");
    expect(orden[0]).toBe("Seguro Debilidad");
  });

  it("el número de Pokédex con o sin ceros", () => {
    expect(coincideNumero(6, "6")).toBe(true);
    expect(coincideNumero(6, "006")).toBe(true);
    expect(coincideNumero(6, "char")).toBe(false);
  });
});
