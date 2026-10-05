import { Aviso } from "@/components/aviso";
import { Encabezado } from "@/components/encabezado";
import { Card, CardContent } from "@/components/ui/card";
import { usuarioDePagina } from "@/lib/pagina";
import { altaVeterinario } from "../acciones";
import { FormularioVeterinario } from "../formulario-veterinario";

// CU-04 Dar de alta veterinario.
export default async function PaginaNuevoVeterinario() {
  const { error } = await usuarioDePagina("administrador");
  if (error) return <Aviso tipo="error">{error}</Aviso>;

  return (
    <div className="space-y-6">
      <Encabezado
        titulo="Dar de alta veterinario"
        descripcion="Al confirmar te mostramos un enlace de invitación para mandarle por WhatsApp. Con ese enlace vincula su cuenta de Google."
      />
      <Card>
        <CardContent>
          <FormularioVeterinario
            accion={altaVeterinario}
            textoBoton="Dar de alta"
            volver={{ href: "/veterinarios", texto: "Volver a veterinarios" }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
