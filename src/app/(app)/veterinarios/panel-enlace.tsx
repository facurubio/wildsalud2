"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Aviso } from "@/components/aviso";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatearFechaHora } from "@/lib/formato";
import type { EnlaceDeInvitacion } from "@/lib/personas/resultado";

// Muestra el enlace de invitación para que el administrador lo copie y lo mande por WhatsApp (alcance-v1.md).
// El código del enlace se ve solo ahora: en la base queda el hash y la dirección no viaja en la URL de la pantalla.
export function PanelEnlace({
  mensaje,
  enlace,
  volver,
  alCerrar,
}: {
  mensaje: string;
  enlace: EnlaceDeInvitacion;
  volver?: { href: string; texto: string };
  alCerrar?: () => void;
}) {
  const campo = useRef<HTMLInputElement>(null);
  const [copiado, setCopiado] = useState<"si" | "no" | null>(null);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace.url);
      setCopiado("si");
    } catch {
      // Sin permiso para el portapapeles: se deja seleccionado para copiarlo a mano.
      campo.current?.select();
      setCopiado("no");
    }
  }

  return (
    <div className="space-y-4">
      <Aviso tipo="exito">{mensaje}</Aviso>
      <div className="space-y-2">
        <label htmlFor="enlace-invitacion" className="text-sm font-medium">
          Enlace de invitación
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            ref={campo}
            id="enlace-invitacion"
            readOnly
            value={enlace.url}
            onFocus={(evento) => evento.currentTarget.select()}
          />
          <Button type="button" onClick={copiar} className="sm:shrink-0">
            {copiado === "si" ? <CheckIcon /> : <CopyIcon />}
            {copiado === "si" ? "Enlace copiado" : "Copiar enlace"}
          </Button>
        </div>
        {copiado === "no" && (
          <p className="text-xs text-muted-foreground">
            No pudimos copiarlo solo: el enlace quedó seleccionado, copialo con el menú o con Ctrl+C.
          </p>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Mandáselo por WhatsApp. El enlace se usa una sola vez y vence el {formatearFechaHora(new Date(enlace.venceEn))}.
        Por seguridad no lo volvemos a mostrar: si se pierde o vence, generá uno nuevo desde la ficha.
      </p>
      {volver && (
        <Link href={volver.href} className={buttonVariants({ variant: "outline" })}>
          {volver.texto}
        </Link>
      )}
      {alCerrar && (
        <Button type="button" variant="outline" onClick={alCerrar}>
          Cerrar
        </Button>
      )}
    </div>
  );
}
