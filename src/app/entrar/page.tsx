import type { Metadata } from "next";

import Entrar from "@/components/comunidad/Entrar";

export const metadata: Metadata = {
  title: "Entrando",
  robots: { index: false },
};

export default function PaginaEntrar() {
  return (
    <main className="mx-auto max-w-[1400px] hoja">
      <Entrar />
    </main>
  );
}
