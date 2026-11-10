"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ErrorDeApi, borrarCuenta } from "@/comunidad/api";
import Aviso from "@/ui/Aviso";
import Boton from "@/ui/Boton";
import { Campo } from "@/ui/Campo";
import Modal from "@/ui/Modal";

// Borrar la cuenta pide escribir el nombre: es lo unico del sitio que no tiene
// vuelta atras, y un click suelto no alcanza.

export default function ModalBorrarCuenta({ nombre, onCerrar }: { nombre: string; onCerrar: () => void }) {
  const router = useRouter();
  const [escrito, setEscrito] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const borrar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await borrarCuenta(escrito);
      onCerrar();
      router.push("/");
    } catch (e) {
      setError(e instanceof ErrorDeApi ? e.message : "Algo falló. Probá de nuevo.");
      setEnviando(false);
    }
  };

  return (
    <Modal titulo="Borrar mi cuenta" ancho="angosto" onCerrar={onCerrar}>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      <div className="space-y-4 px-5 py-5">
        <p className="text-lectura text-tinta-media">
          Se borran tu cuenta, tus sesiones y todos los equipos que publicaste. No se puede
          deshacer.
        </p>
        <Campo
          rotulo={`Escribí "${nombre}" para confirmar`}
          value={escrito}
          autoComplete="off"
          onChange={(e) => setEscrito(e.target.value)}
        />
        <Boton
          variante="principal"
          alarma
          disabled={escrito !== nombre || enviando}
          onClick={borrar}
        >
          {enviando ? "Borrando…" : "Borrar mi cuenta"}
        </Boton>
      </div>
    </Modal>
  );
}
