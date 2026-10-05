"use client";

import { useState } from "react";
import { Campo, Formulario, Seleccion } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { formatearImporte, formatearPeriodo } from "@/lib/formato";
import type { ResultadoAccion } from "@/lib/operacion";
import { formasDePago, type FormaPago } from "@/lib/pagos/reglas";

type Plan = { id: string; nombre: string; precio: number };

// CU-13 pasos 6 y 7 (CU-22 pasos 2 a 5): plan, primer pago y resumen, con una única confirmación.
export function FormularioAlta({
  accion,
  planes,
  formaPreferida,
  hoy,
  periodo,
  children,
}: {
  accion: (anterior: ResultadoAccion, formData: FormData) => Promise<ResultadoAccion>;
  planes: Plan[];
  formaPreferida: FormaPago;
  hoy: string;
  periodo: string;
  children: React.ReactNode;
}) {
  const [planId, setPlanId] = useState("");
  const plan = planes.find((p) => p.id === planId);

  return (
    <Formulario accion={accion} textoBoton="Confirmar alta">
      {children}

      <fieldset className="space-y-4 border-t pt-4">
        <legend className="text-sm font-medium">Plan y primer pago</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Plan" htmlFor="planId">
            <Seleccion id="planId" name="planId" value={planId} onChange={(e) => setPlanId(e.target.value)}>
              <option value="">Elegí un plan…</option>
              {planes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} · {formatearImporte(p.precio)}
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
        {planes.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay planes activos. Creá uno en Planes antes de dar de alta mascotas.</p>
        )}
        <p className="rounded-lg bg-muted p-3 text-sm">
          Primer pago: cuota completa de <strong>{formatearPeriodo(periodo)}</strong>
          {plan ? (
            <>
              {" "}
              por <strong>{formatearImporte(plan.precio)}</strong> con el plan <strong>{plan.nombre}</strong>.
            </>
          ) : (
            "."
          )}{" "}
          La cobertura empieza al confirmar.
        </p>
      </fieldset>
    </Formulario>
  );
}
