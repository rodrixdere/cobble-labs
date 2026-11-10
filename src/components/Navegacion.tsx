"use client";

import { List } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { COMUNIDAD_ACTIVA } from "@/data/sitio";
import { cx } from "@/ui/clases";
import Desplegable from "@/ui/Desplegable";

const SECCIONES = [
  { href: "/", nombre: "Pokédex" },
  { href: "/equipos", nombre: "Equipos" },
  { href: "/tipos", nombre: "Tipos" },
  { href: "/battle-bot", nombre: "Battle Bot" },
  ...(COMUNIDAD_ACTIVA
    ? [
        { href: "/comunidad", nombre: "Comunidad" },
        { href: "/torneos", nombre: "Torneos" },
      ]
    : []),
  { href: "/learn", nombre: "Learn" },
];

const esActiva = (href: string, ruta: string) =>
  href === "/" ? ruta === "/" : ruta.startsWith(href);

// Dos formas de la misma navegacion. En ancho hay lugar para la tira completa,
// y la seccion activa se marca con una regla de 2px al pie de la cabecera, no
// con una pildora: la cabecera es una linea de indice, no una botonera.
// En angosto entra por hamburguesa, porque cinco secciones no caben sin
// achicarlas hasta que dejen de leerse. Con la comunidad son mas secciones y
// ademas esta la cuenta: la tira completa recien entra desde lg.
const TIRA = COMUNIDAD_ACTIVA ? "lg:flex" : "md:flex";
const HAMBURGUESA = COMUNIDAD_ACTIVA ? "lg:hidden" : "md:hidden";

export default function Navegacion() {
  const ruta = usePathname();

  return (
    <>
      <nav className={cx("hidden h-full items-stretch", TIRA)}>
        {SECCIONES.map(({ href, nombre }) => {
          const activa = esActiva(href, ruta);
          return (
            <Link
              key={href}
              href={href}
              // Con output "export" el payload de prefetch queda en
              // `__next.equipos/__PAGE__.txt` pero se pide con puntos, y deja
              // un 404 en cada pagina del sitio.
              prefetch={false}
              aria-current={activa ? "page" : undefined}
              className={cx(
                "relative flex shrink-0 items-center whitespace-nowrap px-4 text-lectura transition-colors duration-150",
                activa
                  ? "font-semibold text-tinta"
                  : "font-medium text-tinta-media hover:text-tinta"
              )}
            >
              {nombre}
              <span
                aria-hidden
                className={cx(
                  "absolute inset-x-3 bottom-0 h-[2px] bg-acento transition-opacity duration-150",
                  activa ? "opacity-100" : "opacity-0"
                )}
              />
            </Link>
          );
        })}
      </nav>

      <div className={cx("ml-auto flex items-center", HAMBURGUESA)}>
        <Desplegable
          titulo="Secciones"
          lado="derecha"
          panel="w-[200px] py-1"
          boton="grid h-9 w-9 place-items-center rounded-pieza text-tinta-media hover:bg-hueco hover:text-tinta"
          etiqueta={<List size={20} aria-hidden />}
        >
          {(cerrar) => (
            <nav>
              {SECCIONES.map(({ href, nombre }) => {
                const activa = esActiva(href, ruta);
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={false}
                    onClick={cerrar}
                    aria-current={activa ? "page" : undefined}
                    className={cx(
                      "block border-l-2 py-2.5 pl-3 pr-4 text-lectura transition-colors duration-150",
                      activa
                        ? "border-l-acento bg-acento-lavado font-semibold text-tinta"
                        : "border-l-transparent text-tinta-media hover:bg-hueco hover:text-tinta"
                    )}
                  >
                    {nombre}
                  </Link>
                );
              })}
            </nav>
          )}
        </Desplegable>
      </div>
    </>
  );
}
