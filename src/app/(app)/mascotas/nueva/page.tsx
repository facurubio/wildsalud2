import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { CamposFicha } from "@/components/mascota/campos-ficha";
import { Card, CardContent } from "@/components/ui/card";
import { mascotaConDeuda } from "@/lib/cobertura/consultas";
import { db } from "@/lib/db";
import { obtenerDueno, planesParaAsignar } from "@/lib/mascotas/consultas";
import { esUuid } from "@/lib/operacion";
import { usuarioDePagina } from "@/lib/pagina";
import { ahora, fechaHoy, periodoMensual } from "@/lib/tiempo";
import { darDeAltaMascota } from "../acciones";
import { FormularioAlta } from "./formulario-alta";

// CU-13 Dar de alta mascota, desde la ficha del dueño (/mascotas/nueva?dueno=<id>).
export default async function PaginaNuevaMascota({ searchParams }: PageProps<"/mascotas/nueva">) {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const { dueno: duenoId } = await searchParams;
  const dueno = typeof duenoId === "string" && esUuid(duenoId) ? await obtenerDueno(db(), duenoId) : null;
  if (!dueno) return <Aviso tipo="error">Elegí el dueño desde su ficha para darle de alta una mascota.</Aviso>;
  const nombreDueno = `${dueno.nombre} ${dueno.apellido}`;

  // Paso 2: dueño no dado de baja (EX-01) y sin deuda (EX-02).
  if (dueno.estadoCuenta === "inactivo") {
    return (
      <Aviso tipo="error">
        {nombreDueno} tiene la cuenta inactiva. Para darle de alta una mascota, primero reactivá su cuenta desde su ficha.
      </Aviso>
    );
  }
  const momento = ahora();
  const conDeuda = await mascotaConDeuda(db(), dueno.id, momento);
  if (conDeuda) {
    return (
      <Aviso tipo="error">
        {nombreDueno} tiene deuda pendiente de {conDeuda.nombre}. No se puede asignar un plan hasta saldarla.
      </Aviso>
    );
  }

  const periodo = periodoMensual(momento);
  const planes = await planesParaAsignar(db(), periodo);

  return (
    <div className="space-y-6">
      <Encabezado titulo="Dar de alta mascota" descripcion={`Dueño: ${nombreDueno} · DNI ${dueno.dni}`} />
      <Card>
        <CardContent>
          <FormularioAlta
            accion={darDeAltaMascota.bind(null, dueno.id)}
            planes={planes}
            formaPreferida={dueno.formaPagoPreferida}
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
