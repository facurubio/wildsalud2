import { cn } from "@/lib/utils";

const estilos = {
  error: "border-destructive/30 bg-destructive/10",
  exito: "border-emerald-600/30 bg-emerald-600/10",
  info: "border-border bg-muted",
} as const;

// Mensaje destacado: errores, confirmaciones y alertas.
export function Aviso({
  tipo,
  children,
  className,
}: {
  tipo: keyof typeof estilos;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      role={tipo === "error" ? "alert" : "status"}
      className={cn("rounded-md border px-3 py-2 text-sm", estilos[tipo], className)}
    >
      {children}
    </p>
  );
}
