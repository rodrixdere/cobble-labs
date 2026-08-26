import { defineConfig } from "vitest/config";

// Los tests corren sobre la lógica pura: tabla de tipos, cálculo de daño,
// validación, análisis y recomendaciones. Nada de esto necesita navegador.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
