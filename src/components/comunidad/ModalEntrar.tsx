"use client";

import Link from "next/link";
import { useState } from "react";

import { irAEntrar } from "@/comunidad/api";
import { MODO_LOCAL } from "@/data/sitio";
import Boton from "@/ui/Boton";
import { Campo } from "@/ui/Campo";
import Modal from "@/ui/Modal";

// Entrar. En el sitio publicado es un boton que lleva a Discord; en la prueba
// local no hay Discord y se entra con un nombre inventado.

export default function ModalEntrar({ motivo, onCerrar }: { motivo?: string; onCerrar: () => void }) {
  const [nombre, setNombre] = useState("Entrenador de prueba");

  return (
    <Modal titulo="Entrar" ancho="angosto" onCerrar={onCerrar}>
      <div className="space-y-4 px-5 py-5">
        {motivo ? <p className="text-lectura text-tinta-media">{motivo}</p> : null}

        {MODO_LOCAL ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              irAEntrar(nombre.trim());
            }}
          >
            <Campo
              rotulo="Nombre de prueba"
              value={nombre}
              maxLength={32}
              onChange={(e) => setNombre(e.target.value)}
              ayuda="Esto es la prueba local. En el sitio publicado se entra con Discord."
            />
            <Boton type="submit" variante="principal" disabled={!nombre.trim()}>
              Entrar
            </Boton>
          </form>
        ) : (
          <Boton variante="principal" onClick={() => irAEntrar()}>
            Entrar con Discord
          </Boton>
        )}

        <p className="text-apoyo text-tinta-tenue">
          De tu cuenta de Discord solo se guarda tu nombre visible.{" "}
          <Link href="/privacidad" prefetch={false} className="underline underline-offset-4 hover:text-tinta">
            Qué se guarda y cómo borrarlo
          </Link>
          .
        </p>
      </div>
    </Modal>
  );
}
