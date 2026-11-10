"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { adondeVolver } from "@/comunidad/api";
import { guardarSesion } from "@/comunidad/sesion";

// Aca vuelve el login. El id y el nombre llegan en el fragmento de la direccion,
// que no viaja a ningun servidor: se guardan en el navegador y se sigue.

export default function Entrar() {
  const router = useRouter();
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    const datos = new URLSearchParams(window.location.hash.slice(1));
    const id = datos.get("id");
    const nombre = datos.get("nombre");
    if (!id || !nombre) {
      setFallo(true);
      return;
    }
    guardarSesion({ id, nombre });
    router.replace(adondeVolver());
  }, [router]);

  return (
    <p className="px-4 py-28 text-center text-lectura text-tinta-tenue md:px-8">
      {fallo ? "No llegaron los datos del inicio de sesión. Probá entrar de nuevo." : "Entrando…"}
    </p>
  );
}
