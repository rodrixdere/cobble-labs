"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import InformePrueba, { type Cambio } from "@/components/prueba/InformePrueba";
import PanelDeConfiguracion, {
  type Corrida,
} from "@/components/prueba/PanelDeConfiguracion";
import TuEquipo from "@/components/prueba/TuEquipo";
import { recomendar } from "@/recommendations/motor";
import { crearAzar, semillaNueva } from "@/simulation/azar";
import {
  armarPool,
  compararPruebas,
  diagnosticar,
  FUENTES_POR_DEFECTO,
  mejoresCuartetos,
  probarEquipo,
  type Cuarteto,
  type ResultadoPrueba,
} from "@/simulation/prueba";
import { leerActual, listarEquipos } from "@/team/almacen";
import type { MovimientoCatalogo, PokemonCombate } from "@/team/combate";
import type { Conjunto } from "@/team/conjunto";
import { armarBando, armarEquipo, indexarRoster, rehidratar } from "@/team/roster";

// La prueba automatica del equipo contra un pool de rivales. Toda la simulacion
// vive en simulation/prueba: aca queda que equipo se prueba, con que
// configuracion, y el guardado de las ultimas corridas.

/** Cuantas corridas se recuerdan para poder volver a una semilla. */
const CORRIDAS_RECORDADAS = 5;

/** Cuantos cuartetos se muestran de los que se midieron. */
const CUARTETOS_MOSTRADOS = 4;

export default function PruebaEquipo({
  roster,
  catalogo,
}: {
  roster: PokemonCombate[];
  catalogo: MovimientoCatalogo[];
}) {
  const indice = useMemo(() => indexarRoster(roster), [roster]);

  const [conjuntos, setConjuntos] = useState<Conjunto[]>([]);
  const [combates, setCombates] = useState(100);
  const [fuentes, setFuentes] = useState(FUENTES_POR_DEFECTO);
  const [adaptativo, setAdaptativo] = useState(true);
  const [semilla, setSemilla] = useState(semillaNueva);
  const [resultado, setResultado] = useState<ResultadoPrueba | null>(null);
  const [cuartetos, setCuartetos] = useState<Cuarteto[]>([]);
  const [cambio, setCambio] = useState<Cambio | null>(null);
  const [historial, setHistorial] = useState<Corrida[]>([]);
  const [corriendo, empezar] = useTransition();

  const traerDelArmador = () => rehidratar(leerActual(), indice, catalogo);

  // El equipo del armador se carga solo al abrir la herramienta. Va en un
  // efecto y no en el render porque localStorage no existe en el servidor.
  useEffect(() => {
    setConjuntos(traerDelArmador());
    // Solo al montar: despues el usuario decide cuando volver a cargarlo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recargar = () => {
    setConjuntos(traerDelArmador());
    setResultado(null);
    setCambio(null);
  };

  const equipo = useMemo(
    () => armarBando(conjuntos, indice, catalogo),
    [conjuntos, indice, catalogo]
  );

  const guardados = useMemo(
    () => listarEquipos().map((e) => ({ nombre: e.nombre, miembros: e.miembros })),
    []
  );

  // El pool se arma con su propio azar derivado de la semilla, para que la
  // misma semilla de los mismos rivales ademas de los mismos combates.
  const armarPoolDeRivales = () =>
    armarPool(
      fuentes,
      roster,
      catalogo,
      crearAzar(semilla ^ 0x5f3759df),
      guardados,
      indice
    );

  const correr = () => {
    empezar(() => {
      const pool = armarPoolDeRivales();
      const r = probarEquipo(equipo, pool, combates, semilla, adaptativo);

      setResultado(r);
      setCuartetos(
        mejoresCuartetos(equipo, pool, 4, semilla).slice(0, CUARTETOS_MOSTRADOS)
      );
      setCambio(null);
      setHistorial((previas) =>
        [
          { semilla: r.semilla, combates: r.combates, porcentaje: r.porcentaje },
          ...previas,
        ].slice(0, CORRIDAS_RECORDADAS)
      );
    });
  };

  // Probar un reemplazo: se corre la misma prueba con el equipo modificado y se
  // comparan las dos. La mejora sale de esa segunda simulacion, no de estimarla.
  const probarCambio = (indiceQueSale: number) => {
    empezar(() => {
      const sinEl = conjuntos.filter((_, i) => i !== indiceQueSale);
      const [sugerido] = recomendar(
        armarEquipo(sinEl, indice, catalogo),
        roster,
        catalogo,
        "general",
        1
      );
      if (!sugerido) return;

      const pool = armarPoolDeRivales();
      const equipoNuevo = armarBando(
        [...sinEl, sugerido.conjunto],
        indice,
        catalogo
      );

      // Sin la segunda vuelta adaptativa: las dos corridas tienen que ver
      // exactamente el mismo pool para que la comparacion signifique algo.
      const antes =
        resultado ?? probarEquipo(equipo, pool, combates, semilla, false);
      const despues = probarEquipo(equipoNuevo, pool, combates, semilla, false);

      setCambio({
        sale: conjuntos[indiceQueSale].slug,
        entra: sugerido.pokemon.slug,
        comparacion: compararPruebas(antes, despues),
      });
    });
  };

  return (
    <div className="border-t border-linea">
      <div className="grid gap-px bg-linea lg:grid-cols-[1fr_340px]">
        <TuEquipo equipo={equipo} indice={indice} onRecargar={recargar} />

        <PanelDeConfiguracion
          fuentes={fuentes}
          onFuentes={setFuentes}
          cuantosGuardados={guardados.length}
          combates={combates}
          onCombates={setCombates}
          adaptativo={adaptativo}
          onAdaptativo={setAdaptativo}
          semilla={semilla}
          onSemilla={setSemilla}
          historial={historial}
          listo={equipo.length > 0}
          corriendo={corriendo}
          onCorrer={correr}
        />
      </div>

      {resultado ? (
        <InformePrueba
          resultado={resultado}
          equipo={equipo}
          cuartetos={cuartetos}
          diagnostico={diagnosticar(resultado, equipo)}
          porSlug={indice}
          cambio={cambio}
          corriendo={corriendo}
          onProbarCambio={probarCambio}
        />
      ) : null}
    </div>
  );
}
