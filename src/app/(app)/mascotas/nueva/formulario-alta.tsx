"use client";

import { useState } from "react";
import { Campo, Formulario, Seleccion } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { formatearImporte, formatearPeriodo } from "@/lib/formato";
import type { ResultadoAccion } from "@/lib/operacion";
import { formasDePago, type FormaPago } from "@/lib/pagos/reglas";

type Plan = { id: string; nombre: string; precio: number };
export type DuenoOpcion = { dni: string; nombre: string; formaPagoPreferida: FormaPago };

// CU-13: dueño, ficha, plan y primer pago (CU-22 pasos 2 a 5), con una única confirmación.
export function FormularioAlta({
  accion,
  duenos,
  duenoInicial,
  planes,
  hoy,
  periodo,
  children,
}: {
  accion: (anterior: ResultadoAccion, formData: FormData) => Promise<ResultadoAccion>;
  duenos: DuenoOpcion[];
  duenoInicial?: string; // DNI
  planes: Plan[];
  hoy: string;
  periodo: string;
  children: React.ReactNode;
}) {
  const [dni, setDni] = useState(duenoInicial ?? "");
  const dueno = duenos.find((d) => d.dni === dni.replace(/[.\s]/g, ""));
  const [formaPago, setFormaPago] = useState<FormaPago>(dueno?.formaPagoPreferida ?? "efectivo");
  const [planId, setPlanId] = useState("");
  const plan = planes.find((p) => p.id === planId);

  // Al elegir el dueño se propone su forma de pago preferida (CU-22 RN-10).
  const elegirDueno = (valor: string) => {
    setDni(valor);
    const elegido = duenos.find((d) => d.dni === valor.replace(/[.\s]/g, ""));
    if (elegido) setFormaPago(elegido.formaPagoPreferida);
  };

  return (
    <Formulario accion={accion} textoBoton="Confirmar alta">
      <Campo
        etiqueta="Dueño"
        htmlFor="duenoDni"
        ayuda={dueno ? `${dueno.nombre} · DNI ${dueno.dni}` : "Escribí el DNI o el apellido y elegilo de la lista. Si no existe, primero dalo de alta en Dueños."}
      >
        <Input
          id="duenoDni"
          name="duenoDni"
          list="duenos"
          inputMode="search"
          autoComplete="off"
          value={dni}
          onChange={(e) => elegirDueno(e.target.value)}
          placeholder="DNI del dueño"
        />
        <datalist id="duenos">
          {duenos.map((d) => (
            <option key={d.dni} value={d.dni}>
              {d.nombre}
            </option>
          ))}
        </datalist>
      </Campo>

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
            <Seleccion id="formaPago" name="formaPago" value={formaPago} onChange={(e) => setFormaPago(e.target.value as FormaPago)}>
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
              por <strong>{formatearImporte(plan.precio)}</strong> con el plan <strong>{plan.nombre}</strong>
            </>
          ) : null}
          {dueno ? (
            <>
              , a nombre de <strong>{dueno.nombre}</strong>
            </>
          ) : null}
          . La cobertura empieza al confirmar.
        </p>
      </fieldset>
    </Formulario>
  );
}
