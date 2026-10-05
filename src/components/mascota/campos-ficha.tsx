import { Campo, Seleccion } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Mascota } from "@/lib/mascotas/consultas";
import { LARGOS } from "@/lib/mascotas/validacion";

// Campos de la ficha de la mascota (CU-13 RN-04), para el alta y la edición.
// En la v1 no se carga foto (docs/alcance-v1.md).
export function CamposFicha({ inicial }: { inicial?: Mascota }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo etiqueta="Nombre" htmlFor="nombre">
        <Input id="nombre" name="nombre" maxLength={LARGOS.nombre[1]} defaultValue={inicial?.nombre} />
      </Campo>
      <Campo etiqueta="Especie" htmlFor="especie" ayuda="Ej.: Perro, Gato, Conejo">
        <Input id="especie" name="especie" maxLength={LARGOS.especie[1]} defaultValue={inicial?.especie} />
      </Campo>
      <Campo etiqueta="Raza (opcional)" htmlFor="raza">
        <Input id="raza" name="raza" maxLength={LARGOS.raza[1]} defaultValue={inicial?.raza ?? ""} />
      </Campo>
      <Campo etiqueta="Color (opcional)" htmlFor="color">
        <Input id="color" name="color" maxLength={LARGOS.color[1]} defaultValue={inicial?.color ?? ""} />
      </Campo>
      <Campo etiqueta="Sexo" htmlFor="sexo">
        <Seleccion id="sexo" name="sexo" defaultValue={inicial?.sexo ?? ""}>
          <option value="">Elegí una opción…</option>
          <option value="macho">Macho</option>
          <option value="hembra">Hembra</option>
        </Seleccion>
      </Campo>
      <Campo etiqueta="Castrado/a" htmlFor="castrado">
        <Seleccion id="castrado" name="castrado" defaultValue={inicial?.castrado ?? ""}>
          <option value="">Elegí una opción…</option>
          <option value="si">Sí</option>
          <option value="no">No</option>
          <option value="no_se_sabe">No se sabe</option>
        </Seleccion>
      </Campo>
      <Campo etiqueta="Edad aproximada (años)" htmlFor="edadAproximada" ayuda="0 = menos de un año">
        <Input
          id="edadAproximada"
          name="edadAproximada"
          inputMode="numeric"
          defaultValue={inicial?.edadAproximada}
        />
      </Campo>
      <div className="hidden sm:block" />
      <Campo etiqueta="Enfermedades previas o crónicas (opcional)" htmlFor="enfermedades" className="sm:col-span-2">
        <Textarea
          id="enfermedades"
          name="enfermedades"
          rows={2}
          maxLength={LARGOS.enfermedades[1]}
          defaultValue={inicial?.enfermedades ?? ""}
        />
      </Campo>
      <Campo etiqueta="Alimentación (opcional)" htmlFor="alimentacion" className="sm:col-span-2">
        <Textarea
          id="alimentacion"
          name="alimentacion"
          rows={2}
          maxLength={LARGOS.alimentacion[1]}
          defaultValue={inicial?.alimentacion ?? ""}
        />
      </Campo>
    </div>
  );
}
