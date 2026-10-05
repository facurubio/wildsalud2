import "server-only";
import type postgres from "postgres";
import { db } from "@/lib/db";
import { ahora } from "@/lib/tiempo";
import { codigoConFormatoValido, hashCodigo } from "./codigo";
import type { MotivoVinculacion } from "./mensajes";
import { validarInvitacion, type EstadoCuenta, type EstadoInvitacion, type RolInvitado } from "./validacion";

type FilaInvitacion = {
  invitacion_id: string;
  estado: EstadoInvitacion;
  vence_en: Date;
  usuario_id: string;
  rol: RolInvitado;
  estado_cuenta: EstadoCuenta;
  nombre: string;
};

async function buscarInvitacion(sql: postgres.Sql | postgres.TransactionSql, codigo: string, bloquear: boolean) {
  if (!codigoConFormatoValido(codigo)) return null;
  const [fila] = await sql<FilaInvitacion[]>`
    select i.id as invitacion_id, i.estado, i.vence_en,
           u.id as usuario_id, u.rol, u.estado_cuenta, u.nombre
    from public.invitacion i
    join public.usuario u on u.id = i.usuario_id
    where i.token_hash = ${hashCodigo(codigo)}
    ${bloquear ? sql`for update of i, u` : sql``}
  `;
  return fila ?? null;
}

function motivoRechazo(fila: FilaInvitacion | null) {
  return validarInvitacion(
    fila && {
      estado: fila.estado,
      venceEn: fila.vence_en,
      usuario: { rol: fila.rol, estadoCuenta: fila.estado_cuenta },
    },
    ahora(),
  );
}

export type InvitacionAbierta =
  | { valida: true; nombre: string; rol: RolInvitado }
  | { valida: false; motivo: MotivoVinculacion; rol: RolInvitado | null };

// CU-01 paso 2: valida la invitación al abrir el enlace.
export async function abrirInvitacion(codigo: string): Promise<InvitacionAbierta> {
  const fila = await buscarInvitacion(db(), codigo, false);
  const motivo = motivoRechazo(fila);
  if (motivo || !fila) return { valida: false, motivo: motivo ?? "enlace-invalido", rol: fila?.rol ?? null };
  return { valida: true, nombre: fila.nombre, rol: fila.rol };
}

export type ResultadoVinculacion =
  | { vinculada: true; reemplazo: boolean }
  | { vinculada: false; motivo: MotivoVinculacion; rol: RolInvitado | null };

// CU-01 pasos 7 a 9: vuelve a validar y vincula la cuenta de Google, todo en una transacción.
// El bloqueo de la invitación hace que dos usos simultáneos vinculen una sola cuenta (EX-09, RN-10).
export async function vincularCuenta(datos: {
  codigo: string;
  cuentaProveedorId: string;
  authUserId: string;
}): Promise<ResultadoVinculacion> {
  return db().begin(async (tx) => {
    const fila = await buscarInvitacion(tx, datos.codigo, true);
    const motivo = motivoRechazo(fila);
    if (motivo || !fila) return { vinculada: false, motivo: motivo ?? "enlace-invalido", rol: fila?.rol ?? null };

    // RN-04: la cuenta de Google no puede estar vinculada a otro usuario, activo o dado de baja.
    const [deOtro] = await tx`
      select 1 from public.vinculacion
      where proveedor = 'google' and cuenta_proveedor_id = ${datos.cuentaProveedorId}
        and finalizada_en is null and usuario_id <> ${fila.usuario_id}
    `;
    if (deOtro) return { vinculada: false, motivo: "cuenta-de-otro-usuario", rol: fila.rol };

    // RN-06 / FA-02: si ya tenía una cuenta vinculada, la nueva la reemplaza.
    const [anterior] = await tx<{ id: string; proveedor: string }[]>`
      update public.vinculacion
      set finalizada_en = now(), motivo_fin = 'reemplazada'
      where usuario_id = ${fila.usuario_id} and finalizada_en is null
      returning id, proveedor
    `;
    if (anterior) {
      await tx`
        update public.sesion set cerrada_en = now(), motivo_cierre = 'cuenta_reemplazada'
        where vinculacion_id = ${anterior.id} and cerrada_en is null
      `;
    }

    await tx`
      insert into public.vinculacion (usuario_id, proveedor, cuenta_proveedor_id, auth_user_id)
      values (${fila.usuario_id}, 'google', ${datos.cuentaProveedorId}, ${datos.authUserId})
    `;
    await tx`
      update public.invitacion set estado = 'vigente', aceptada_en = now()
      where id = ${fila.invitacion_id}
    `;
    if (fila.estado_cuenta === "invitado") {
      await tx`update public.usuario set estado_cuenta = 'activo' where id = ${fila.usuario_id}`;
    }

    // RN-11 y CU-02 RN-08: la vinculación y el inicio de sesión quedan auditados.
    const detalle = { proveedor: "google", ...(anterior ? { proveedor_anterior: anterior.proveedor } : {}) };
    await tx`
      insert into public.auditoria (usuario_id, accion, entidad, entidad_id, detalle)
      values (${fila.usuario_id}, 'vinculacion', 'usuario', ${fila.usuario_id}, ${tx.json(detalle)}),
             (${fila.usuario_id}, 'inicio_sesion', 'usuario', ${fila.usuario_id}, null)
    `;

    return { vinculada: true, reemplazo: Boolean(anterior) };
  });
}
