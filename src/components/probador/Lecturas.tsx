import type { ReactNode } from "react";

import type { Cruce } from "@/simulation/cruce";

// Las conclusiones del cruce en castellano. Cada una sale de un numero que se
// acaba de correr y solo aparece si ese numero dice algo: si la salida no
// cambia nada, se dice que no cambia nada, y no se rellena con una frase.

function Nombre({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-tinta">{children}</span>;
}

export default function Lecturas({ cruce }: { cruce: Cruce }) {
  const { salidas, impacto, serie, equipoA, equipoB, porcentajeA } = cruce;

  const mejor = salidas[0];
  const peor = salidas[salidas.length - 1];
  const brecha = mejor && peor ? mejor.porcentaje - peor.porcentaje : 0;

  const sostiene = impacto[0];
  const sobra = impacto[impacto.length - 1];

  // Veinte puntos entre la mejor y la peor salida es donde deja de ser ruido y
  // pasa a ser una decision que cambia el cruce.
  const laSalidaDefine = brecha >= 20;
  const parejo = porcentajeA > 43 && porcentajeA < 57;

  return (
    <ul className="mt-5 grid grid-cols-2 gap-x-10 gap-y-2.5 text-lectura text-tinta-media">
      {mejor ? (
        <li>
          Conviene abrir con <Nombre>{mejor.nombre}</Nombre>:{" "}
          {mejor.porcentaje.toFixed(0)} % contra los {peor.porcentaje.toFixed(0)}{" "}
          % de {peor.nombre}.
        </li>
      ) : null}

      <li>
        {laSalidaDefine
          ? `La salida define el cruce: hay ${brecha.toFixed(0)} puntos entre la mejor y la peor.`
          : `La salida no cambia mucho: entre la mejor y la peor hay ${brecha.toFixed(0)} puntos.`}
      </li>

      {sostiene && sostiene.caida > 3 ? (
        <li>
          <Nombre>{sostiene.nombre}</Nombre> es el que sostiene el equipo: sin él
          caés {sostiene.caida.toFixed(1)} puntos.
        </li>
      ) : null}

      {sobra && sobra.caida < 0 ? (
        <li>
          Sacar a <Nombre>{sobra.nombre}</Nombre> te deja mejor: te suma{" "}
          {Math.abs(sobra.caida).toFixed(1)} puntos contra este rival.
        </li>
      ) : null}

      <li>
        Sobre {serie.combates} combates quedaron{" "}
        {(equipoA.length - serie.caidosPromedioA).toFixed(1)} de {equipoA.length}{" "}
        en pie de un lado y{" "}
        {(equipoB.length - serie.caidosPromedioB).toFixed(1)} de {equipoB.length}{" "}
        del otro.
      </li>

      {parejo ? (
        <li>
          Está tan parejo que un solo cambio de objeto o de naturaleza puede
          darlo vuelta.
        </li>
      ) : null}
    </ul>
  );
}
