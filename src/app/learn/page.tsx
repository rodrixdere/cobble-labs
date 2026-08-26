import type { Metadata } from "next";
import Link from "next/link";

import { NOMBRE_TIPO, POKEMON, TIPOS, suma } from "@/data/pokemon";
import { defensaContra } from "@/engine/tabla-tipos";
import { TOTAL_MOVIMIENTOS } from "@/data/textos";

export const metadata: Metadata = {
  title: "Learn · Cobble Labs",
  description:
    "Cómo se lee la tabla de tipos, cómo se arma un equipo y qué significan las stats, las habilidades y los movimientos del servidor.",
};

// Todas las cifras que aparecen en el texto se calculan del roster, no se
// escriben a mano: si cambia el servidor, el texto sigue siendo cierto.
const cuentaPorTipo = TIPOS.map((t) => ({
  tipo: t,
  cuantos: POKEMON.filter((p) => p.tipos.includes(t)).length,
})).toSorted((a, b) => b.cuantos - a.cuantos);

const masComun = cuentaPorTipo[0];

const debilesAAgua = POKEMON.filter((p) => defensaContra(p.tipos, "water") > 1).length;
const inmunes = POKEMON.filter((p) =>
  TIPOS.some((t) => defensaContra(p.tipos, t) === 0)
).length;
const totalPromedio = Math.round(
  POKEMON.reduce((a, p) => a + suma(p.stats), 0) / POKEMON.length
);
const masRapido = POKEMON.toSorted((a, b) => b.stats.speed - a.stats.speed)[0];
const conMega = POKEMON.filter((p) => p.formas.length > 0).length;

type Capitulo = {
  id: string;
  numero: string;
  titulo: string;
  cuerpo: React.ReactNode;
};

const CAPITULOS: Capitulo[] = [
  {
    id: "tipos",
    numero: "01",
    titulo: "La tabla de tipos es la mitad del juego",
    cuerpo: (
      <>
        <p>
          Cada movimiento tiene un tipo y cada Pokémon tiene uno o dos. El
          cruce decide por cuánto se multiplica el daño: ×2 si es súper
          efectivo, ×½ si lo resiste, ×0 si es inmune. Cuando el que recibe
          tiene dos tipos, los dos multiplicadores se aplican, y ahí aparecen el
          ×4 que decide combates y el ×¼ que los alarga.
        </p>
        <p>
          Lo que más se olvida es que atacar y defender son dos lecturas
          distintas. {NOMBRE_TIPO[masComun.tipo]} es el tipo más común del
          servidor, con {masComun.cuantos} de {POKEMON.length}, y{" "}
          {debilesAAgua} Pokémon del roster reciben daño aumentado de Agua. Eso
          no lo hace el mejor tipo para llevar: lo hace el más previsible.
        </p>
        <p>
          La tabla completa, con los 18 tipos y la explicación de cada caso,
          está en <Enlace href="/tipos">Tipos</Enlace>.
        </p>
      </>
    ),
  },
  {
    id: "equipos",
    numero: "02",
    titulo: "Un equipo se arma tapando huecos, no juntando favoritos",
    cuerpo: (
      <>
        <p>
          Seis Pokémon buenos por separado no son un buen equipo. Lo que
          importa es qué le pasa al conjunto: si tres miembros son débiles al
          mismo tipo, un solo movimiento te parte el equipo por la mitad. A eso
          le decimos una debilidad crítica, y es lo primero que hay que mirar.
        </p>
        <p>
          Después va la otra mitad: los tipos a los que nadie del equipo le pega
          fuerte. Son los puntos ciegos, y son la razón por la que un combate se
          estanca. {inmunes} Pokémon del roster tienen al menos una inmunidad, o
          sea que hay muchas paredes que solo se rompen con el tipo correcto.
        </p>
        <p>
          En <Enlace href="/equipos">Equipos</Enlace> las dos cuentas están
          hechas mientras armás, y la lista de compañeros sugeridos ordena el
          roster por cuántas de tus debilidades resiste cada uno.
        </p>
      </>
    ),
  },
  {
    id: "stats",
    numero: "03",
    titulo: "Las stats base y para qué sirve cada una",
    cuerpo: (
      <>
        <p>
          Son seis: PS, Ataque, Defensa, Ataque Especial, Defensa Especial y
          Velocidad. Cada movimiento es físico o especial, y usa el par que le
          corresponde: un movimiento físico enfrenta Ataque contra Defensa, uno
          especial enfrenta Ataque Especial contra Defensa Especial. Por eso un
          Pokémon puede aguantar perfectamente de un lado y caerse del otro.
        </p>
        <p>
          El total de las seis es la referencia rápida de cuánto material tiene
          uno. En este roster el promedio es {totalPromedio} y el techo lo pone{" "}
          {POKEMON.toSorted((a, b) => suma(b.stats) - suma(a.stats))[0].nombre}{" "}
          con{" "}
          {suma(POKEMON.toSorted((a, b) => suma(b.stats) - suma(a.stats))[0].stats)}
          . Pero el total miente seguido: repartido en las stats equivocadas no
          sirve de nada.
        </p>
        <p>
          La Velocidad es distinta de las otras cinco porque no se reparte el
          daño: decide quién pega primero, y pegar primero muchas veces es todo.{" "}
          {masRapido.nombre} llega a {masRapido.stats.speed} de base, que es el
          techo del servidor.
        </p>
      </>
    ),
  },
  {
    id: "habilidades",
    numero: "04",
    titulo: "Las habilidades cambian las reglas, no los números",
    cuerpo: (
      <>
        <p>
          Cada Pokémon tiene una habilidad, y algunas cambian el combate más que
          cualquier stat: ponen sol, duplican velocidad, anulan un tipo entero
          de daño o devuelven parte del que reciben. Están escritas en la ficha
          de cada uno, con la descripción que trae el propio juego.
        </p>
        <p>
          Las marcadas como ocultas son las que no aparecen normalmente al
          capturar. Cuando un Pokémon lista la misma habilidad como normal y
          como oculta, la ficha la muestra una sola vez y sin la marca: si se
          puede conseguir sin buscarla, marcarla como oculta sería engañoso.
        </p>
      </>
    ),
  },
  {
    id: "movimientos",
    numero: "05",
    titulo: "Cómo leer un movimiento",
    cuerpo: (
      <>
        <p>
          Un movimiento se lee con cinco datos: tipo, categoría, potencia,
          precisión y PP. La categoría dice qué stats entran en la cuenta. La
          potencia es la base del daño, pero no es comparable entre tipos
          distintos hasta que la cruzás con la tabla. Y la precisión es la
          cuenta que casi nadie hace: 120 de potencia al 70 % rinde menos que 90
          al 100 % si el combate dura.
        </p>
        <p>
          Cuando el tipo del movimiento coincide con el de quien lo usa, pega un
          50 % más. Ese bonus es la razón por la que la cobertura de un equipo se
          mide primero por los tipos de sus miembros.
        </p>
        <p>
          El servidor tiene {TOTAL_MOVIMIENTOS} movimientos distintos repartidos
          entre los {POKEMON.length} del roster. Cada ficha muestra los suyos con
          los cinco datos, y en{" "}
          <Enlace href="/battle-bot">Battle Bot</Enlace> podés ver cuánto pega
          cada uno contra un objetivo concreto.
        </p>
      </>
    ),
  },
  {
    id: "combate",
    numero: "06",
    titulo: "El turno: quién pega primero y qué pasa con las megas",
    cuerpo: (
      <>
        <p>
          A igualdad de prioridad, mueve primero el que tiene más Velocidad. Hay
          movimientos con prioridad propia que se saltan esa regla y pegan
          siempre antes: son la respuesta clásica a un rival más rápido que
          está a un golpe de caerse.
        </p>
        <p>
          Las megaevoluciones cambian stats, a veces tipos y casi siempre la
          habilidad. {conMega} Pokémon del roster tienen una. En la ficha se
          alternan con el conmutador de forma, y las barras muestran la
          diferencia contra la forma base para que se vea a dónde fue a parar
          cada punto.
        </p>
      </>
    ),
  },
  {
    id: "datos",
    numero: "07",
    titulo: "De dónde salen estos datos",
    cuerpo: (
      <>
        <p>
          Todo lo que se muestra sale de lo que corre el servidor, no de una
          API de los juegos oficiales. Las especies, sus stats, habilidades,
          movimientos y megaevoluciones se leen del jar de Cobblemon
          1.7.3+1.21.1. Los nombres y las descripciones son los del idioma
          español del propio mod, tal como aparecen dentro del juego.
        </p>
        <p>
          El tipo, la categoría, la potencia, la precisión y los PP de cada
          movimiento salen del Pokémon Showdown que Cobblemon instala para
          resolver los combates, y el cálculo de daño del Battle Bot usa esa
          misma fórmula.
        </p>
        <p>
          Los retratos son pixel art del pack dCIM, con licencia MIT. Lo único
          que no sale de ninguna de esas fuentes es el tier y el porcentaje de
          uso: eso depende de lo que la gente juega y el servidor no lo publica,
          así que solo aparece donde alguien lo aportó a mano.
        </p>
      </>
    ),
  },
];

export default function Learn() {
  return (
    <main className="mx-auto max-w-[1400px] hoja">
      <div className="px-8 pb-6 pt-9">
        <h1 className="font-display text-portada">
          Learn
        </h1>
        <p className="mt-3 max-w-[62ch] text-realce leading-relaxed text-tinta-media">
          Lo que hay que entender para dejar de improvisar: la tabla de tipos,
          cómo se arma un equipo que no se cae con un solo movimiento, y qué
          significan de verdad los números de una ficha.
        </p>
      </div>

      <div className="grid grid-cols-[280px_1fr] border-t border-linea">
        <nav
          aria-label="Índice"
          className="sticky top-[var(--alto-cabecera)] h-[calc(100dvh-var(--alto-cabecera))] overflow-y-auto border-r border-linea px-6 py-6"
        >
          <h2 className="rotulo border-b border-linea pb-2">Índice</h2>
          <ol className="mt-2">
            {CAPITULOS.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  className="flex gap-3 border-l-2 border-l-transparent py-2 pl-2.5 text-lectura text-tinta-media transition-colors duration-150 hover:border-l-acento hover:bg-hueco hover:text-tinta"
                >
                  <span className="cifra text-apoyo text-tinta-tenue">
                    {c.numero}
                  </span>
                  <span className="flex-1">{c.titulo}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div>
          {CAPITULOS.map((c) => (
            <section
              key={c.id}
              id={c.id}
              className="border-b border-linea px-10 py-9 [scroll-margin-top:calc(var(--alto-cabecera)+8px)] last:border-b-0"
            >
              <div className="mx-auto max-w-[720px]">
              <p className="cifra text-apoyo text-tinta-tenue">{c.numero}</p>
              <h2 className="mt-2 max-w-[24ch] font-display text-capitulo text-balance">
                {c.titulo}
              </h2>
              <div className="mt-4 space-y-3.5 text-realce leading-relaxed text-tinta-media">
                {c.cuerpo}
              </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function Enlace({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-semibold text-acento-hondo underline underline-offset-4 transition-colors duration-150 hover:text-tinta"
    >
      {children}
    </Link>
  );
}
