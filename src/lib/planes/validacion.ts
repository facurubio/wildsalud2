// CU-16 RN-01 a RN-04: validación de los datos de un plan. Función pura.
import { leerEntero, leerImporte } from "@/lib/formato";
import type { Periodicidad } from "@/lib/cobertura/calculo";

export type FilaPrestacionFormulario = {
  tipoPrestacionId: string;
  limite: string; // vacío: ilimitada
  periodicidad: string;
  periodosParaHabilitar: string;
};

export type DatosPlanFormulario = {
  nombre: string;
  precio: string;
  prestaciones: FilaPrestacionFormulario[];
};

export type PrestacionPlan = {
  tipoPrestacionId: string;
  limite: number | null;
  periodicidad: Periodicidad;
  periodosParaHabilitar: number;
};

export type PlanValidado = { nombre: string; precio: number; prestaciones: PrestacionPlan[] };

// Devuelve el plan normalizado o el mensaje del primer error, en el orden de las excepciones de CU-16.
export function validarPlan(
  datos: DatosPlanFormulario,
  nombresDeTipos: Map<string, string>,
): { plan: PlanValidado; error?: never } | { plan?: never; error: string } {
  const nombre = datos.nombre.trim();
  if (!nombre) return { error: "Completá el campo nombre." }; // EX-01
  if (!datos.precio.trim()) return { error: "Completá el campo precio." }; // EX-01

  const precio = leerImporte(datos.precio);
  if (precio === null || precio <= 0) return { error: "El precio tiene que ser mayor que cero." }; // EX-03

  if (datos.prestaciones.length === 0) return { error: "Agregá al menos una prestación al plan." }; // EX-04

  const vistos = new Set<string>();
  const prestaciones: PrestacionPlan[] = [];
  for (const fila of datos.prestaciones) {
    const nombreTipo = nombresDeTipos.get(fila.tipoPrestacionId);
    if (!nombreTipo) return { error: "Elegí la prestación de cada fila." };
    if (vistos.has(fila.tipoPrestacionId)) return { error: `${nombreTipo} ya está en el plan.` }; // EX-05
    vistos.add(fila.tipoPrestacionId);

    const limite = leerEntero(fila.limite.trim());
    const periodos = leerEntero(fila.periodosParaHabilitar.trim());
    const limiteValido = limite === null || (Number.isInteger(limite) && limite > 0);
    const periodosValidos = periodos !== null && Number.isInteger(periodos) && periodos >= 1;
    if (!limiteValido || !periodosValidos) {
      // EX-06
      return {
        error: `Revisá los valores de ${nombreTipo}: el límite tiene que ser mayor que cero y los períodos pagos, 1 o más.`,
      };
    }
    if (fila.periodicidad !== "mensual" && fila.periodicidad !== "anual") {
      return { error: `Elegí la periodicidad de ${nombreTipo}.` };
    }

    prestaciones.push({
      tipoPrestacionId: fila.tipoPrestacionId,
      limite,
      periodicidad: fila.periodicidad,
      periodosParaHabilitar: periodos,
    });
  }

  return { plan: { nombre, precio, prestaciones } };
}

// Compara las condiciones (precio y prestaciones) de dos versiones, sin importar el orden de las prestaciones.
export function mismasCondiciones(
  a: { precio: number; prestaciones: PrestacionPlan[] },
  b: { precio: number; prestaciones: PrestacionPlan[] },
): boolean {
  const clave = (p: PrestacionPlan) => `${p.tipoPrestacionId}|${p.limite}|${p.periodicidad}|${p.periodosParaHabilitar}`;
  const ordenar = (ps: PrestacionPlan[]) => ps.map(clave).sort().join(";");
  return a.precio === b.precio && ordenar(a.prestaciones) === ordenar(b.prestaciones);
}
