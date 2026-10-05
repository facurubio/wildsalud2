import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { Card, CardContent } from "@/components/ui/card";
import { resumenCobertura } from "@/lib/cobertura/consultas";
import { db } from "@/lib/db";
import { obtenerMascota } from "@/lib/mascotas/consultas";
import { formatearAfiliado } from "@/lib/mascotas/validacion";
import { esUuid } from "@/lib/operacion";
import { usuarioDePagina } from "@/lib/pagina";
import { ahora } from "@/lib/tiempo";
import { registrarConsumo } from "../../acciones-atencion";
import { FormularioConsumo } from "./formulario-consumo";

// CU-39 Registrar consumo, desde la ficha (CU-38).
export default async function PaginaRegistrarConsumo({ params }: PageProps<"/mascotas/[id]/consumo">) {
  const acceso = await usuarioDePagina("veterinario");
  if (!acceso.usuario) return <Aviso tipo="error">{acceso.error}</Aviso>;

  const { id } = await params;
  const mascota = esUuid(id) ? await obtenerMascota(db(), id) : null;
  if (!mascota || mascota.estado === "dada_de_baja") return <Aviso tipo="error">La mascota ya no está disponible.</Aviso>;

  const resumen = await resumenCobertura(db(), mascota.id, ahora());
  const volver = (
    <Link href={`/mascotas/${mascota.id}`} className="text-sm underline-offset-4 hover:underline">
      ← Volver a la ficha
    </Link>
  );
  if (!resumen) {
    return (
      <div className="space-y-4">
        <Aviso tipo="error">{mascota.nombre} no tiene una cobertura vigente.</Aviso>
        {volver}
      </div>
    );
  }
  if (resumen.estado === "suspendida") {
    return (
      <div className="space-y-4">
        <Aviso tipo="error">La cobertura de {mascota.nombre} está suspendida por falta de pago.</Aviso>
        {volver}
      </div>
    );
  }

  const opciones = resumen.saldos.map((s) => ({
    tipoPrestacionId: s.tipoPrestacionId,
    nombre: s.nombre,
    disponible: s.estado === "disponible",
    detalle:
      s.estado === "no_habilitada"
        ? `No habilitada todavía: ${s.periodosQueFaltan === 1 ? "falta 1 período pago" : `faltan ${s.periodosQueFaltan} períodos pagos`}`
        : s.estado === "agotada"
          ? "Agotada en el período"
          : s.saldo === null
            ? "Ilimitada"
            : `Saldo del ${s.periodicidad === "mensual" ? "mes" : "año"}: ${s.saldo}`,
  }));

  return (
    <div className="space-y-6">
      <Encabezado
        titulo={`Registrar consumo de ${mascota.nombre}`}
        descripcion={`Afiliado N.º ${formatearAfiliado(mascota.numeroAfiliado)} · Plan ${resumen.cobertura.planNombre}`}
      />
      <Card>
        <CardContent>
          <FormularioConsumo accion={registrarConsumo.bind(null, mascota.id)} opciones={opciones} mascota={mascota.nombre} />
        </CardContent>
      </Card>
      {volver}
    </div>
  );
}
