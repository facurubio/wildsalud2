import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EstadoCobertura, SaldoPrestacion } from "@/lib/cobertura/calculo";
import type { ResumenCobertura } from "@/lib/cobertura/consultas";
import { formatearFechaHora, formatearPeriodo } from "@/lib/formato";

const textoEstado: Record<EstadoCobertura, string> = {
  al_dia: "Al día",
  suspendida: "Suspendida por falta de pago",
  dada_de_baja: "Dada de baja",
};

export function EstadoCoberturaBadge({ estado }: { estado: EstadoCobertura | null }) {
  if (!estado) return <Badge variant="secondary">Sin cobertura vigente</Badge>;
  return <Badge variant={estado === "al_dia" ? "default" : "destructive"}>{textoEstado[estado]}</Badge>;
}

function estadoPrestacion(s: SaldoPrestacion): string {
  if (s.estado === "no_habilitada") {
    return `No habilitada todavía: ${s.periodosQueFaltan === 1 ? "falta 1 período pago" : `faltan ${s.periodosQueFaltan} períodos pagos`}`;
  }
  return s.estado === "agotada" ? "Agotada" : "Disponible";
}

// CU-38 paso 4: prestaciones del plan con periodicidad, límite, consumidas, saldo y estado.
export function TablaPrestaciones({ saldos }: { saldos: SaldoPrestacion[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Prestación</TableHead>
          <TableHead className="hidden sm:table-cell">Periodicidad</TableHead>
          <TableHead className="hidden sm:table-cell">Límite</TableHead>
          <TableHead>Usadas</TableHead>
          <TableHead>Saldo</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {saldos.map((s) => (
          <TableRow key={s.tipoPrestacionId}>
            <TableCell className="font-medium">{s.nombre}</TableCell>
            <TableCell className="hidden sm:table-cell">{s.periodicidad === "mensual" ? "Mensual" : "Anual"}</TableCell>
            <TableCell className="hidden sm:table-cell">{s.limite ?? "Ilimitada"}</TableCell>
            <TableCell>{s.consumidas}</TableCell>
            <TableCell>{s.saldo ?? "Ilimitada"}</TableCell>
            <TableCell className="whitespace-normal">
              <Badge variant={s.estado === "disponible" ? "outline" : "secondary"}>{estadoPrestacion(s)}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// CU-38 paso 5: consumos del período en curso (fecha, prestación y veterinaria).
export function ConsumosDelPeriodo({
  consumos,
  accion,
}: {
  consumos: ResumenCobertura["consumosDelPeriodo"];
  accion?: (consumoId: string) => React.ReactNode;
}) {
  if (consumos.length === 0) return <p className="text-sm text-muted-foreground">Sin consumos en el período en curso.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Prestación</TableHead>
          <TableHead>Veterinaria</TableHead>
          {accion && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {consumos.map((c) => (
          <TableRow key={c.id}>
            <TableCell>{formatearFechaHora(c.registradoEn)}</TableCell>
            <TableCell>{c.prestacion}</TableCell>
            <TableCell>{c.veterinaria}</TableCell>
            {accion && <TableCell className="text-right">{accion(c.id)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// CU-38 RN-04: alertas de cobertura suspendida y prestaciones agotadas.
export function alertasDeCobertura(nombreMascota: string, resumen: ResumenCobertura | null): string[] {
  if (!resumen) return [`${nombreMascota} no tiene una cobertura vigente.`];
  const alertas: string[] = [];
  if (resumen.estado === "suspendida") alertas.push("Cobertura suspendida por falta de pago. No se pueden registrar consumos.");
  for (const s of resumen.saldos.filter((s) => s.estado === "agotada")) {
    const periodo = s.periodicidad === "mensual" ? s.periodo.slice(0, 7) : s.periodo.slice(0, 4);
    alertas.push(`${s.nombre} está agotada para el período ${periodo}.`);
  }
  return alertas;
}

export function textoPeriodos(periodos: string[]): string {
  return periodos.map(formatearPeriodo).join(", ");
}
