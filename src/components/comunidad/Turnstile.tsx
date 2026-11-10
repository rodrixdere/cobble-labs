"use client";

import { useEffect, useRef, useState } from "react";

import { TURNSTILE_SITEKEY } from "@/data/sitio";

// El widget de Turnstile. Entrega un token de un solo uso que el Worker
// confirma con Cloudflare; si hace falta otro, se vuelve a montar con otra key.

type Widget = {
  render(
    caja: HTMLElement,
    opciones: {
      sitekey: string;
      language: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    }
  ): string;
  remove(id: string): void;
};

declare global {
  interface Window {
    turnstile?: Widget;
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// El script se pide una sola vez aunque haya varios widgets en la vida de la pagina.
let cargando: Promise<void> | null = null;

function cargarScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  cargando ??= new Promise((listo, fallo) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => listo();
    script.onerror = () => {
      cargando = null;
      fallo(new Error("No cargó Turnstile"));
    };
    document.head.append(script);
  });
  return cargando;
}

export default function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const caja = useRef<HTMLDivElement>(null);
  const avisar = useRef(onToken);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    avisar.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let id: string | undefined;
    let vigente = true;

    cargarScript()
      .then(() => {
        if (!vigente || !caja.current || !window.turnstile) return;
        id = window.turnstile.render(caja.current, {
          sitekey: TURNSTILE_SITEKEY,
          language: "es",
          callback: (token) => avisar.current(token),
          "expired-callback": () => avisar.current(null),
          "error-callback": () => avisar.current(null),
        });
      })
      .catch(() => setFallo(true));

    return () => {
      vigente = false;
      if (id) window.turnstile?.remove(id);
    };
  }, []);

  if (fallo) {
    return (
      <p className="text-cuerpo text-alarma">
        No se pudo cargar la verificación. Revisá la conexión y probá de nuevo.
      </p>
    );
  }
  return <div ref={caja} className="min-h-[65px]" />;
}
