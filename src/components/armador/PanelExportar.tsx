"use client";

import type { MovimientoCatalogo } from "@/team/combate";
import type { Conjunto } from "@/team/conjunto";
import { exportarEquipo } from "@/team/formato";
import type { IndicePokemon } from "@/team/roster";
import Boton from "@/ui/Boton";
import { AreaTexto } from "@/ui/Campo";
import Modal from "@/ui/Modal";

type Props = {
  conjuntos: Conjunto[];
  indice: IndicePokemon;
  catalogo: MovimientoCatalogo[];
  onCopiado: (aviso: string) => void;
  onCerrar: () => void;
};

export default function PanelExportar({
  conjuntos,
  indice,
  catalogo,
  onCopiado,
  onCerrar,
}: Props) {
  const texto = exportarEquipo(conjuntos, indice, catalogo);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      onCopiado("Equipo copiado al portapapeles.");
      onCerrar();
    } catch {
      onCopiado("No se pudo copiar. El texto está acá abajo para copiarlo a mano.");
    }
  };

  return (
    <Modal titulo="Exportar el equipo" onCerrar={onCerrar}>
      <div className="px-5 py-4">
        <AreaTexto
          rotulo="Equipo exportado"
          mono
          readOnly
          rows={14}
          value={texto}
        />
        <Boton variante="principal" onClick={copiar} ubicacion="mt-3">
          Copiar
        </Boton>
      </div>
    </Modal>
  );
}
