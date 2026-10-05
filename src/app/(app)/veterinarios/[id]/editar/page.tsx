import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { Card, CardContent } from "@/components/ui/card";
import { esUuid } from "@/lib/operacion";
import { usuarioDePagina } from "@/lib/pagina";
import { obtenerVeterinario } from "@/lib/personas/consultas";
import { datosDeVeterinario, huellaDeDatos, nombreCompleto } from "@/lib/personas/validacion";
import { editarVeterinario } from "../../acciones";
import { FormularioVeterinario } from "../../formulario-veterinario";

// CU-05 Editar veterinario. El estado de la cuenta y la cuenta de Google vinculada son de solo lectura.
export default async function PaginaEditarVeterinario({ params }: PageProps<"/veterinarios/[id]/editar">) {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const { id } = await params;
  const veterinario = esUuid(id) ? await obtenerVeterinario(id) : null;
  if (!veterinario) return <Aviso tipo="error">El veterinario ya no está disponible.</Aviso>;

  // Precondición 2 / RN-05: a un veterinario dado de baja no se le modifican los datos.
  if (veterinario.estadoCuenta === "inactivo") {
    return (
      <Aviso tipo="error">
        La cuenta de {nombreCompleto(veterinario)} está inactiva. Reactivala antes de modificar sus datos.
      </Aviso>
    );
  }

  const datos = datosDeVeterinario(veterinario);
  const ficha = `/veterinarios/${veterinario.id}`;
  const cuentaVinculada =
    veterinario.proveedor === "google"
      ? "Sí, con Google"
      : veterinario.proveedor
        ? `Sí, con ${veterinario.proveedor}`
        : "No, todavía no vinculó su cuenta";

  return (
    <div className="space-y-6">
      <Encabezado titulo={`Editar a ${nombreCompleto(veterinario)}`} />
      <Card>
        <CardContent className="space-y-6">
          <dl className="grid gap-3 rounded-lg bg-muted p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Estado de la cuenta</dt>
              <dd className="font-medium">{veterinario.estadoCuenta === "activo" ? "Activo" : "Invitado"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Cuenta de Google vinculada</dt>
              <dd className="font-medium">{cuentaVinculada}</dd>
            </div>
          </dl>
          <FormularioVeterinario
            accion={editarVeterinario.bind(null, veterinario.id)}
            textoBoton="Guardar cambios"
            inicial={datos}
            huella={huellaDeDatos(datos)}
            volver={{ href: ficha, texto: "Volver a la ficha" }}
          />
          <Link href={ficha} className="block text-sm underline-offset-4 hover:underline">
            Cancelar
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
