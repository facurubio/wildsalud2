import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { Campo, Formulario } from "@/components/formulario";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { consumosDeMascota } from "@/lib/atencion/consultas";
import { textoPeriodo } from "@/lib/atencion/reglas";
import { periodoDeConsumo } from "@/lib/cobertura/calculo";
import { resumenCobertura } from "@/lib/cobertura/consultas";
import { db } from "@/lib/db";
import { formatearFechaHora } from "@/lib/formato";
import { obtenerMascota } from "@/lib/mascotas/consultas";
import { esUuid } from "@/lib/operacion";
import { usuarioDePagina } from "@/lib/pagina";
import { ahora } from "@/lib/tiempo";
import { anularConsumo } from "../../../../acciones-atencion";

// CU-31 Anular consumo: muestra el consumo y cómo queda el saldo si se anula (paso 2), y pide el motivo.
export default async function PaginaAnularConsumo({ params }: PageProps<"/mascotas/[id]/consumos/[consumoId]/anular">) {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const { id, consumoId } = await params;
  const mascota = esUuid(id) ? await obtenerMascota(db(), id) : null;
  const consumo = mascota ? (await consumosDeMascota(mascota.id)).find((c) => c.id === consumoId) : null;
  if (!mascota || !consumo) return <Aviso tipo="error">El consumo ya no está disponible.</Aviso>;
  if (consumo.estado === "anulado") return <Aviso tipo="error">El consumo ya está anulado.</Aviso>;

  // Paso 2 y RN-03/RN-04: solo un consumo del período vigente devuelve saldo.
  const momento = ahora();
  const delPeriodoVigente = consumo.periodo === periodoDeConsumo(consumo.periodicidad, momento);
  const resumen = await resumenCobertura(db(), mascota.id, momento);
  const saldo = resumen?.saldos.find((s) => s.nombre === consumo.prestacion);
  const efecto = !delPeriodoVigente
    ? `Es de un período cerrado (${textoPeriodo(consumo)}): cambia solo el historial de ese período; no devuelve saldo al período actual.`
    : saldo
      ? `Si lo anulás, ${consumo.prestacion} vuelve a tener ${saldo.saldo === null ? "saldo ilimitado" : `saldo ${saldo.saldo + 1}`} en el período ${textoPeriodo(consumo)}.`
      : `Si lo anulás, deja de contar para el saldo de ${consumo.prestacion}.`;

  return (
    <div className="space-y-6">
      <Encabezado
        titulo={`Anular consumo de ${mascota.nombre}`}
        descripcion={`${consumo.prestacion} · ${formatearFechaHora(consumo.registradoEn)} · ${consumo.veterinario} (${consumo.veterinaria})`}
      />
      <Aviso tipo="info">{efecto}</Aviso>
      <Card>
        <CardContent>
          <Formulario accion={anularConsumo.bind(null, mascota.id, consumo.id)} textoBoton="Anular consumo">
            <Campo etiqueta="Motivo de la anulación" htmlFor="motivo">
              <Textarea id="motivo" name="motivo" rows={3} />
            </Campo>
          </Formulario>
        </CardContent>
      </Card>
    </div>
  );
}
