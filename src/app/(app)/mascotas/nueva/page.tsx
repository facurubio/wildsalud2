import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { CamposFicha } from "@/components/mascota/campos-ficha";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { planesParaAsignar } from "@/lib/mascotas/consultas";
import { esUuid } from "@/lib/operacion";
import { usuarioDePagina } from "@/lib/pagina";
import type { FormaPago } from "@/lib/pagos/reglas";
import { ahora, fechaHoy, periodoMensual } from "@/lib/tiempo";
import { darDeAltaMascota } from "../acciones";
import { FormularioAlta } from "./formulario-alta";

// CU-13 Dar de alta mascota. El dueño se elige en el mismo formulario; desde la ficha del dueño
// (/mascotas/nueva?dueno=<id>) llega ya elegido. Su cuenta activa y su deuda se validan al confirmar.
export default async function PaginaNuevaMascota({ searchParams }: PageProps<"/mascotas/nueva">) {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const { dueno: duenoId } = await searchParams;
  const duenos = await db()<{ id: string; dni: string; nombre: string; forma_pago_preferida: FormaPago }[]>`
    select u.id, u.dni, u.apellido || ', ' || u.nombre as nombre, d.forma_pago_preferida
    from public.usuario u join public.dueno d on d.usuario_id = u.id
    where u.rol = 'dueno' and u.estado_cuenta <> 'inactivo'
    order by public.normalizar(u.apellido), public.normalizar(u.nombre)
  `;
  const inicial = typeof duenoId === "string" && esUuid(duenoId) ? duenos.find((d) => d.id === duenoId) : undefined;

  const momento = ahora();
  const periodo = periodoMensual(momento);
  const planes = await planesParaAsignar(db(), periodo);

  return (
    <div className="space-y-6">
      <Encabezado titulo="Dar de alta mascota" descripcion="Se registra con su plan y el pago de la cuota del mes en curso." />
      {duenos.length === 0 && <Aviso tipo="info">Todavía no hay dueños. Primero dalo de alta en Dueños.</Aviso>}
      <Card>
        <CardContent>
          <FormularioAlta
            accion={darDeAltaMascota}
            duenos={duenos.map((d) => ({ dni: d.dni, nombre: d.nombre, formaPagoPreferida: d.forma_pago_preferida }))}
            duenoInicial={inicial?.dni}
            planes={planes}
            hoy={fechaHoy(momento)}
            periodo={periodo}
          >
            <CamposFicha />
          </FormularioAlta>
        </CardContent>
      </Card>
    </div>
  );
}
