"use client";

import { ArrowSquareOut, CaretDown } from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";

import SeisRetratos from "@/components/comunidad/SeisRetratos";
import SetsDelEquipo from "@/components/comunidad/SetsDelEquipo";
import type { MovimientoCatalogo } from "@/team/combate";
import type { IndicePokemon } from "@/team/roster";
import Boton from "@/ui/Boton";
import { cx } from "@/ui/clases";

// Un equipo en una lista, a la manera de los equipos de torneo de Champions Lab:
// los seis de un vistazo y, al abrirlo, los sets completos. El detalle se pide
// recien al abrir, porque la lista trae solo el resumen.

type Props = {
  especies: string[];
  indice: IndicePokemon;
  catalogo: MovimientoCatalogo[];
  titulo: string;
  detalle: ReactNode;
  etiquetas?: string[];
  /** Lo que va antes de los retratos, como el puesto en un torneo. */
  delante?: ReactNode;
  /** Acciones al costado que no abren el equipo: la estrella o Borrar. */
  extra?: ReactNode;
  obtenerCadena: () => Promise<string | null>;
  onCargar: (cadena: string) => void;
  onProbar: (cadena: string) => void;
};

export default function EquipoDesplegable({
  especies,
  indice,
  catalogo,
  titulo,
  detalle,
  etiquetas = [],
  delante,
  extra,
  obtenerCadena,
  onCargar,
  onProbar,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  // undefined mientras no se pidio; null si el equipo ya no esta publicado.
  const [cadena, setCadena] = useState<string | null | undefined>(undefined);
  const [fallo, setFallo] = useState(false);

  const alternar = () => {
    const abrir = !abierto;
    setAbierto(abrir);
    if (abrir && cadena === undefined) {
      obtenerCadena()
        .then(setCadena)
        .catch(() => setFallo(true));
    }
  };

  let desplegado: ReactNode = null;
  if (abierto) {
    if (fallo) desplegado = <Aviso>No se pudo cargar el equipo. Probá de nuevo.</Aviso>;
    else if (cadena === undefined) desplegado = <Aviso>Cargando los sets…</Aviso>;
    else if (cadena === null) desplegado = <Aviso>Ese equipo ya no está publicado.</Aviso>;
    else {
      desplegado = (
        <>
          <SetsDelEquipo cadena={cadena} indice={indice} catalogo={catalogo} />
          <div className="flex flex-wrap gap-1 border-t border-linea px-4 py-3">
            <Boton variante="contorno" onClick={() => onCargar(cadena)}>
              Cargar en el armador
            </Boton>
            <Boton onClick={() => onProbar(cadena)}>
              <ArrowSquareOut size={13} aria-hidden />
              Probar en el Battle Bot
            </Boton>
          </div>
        </>
      );
    }
  }

  return (
    <li className="border border-linea bg-panel">
      <div className="flex items-center">
        <button
          type="button"
          aria-expanded={abierto}
          onClick={alternar}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-left transition-colors duration-150 hover:bg-hueco"
        >
          {delante}
          <SeisRetratos especies={especies} indice={indice} tamanio="chico" />
          <span className="min-w-0 flex-1 basis-[180px]">
            <span className="block truncate text-lectura font-semibold">{titulo}</span>
            <span className="block truncate text-apoyo text-tinta-tenue">{detalle}</span>
            {etiquetas.length > 0 ? (
              <span className="mt-1 flex flex-wrap gap-1">
                {etiquetas.map((e) => (
                  <span key={e} className="border border-linea px-1.5 py-[1px] text-nota text-tinta-media">
                    {e}
                  </span>
                ))}
              </span>
            ) : null}
          </span>
          <CaretDown
            size={14}
            aria-hidden
            className={cx("shrink-0 text-tinta-tenue transition-transform duration-150", abierto && "rotate-180")}
          />
        </button>
        {extra ? <span className="flex shrink-0 items-center pr-2">{extra}</span> : null}
      </div>

      {abierto ? <div className="border-t border-linea">{desplegado}</div> : null}
    </li>
  );
}

function Aviso({ children }: { children: ReactNode }) {
  return <p className="px-4 py-6 text-center text-cuerpo text-tinta-tenue">{children}</p>;
}
