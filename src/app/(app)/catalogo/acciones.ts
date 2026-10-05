"use server";

import { revalidatePath } from "next/cache";
import { validarTipoPrestacion } from "@/lib/catalogo/validacion";
import {
  accion,
  auditar,
  campo,
  claveDeSolicitud,
  ejecutarUnaVez,
  ErrorDeNegocio,
  requerirUsuario,
  type ResultadoAccion,
} from "@/lib/operacion";

// CU-20 Crear tipo de prestación.
export async function crearTipoPrestacion(_anterior: ResultadoAccion, formData: FormData): Promise<ResultadoAccion> {
  return accion(async () => {
    const usuario = await requerirUsuario("administrador"); // EX-04
    const nombre = campo(formData, "nombre");
    const descripcion = campo(formData, "descripcion");
    const error = validarTipoPrestacion({ nombre, descripcion });
    if (error) throw new ErrorDeNegocio(error);

    // EX-05: la misma confirmación dos veces agrega un solo tipo.
    const resultado = await ejecutarUnaVez(
      { clave: claveDeSolicitud(formData), usuarioId: usuario.id, operacion: "crear_tipo_prestacion" },
      async (tx) => {
        // EX-02: único sin distinguir mayúsculas ni acentos (D132).
        const [existente] = await tx`
          select nombre from public.tipo_prestacion where public.normalizar(nombre) = public.normalizar(${nombre})
        `;
        if (existente) return { error: `${existente.nombre} ya está en el catálogo.` };

        const [tipo] = await tx<{ id: string }[]>`
          insert into public.tipo_prestacion (nombre, descripcion, creado_por)
          values (${nombre}, ${descripcion || null}, ${usuario.id})
          returning id
        `;
        await auditar(tx, {
          usuarioId: usuario.id,
          accion: "alta",
          entidad: "tipo_prestacion",
          entidadId: tipo.id,
          detalle: { nombre, descripcion: descripcion || null },
        });
        return { error: null };
      },
    );
    if (resultado.error) throw new ErrorDeNegocio(resultado.error);

    revalidatePath("/catalogo");
    return `Se agregó ${nombre} al catálogo.`;
  });
}
