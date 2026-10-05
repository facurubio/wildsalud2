import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { EtiquetaEstado } from "@/components/etiqueta-estado";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatearFechaHora } from "@/lib/formato";
import { esUuid } from "@/lib/operacion";
import { usuarioDePagina } from "@/lib/pagina";
import { obtenerVeterinario, type VeterinarioDetalle } from "@/lib/personas/consultas";
import { nombreCompleto } from "@/lib/personas/validacion";
import { ahora } from "@/lib/tiempo";
import { generarEnlaceVeterinario } from "../acciones";
import { FormularioConEnlace } from "../formulario-con-enlace";

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{etiqueta}</dt>
      <dd className="font-medium break-words">{children}</dd>
    </div>
  );
}

// Cómo está el acceso de la cuenta (CU-12 RN-08, sin emails: el enlace se manda por WhatsApp).
function textoDeAcceso(v: VeterinarioDetalle): string {
  if (v.estadoCuenta === "inactivo") return "Sin acceso: la cuenta está dada de baja.";
  if (v.estadoCuenta === "activo") {
    const proveedor = v.proveedor === "google" ? "Google" : (v.proveedor ?? "Google");
    return `Cuenta de ${proveedor} vinculada${v.vinculadaEn ? ` el ${formatearFechaHora(v.vinculadaEn)}` : ""}.`;
  }
  const invitacion = v.invitacion;
  if (invitacion?.estado === "invitado" && invitacion.venceEn.getTime() > ahora().getTime()) {
    return `Enlace de invitación vigente hasta el ${formatearFechaHora(invitacion.venceEn)}.`;
  }
  return "Todavía no vinculó su cuenta y no tiene un enlace vigente: generá uno nuevo.";
}

export default async function PaginaVeterinario({ params, searchParams }: PageProps<"/veterinarios/[id]">) {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const { id } = await params;
  const veterinario = esUuid(id) ? await obtenerVeterinario(id) : null;
  if (!veterinario) return <Aviso tipo="error">El veterinario ya no está disponible.</Aviso>;

  const nombre = nombreCompleto(veterinario);
  const { aviso } = await searchParams;
  const confirmacion =
    aviso === "creado"
      ? `Se dio de alta a ${nombre}.`
      : aviso === "editado"
        ? `Se actualizaron los datos de ${nombre}.`
        : aviso === "baja"
          ? `Se dio de baja a ${nombre}. Su cuenta quedó inactiva.`
          : null;
  const dadoDeBaja = veterinario.estadoCuenta === "inactivo";

  return (
    <div className="space-y-6">
      {confirmacion && <Aviso tipo="exito">{confirmacion}</Aviso>}
      <Encabezado
        titulo={nombre}
        descripcion={veterinario.veterinaria}
        acciones={
          !dadoDeBaja && (
            <Link href={`/veterinarios/${veterinario.id}/editar`} className={buttonVariants({ variant: "outline" })}>
              Editar
            </Link>
          )
        }
      />

      <Card>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Dato etiqueta="DNI">{veterinario.dni}</Dato>
            <Dato etiqueta="Veterinaria">{veterinario.veterinaria}</Dato>
            <Dato etiqueta="Teléfono">{veterinario.telefono}</Dato>
            <Dato etiqueta="Email">{veterinario.email}</Dato>
            <Dato etiqueta="Estado de la cuenta">
              <EtiquetaEstado estado={veterinario.estadoCuenta} />
            </Dato>
            <Dato etiqueta="Acceso">{textoDeAcceso(veterinario)}</Dato>
            {dadoDeBaja && (
              <>
                <Dato etiqueta="Fecha de la baja">{veterinario.bajaEn ? formatearFechaHora(veterinario.bajaEn) : "—"}</Dato>
                <Dato etiqueta="Dado de baja por">{veterinario.bajaPor ?? "—"}</Dato>
                <Dato etiqueta="Motivo de la baja">{veterinario.motivoBaja}</Dato>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      {veterinario.estadoCuenta === "invitado" && (
        <Card>
          <CardContent className="space-y-3">
            <h2 className="font-medium">Enlace de invitación</h2>
            <p className="text-sm text-muted-foreground">
              Si el enlace venció o se perdió, generá uno nuevo y mandáselo por WhatsApp. Al generarlo, los enlaces
              anteriores dejan de servir.
            </p>
            <FormularioConEnlace accion={generarEnlaceVeterinario.bind(null, veterinario.id)} textoBoton="Generar enlace nuevo" />
          </CardContent>
        </Card>
      )}

      <Link href="/veterinarios" className="text-sm underline-offset-4 hover:underline">
        ← Volver a veterinarios
      </Link>
    </div>
  );
}
