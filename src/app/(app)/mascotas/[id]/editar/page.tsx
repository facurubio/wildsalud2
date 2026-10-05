import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { Formulario } from "@/components/formulario";
import { CamposFicha } from "@/components/mascota/campos-ficha";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { obtenerMascota } from "@/lib/mascotas/consultas";
import { formatearAfiliado } from "@/lib/mascotas/validacion";
import { esUuid } from "@/lib/operacion";
import { usuarioDePagina } from "@/lib/pagina";
import { editarMascota } from "../../acciones";

// CU-14 Editar mascota: datos de la ficha. El número de afiliado y la fecha de alta son de solo lectura.
export default async function PaginaEditarMascota({ params }: PageProps<"/mascotas/[id]/editar">) {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  const { id } = await params;
  const mascota = esUuid(id) ? await obtenerMascota(db(), id) : null;
  if (!mascota) return <Aviso tipo="error">La mascota ya no está disponible.</Aviso>;
  if (mascota.estado === "dada_de_baja") {
    return <Aviso tipo="error">La mascota {mascota.nombre} está dada de baja y su ficha no se puede modificar.</Aviso>;
  }

  return (
    <div className="space-y-6">
      <Encabezado titulo={`Editar ${mascota.nombre}`} descripcion={`Afiliado N.º ${formatearAfiliado(mascota.numeroAfiliado)}`} />
      <Card>
        <CardContent>
          <Formulario accion={editarMascota.bind(null, mascota.id)} textoBoton="Guardar">
            <input type="hidden" name="version" value={mascota.version} />
            <CamposFicha inicial={mascota} />
          </Formulario>
        </CardContent>
      </Card>
    </div>
  );
}
