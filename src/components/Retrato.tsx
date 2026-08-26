import { assetsDeForma, medidaRetrato } from "@/data/retrato";

type Props = {
  assets: string;
  nombre: string;
  lado: number;
  escalaMaxima: number;
  /** Clave de la mega o forma regional puesta, si hay alguna. */
  forma?: string | null;
  prioritario?: boolean;
  className?: string;
};

// Sin next/image a proposito: son PNG de 2 KB ya listos para mostrar, y pasar
// 366 por el optimizador de Vercel costaria una transformacion por cada uno
// para no ahorrar nada. width y height van explicitos para que el hueco no
// salte cuando entra la imagen.
export default function Retrato({
  assets,
  nombre,
  lado,
  escalaMaxima,
  forma,
  prioritario = false,
  className = "",
}: Props) {
  const clave = assetsDeForma(assets, forma);
  const medida = medidaRetrato(clave, lado, escalaMaxima);
  if (!medida) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/cobblemon/retratos/${clave}.png`}
      alt={nombre}
      width={medida.ancho}
      height={medida.alto}
      loading={prioritario ? "eager" : "lazy"}
      fetchPriority={prioritario ? "high" : "auto"}
      decoding="async"
      className={`pixel max-h-full max-w-full ${className}`}
    />
  );
}
