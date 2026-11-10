"use client";

import { Star, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import BuscadorFlotante from "@/components/BuscadorFlotante";
import EquipoDesplegable from "@/components/comunidad/EquipoDesplegable";
import ModalEntrar from "@/components/comunidad/ModalEntrar";
import {
  borrarEquipoPublicado,
  leerDeAutor,
  leerEquipo,
  leerPorEspecie,
  leerRecientes,
  mensajeDeError,
} from "@/comunidad/api";
import { alternarFavorito, useFavoritos } from "@/comunidad/favoritos";
import { useSesion } from "@/comunidad/sesion";
import type { ResumenEquipo } from "@/comunidad/tipos";
import { guardarActual } from "@/team/almacen";
import type { MovimientoCatalogo, PokemonCombate } from "@/team/combate";
import { desdeCadena } from "@/team/formato";
import { indexarRoster } from "@/team/roster";
import Aviso from "@/ui/Aviso";
import Boton from "@/ui/Boton";
import Opcion from "@/ui/Opcion";
import Pestanias, { type Pestania } from "@/ui/Pestanias";

// La comunidad. Todo lo que se ve sale de los archivos publicos, sin pasar por
// el Worker: la lista, el filtro por Pokemon y los sets de cada equipo. Los
// favoritos ni siquiera salen del navegador. La forma de la lista es la de los
// equipos de torneo de Champions Lab: dos columnas y cada equipo se despliega.

type Vista = "recientes" | "favoritos" | "mios";

const POR_TANDA = 20;

const TIEMPO = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
const UNIDADES: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

function hace(momento: number): string {
  const segundos = (momento - Date.now()) / 1000;
  for (const [unidad, largo] of UNIDADES) {
    if (Math.abs(segundos) >= largo) return TIEMPO.format(Math.round(segundos / largo), unidad);
  }
  return "recién";
}

type Props = { roster: PokemonCombate[]; catalogo: MovimientoCatalogo[] };

export default function Comunidad({ roster, catalogo }: Props) {
  const router = useRouter();
  const parametros = useSearchParams();
  const indice = useMemo(() => indexarRoster(roster), [roster]);
  const sesion = useSesion();
  const favoritos = useFavoritos();

  const [vista, setVista] = useState<Vista>(parametros.get("ver") === "mios" ? "mios" : "recientes");
  const [especie, setEspecie] = useState<string | null>(null);
  const [etiqueta, setEtiqueta] = useState<string | null>(null);
  const [cuantos, setCuantos] = useState(POR_TANDA);
  const [eligiendo, setEligiendo] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [lista, setLista] = useState<ResumenEquipo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const idSesion = sesion?.id ?? null;

  useEffect(() => {
    setCuantos(POR_TANDA);
    setEtiqueta(null);
    if (vista === "favoritos") return;
    if (vista === "mios" && !idSesion) return;

    let vigente = true;
    setLista(null);
    setError(null);

    const pedido =
      vista === "mios"
        ? leerDeAutor(idSesion!)
        : especie
          ? leerPorEspecie(especie)
          : leerRecientes();

    pedido
      .then((archivo) => vigente && setLista(archivo?.equipos ?? []))
      .catch(() => vigente && setError("No se pudieron cargar los equipos. Probá recargar la página."));

    return () => {
      vigente = false;
    };
  }, [vista, especie, idSesion]);

  const cargar = (cadena: string) => router.push(`/equipos?e=${encodeURIComponent(cadena)}`);
  const probar = (cadena: string) => {
    guardarActual(desdeCadena(cadena));
    router.push("/battle-bot?herramienta=prueba");
  };
  const leerCadena = async (id: string) => (await leerEquipo(id))?.cadena ?? null;

  const borrar = async (id: string) => {
    setAviso(null);
    try {
      await borrarEquipoPublicado(id);
      setLista((actual) => actual?.filter((e) => e.id !== id) ?? actual);
      setAviso("Equipo borrado.");
    } catch (e) {
      setAviso(mensajeDeError(e));
    }
  };

  const nombreDe = (slug: string) => indice.get(slug)?.nombre ?? slug;
  const base = vista === "favoritos" ? favoritos : lista;
  const etiquetas = useMemo(() => [...new Set((base ?? []).flatMap((e) => e.etiquetas))].sort(), [base]);

  const mostrar = (vacio: string, propios = false) => {
    if (error && vista !== "favoritos") return <Estado>{error}</Estado>;
    if (base === null) return <Estado>Cargando equipos…</Estado>;

    const filtrados = base.filter((e) => !etiqueta || e.etiquetas.includes(etiqueta));
    if (filtrados.length === 0) return <Estado>{base.length === 0 ? vacio : "Ningún equipo tiene esa etiqueta."}</Estado>;

    return (
      <>
        <ul className="mt-4 grid items-start gap-3 lg:grid-cols-2">
          {filtrados.slice(0, cuantos).map((equipo) => {
            const favorito = favoritos.some((f) => f.id === equipo.id);
            return (
              <EquipoDesplegable
                key={equipo.id}
                especies={equipo.especies}
                indice={indice}
                catalogo={catalogo}
                titulo={equipo.nombre}
                detalle={`de ${equipo.autor.nombre}, ${hace(equipo.creado)}`}
                etiquetas={equipo.etiquetas}
                obtenerCadena={() => leerCadena(equipo.id)}
                onCargar={cargar}
                onProbar={probar}
                extra={
                  propios ? (
                    <Boton variante="icono" alarma aria-label={`Borrar ${equipo.nombre}`} onClick={() => borrar(equipo.id)}>
                      <Trash size={15} aria-hidden />
                    </Boton>
                  ) : (
                    <Boton
                      variante="icono"
                      aria-label={favorito ? "Quitar de favoritos" : "Marcar como favorito"}
                      aria-pressed={favorito}
                      onClick={() => alternarFavorito(equipo)}
                    >
                      <Star
                        size={16}
                        weight={favorito ? "fill" : "regular"}
                        aria-hidden
                        className={favorito ? "text-ambar" : undefined}
                      />
                    </Boton>
                  )
                }
              />
            );
          })}
        </ul>
        {filtrados.length > cuantos ? (
          <Boton variante="contorno" ubicacion="mt-4 w-full justify-center" onClick={() => setCuantos((n) => n + POR_TANDA)}>
            Mostrar más ({filtrados.length - cuantos} restantes)
          </Boton>
        ) : null}
      </>
    );
  };

  // Los filtros de arriba de la lista: por Pokemon solo en Recientes, porque
  // sale de un archivo por especie; por etiqueta en todas, sobre lo cargado.
  const filtros = (conEspecie: boolean) => (
    <div className="-mx-1 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-linea px-1 pb-3">
      {conEspecie ? (
        especie ? (
          <span className="flex items-center gap-2">
            <span className="text-lectura text-tinta-media">
              Con <strong className="text-tinta">{nombreDe(especie)}</strong>
            </span>
            <Boton variante="enlace" onClick={() => setEspecie(null)}>
              Quitar
            </Boton>
          </span>
        ) : (
          <Boton variante="contorno" onClick={() => setEligiendo(true)}>
            Filtrar por Pokémon
          </Boton>
        )
      ) : null}
      {etiquetas.length > 0 ? (
        <div role="group" aria-label="Etiqueta" className="flex flex-wrap gap-1">
          <Opcion estilo="contorno" puesta={etiqueta === null} onElegir={() => setEtiqueta(null)}>
            Todas
          </Opcion>
          {etiquetas.map((e) => (
            <Opcion key={e} estilo="contorno" puesta={etiqueta === e} onElegir={() => setEtiqueta(e)}>
              {e}
            </Opcion>
          ))}
        </div>
      ) : null}
    </div>
  );

  const vistas: Pestania<Vista>[] = [
    {
      clave: "recientes",
      nombre: "Recientes",
      contenido: () => (
        <>
          {filtros(true)}
          {mostrar(
            especie
              ? `Todavía nadie publicó un equipo con ${nombreDe(especie)}.`
              : "Todavía nadie publicó equipos. Armá uno en Equipos y tocá Publicar."
          )}
        </>
      ),
    },
    {
      clave: "favoritos",
      nombre: favoritos.length > 0 ? `Favoritos (${favoritos.length})` : "Favoritos",
      contenido: () => (
        <>
          {filtros(false)}
          {mostrar("Todavía no marcaste ninguno. Tocá la estrella de un equipo para guardarlo acá.")}
        </>
      ),
    },
    {
      clave: "mios",
      nombre: "Mis equipos",
      contenido: () =>
        sesion ? (
          mostrar("Todavía no publicaste ninguno. Armalo en Equipos y tocá Publicar.", true)
        ) : (
          <Estado>
            Entrá para ver y borrar los equipos que publicaste.{" "}
            <Boton variante="enlace" onClick={() => setEntrando(true)}>
              Entrar
            </Boton>
          </Estado>
        ),
    },
  ];

  return (
    <>
      <div className="px-4 pb-5 pt-9 md:px-8">
        <h1 className="font-display text-portada">Comunidad</h1>
        <p className="mt-3 max-w-[62ch] text-realce leading-relaxed text-tinta-media">
          Equipos que publicó la gente del servidor. Abrí uno para ver sus sets, cargalo en el
          armador o probalo en el Battle Bot. Para publicar el tuyo, armalo en{" "}
          <Link href="/equipos" prefetch={false} className="underline underline-offset-4 hover:text-tinta">
            Equipos
          </Link>{" "}
          y tocá Publicar.
        </p>
      </div>

      {aviso ? <Aviso>{aviso}</Aviso> : null}

      <div className="border-t border-linea px-4 pb-8 pt-4 md:px-8">
        <Pestanias pestanias={vistas} activa={vista} onCambiar={setVista} />
      </div>

      {eligiendo ? (
        <BuscadorFlotante
          roster={roster}
          onCerrar={() => setEligiendo(false)}
          onElegir={(slug) => {
            setEspecie(slug);
            setEligiendo(false);
          }}
        />
      ) : null}

      {entrando ? <ModalEntrar onCerrar={() => setEntrando(false)} /> : null}
    </>
  );
}

function Estado({ children }: { children: ReactNode }) {
  // Sin margen propio a los lados: la lista ya vive dentro del de la pagina.
  return <p className="py-16 text-center text-lectura text-tinta-tenue">{children}</p>;
}
