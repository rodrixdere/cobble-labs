import { useCallback, useSyncExternalStore } from "react";

// Un valor de localStorage que las pantallas pueden mirar: cuando cambia, aca o
// en otra pestaña, se enteran todas. Envuelto como el resto del guardado, por
// si el navegador tiene el almacenamiento bloqueado.

const evento = (clave: string) => `guardado:${clave}`;

export function leerGuardado(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

export function escribirGuardado(clave: string, valor: string | null): void {
  try {
    if (valor === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento no queda guardado, pero la pantalla sigue andando.
  }
  window.dispatchEvent(new Event(evento(clave)));
}

export function useGuardado(clave: string): string | null {
  const suscribir = useCallback(
    (avisar: () => void) => {
      window.addEventListener(evento(clave), avisar);
      window.addEventListener("storage", avisar);
      return () => {
        window.removeEventListener(evento(clave), avisar);
        window.removeEventListener("storage", avisar);
      };
    },
    [clave]
  );

  // En el servidor no hay navegador: se arranca vacio y se completa al hidratar.
  return useSyncExternalStore(suscribir, () => leerGuardado(clave), () => null);
}
