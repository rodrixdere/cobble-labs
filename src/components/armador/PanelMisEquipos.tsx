"use client";

import { useState } from "react";

import {
  borrarEquipo,
  duplicarEquipo,
  listarEquipos,
  type EquipoGuardado,
} from "@/team/almacen";
import type { Conjunto } from "@/team/conjunto";
import type { IndicePokemon } from "@/team/roster";
import Boton from "@/ui/Boton";
import Modal from "@/ui/Modal";

// Los equipos guardados en este navegador. La lista se relee despues de cada
// cambio en vez de mantenerse en sincronia a mano: son pocos y salen de
// localStorage, asi que releer es mas simple que llevar dos copias.

type Props = {
  indice: IndicePokemon;
  onCargar: (equipo: EquipoGuardado) => void;
  onCerrar: () => void;
};

export default function PanelMisEquipos({ indice, onCargar, onCerrar }: Props) {
  const [equipos, setEquipos] = useState<EquipoGuardado[]>(listarEquipos);

  const nombres = (miembros: Conjunto[]) =>
    miembros.map((m) => indice.get(m.slug)?.nombre ?? m.slug).join(", ");

  return (
    <Modal titulo="Mis equipos" onCerrar={onCerrar}>
      {equipos.length === 0 ? (
        <p className="px-5 py-10 text-center text-lectura text-tinta-tenue">
          Todavía no guardaste ninguno.
        </p>
      ) : (
        <ul className="divide-y divide-linea">
          {equipos.map((e) => (
            <li key={e.id} className="flex items-center gap-4 px-5 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lectura font-semibold">
                  {e.nombre}
                </span>
                <span className="block truncate text-apoyo text-tinta-tenue">
                  {nombres(e.miembros)}
                </span>
              </span>

              <Boton
                variante="contorno"
                onClick={() => onCargar(e)}
                ubicacion="shrink-0"
              >
                Cargar
              </Boton>
              <Boton
                variante="enlace"
                onClick={() => {
                  duplicarEquipo(e.id);
                  setEquipos(listarEquipos());
                }}
                ubicacion="shrink-0"
              >
                Duplicar
              </Boton>
              <Boton
                variante="enlace"
                alarma
                onClick={() => {
                  borrarEquipo(e.id);
                  setEquipos(listarEquipos());
                }}
                ubicacion="shrink-0"
              >
                Borrar
              </Boton>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
