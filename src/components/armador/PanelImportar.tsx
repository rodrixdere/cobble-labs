"use client";

import { useState } from "react";

import type { MovimientoCatalogo, PokemonCombate } from "@/team/combate";
import type { Conjunto } from "@/team/conjunto";
import { importarEquipo } from "@/team/formato";
import Boton from "@/ui/Boton";
import { AreaTexto } from "@/ui/Campo";
import Modal from "@/ui/Modal";

// Importar en formato Showdown. Los problemas se muestran y el panel queda
// abierto: si algo del equipo pegado no cerro, el usuario tiene que ver que
// fue, no encontrarse con un equipo incompleto y sin explicacion.

type Props = {
  roster: PokemonCombate[];
  catalogo: MovimientoCatalogo[];
  onImportado: (conjuntos: Conjunto[]) => void;
  onCerrar: () => void;
};

export default function PanelImportar({
  roster,
  catalogo,
  onImportado,
  onCerrar,
}: Props) {
  const [texto, setTexto] = useState("");
  const [problemas, setProblemas] = useState<string[]>([]);

  const importar = () => {
    const { conjuntos, problemas: fallos } = importarEquipo(
      texto,
      roster,
      catalogo
    );
    setProblemas(fallos);
    if (conjuntos.length === 0) return;

    onImportado(conjuntos);
    if (fallos.length === 0) onCerrar();
  };

  return (
    <Modal titulo="Importar un equipo" onCerrar={onCerrar}>
      <div className="px-5 py-4">
        <p className="text-cuerpo leading-relaxed text-tinta-media">
          Pegá un equipo en formato Showdown, con los nombres en español del
          juego. Se valida contra el roster del servidor: lo que no cierre se
          avisa.
        </p>

        <AreaTexto
          rotulo="Equipo a importar"
          mono
          rows={12}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          ubicacion="mt-3"
        />

        {problemas.length > 0 ? (
          <ul className="mt-3 space-y-1">
            {problemas.map((p) => (
              <li key={p} className="text-cuerpo text-alarma">
                {p}
              </li>
            ))}
          </ul>
        ) : null}

        <Boton
          variante="principal"
          onClick={importar}
          disabled={texto.trim() === ""}
          ubicacion="mt-3"
        >
          Importar
        </Boton>
      </div>
    </Modal>
  );
}
