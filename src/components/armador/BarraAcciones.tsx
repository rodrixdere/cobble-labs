"use client";

import {
  ArrowSquareOut,
  Copy,
  DownloadSimple,
  FloppyDisk,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";

import Boton from "@/ui/Boton";

// La barra de acciones sobre el equipo. Todo lo que necesita un equipo cargado
// queda deshabilitado mientras no lo haya, salvo Importar y Mis equipos, que
// son justamente las dos formas de conseguir uno.

type Props = {
  vacio: boolean;
  onCompartir: () => void;
  onGuardar: () => void;
  onMisEquipos: () => void;
  onImportar: () => void;
  onExportar: () => void;
  onVaciar: () => void;
  onProbar: () => void;
};

export default function BarraAcciones({
  vacio,
  onCompartir,
  onGuardar,
  onMisEquipos,
  onImportar,
  onExportar,
  onVaciar,
  onProbar,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-linea px-8 py-3">
      <Boton onClick={onCompartir} disabled={vacio}>
        <Copy size={13} aria-hidden />
        Compartir
      </Boton>
      <Boton onClick={onGuardar} disabled={vacio}>
        <FloppyDisk size={13} aria-hidden />
        Guardar
      </Boton>
      <Boton onClick={onMisEquipos}>Mis equipos</Boton>
      <Boton onClick={onImportar}>
        <UploadSimple size={13} aria-hidden />
        Importar
      </Boton>
      <Boton onClick={onExportar} disabled={vacio}>
        <DownloadSimple size={13} aria-hidden />
        Exportar
      </Boton>
      <Boton onClick={onVaciar} disabled={vacio} alarma>
        <Trash size={13} aria-hidden />
        Vaciar
      </Boton>

      <Boton
        variante="principal"
        onClick={onProbar}
        disabled={vacio}
        ubicacion="ml-auto"
      >
        <ArrowSquareOut size={13} aria-hidden />
        Probar mi equipo
      </Boton>
    </div>
  );
}
