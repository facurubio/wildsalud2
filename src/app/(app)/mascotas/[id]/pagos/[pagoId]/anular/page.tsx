import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { Campo, Formulario } from "@/components/formulario";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { calcularAntiguedad, calcularEstado } from "@/lib/cobertura/calculo";
import { coberturaVigente } from "@/lib/cobertura/consultas";
import { db } from "@/lib/db";
import { formatearImporte, formatearPeriodo } from "@/lib/formato";
import { obtenerMascota, pagosDeMascota } from "@/lib/mascotas/consultas";
import { esUuid } from "@/lib/operacion";
import { usuarioDePagina } from "@/lib/pagina";
import { formasDePago } from "@/lib/pagos/reglas";
import { ahora } from "@/lib/tiempo";
import { anularPago } from "../../../../acciones";

// CU-28 Anular pago: muestra el pago y cómo queda la cobertura si se anula (paso 2), y pide el motivo.
export default async function PaginaAnularPago({ params }: PageProps<"/mascotas/[id]/pagos/[pagoId]/anular">) {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const { id, pagoId } = await params;
  const mascota = esUuid(id) ? await obtenerMascota(db(), id) : null;
  const pago = mascota ? (await pagosDeMascota(mascota.id)).find((p) => p.id === pagoId) : null;
  if (!mascota || !pago) return <Aviso tipo="error">El pago ya no está disponible.</Aviso>;
  if (pago.estado === "anulado") return <Aviso tipo="error">El pago ya está anulado.</Aviso>;
  if (pago.esPrimerPago) return <Aviso tipo="error">No se puede anular el primer pago de una cobertura.</Aviso>;

  // Paso 2: cómo queda la cobertura si se anula.
  const cobertura = await coberturaVigente(db(), mascota.id);
  let efecto: string | null = null;
  if (cobertura && cobertura.id === pago.coberturaId) {
    const momento = ahora();
    const pagos = cobertura.pagos.map((p) =>
      p.periodo === pago.periodo && !p.anuladoEn ? { ...p, anuladoEn: momento } : p,
    );
    const despues = calcularEstado({ iniciadaEn: cobertura.iniciadaEn, dadaDeBaja: false, pagos }, momento);
    const cantidad = calcularAntiguedad(cobertura.periodosPagos.filter((p) => p !== pago.periodo));
    const antiguedad = `${cantidad} ${cantidad === 1 ? "período pago" : "períodos pagos"}`;
    efecto =
      despues.estado === "suspendida"
        ? `Si lo anulás, la cobertura de ${mascota.nombre} se va a suspender por falta de pago y va a quedar con ${antiguedad}.`
        : `Si lo anulás, la cobertura de ${mascota.nombre} sigue al día, con ${antiguedad}; ${formatearPeriodo(pago.periodo)} vuelve a quedar pendiente de pago.`;
  }

  return (
    <div className="space-y-6">
      <Encabezado
        titulo={`Anular pago de ${mascota.nombre}`}
        descripcion={`${formatearPeriodo(pago.periodo)} · ${formatearImporte(pago.importe)} · ${formasDePago[pago.formaPago]} · pagado el ${pago.fechaPago.split("-").reverse().join("/")}`}
      />
      {efecto && <Aviso tipo="info">{efecto}</Aviso>}
      <Card>
        <CardContent>
          <Formulario accion={anularPago.bind(null, mascota.id, pago.id)} textoBoton="Anular pago">
            <Campo etiqueta="Motivo de la anulación" htmlFor="motivo">
              <Textarea id="motivo" name="motivo" rows={3} />
            </Campo>
          </Formulario>
        </CardContent>
      </Card>
    </div>
  );
}
