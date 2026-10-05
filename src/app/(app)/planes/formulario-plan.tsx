"use client";

import { useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Campo, Formulario, Seleccion } from "@/components/formulario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { leerImporte, formatearImporte } from "@/lib/formato";
import type { ResultadoAccion } from "@/lib/operacion";
import type { DatosPlanFormulario, FilaPrestacionFormulario } from "@/lib/planes/validacion";

type Tipo = { id: string; nombre: string };

const filaVacia = (): FilaPrestacionFormulario => ({
  tipoPrestacionId: "",
  limite: "",
  periodicidad: "mensual",
  periodosParaHabilitar: "1",
});

// Formulario de CU-16 (y de la edición de la v1): datos del plan, prestaciones y resumen antes de confirmar.
export function FormularioPlan({
  accion,
  tipos,
  inicial,
  textoBoton,
}: {
  accion: (anterior: ResultadoAccion, formData: FormData) => Promise<ResultadoAccion>;
  tipos: Tipo[];
  inicial?: DatosPlanFormulario;
  textoBoton: string;
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [precio, setPrecio] = useState(inicial?.precio ?? "");
  const [filas, setFilas] = useState<FilaPrestacionFormulario[]>(inicial?.prestaciones ?? [filaVacia()]);

  const cambiarFila = (indice: number, cambios: Partial<FilaPrestacionFormulario>) =>
    setFilas((actuales) => actuales.map((f, i) => (i === indice ? { ...f, ...cambios } : f)));

  const nombreDeTipo = (id: string) => tipos.find((t) => t.id === id)?.nombre;
  const precioLeido = leerImporte(precio);

  return (
    <Formulario accion={accion} textoBoton={textoBoton}>
      <input type="hidden" name="prestaciones" value={JSON.stringify(filas)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre" htmlFor="nombre">
          <Input id="nombre" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Campo>
        <Campo etiqueta="Precio mensual" htmlFor="precio" ayuda="En pesos. Ej.: 15.000 o 15000,50">
          <Input id="precio" name="precio" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </Campo>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Prestaciones</legend>
        <p className="text-xs text-muted-foreground">
          Límite vacío: ilimitada. Meses pagos: cuántos meses tiene que haber pagado la mascota para poder usarla.
        </p>
        {tipos.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Primero cargá los tipos de prestación en el catálogo.
          </p>
        )}
        {filas.map((fila, i) => (
          <div key={i} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2 xl:grid-cols-[minmax(8rem,2fr)_minmax(4rem,1fr)_minmax(6rem,1fr)_minmax(5rem,1fr)_auto] xl:items-end">
            <Campo etiqueta="Prestación" htmlFor={`tipo-${i}`}>
              <Seleccion
                id={`tipo-${i}`}
                value={fila.tipoPrestacionId}
                onChange={(e) => cambiarFila(i, { tipoPrestacionId: e.target.value })}
              >
                <option value="">Elegí una…</option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </Seleccion>
            </Campo>
            <Campo etiqueta="Límite" htmlFor={`limite-${i}`}>
              <Input
                id={`limite-${i}`}
                placeholder="Ilimitada"
                inputMode="numeric"
                value={fila.limite}
                onChange={(e) => cambiarFila(i, { limite: e.target.value })}
              />
            </Campo>
            <Campo etiqueta="Periodicidad" htmlFor={`periodicidad-${i}`}>
              <Seleccion
                id={`periodicidad-${i}`}
                value={fila.periodicidad}
                onChange={(e) => cambiarFila(i, { periodicidad: e.target.value })}
              >
                <option value="mensual">Mensual</option>
                <option value="anual">Anual</option>
              </Seleccion>
            </Campo>
            <Campo etiqueta="Meses pagos" htmlFor={`periodos-${i}`}>
              <Input
                id={`periodos-${i}`}
                title="Meses pagos necesarios para habilitar la prestación"
                inputMode="numeric"
                value={fila.periodosParaHabilitar}
                onChange={(e) => cambiarFila(i, { periodosParaHabilitar: e.target.value })}
              />
            </Campo>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Quitar prestación"
              onClick={() => setFilas((actuales) => actuales.filter((_, j) => j !== i))}
            >
              <Trash2Icon />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setFilas((actuales) => [...actuales, filaVacia()])}>
          <PlusIcon /> Agregar prestación
        </Button>
      </fieldset>

      {/* CU-16 paso 5: resumen del plan antes de confirmar. */}
      <div className="space-y-2 rounded-lg bg-muted p-4 text-sm">
        <p className="font-medium">Resumen</p>
        <p>
          {nombre.trim() || "Sin nombre"} ·{" "}
          {precioLeido && precioLeido > 0 ? `${formatearImporte(precioLeido)} por mes` : "sin precio"}
        </p>
        <ul className="list-disc space-y-1 pl-5">
          {filas
            .filter((f) => nombreDeTipo(f.tipoPrestacionId))
            .map((f, i) => (
              <li key={i}>
                {nombreDeTipo(f.tipoPrestacionId)}: {f.limite.trim() ? f.limite : "ilimitada"}{" "}
                {f.periodicidad === "anual" ? "por año" : "por mes"}, desde {f.periodosParaHabilitar || "?"}{" "}
                {f.periodosParaHabilitar === "1" ? "mes pago" : "meses pagos"}
              </li>
            ))}
        </ul>
      </div>
    </Formulario>
  );
}
