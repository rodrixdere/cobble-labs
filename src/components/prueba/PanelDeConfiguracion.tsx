"use client";

import { Play } from "@phosphor-icons/react";

import FuenteDeRivales from "@/components/prueba/FuenteDeRivales";
import { semillaNueva } from "@/simulation/azar";
import { TAMANOS, type Fuentes } from "@/simulation/prueba";
import Boton from "@/ui/Boton";
import { Campo } from "@/ui/Campo";
import { cx } from "@/ui/clases";
import Opcion from "@/ui/Opcion";

// Contra quien, cuantas veces y con que semilla. Todo lo que decide la prueba
// esta en esta columna, y nada de lo que hay aca calcula: solo junta la
// configuracion y avisa cuando se toca Probar.

export type Corrida = {
  semilla: number;
  combates: number;
  porcentaje: number;
};

type Props = {
  fuentes: Fuentes;
  onFuentes: (f: Fuentes) => void;
  cuantosGuardados: number;
  combates: number;
  onCombates: (n: number) => void;
  adaptativo: boolean;
  onAdaptativo: (v: boolean) => void;
  semilla: number;
  onSemilla: (n: number) => void;
  historial: Corrida[];
  listo: boolean;
  corriendo: boolean;
  onCorrer: () => void;
};

export default function PanelDeConfiguracion({
  fuentes,
  onFuentes,
  cuantosGuardados,
  combates,
  onCombates,
  adaptativo,
  onAdaptativo,
  semilla,
  onSemilla,
  historial,
  listo,
  corriendo,
  onCorrer,
}: Props) {
  const alternar = (clave: keyof Fuentes) =>
    onFuentes({ ...fuentes, [clave]: !fuentes[clave] });

  return (
    <div className="bg-panel px-6 py-6">
      <h2 className="rotulo border-b border-linea pb-2">Contra quién</h2>

      <ul className="mt-3 space-y-2">
        <FuenteDeRivales
          puesta={fuentes.arquetipos}
          onCambiar={() => alternar("arquetipos")}
          nombre="Arquetipos"
          detalle="18 equipos: dos de cada estrategia, armados con Pokémon que de verdad pueden hacerla"
          origen="generado"
        />
        <FuenteDeRivales
          puesta={fuentes.aleatorios}
          onCambiar={() => alternar("aleatorios")}
          nombre="Aleatorios legales"
          detalle="8 equipos al azar que cumplen las reglas, mitad de los fuertes y mitad de todo el roster"
          origen="generado"
        />
        <FuenteDeRivales
          puesta={fuentes.propios}
          onCambiar={() => alternar("propios")}
          nombre="Tus equipos guardados"
          detalle={
            cuantosGuardados > 0
              ? `${cuantosGuardados} guardados en este navegador`
              : "No tenés ninguno guardado todavía"
          }
          origen="real"
          deshabilitada={cuantosGuardados === 0}
        />
      </ul>

      <label className="mt-3 flex items-start gap-2 border-t border-linea pt-3">
        <input
          type="checkbox"
          checked={fuentes.sinRestringidos}
          onChange={() => alternar("sinRestringidos")}
          className="mt-0.5 accent-acento"
        />
        <span className="text-cuerpo leading-snug text-tinta-media">
          Sin legendarios ni restringidos, usando las etiquetas del propio jar.
          Si los dejás entrar, cada rival lleva como mucho uno. Los rivales
          usan solo la última etapa de cada línea y una mega como máximo.
        </span>
      </label>

      <div className="mt-5 border-t border-linea pt-4">
        <h3 className="rotulo">Cuántos combates</h3>
        <div className="mt-2 flex flex-wrap gap-1">
          {TAMANOS.map((t) => (
            <Opcion
              key={t.combates}
              mono
              puesta={combates === t.combates}
              onElegir={() => onCombates(t.combates)}
            >
              {t.combates}
            </Opcion>
          ))}
        </div>
      </div>

      <label className="mt-4 flex items-start gap-2">
        <input
          type="checkbox"
          checked={adaptativo}
          onChange={() => onAdaptativo(!adaptativo)}
          className="mt-0.5 accent-acento"
        />
        <span className="text-cuerpo leading-snug text-tinta-media">
          Segunda vuelta contra el arquetipo donde peor le vaya, para que el
          número no dependa de dos partidas sueltas.
        </span>
      </label>

      <div className="mt-4 flex items-end gap-2">
        <Campo
          rotulo="Semilla"
          inputMode="numeric"
          value={semilla}
          onChange={(e) => onSemilla(Number(e.target.value) || 0)}
          ubicacion="flex-1"
        />
        <Boton variante="contorno" onClick={() => onSemilla(semillaNueva())}>
          Otra
        </Boton>
      </div>
      <p className="mt-1.5 text-apoyo leading-snug text-tinta-tenue">
        La misma semilla devuelve exactamente la misma prueba.
      </p>

      {historial.length > 0 ? (
        <>
          <h3 className="rotulo mt-5 border-t border-linea pt-4">Corridas</h3>
          <ul className="mt-2 divide-y divide-linea">
            {historial.map((c) => (
              <li key={c.semilla} className="flex items-baseline gap-3 py-1.5">
                <button
                  type="button"
                  onClick={() => onSemilla(c.semilla)}
                  title="Volver a usar esta semilla"
                  className="cifra min-w-0 flex-1 truncate text-left text-menuda text-tinta-tenue underline underline-offset-4 hover:text-tinta"
                >
                  {c.semilla}
                </button>
                <span className="cifra shrink-0 text-menuda text-tinta-tenue">
                  {c.combates}
                </span>
                <span
                  className={cx(
                    "cifra shrink-0 text-cuerpo font-bold",
                    c.porcentaje >= 50 ? "text-acento-hondo" : "text-alarma"
                  )}
                >
                  {c.porcentaje.toFixed(1)} %
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <Boton
        variante="principal"
        onClick={onCorrer}
        disabled={!listo || corriendo}
        ubicacion="mt-5 w-full justify-center py-2.5"
      >
        <Play size={13} weight="fill" aria-hidden />
        {corriendo ? "Simulando…" : `Probar el equipo (${combates})`}
      </Boton>
    </div>
  );
}
