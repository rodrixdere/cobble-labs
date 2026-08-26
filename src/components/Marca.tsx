// La marca: un hexágono con una Poké Ball adentro, y el nombre al lado.
//
// Está dibujada con geometría exacta y no calcada del render: el hexágono es
// regular de verdad (radio 15 sobre una caja de 32, vértices arriba y abajo),
// la ball está centrada en el mismo punto y la banda mide justo el diámetro,
// así que no hay bordes que asomen ni curvas a ojo.
//
// Los colores son los del sitio, no los del render: el hexágono toma el color
// del texto y el rojo es el mismo que ya usa la interfaz para el daño. Sin
// resplandores ni degradados, que es lo que delata a una imagen generada.

const HEXAGONO = "16,1 29,8.5 29,23.5 16,31 3,23.5 3,8.5";
const HEXAGONO_INTERIOR = "16,4.2 26.4,10.2 26.4,21.8 16,27.8 5.6,21.8 5.6,10.2";

const ROJO = "#c0392b";

export function Insignia({ tamano = 30 }: { tamano?: number }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Cobble Labs"
    >
      <polygon points={HEXAGONO} fill="currentColor" />
      <polygon
        points={HEXAGONO_INTERIOR}
        fill="none"
        stroke="var(--color-panel)"
        strokeOpacity={0.28}
        strokeWidth={0.9}
      />

      {/* La ball: aro claro, media esfera roja, banda y botón. */}
      <circle cx={16} cy={16} r={8.4} fill="var(--color-panel)" />
      <path d="M8.8 16a7.2 7.2 0 0 1 14.4 0Z" fill={ROJO} />
      <rect x={8.8} y={15.05} width={14.4} height={1.9} fill="currentColor" />
      <circle cx={16} cy={16} r={2.5} fill="currentColor" />
      <circle cx={16} cy={16} r={1.35} fill="var(--color-panel)" />
    </svg>
  );
}

// El bloque completo: insignia más nombre. "LABS" va espaciado entre dos
// líneas, que es el mismo recurso que usa el resto del sitio para los rótulos.
export default function Marca({ tamano = 30 }: { tamano?: number }) {
  return (
    <span className="flex items-center gap-2.5 text-tinta">
      <Insignia tamano={tamano} />

      <span className="flex flex-col justify-center leading-none">
        <span className="font-display text-guia uppercase tracking-[0.02em]">
          Cobble
        </span>
        <span className="mt-[3px] flex items-center gap-1.5">
          <span aria-hidden className="h-px w-2.5 bg-acento" />
          <span className="cifra text-nota font-bold uppercase tracking-[0.34em] text-tinta-media">
            Labs
          </span>
          <span aria-hidden className="h-px flex-1 bg-acento" />
        </span>
      </span>
    </span>
  );
}
