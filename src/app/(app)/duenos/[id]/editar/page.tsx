import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { Card, CardContent } from "@/components/ui/card";
import { esUuid } from "@/lib/operacion";
import { usuarioDePagina } from "@/lib/pagina";
import { obtenerDueno } from "@/lib/personas/consultas";
import { datosDeDueno, huellaDeDatos, nombreCompleto } from "@/lib/personas/validacion";
import { editarDueno } from "../../acciones";
import { FormularioDueno } from "../../formulario-dueno";

// CU-09 Editar dueño. El estado de la cuenta no se edita acá.
export default async function PaginaEditarDueno({ params }: PageProps<"/duenos/[id]/editar">) {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const { id } = await params;
  const dueno = esUuid(id) ? await obtenerDueno(id) : null;
  if (!dueno) return <Aviso tipo="error">El dueño ya no está disponible.</Aviso>;

  // Precondición 2 / RN-10: a un dueño dado de baja no se le modifican los datos.
  if (dueno.estadoCuenta === "inactivo") {
    return (
      <Aviso tipo="error">
        La cuenta de {nombreCompleto(dueno)} está inactiva. Reactivala antes de modificar sus datos.
      </Aviso>
    );
  }

  const datos = datosDeDueno(dueno);
  return (
    <div className="space-y-6">
      <Encabezado titulo={`Editar a ${nombreCompleto(dueno)}`} />
      <Card>
        <CardContent>
          <FormularioDueno
            accion={editarDueno.bind(null, dueno.id)}
            textoBoton="Guardar cambios"
            inicial={datos}
            huella={huellaDeDatos(datos)}
          />
        </CardContent>
      </Card>
      <Link href={`/duenos/${dueno.id}`} className="text-sm underline-offset-4 hover:underline">
        Cancelar
      </Link>
    </div>
  );
}
