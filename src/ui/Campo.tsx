import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { useId } from "react";

import { cx } from "@/ui/clases";

// El rotulo va arriba y asociado por htmlFor, para que se pueda clickear y para
// que lo lea un lector de pantalla. El placeholder nunca hace de etiqueta.

const CONTROL =
  "w-full rounded-pieza border border-linea-fuerte bg-panel px-2 py-1.5 text-cuerpo text-tinta outline-none transition-colors duration-150 focus:border-acento";

function Envoltura({
  rotulo,
  id,
  ayuda,
  ubicacion,
  children,
}: {
  rotulo: string;
  id: string;
  ayuda?: ReactNode;
  ubicacion?: string;
  children: ReactNode;
}) {
  return (
    <div className={ubicacion}>
      <label htmlFor={id} className="rotulo mb-1.5 block">
        {rotulo}
      </label>
      {children}
      {ayuda ? (
        <p className="mt-1 text-apoyo text-tinta-media">{ayuda}</p>
      ) : null}
    </div>
  );
}

type PropsCampo = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "id"
> & {
  rotulo: string;
  ayuda?: ReactNode;
  ubicacion?: string;
};

export function Campo({ rotulo, ayuda, ubicacion, ...resto }: PropsCampo) {
  const id = useId();
  return (
    <Envoltura rotulo={rotulo} id={id} ayuda={ayuda} ubicacion={ubicacion}>
      <input id={id} {...resto} className={CONTROL} />
    </Envoltura>
  );
}

type PropsArea = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className" | "id"
> & {
  rotulo: string;
  ayuda?: ReactNode;
  ubicacion?: string;
  /** El texto de un equipo se pega y se lee mejor en mono. */
  mono?: boolean;
};

export function AreaTexto({
  rotulo,
  ayuda,
  ubicacion,
  mono,
  ...resto
}: PropsArea) {
  const id = useId();
  return (
    <Envoltura rotulo={rotulo} id={id} ayuda={ayuda} ubicacion={ubicacion}>
      <textarea
        id={id}
        spellCheck={false}
        {...resto}
        className={cx(CONTROL, "bg-fondo p-3", mono && "font-mono")}
      />
    </Envoltura>
  );
}
