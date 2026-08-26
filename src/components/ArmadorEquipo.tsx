"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import BuscadorFlotante from "@/components/BuscadorFlotante";
import EditorConjunto from "@/components/EditorConjunto";
import AnalisisEquipo from "@/components/armador/AnalisisEquipo";
import BarraAcciones from "@/components/armador/BarraAcciones";
import HuecoDelEquipo, { HuecoVacio } from "@/components/armador/HuecoDelEquipo";
import PanelExportar from "@/components/armador/PanelExportar";
import PanelImportar from "@/components/armador/PanelImportar";
import PanelMisEquipos from "@/components/armador/PanelMisEquipos";
import Recomendaciones, {
  Optimizacion,
} from "@/components/armador/Recomendaciones";
import SeccionPendientes from "@/components/armador/SeccionPendientes";
import { analizarEquipo } from "@/analysis/equipo";
import {
  amenazasContra,
  estadoDelEquipo,
  optimizar,
  recomendar,
  type Criterio,
} from "@/recommendations/motor";
import { guardarActual, guardarEquipo } from "@/team/almacen";
import type { MovimientoCatalogo, PokemonCombate } from "@/team/combate";
import { armarEquipo, indexarRoster } from "@/team/roster";
import { useEquipo } from "@/team/useEquipo";
import { fallasDe, hayErrores, validarEquipo, MAXIMO_MIEMBROS } from "@/team/validador";
import Aviso from "@/ui/Aviso";
import { Campo } from "@/ui/Campo";

// El armador. Este archivo solo decide QUE se muestra y en que orden; el como
// se dibuja cada parte vive en components/armador, y el estado del equipo (con
// su guardado y su enlace compartible) vive en useEquipo.
//
// La regla que ordena la pantalla: mientras faltan miembros se recomienda a
// quien sumar, y con los seis puestos se pasa a proponer cambios. Son dos
// preguntas distintas y no tiene sentido contestar las dos a la vez.

type Panel = "misEquipos" | "importar" | "exportar";

export default function ArmadorEquipo({
  roster,
  catalogo,
}: {
  roster: PokemonCombate[];
  catalogo: MovimientoCatalogo[];
}) {
  const router = useRouter();
  const indice = useMemo(() => indexarRoster(roster), [roster]);
  const equipo = useEquipo(indice, catalogo);
  const { conjuntos } = equipo;

  const [nombre, setNombre] = useState("Mi equipo");
  const [criterio, setCriterio] = useState<Criterio>("general");
  const [eligiendo, setEligiendo] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const miembros = useMemo(
    () => armarEquipo(conjuntos, indice, catalogo),
    [conjuntos, indice, catalogo]
  );

  const analisis = useMemo(() => analizarEquipo(miembros), [miembros]);
  const amenazas = useMemo(
    () => amenazasContra(miembros, roster, catalogo, 6),
    [miembros, roster, catalogo]
  );
  const fallas = useMemo(
    () => validarEquipo(conjuntos, indice, catalogo),
    [conjuntos, indice, catalogo]
  );

  const recomendaciones = useMemo(
    () =>
      equipo.completo
        ? []
        : recomendar(miembros, roster, catalogo, criterio, 5, analisis),
    [equipo.completo, miembros, roster, catalogo, criterio, analisis]
  );

  const reemplazos = useMemo(
    () =>
      equipo.completo ? optimizar(miembros, roster, catalogo, criterio) : [],
    [equipo.completo, miembros, roster, catalogo, criterio]
  );

  const estado = estadoDelEquipo(conjuntos.length);

  const compartir = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setAviso("Enlace copiado: quien lo abra ve este equipo con sus sets.");
    } catch {
      setAviso("No se pudo copiar. La dirección de la página ya tiene el equipo.");
    }
  };

  const probarEnBattleBot = () => {
    guardarActual(conjuntos);
    router.push("/battle-bot?herramienta=prueba");
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 px-8 pb-5 pt-9">
        <div>
          <h1 className="font-display text-portada">Equipos</h1>
          <p className="mt-3 max-w-[62ch] text-realce leading-relaxed text-tinta-media">
            Armá los seis y el sistema va diciendo qué le falta al equipo y quién
            lo tapa. Cada recomendación explica por qué mejora este equipo, no
            por qué es bueno en general.
          </p>
        </div>

        <Campo
          rotulo="Nombre del equipo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          ubicacion="w-[260px]"
        />
      </div>

      <ul className="grid grid-cols-6 gap-px border-y border-linea bg-linea">
        {Array.from({ length: MAXIMO_MIEMBROS }, (_, i) => {
          const conjunto = conjuntos[i];
          const pokemon = conjunto ? indice.get(conjunto.slug) : undefined;

          if (!conjunto || !pokemon) {
            return <HuecoVacio key={`hueco-${i}`} onElegir={() => setEligiendo(true)} />;
          }

          return (
            <HuecoDelEquipo
              key={conjunto.slug}
              pokemon={pokemon}
              conjunto={conjunto}
              fallas={fallasDe(fallas, i)}
              onEditar={() => setEditando(i)}
              onQuitar={() => equipo.quitar(i)}
            />
          );
        })}
      </ul>

      <BarraAcciones
        vacio={conjuntos.length === 0}
        onCompartir={compartir}
        onGuardar={() => {
          guardarEquipo(nombre, conjuntos);
          setAviso(`Guardado como "${nombre}".`);
        }}
        onMisEquipos={() => setPanel("misEquipos")}
        onImportar={() => setPanel("importar")}
        onExportar={() => setPanel("exportar")}
        onVaciar={equipo.vaciar}
        onProbar={probarEnBattleBot}
      />

      {aviso ? <Aviso>{aviso}</Aviso> : null}

      {hayErrores(fallas)
        ? fallas
            .filter((f) => f.gravedad === "error")
            .map((f) => (
              <Aviso key={f.regla + f.indice} tono="error">
                {f.mensaje}
              </Aviso>
            ))
        : null}

      {equipo.completo ? (
        <section className="border-t border-linea">
          <div className="px-8 pb-4 pt-6">
            <h2 className="font-display text-titulo">Optimización del equipo</h2>
            <p className="mt-1 max-w-[70ch] text-lectura text-tinta-media">
              {estado.detalle} Cada cambio se mide contra la sinergia actual:
              solo aparecen los que la suben.
            </p>
          </div>
          <Optimizacion
            reemplazos={reemplazos}
            onCambiar={(r) => {
              const i = conjuntos.findIndex((c) => c.slug === r.sale.pokemon.slug);
              if (i >= 0) equipo.reemplazar(i, r.entra.conjunto);
            }}
          />
        </section>
      ) : (
        <Recomendaciones
          recomendaciones={recomendaciones}
          criterio={criterio}
          onCriterio={setCriterio}
          onAgregar={(r) => equipo.sumar(r.conjunto)}
          titulo={estado.titulo}
          detalle={estado.detalle}
        />
      )}

      {miembros.length > 0 ? (
        <AnalisisEquipo analisis={analisis} amenazas={amenazas} />
      ) : null}

      <SeccionPendientes />

      {eligiendo ? (
        <BuscadorFlotante
          roster={roster}
          onCerrar={() => setEligiendo(false)}
          onElegir={(slug) => {
            setAviso(equipo.agregar(slug));
            setEligiendo(false);
          }}
        />
      ) : null}

      {editando !== null && conjuntos[editando] ? (
        <EditorConjunto
          pokemon={indice.get(conjuntos[editando].slug)!}
          catalogo={catalogo}
          conjunto={conjuntos[editando]}
          onCambiar={(c) => equipo.reemplazar(editando, c)}
          onQuitar={() => {
            equipo.quitar(editando);
            setEditando(null);
          }}
          onCerrar={() => setEditando(null)}
        />
      ) : null}

      {panel === "misEquipos" ? (
        <PanelMisEquipos
          indice={indice}
          onCargar={(e) => {
            equipo.cargar(e.miembros);
            setNombre(e.nombre);
            setPanel(null);
          }}
          onCerrar={() => setPanel(null)}
        />
      ) : null}

      {panel === "importar" ? (
        <PanelImportar
          roster={roster}
          catalogo={catalogo}
          onImportado={equipo.cargar}
          onCerrar={() => setPanel(null)}
        />
      ) : null}

      {panel === "exportar" ? (
        <PanelExportar
          conjuntos={conjuntos}
          indice={indice}
          catalogo={catalogo}
          onCopiado={setAviso}
          onCerrar={() => setPanel(null)}
        />
      ) : null}
    </>
  );
}
