"use client";

import { useState } from "react";
import { Formulario } from "@/components/formulario";
import type { ResultadoAccion } from "@/lib/operacion";
import { cn } from "@/lib/utils";

type Opcion = {
  tipoPrestacionId: string;
  nombre: string;
  disponible: boolean;
  detalle: string; // saldo, "Agotada" o "No habilitada todavía…"
};

// CU-39 pasos 2 a 5: prestaciones con su estado (solo se eligen las disponibles) y confirmación con el saldo actual.
export function FormularioConsumo({
  accion,
  opciones,
  mascota,
}: {
  accion: (anterior: ResultadoAccion, formData: FormData) => Promise<ResultadoAccion>;
  opciones: Opcion[];
  mascota: string;
}) {
  const [elegida, setElegida] = useState("");
  const opcion = opciones.find((o) => o.tipoPrestacionId === elegida);

  return (
    <Formulario accion={accion} textoBoton="Confirmar consumo">
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Prestación</legend>
        {opciones.map((o) => (
          <label
            key={o.tipoPrestacionId}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg border p-3 text-sm",
              o.disponible ? "cursor-pointer hover:bg-muted" : "cursor-not-allowed opacity-60",
              elegida === o.tipoPrestacionId && "border-primary bg-muted",
            )}
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="tipoPrestacionId"
                value={o.tipoPrestacionId}
                disabled={!o.disponible}
                checked={elegida === o.tipoPrestacionId}
                onChange={() => setElegida(o.tipoPrestacionId)}
                className="size-4"
              />
              <span className="font-medium">{o.nombre}</span>
            </span>
            <span className="text-right text-muted-foreground">{o.detalle}</span>
          </label>
        ))}
      </fieldset>
      {opcion && (
        <p className="rounded-lg bg-muted p-3 text-sm">
          Vas a registrar <strong>{opcion.nombre}</strong> para <strong>{mascota}</strong>. {opcion.detalle}.
        </p>
      )}
    </Formulario>
  );
}
