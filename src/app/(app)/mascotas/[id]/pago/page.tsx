import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { EstadoCoberturaBadge } from "@/components/mascota/cobertura";
import { Card, CardContent } from "@/components/ui/card";
import { calcularEstado, periodosAPagar } from "@/lib/cobertura/calculo";
import { coberturaVigente, versionesDelPlan } from "@/lib/cobertura/consultas";
import { db } from "@/lib/db";
import { obtenerDueno, obtenerMascota } from "@/lib/mascotas/consultas";
import { formatearAfiliado } from "@/lib/mascotas/validacion";
import { esUuid } from "@/lib/operacion";
import { usuarioDePagina } from "@/lib/pagina";
import { precioDelPeriodo } from "@/lib/pagos/reglas";
import { ahora, fechaHoy } from "@/lib/tiempo";
import { registrarPago } from "../../acciones";
import { FormularioPago } from "./formulario-pago";

// CU-26 Registrar pago (cobertura vigente). La deuda congelada (FA-04) no se da en la v1: no hay bajas.
export default async function PaginaRegistrarPago({ params }: PageProps<"/mascotas/[id]/pago">) {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const { id } = await params;
  const mascota = esUuid(id) ? await obtenerMascota(db(), id) : null;
  if (!mascota) return <Aviso tipo="error">La mascota ya no está disponible.</Aviso>;

  const momento = ahora();
  const cobertura = await coberturaVigente(db(), mascota.id);
  if (!cobertura) return <Aviso tipo="error">{mascota.nombre} no tiene una cobertura vigente ni deuda pendiente.</Aviso>; // EX-02

  const pendientes = periodosAPagar(cobertura, momento);
  if (pendientes.length === 0) {
    return (
      <Aviso tipo="error">
        No hay períodos pendientes de pago para {mascota.nombre}. No se permiten pagos anticipados.
      </Aviso>
    ); // EX-01
  }

  const [dueno, versiones] = await Promise.all([obtenerDueno(db(), mascota.duenoId), versionesDelPlan(db(), cobertura.planId)]);
  const { estado } = calcularEstado({ ...cobertura, dadaDeBaja: false }, momento);
  const periodos = pendientes.map((periodo) => ({ periodo, importe: precioDelPeriodo(versiones, periodo) ?? 0 }));

  return (
    <div className="space-y-6">
      <Encabezado
        titulo={`Registrar pago de ${mascota.nombre}`}
        descripcion={`Afiliado N.º ${formatearAfiliado(mascota.numeroAfiliado)} · ${dueno ? `${dueno.nombre} ${dueno.apellido}` : ""} · Plan ${cobertura.planNombre}`}
      />
      <EstadoCoberturaBadge estado={estado} />
      <Card>
        <CardContent>
          <FormularioPago
            accion={registrarPago.bind(null, mascota.id)}
            periodos={periodos}
            formaPreferida={dueno?.formaPagoPreferida ?? "efectivo"}
            hoy={fechaHoy(momento)}
            nombreMascota={mascota.nombre}
            suspendida={estado === "suspendida"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
