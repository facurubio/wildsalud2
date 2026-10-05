"use client";

import { useState } from "react";
import { Campo, Formulario, Seleccion } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { formatearImporte, formatearPeriodo } from "@/lib/formato";
import type { ResultadoAccion } from "@/lib/operacion";
import { formasDePago, type FormaPago } from "@/lib/pagos/reglas";

type PeriodoAPagar = { periodo: string; importe: number };

// CU-26 pasos 2 a 4: cuántos períodos se pagan (desde el más antiguo), forma y fecha de pago, y resumen.
export function FormularioPago({
  accion,
  periodos,
  formaPreferida,
  hoy,
  nombreMascota,
  suspendida,
}: {
  accion: (anterior: ResultadoAccion, formData: FormData) => Promise<ResultadoAccion>;
  periodos: PeriodoAPagar[];
  formaPreferida: FormaPago;
  hoy: string;
  nombreMascota: string;
  suspendida: boolean;
}) {
  const [cantidad, setCantidad] = useState(periodos.length);
  const elegidos = periodos.slice(0, cantidad);
  const total = elegidos.reduce((suma, p) => suma + p.importe, 0);
  // D4: una cobertura suspendida se reactiva recién con todo pago hasta el mes en curso inclusive.
  const sigueSuspendida = suspendida && cantidad < periodos.length;

  return (
    <Formulario accion={accion} textoBoton="Registrar pago">
      <input type="hidden" name="periodos" value={elegidos.map((p) => p.periodo).join(",")} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo etiqueta="Períodos a pagar" htmlFor="cantidad" ayuda="Siempre desde el más antiguo">
          <Seleccion id="cantidad" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))}>
            {periodos.map((p, i) => (
              <option key={p.periodo} value={i + 1}>
                {i === 0 ? formatearPeriodo(p.periodo) : `${formatearPeriodo(periodos[0].periodo)} a ${formatearPeriodo(p.periodo)}`}
              </option>
            ))}
          </Seleccion>
        </Campo>
        <Campo etiqueta="Forma de pago" htmlFor="formaPago">
          <Seleccion id="formaPago" name="formaPago" defaultValue={formaPreferida}>
            {Object.entries(formasDePago).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </Seleccion>
        </Campo>
        <Campo etiqueta="Fecha de pago" htmlFor="fechaPago">
          <Input id="fechaPago" name="fechaPago" type="date" max={hoy} defaultValue={hoy} />
        </Campo>
      </div>

      {/* Paso 4: resumen con importe por período, total y cómo queda la cobertura. */}
      <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
        <p className="font-medium">Resumen</p>
        <ul className="space-y-1">
          {elegidos.map((p) => (
            <li key={p.periodo} className="flex justify-between gap-4">
              <span>{formatearPeriodo(p.periodo)}</span>
              <span>{formatearImporte(p.importe)}</span>
            </li>
          ))}
        </ul>
        <p className="flex justify-between gap-4 border-t pt-2 font-medium">
          <span>Total</span>
          <span>{formatearImporte(total)}</span>
        </p>
        <p>
          {sigueSuspendida
            ? `La cobertura de ${nombreMascota} va a seguir suspendida: para reactivarla hay que pagar hasta ${formatearPeriodo(periodos[periodos.length - 1].periodo)} inclusive.`
            : `La cobertura de ${nombreMascota} va a quedar al día.`}
        </p>
      </div>
    </Formulario>
  );
}
