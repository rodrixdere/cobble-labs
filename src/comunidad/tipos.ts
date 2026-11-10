// La forma de los archivos publicos de la comunidad. Los escribe el Worker y los
// lee el sitio, asi que se define en un solo lugar.

export type ResumenEquipo = {
  id: string;
  nombre: string;
  autor: { id: string; nombre: string };
  especies: string[];
  etiquetas: string[];
  creado: number;
};

export type EquipoPublicado = ResumenEquipo & { cadena: string };

export type ListaDeEquipos = { generado: number; equipos: ResumenEquipo[] };
