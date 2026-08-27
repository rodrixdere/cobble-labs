import type { Metadata } from "next";
import Link from "next/link";

import TablaTipos from "@/components/TablaTipos";

export const metadata: Metadata = {
  title: "Tipos",
  description:
    "La tabla de efectividad de tipos que usa Cobblemon, con la explicación de cómo se lee y cómo se multiplican los tipos dobles.",
  alternates: { canonical: "/tipos" },
  openGraph: {
    title: "Tipos · Cobble Labs",
    description: "La tabla de efectividad de tipos que usa Cobblemon, con la explicación de cómo se lee y cómo se multiplican los tipos dobles.",
    url: "/tipos",
  },
};

// Los ejemplos son de Pokemon del roster y estan verificados contra la propia
// tabla: no hay ninguno puesto de memoria.
const EJEMPLOS = [
  {
    titulo: "Un tipo",
    cuenta: "Fuego contra Planta",
    resultado: "×2",
    detalle:
      "Un solo tipo defensor, un solo multiplicador. Es el caso más simple y el que ya sabés de memoria.",
  },
  {
    titulo: "Dos tipos que suman",
    cuenta: "Eléctrico contra Gyarados, que es Agua y Volador",
    resultado: "×4",
    detalle:
      "Eléctrico pega ×2 a Agua y ×2 a Volador. Los dos se multiplican, y por eso un solo Rayo se lleva puesto a medio equipo.",
  },
  {
    titulo: "Dos tipos que se cancelan",
    cuenta: "Planta contra Venusaur, que es Planta y Veneno",
    resultado: "×¼",
    detalle:
      "Planta resiste a Planta ×½ y Veneno la resiste otro ×½. Multiplicadas quedan en un cuarto del daño.",
  },
  {
    titulo: "La inmunidad manda",
    cuenta: "Tierra contra Skarmory, que es Acero y Volador",
    resultado: "×0",
    detalle:
      "Tierra le haría ×2 al Acero, pero Volador es inmune. Un cero multiplica a cero: no importa el resto.",
  },
];

export default function Tipos() {
  return (
    <main className="mx-auto max-w-[1400px] hoja">
      <div className="flex items-end justify-between gap-10 px-4 md:px-8 pb-6 pt-9">
        <div>
          <h1 className="font-display text-portada">
            Tipos
          </h1>
          <p className="mt-3 max-w-[58ch] text-realce leading-relaxed text-tinta-media">
            La tabla de efectividad de la sexta generación en adelante, que es
            la que implementa Cobblemon. Elegí un tipo para ver qué le hace al
            resto y qué le hace el resto a él.
          </p>
        </div>
      </div>

      <div className="border-t border-linea">
        <TablaTipos />
      </div>

      <section className="border-t border-linea px-4 md:px-8 py-8">
        <h2 className="font-display text-capitulo">
          Cómo se lee
        </h2>
        <p className="mt-2.5 max-w-[74ch] text-realce leading-relaxed text-tinta-media">
          Cada fila es el tipo del movimiento que ataca y cada columna el tipo
          del Pokémon que lo recibe. La celda dice por cuánto se multiplica el
          daño. Las casillas vacías son daño normal, que es el caso más común:
          se dejan en blanco para que salten a la vista las que importan.
        </p>

        <ul className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-px bg-linea">
          {EJEMPLOS.map((e) => (
            <li key={e.titulo} className="bg-panel p-5">
              <h3 className="rotulo">{e.titulo}</h3>
              <p className="cifra mt-2 text-cifra">
                {e.resultado}
              </p>
              <p className="mt-3 text-lectura font-semibold">{e.cuenta}</p>
              <p className="mt-1.5 text-cuerpo leading-relaxed text-tinta-media">
                {e.detalle}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-y-7 border-t border-linea pt-7 md:grid-cols-2 md:gap-x-12 md:gap-y-0">
          <div>
            <h3 className="font-display text-guia">
              Atacar y defender son dos tablas distintas
            </h3>
            <p className="mt-2 max-w-[60ch] text-lectura leading-relaxed text-tinta-media">
              Que tu tipo resista algo no quiere decir que le pegue fuerte. Acero
              resiste diez tipos y solo tres le tienen miedo. Cuando armes el
              equipo mirá las dos cosas por separado: la columna te dice qué
              aguanta y la fila qué rompe. En{" "}
              <Link
                href="/equipos"
                prefetch={false}
                className="font-semibold text-acento-hondo underline underline-offset-4"
              >
                Equipos
              </Link>{" "}
              las dos cuentas están hechas para los seis a la vez.
            </p>
          </div>
          <div>
            <h3 className="font-display text-guia">
              El bonus por tipo propio
            </h3>
            <p className="mt-2 max-w-[60ch] text-lectura leading-relaxed text-tinta-media">
              Un movimiento del mismo tipo que quien lo usa pega un 50 % más.
              Por eso la cobertura de un equipo se mide primero por los tipos de
              sus miembros: son los que van con bonus. Un movimiento prestado
              llega igual, pero pega menos que el propio.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
