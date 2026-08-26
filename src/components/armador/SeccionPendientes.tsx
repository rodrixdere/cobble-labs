// Las dos secciones que todavia no tienen dato. Se quedan vacias y lo dicen: el
// servidor no publica resultados, asi que cualquier equipo aca seria inventado.

const PENDIENTES = [
  {
    titulo: "Equipos de torneo",
    detalle:
      "Acá van a aparecer equipos de torneos del servidor, con su jugador y su resultado, listos para cargar. El servidor todavía no publica resultados, así que la sección está vacía a propósito: no hay equipos inventados.",
  },
  {
    titulo: "Equipos curados",
    detalle:
      "Equipos elegidos a mano como punto de partida. Cuando armes uno que valga la pena, guardalo y decime y lo dejamos fijo acá.",
  },
];

export default function SeccionPendientes() {
  return (
    <section className="grid grid-cols-2 gap-px border-t border-linea bg-linea">
      {PENDIENTES.map((p) => (
        <div key={p.titulo} className="bg-panel px-8 py-6">
          <h2 className="rotulo border-b border-linea pb-2">{p.titulo}</h2>
          <p className="mt-3 max-w-[52ch] text-lectura text-tinta-media">
            {p.detalle}
          </p>
        </div>
      ))}
    </section>
  );
}
