"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { Aviso } from "@/components/aviso";
import { Button } from "@/components/ui/button";
import type { ResultadoAccion } from "@/lib/operacion";
import { cn } from "@/lib/utils";

type Accion = (anterior: ResultadoAccion, formData: FormData) => Promise<ResultadoAccion>;

// Formulario de una operación. Manda una clave única por envío, para que la misma confirmación
// no se procese dos veces (RNF-INT-01), y muestra el error o la confirmación que devuelve el servidor.
export function Formulario({
  accion,
  textoBoton,
  reiniciarAlTerminar = false,
  className,
  children,
}: {
  accion: Accion;
  textoBoton: string;
  reiniciarAlTerminar?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [resultado, enviar, pendiente] = useActionState(accion, null);
  const formulario = useRef<HTMLFormElement>(null);
  const clave = useRef<HTMLInputElement>(null);

  // La clave se genera en el navegador; después de una operación exitosa, se genera otra.
  useEffect(() => {
    if (resultado?.ok && reiniciarAlTerminar) formulario.current?.reset();
    if (clave.current && (!clave.current.value || resultado?.ok)) clave.current.value = crypto.randomUUID();
  }, [resultado, reiniciarAlTerminar]);

  return (
    <form
      ref={formulario}
      // Se envía a mano para que, si hay un error, no se borre lo que la persona escribió.
      onSubmit={(evento) => {
        evento.preventDefault();
        const datos = new FormData(evento.currentTarget);
        startTransition(() => enviar(datos));
      }}
      className={cn("space-y-4", className)}
    >
      <input ref={clave} type="hidden" name="clave" />
      {resultado && <Aviso tipo={resultado.ok ? "exito" : "error"}>{resultado.ok ? resultado.mensaje : resultado.error}</Aviso>}
      {children}
      <Button type="submit" disabled={pendiente} className="w-full sm:w-auto">
        {pendiente ? "Guardando…" : textoBoton}
      </Button>
    </form>
  );
}

// Campo con su etiqueta.
export function Campo({
  etiqueta,
  htmlFor,
  ayuda,
  children,
  className,
}: {
  etiqueta: string;
  htmlFor: string;
  ayuda?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {etiqueta}
      </label>
      {children}
      {ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>}
    </div>
  );
}

// Lista desplegable nativa: es la más cómoda en celular.
export function Seleccion({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}
