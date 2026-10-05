import { Badge } from "@/components/ui/badge";

const estados = {
  invitado: { texto: "Invitado", variante: "secondary" },
  activo: { texto: "Activo", variante: "default" },
  inactivo: { texto: "Dado de baja", variante: "destructive" },
} as const;

// Estado de la cuenta de una persona (D47).
export function EtiquetaEstado({ estado }: { estado: keyof typeof estados }) {
  const { texto, variante } = estados[estado];
  return <Badge variant={variante}>{texto}</Badge>;
}
