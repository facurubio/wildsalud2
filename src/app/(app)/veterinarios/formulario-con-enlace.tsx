"use client";

import { useState } from "react";
import { Formulario } from "@/components/formulario";
import type { ResultadoAccion } from "@/lib/operacion";
import type { EnlaceDeInvitacion, ResultadoConEnlace } from "@/lib/personas/resultado";
import { PanelEnlace } from "./panel-enlace";

type AccionConEnlace = (anterior: ResultadoConEnlace, formData: FormData) => Promise<ResultadoConEnlace>;

// Formulario de una operación que puede terminar entregando un enlace de invitación: cuando lo hay,
// reemplaza al formulario por el enlace para copiar (CU-04, CU-05 FA-03 y "Generar enlace nuevo").
export function FormularioConEnlace({
  accion,
  textoBoton,
  volver,
  children,
}: {
  accion: AccionConEnlace;
  textoBoton: string;
  // Si se indica, el panel ofrece ir a esa pantalla; si no, ofrece cerrarlo y volver al formulario.
  volver?: { href: string; texto: string };
  children?: React.ReactNode;
}) {
  const [entrega, setEntrega] = useState<{ mensaje: string; enlace: EnlaceDeInvitacion } | null>(null);

  if (entrega) {
    return <PanelEnlace {...entrega} volver={volver} alCerrar={volver ? undefined : () => setEntrega(null)} />;
  }

  const accionQueMuestraElEnlace = async (anterior: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> => {
    const resultado = await accion(anterior, formData);
    if (resultado?.ok && resultado.enlace) setEntrega({ mensaje: resultado.mensaje, enlace: resultado.enlace });
    return resultado;
  };

  return (
    <Formulario accion={accionQueMuestraElEnlace} textoBoton={textoBoton}>
      {children}
    </Formulario>
  );
}
