"use client";

import { useState } from "react";

import Cifra from "@/components/prueba/informe/Cifra";
import PanelAmenazas from "@/components/prueba/informe/PanelAmenazas";
import PanelCambios, {
  type Cambio,
} from "@/components/prueba/informe/PanelCambios";
import PanelEnfrentamientos from "@/components/prueba/informe/PanelEnfrentamientos";
import PanelRepeticion from "@/components/prueba/informe/PanelRepeticion";
import PanelResumen from "@/components/prueba/informe/PanelResumen";
import PanelSalidas from "@/components/prueba/informe/PanelSalidas";
import {
  letraDe,
  type Cuarteto,
  type Diagnostico,
  type ResultadoPrueba,
} from "@/simulation/prueba";
import type { Luchador } from "@/simulation/simulador";
import type { IndicePokemon } from "@/team/roster";
import Barra from "@/ui/Barra";
import Pestanias, { type Pestania } from "@/ui/Pestanias";

export type { Cambio };

// El informe de la prueba, que es la unica pantalla de resultados del Battle
// Bot. Arriba las seis cifras que resumen todo, y abajo las seis pestañas que
// lo abren: cada una vive en prueba/informe y contesta una pregunta distinta.

type Clave =
  | "resumen"
  | "enfrentamientos"
  | "amenazas"
  | "salidas"
  | "cambios"
  | "repeticion";

export default function InformePrueba({
  resultado,
  equipo,
  cuartetos,
  diagnostico,
  porSlug,
  cambio,
  corriendo,
  onProbarCambio,
}: {
  resultado: ResultadoPrueba;
  equipo: Luchador[];
  cuartetos: Cuarteto[];
  diagnostico: Diagnostico | null;
  porSlug: IndicePokemon;
  cambio: Cambio | null;
  corriendo: boolean;
  onProbarCambio: (i: number) => void;
}) {
  const [pestania, setPestania] = useState<Clave>("resumen");

  const pestanias: Pestania<Clave>[] = [
    {
      clave: "resumen",
      nombre: "Resumen",
      contenido: () => (
        <PanelResumen resultado={resultado} diagnostico={diagnostico} />
      ),
    },
    {
      clave: "enfrentamientos",
      nombre: "Enfrentamientos",
      contenido: () => <PanelEnfrentamientos resultado={resultado} />,
    },
    {
      clave: "amenazas",
      nombre: "Amenazas",
      contenido: () => <PanelAmenazas resultado={resultado} />,
    },
    {
      clave: "salidas",
      nombre: "Salidas",
      contenido: () => (
        <PanelSalidas resultado={resultado} cuartetos={cuartetos} />
      ),
    },
    {
      clave: "cambios",
      nombre: "Probar un cambio",
      contenido: () => (
        <PanelCambios
          equipo={equipo}
          indice={porSlug}
          cambio={cambio}
          corriendo={corriendo}
          onProbarCambio={onProbarCambio}
        />
      ),
    },
    {
      clave: "repeticion",
      nombre: "Repetición",
      contenido: () => (
        <PanelRepeticion
          resultado={resultado}
          equipo={equipo}
          indice={porSlug}
        />
      ),
    },
  ];

  return (
    <div aria-live="polite">
      <dl className="grid grid-cols-3 gap-px md:grid-cols-6 border-t border-linea bg-linea">
        <Cifra
          rotulo="Victorias"
          valor={`${resultado.porcentaje.toFixed(1)} %`}
          destacada
        />
        <Cifra rotulo="Letra" valor={letraDe(resultado.porcentaje)} destacada />
        <Cifra rotulo="Ganados" valor={String(resultado.ganados)} />
        <Cifra rotulo="Perdidos" valor={String(resultado.perdidos)} />
        <Cifra rotulo="Turnos" valor={resultado.turnosPromedio.toFixed(1)} />
        <Cifra
          rotulo="Sobreviven"
          valor={resultado.sobrevivientesPromedio.toFixed(1)}
        />
      </dl>

      <Barra
        valor={resultado.porcentaje}
        alto="grueso"
        etiqueta="Porcentaje de victorias"
        ubicacion="w-full"
      />

      {/* De donde salio el numero: cuantos combates, con que semilla y contra
          que. Va arriba de todo el detalle porque sin esto el porcentaje no se
          puede juzgar ni reproducir. */}
      <div className="border-t border-linea px-4 md:px-8 py-3">
        <p className="cifra text-apoyo text-tinta-tenue">
          {resultado.combates} combates · semilla {resultado.semilla} ·{" "}
          {resultado.distribucion
            .map((d) => `${d.fuente}: ${d.combates} (${d.equipos} equipos)`)
            .join(" · ")}
        </p>

        {resultado.faseExtra ? (
          <p className="mt-1 text-cuerpo text-tinta-media">
            Segunda vuelta: {resultado.faseExtra.combates} combates más contra{" "}
            {resultado.faseExtra.arquetipo}, con{" "}
            {resultado.faseExtra.porcentaje.toFixed(0)} % de victorias.
          </p>
        ) : null}
      </div>

      <div className="border-t border-linea px-4 md:px-8 py-3">
        <Pestanias
          pestanias={pestanias}
          activa={pestania}
          onCambiar={setPestania}
        />
      </div>
    </div>
  );
}
