"use client";

import { Campo } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import type { ResultadoConEnlace } from "@/lib/personas/resultado";
import type { DatosVeterinario } from "@/lib/personas/validacion";
import { FormularioConEnlace } from "./formulario-con-enlace";

// Formulario de CU-04 (alta) y CU-05 (edición). La validación es del servidor: la pantalla no marca errores por su cuenta.
export function FormularioVeterinario({
  accion,
  textoBoton,
  inicial,
  huella,
  volver,
}: {
  accion: (anterior: ResultadoConEnlace, formData: FormData) => Promise<ResultadoConEnlace>;
  textoBoton: string;
  inicial?: DatosVeterinario;
  // Estado de los datos al abrir la edición, para no pisar cambios de otro administrador (CU-05 EX-08).
  huella?: string;
  volver: { href: string; texto: string };
}) {
  return (
    <FormularioConEnlace accion={accion} textoBoton={textoBoton} volver={volver}>
      {huella && <input type="hidden" name="huella" value={huella} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre" htmlFor="nombre">
          <Input id="nombre" name="nombre" defaultValue={inicial?.nombre} autoComplete="off" />
        </Campo>
        <Campo etiqueta="Apellido" htmlFor="apellido">
          <Input id="apellido" name="apellido" defaultValue={inicial?.apellido} autoComplete="off" />
        </Campo>
        <Campo etiqueta="DNI" htmlFor="dni" ayuda="7 u 8 dígitos. Se pueden escribir con puntos.">
          <Input id="dni" name="dni" inputMode="numeric" defaultValue={inicial?.dni} autoComplete="off" />
        </Campo>
        <Campo etiqueta="Veterinaria" htmlFor="veterinaria">
          <Input id="veterinaria" name="veterinaria" defaultValue={inicial?.veterinaria} autoComplete="off" />
        </Campo>
        <Campo etiqueta="Teléfono" htmlFor="telefono" ayuda="Con código de área. Ej.: 11 4444-5555 o +54 11 4444-5555.">
          <Input id="telefono" name="telefono" type="tel" defaultValue={inicial?.telefono} autoComplete="off" />
        </Campo>
        <Campo etiqueta="Email" htmlFor="email">
          <Input id="email" name="email" inputMode="email" defaultValue={inicial?.email} autoComplete="off" />
        </Campo>
      </div>
    </FormularioConEnlace>
  );
}
