import next from "eslint-config-next";

export default [
  { ignores: [".next/**", "node_modules/**", "src/data/*.json", "capturas/**"] },
  ...next(),
  {
    rules: {
      // Los datos del jar entran como JSON sin tipar y se validan al leerlos en
      // src/data. Fuera de ahi, un `any` es un descuido.
      "@typescript-eslint/no-explicit-any": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
];
