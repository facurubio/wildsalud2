"use client";

import { Campo, Formulario, Seleccion } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import type { ResultadoAccion } from "@/lib/operacion";
import { FORMAS_DE_PAGO, type DatosDueno } from "@/lib/personas/validacion";

// Formulario de CU-08 (alta) y CU-09 (edición). La validación es del servidor: la pantalla no marca errores por su cuenta.
export function FormularioDueno({
  accion,
  textoBoton,
  inicial,
  huella,
}: {
  accion: (anterior: ResultadoAccion, formData: FormData) => Promise<ResultadoAccion>;
  textoBoton: string;
  inicial?: DatosDueno;
  // Estado de los datos al abrir la edición, para no pisar cambios de otro administrador (CU-09 EX-09).
  huella?: string;
}) {
  return (
    <Formulario accion={accion} textoBoton={textoBoton}>
      {huella && <input type="hidden" name="huella" value={huella} />}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">Datos personales</legend>
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
          <Campo etiqueta="Email" htmlFor="email">
            <Input id="email" name="email" inputMode="email" defaultValue={inicial?.email} autoComplete="off" />
          </Campo>
          <Campo etiqueta="Teléfono" htmlFor="telefono" ayuda="Con código de área. Ej.: 11 5555-1234 o +54 11 5555-1234.">
            <Input id="telefono" name="telefono" type="tel" defaultValue={inicial?.telefono} autoComplete="off" />
          </Campo>
          <Campo etiqueta="Forma de pago preferida" htmlFor="formaPago" ayuda="Se propone al registrar cada pago.">
            <Seleccion id="formaPago" name="formaPago" defaultValue={inicial?.formaPago ?? ""}>
              <option value="">Elegí una…</option>
              {FORMAS_DE_PAGO.map((f) => (
                <option key={f.valor} value={f.valor}>
                  {f.texto}
                </option>
              ))}
            </Seleccion>
          </Campo>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold">Dirección</legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo etiqueta="Calle" htmlFor="calle" className="sm:col-span-2">
            <Input id="calle" name="calle" defaultValue={inicial?.calle} autoComplete="off" />
          </Campo>
          <Campo etiqueta="Número" htmlFor="numero">
            <Input id="numero" name="numero" defaultValue={inicial?.numero} autoComplete="off" />
          </Campo>
          <div className="grid grid-cols-2 gap-4">
            <Campo etiqueta="Piso" htmlFor="piso" ayuda="Opcional">
              <Input id="piso" name="piso" defaultValue={inicial?.piso} autoComplete="off" />
            </Campo>
            <Campo etiqueta="Depto." htmlFor="departamento" ayuda="Opcional">
              <Input id="departamento" name="departamento" defaultValue={inicial?.departamento} autoComplete="off" />
            </Campo>
          </div>
          <Campo etiqueta="Localidad" htmlFor="localidad" className="sm:col-span-2">
            <Input id="localidad" name="localidad" defaultValue={inicial?.localidad} autoComplete="off" />
          </Campo>
          <Campo etiqueta="Provincia" htmlFor="provincia">
            <Input id="provincia" name="provincia" defaultValue={inicial?.provincia} autoComplete="off" />
          </Campo>
          <Campo etiqueta="Código postal" htmlFor="codigoPostal">
            <Input id="codigoPostal" name="codigoPostal" defaultValue={inicial?.codigoPostal} autoComplete="off" />
          </Campo>
        </div>
      </fieldset>
    </Formulario>
  );
}
