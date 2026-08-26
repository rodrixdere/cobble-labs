"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/", nombre: "Pokédex" },
  { href: "/equipos", nombre: "Equipos" },
  { href: "/tipos", nombre: "Tipos" },
  { href: "/battle-bot", nombre: "Battle Bot" },
  { href: "/learn", nombre: "Learn" },
];

// La seccion activa se marca con una regla de 2px al pie de la cabecera, no con
// una pildora de fondo: la cabecera es una linea de indice, no una botonera.
export default function Navegacion() {
  const ruta = usePathname();

  return (
    <nav className="flex h-full items-stretch">
      {SECCIONES.map(({ href, nombre }) => {
        const activa = href === "/" ? ruta === "/" : ruta.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={activa ? "page" : undefined}
            className={`relative flex items-center px-4 text-lectura transition-colors duration-150 ${
              activa
                ? "font-semibold text-tinta"
                : "font-medium text-tinta-media hover:text-tinta"
            }`}
          >
            {nombre}
            <span
              aria-hidden
              className={`absolute inset-x-3 bottom-0 h-[2px] transition-opacity duration-150 ${
                activa ? "bg-acento opacity-100" : "bg-acento opacity-0"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
