import type { Miembro } from "@/team/combate";

// Roles, deducidos de las stats con las que pelea y de los movimientos que
// lleva. Todos los umbrales estan escritos aca y son discutibles a proposito:
// no hay ninguna lista de "este Pokemon es un sweeper" cargada a mano.

export type Rol =
  | "Atacante físico"
  | "Atacante especial"
  | "Atacante mixto"
  | "Barredor"
  | "Rompemuros"
  | "Muro"
  | "Muro especial"
  | "Control de velocidad"
  | "Apoyo"
  | "Preparación"
  | "Prioridad"
  | "Pivote"
  | "Clima"
  | "Terreno"
  | "Espacio Raro";

// Movimientos que dan control de velocidad, por lo que hacen y no por su
// nombre: los que dejan Viento Afin de lado, los que ponen Espacio Raro, los
// que bajan la velocidad del rival y los que paralizan.
export function esControlDeVelocidad(m: {
  efectoDeLado: string | null;
  efectoDeCampo: string | null;
  estado: string | null;
  cambiosAlRival: Record<string, number> | null;
}): boolean {
  if (m.efectoDeLado === "tailwind") return true;
  if (m.efectoDeCampo === "trickroom") return true;
  if (m.estado === "par") return true;
  if (m.cambiosAlRival && (m.cambiosAlRival.spe ?? 0) < 0) return true;
  return false;
}

export function esPreparacion(m: {
  cambiosPropios: Record<string, number> | null;
}): boolean {
  if (!m.cambiosPropios) return false;
  return Object.values(m.cambiosPropios).some((v) => v > 0);
}

export function rolesDe(m: Miembro): Rol[] {
  const roles: Rol[] = [];
  const s = m.stats;
  const fisico = s.attack;
  const especial = s.special_attack;
  const ofensiva = Math.max(fisico, especial);
  const aguante = s.hp + (s.defence + s.special_defence) / 2;

  if (Math.abs(fisico - especial) <= 15 && ofensiva >= 90) roles.push("Atacante mixto");
  else if (fisico > especial + 15 && fisico >= 90) roles.push("Atacante físico");
  else if (especial > fisico + 15 && especial >= 90) roles.push("Atacante especial");

  if (ofensiva >= 100 && s.speed >= 100) roles.push("Barredor");
  if (ofensiva >= 125) roles.push("Rompemuros");
  if (s.hp >= 90 && s.defence >= 95) roles.push("Muro");
  if (s.hp >= 90 && s.special_defence >= 95) roles.push("Muro especial");

  const conEstado = m.movimientos.filter((x) => x.categoria === "status");
  if (m.movimientos.some(esControlDeVelocidad)) roles.push("Control de velocidad");
  if (m.movimientos.some((x) => x.efectoDeCampo === "trickroom")) roles.push("Espacio Raro");
  if (m.movimientos.some((x) => x.clima)) roles.push("Clima");
  if (m.movimientos.some((x) => x.terreno)) roles.push("Terreno");
  if (m.movimientos.some(esPreparacion)) roles.push("Preparación");
  if (m.movimientos.some((x) => x.prioridad > 0 && x.potencia > 0)) roles.push("Prioridad");
  if (conEstado.length >= 2) roles.push("Apoyo");
  if (m.movimientos.some((x) => ["uturn", "voltswitch", "flipturn"].includes(x.clave))) {
    roles.push("Pivote");
  }

  return [...new Set(roles)];
}

export type ResumenDeRoles = {
  porMiembro: { nombre: string; roles: Rol[] }[];
  conteo: { rol: Rol; cuantos: number }[];
  fisicos: number;
  especiales: number;
  conControlDeVelocidad: number;
  conApoyo: number;
  conPreparacion: number;
};

export function analizarRoles(equipo: Miembro[]): ResumenDeRoles {
  const porMiembro = equipo.map((m) => ({ nombre: m.nombre, roles: rolesDe(m) }));

  const conteo = new Map<Rol, number>();
  for (const { roles } of porMiembro) {
    for (const r of roles) conteo.set(r, (conteo.get(r) ?? 0) + 1);
  }

  const tiene = (rol: Rol) => porMiembro.filter((p) => p.roles.includes(rol)).length;

  return {
    porMiembro,
    conteo: [...conteo.entries()]
      .map(([rol, cuantos]) => ({ rol, cuantos }))
      .toSorted((a, b) => b.cuantos - a.cuantos),
    fisicos: equipo.filter((m) => m.stats.attack > m.stats.special_attack).length,
    especiales: equipo.filter((m) => m.stats.special_attack > m.stats.attack).length,
    conControlDeVelocidad: tiene("Control de velocidad"),
    conApoyo: tiene("Apoyo"),
    conPreparacion: tiene("Preparación"),
  };
}
