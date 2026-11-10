"use client";

import { SignIn, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

import ModalBorrarCuenta from "@/components/comunidad/ModalBorrarCuenta";
import ModalEntrar from "@/components/comunidad/ModalEntrar";
import { salirDeLaCuenta } from "@/comunidad/api";
import { useSesion } from "@/comunidad/sesion";
import { COMUNIDAD_ACTIVA } from "@/data/sitio";
import Boton from "@/ui/Boton";
import Desplegable from "@/ui/Desplegable";

// La cuenta en la cabecera: "Entrar" si no hay nadie, y el nombre con su menu
// si ya entro. Saber quien entro no le pregunta nada al Worker.

const ITEM = "block px-4 py-2.5 text-lectura text-tinta-media hover:bg-hueco hover:text-tinta";

export default function Cuenta() {
  const sesion = useSesion();
  const [modal, setModal] = useState<"entrar" | "borrar" | null>(null);

  if (!COMUNIDAD_ACTIVA) return null;

  return (
    <div className="flex shrink-0 items-center pl-2 lg:ml-auto">
      {sesion ? (
        <Desplegable
          titulo={`Cuenta de ${sesion.nombre}`}
          lado="derecha"
          panel="w-[220px] py-1"
          boton="flex h-9 items-center gap-1.5 rounded-pieza px-2 text-lectura text-tinta-media hover:bg-hueco hover:text-tinta"
          etiqueta={
            <>
              <UserCircle size={18} aria-hidden />
              {/* El nombre solo donde sobra lugar: con la tira completa, abajo de xl no entra. */}
              <span className="hidden max-w-[140px] truncate xl:inline">{sesion.nombre}</span>
            </>
          }
        >
          {(cerrar) => (
            <div>
              <Link href="/comunidad?ver=mios" prefetch={false} onClick={cerrar} className={ITEM}>
                Mis equipos publicados
              </Link>
              <Boton
                ubicacion="w-full"
                onClick={() => {
                  cerrar();
                  salirDeLaCuenta().catch(() => {});
                }}
              >
                Salir
              </Boton>
              <Boton
                alarma
                ubicacion="w-full"
                onClick={() => {
                  cerrar();
                  setModal("borrar");
                }}
              >
                Borrar mi cuenta
              </Boton>
            </div>
          )}
        </Desplegable>
      ) : (
        <Boton variante="contorno" onClick={() => setModal("entrar")}>
          <SignIn size={13} aria-hidden />
          Entrar
        </Boton>
      )}

      {modal === "entrar" ? <ModalEntrar onCerrar={() => setModal(null)} /> : null}
      {modal === "borrar" && sesion ? (
        <ModalBorrarCuenta nombre={sesion.nombre} onCerrar={() => setModal(null)} />
      ) : null}
    </div>
  );
}
