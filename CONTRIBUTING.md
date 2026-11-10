# Cómo contribuir

Cobble Labs es una herramienta de comunidad y los aportes son bienvenidos. Estas
son las reglas para que un cambio entre.

## El camino de un cambio

1. Hacé un fork y trabajá en una rama propia.
2. Antes de abrir el PR, corré lo mismo que corre el repo:

   ```bash
   npx tsc --noEmit
   npm test
   npm run build
   ```

3. Abrí el PR contra `main` contando qué cambia y por qué.

A `main` no se puede subir directo. Todo PR necesita el workflow `pruebas` en
verde y la aprobación del dueño del repo. Un PR que agrega algo que no se pidió
conviene charlarlo antes en un issue, para no hacer trabajo que después no entra.

## Los datos no se inventan

Es lo que separa a Cobble Labs de una calculadora cualquiera, y no se negocia:

- Toda cifra sale del jar de Cobblemon o de una simulación que se acaba de
  correr. Si no hay dato, la sección queda vacía y dice por qué.
- Lo generado se marca como generado.
- No hay tier ni porcentaje de uso inventados.
- `src/data/pokemon.json` y los retratos no se editan a mano: salen de
  `npm run extraer` y `npm run retratos`.

## Estilo

- Todo en español, incluido el código: nombres, tipos y comentarios.
- Nada de guiones largos (ni em dash ni en dash), en ningún lado.
- Comentarios cortos que explican por qué, no qué.
- Botones, modales, campos y filas elegibles se arman con las primitivas de
  `src/ui`, nunca a mano: ahí están resueltos el foco, el teclado y el `aria-*`.
- Nada de `text-[Npx]`: la escala tipográfica está en `src/app/globals.css`.

## Lo que no entra

- Claves, tokens o cualquier secreto, aunque sea de prueba.
- Datos personales de nadie.
- Dependencias nuevas sin un motivo claro en el PR.

## Seguridad

Las vulnerabilidades no van en issues públicos. Ver [SECURITY.md](SECURITY.md).

## Licencia

El proyecto es MIT. Al contribuir, aceptás que tu aporte se publique bajo la
misma licencia.
