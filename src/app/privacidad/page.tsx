import type { Metadata } from "next";
import type { ReactNode } from "react";

import { COMUNIDAD_ACTIVA } from "@/data/sitio";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Qué guarda Cobble Labs cuando entrás con Discord y cómo borrarlo.",
  alternates: { canonical: "/privacidad" },
  // Habla de un login que no existe hasta que la comunidad se abra.
  robots: COMUNIDAD_ACTIVA ? undefined : { index: false },
};

// La nota de privacidad. Dice lo que hace el codigo y nada mas: si el codigo
// cambia lo que guarda, esta pagina cambia en el mismo commit.

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="border-t border-linea px-4 py-6 md:px-8">
      <h2 className="font-display text-titulo">{titulo}</h2>
      <div className="mt-3 max-w-[68ch] space-y-3 text-lectura leading-relaxed text-tinta-media">
        {children}
      </div>
    </section>
  );
}

export default function Privacidad() {
  return (
    <main className="mx-auto max-w-[1400px] hoja">
      <div className="px-4 pb-6 pt-9 md:px-8">
        <h1 className="font-display text-portada">Privacidad</h1>
        <p className="mt-3 max-w-[62ch] text-realce leading-relaxed text-tinta-media">
          Para ver el Pokédex, armar equipos o usar el Battle Bot no hace falta cuenta, y nada de
          eso sale de tu navegador. Esto es lo que cambia si entrás con Discord para publicar.
        </p>
      </div>

      <Seccion titulo="Qué se guarda">
        <p>
          Tu id de Discord y tu nombre visible. Nunca tu correo, tu contraseña ni nada de tus
          servidores: al entrar, Discord solo comparte el permiso de identificarte.
        </p>
        <p>
          Los equipos que publicás, con la fecha. Y una sesión que dura seis meses, que solo sirve
          para publicar y borrar. De esa sesión se guarda una huella, no la sesión en sí.
        </p>
      </Seccion>

      <Seccion titulo="Qué es público">
        <p>
          Los equipos que publicás y tu nombre visible, que aparece como autor. Tu id de Discord
          no se muestra en ningún lado.
        </p>
      </Seccion>

      <Seccion titulo="Qué queda solo en tu navegador">
        <p>
          Tus favoritos, los equipos que guardás en el armador y el equipo que tenés abierto. No
          viajan a ningún servidor.
        </p>
      </Seccion>

      <Seccion titulo="Cómo borrar todo">
        <p>
          En el menú de tu cuenta, arriba a la derecha, está <strong>Borrar mi cuenta</strong>. Se
          borran al instante tu cuenta, tus sesiones y todos tus equipos publicados.
        </p>
        <p>
          Además podés quitarle el permiso a Cobble Labs desde Discord, en Ajustes de usuario,
          Aplicaciones autorizadas.
        </p>
      </Seccion>
    </main>
  );
}
