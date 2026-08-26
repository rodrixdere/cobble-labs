import { cx } from "@/ui/clases";

// Una de las seis cifras de la cabecera del informe. Las dos que resumen toda
// la prueba (el porcentaje y la letra) van grandes y en acento; las otras
// cuatro son contexto y no compiten con ellas.
export default function Cifra({
  rotulo,
  valor,
  destacada,
}: {
  rotulo: string;
  valor: string;
  destacada?: boolean;
}) {
  return (
    <div className="bg-panel py-3.5 text-center">
      <dt className="rotulo">{rotulo}</dt>
      <dd
        className={cx(
          "cifra mt-1.5",
          destacada ? "text-capitulo text-acento-hondo" : "text-subtitulo"
        )}
      >
        {valor}
      </dd>
    </div>
  );
}
