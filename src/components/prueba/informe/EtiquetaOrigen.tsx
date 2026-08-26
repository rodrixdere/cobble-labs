// De donde salio el rival de esa fila: un equipo que el usuario guardo, o uno
// que arma el sitio con reglas. Sin la etiqueta los dos se leen igual y no lo son.
export default function EtiquetaOrigen({ real }: { real: boolean }) {
  return (
    <span className="cifra ml-2 text-nota uppercase text-tinta-tenue">
      {real ? "real" : "generado"}
    </span>
  );
}
