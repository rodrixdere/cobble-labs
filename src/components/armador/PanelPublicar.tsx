"use client";

import { useCallback, useMemo, useState } from "react";

import ModalEntrar from "@/components/comunidad/ModalEntrar";
import Turnstile from "@/components/comunidad/Turnstile";
import { ErrorDeApi, publicarEquipo } from "@/comunidad/api";
import { problemasParaPublicar } from "@/comunidad/publicacion";
import { useSesion } from "@/comunidad/sesion";
import type { MovimientoCatalogo } from "@/team/combate";
import type { Conjunto } from "@/team/conjunto";
import { aCadena } from "@/team/formato";
import type { IndicePokemon } from "@/team/roster";
import Aviso from "@/ui/Aviso";
import Boton from "@/ui/Boton";
import { Campo } from "@/ui/Campo";
import Modal from "@/ui/Modal";

// Publicar el equipo del armador. Las reglas se muestran antes de mandar nada,
// con el mismo codigo que las vuelve a revisar el Worker.

type Props = {
  conjuntos: Conjunto[];
  indice: IndicePokemon;
  catalogo: MovimientoCatalogo[];
  nombreInicial: string;
  onPublicado: (mensaje: string) => void;
  onCerrar: () => void;
};

// El nombre que trae el armador de fabrica no dice nada: mejor que lo escriba.
const NOMBRE_DE_FABRICA = "Mi equipo";

export default function PanelPublicar({
  conjuntos,
  indice,
  catalogo,
  nombreInicial,
  onPublicado,
  onCerrar,
}: Props) {
  const sesion = useSesion();
  const [nombre, setNombre] = useState(nombreInicial === NOMBRE_DE_FABRICA ? "" : nombreInicial);
  const [token, setToken] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<{ mensaje: string; problemas: string[] } | null>(null);

  const problemas = useMemo(
    () => problemasParaPublicar(nombre, conjuntos, indice, catalogo),
    [nombre, conjuntos, indice, catalogo]
  );
  const alToken = useCallback((t: string | null) => setToken(t), []);

  if (!sesion) {
    return (
      <ModalEntrar
        motivo="Para publicar un equipo tenés que entrar. Así solo vos lo podés borrar."
        onCerrar={onCerrar}
      />
    );
  }

  const publicar = async () => {
    if (!token) return;
    setEnviando(true);
    setError(null);
    try {
      await publicarEquipo(nombre, aCadena(conjuntos), token);
      onPublicado(`"${nombre.trim()}" ya está en Comunidad.`);
    } catch (e) {
      setError(
        e instanceof ErrorDeApi
          ? { mensaje: e.message, problemas: e.problemas }
          : { mensaje: "Algo falló. Probá de nuevo.", problemas: [] }
      );
      // El token de Turnstile ya se gasto: hace falta uno nuevo.
      setToken(null);
      setIntento((n) => n + 1);
      setEnviando(false);
    }
  };

  return (
    <Modal
      titulo="Publicar en la comunidad"
      ancho="angosto"
      onCerrar={onCerrar}
      pie={
        <div className="flex flex-wrap items-center gap-3 px-5 py-3">
          <Boton
            variante="principal"
            disabled={problemas.length > 0 || !token || enviando}
            onClick={publicar}
          >
            {enviando ? "Publicando…" : "Publicar"}
          </Boton>
          <span className="text-apoyo text-tinta-tenue">Publicás como {sesion.nombre}</span>
        </div>
      }
    >
      {error ? <Aviso tono="error">{error.mensaje}</Aviso> : null}

      <div className="space-y-4 px-5 py-5">
        <p className="text-lectura text-tinta-media">
          Va a aparecer en Comunidad con tu nombre. Un equipo publicado no se edita: si lo
          cambiás, borralo y publicalo de nuevo.
        </p>

        <Campo
          rotulo="Nombre del equipo"
          value={nombre}
          maxLength={40}
          onChange={(e) => setNombre(e.target.value)}
        />

        {[...problemas, ...(error?.problemas ?? [])].length > 0 ? (
          <ul className="space-y-1">
            {[...new Set([...problemas, ...(error?.problemas ?? [])])].map((p) => (
              <li key={p} className="text-cuerpo text-ambar">
                {p}
              </li>
            ))}
          </ul>
        ) : null}

        <Turnstile key={intento} onToken={alToken} />
      </div>
    </Modal>
  );
}
