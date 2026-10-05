// CU-13 RN-04 y RN-05 (y CU-14 RN-03): datos de la ficha de la mascota. Función pura.

export type Sexo = "macho" | "hembra";
export type Castrado = "si" | "no" | "no_se_sabe";

export type FichaFormulario = {
  nombre: string;
  especie: string;
  raza: string;
  sexo: string;
  color: string;
  castrado: string;
  enfermedades: string;
  alimentacion: string;
  edadAproximada: string;
};

export type Ficha = {
  nombre: string;
  especie: string;
  raza: string | null;
  sexo: Sexo;
  color: string | null;
  castrado: Castrado;
  enfermedades: string | null;
  alimentacion: string | null;
  edadAproximada: number;
};

// Largos máximos de RN-04, con el nombre del campo como se muestra en los mensajes.
export const LARGOS: Record<keyof Omit<FichaFormulario, "sexo" | "castrado" | "edadAproximada">, [string, number]> = {
  nombre: ["nombre", 50],
  especie: ["especie", 30],
  raza: ["raza", 50],
  color: ["color", 50],
  alimentacion: ["alimentación", 500],
  enfermedades: ["enfermedades previas o crónicas", 1000],
};

export function validarFicha(datos: FichaFormulario): { ficha: Ficha; error?: never } | { ficha?: never; error: string } {
  const d = Object.fromEntries(Object.entries(datos).map(([k, v]) => [k, v.trim()])) as FichaFormulario;

  // EX-03: obligatorios, en el orden de la ficha.
  const obligatorios: [keyof FichaFormulario, string][] = [
    ["nombre", "nombre"],
    ["especie", "especie"],
    ["sexo", "sexo"],
    ["castrado", "castrado/a"],
    ["edadAproximada", "edad aproximada"],
  ];
  for (const [clave, etiqueta] of obligatorios) {
    if (!d[clave]) return { error: `Completá el campo ${etiqueta}.` };
  }

  // EX-05: largos máximos.
  for (const [clave, [etiqueta, maximo]] of Object.entries(LARGOS) as [keyof typeof LARGOS, [string, number]][]) {
    if (d[clave].length > maximo) return { error: `El campo ${etiqueta} admite hasta ${maximo} caracteres.` };
  }

  if (d.sexo !== "macho" && d.sexo !== "hembra") return { error: "Completá el campo sexo." };
  if (d.castrado !== "si" && d.castrado !== "no" && d.castrado !== "no_se_sabe") {
    return { error: "Completá el campo castrado/a." };
  }

  // EX-04 / RN-05: entero de 0 a 30.
  const edad = /^\d+$/.test(d.edadAproximada) ? Number(d.edadAproximada) : Number.NaN;
  if (!Number.isInteger(edad) || edad < 0 || edad > 30) {
    return { error: "Ingresá la edad aproximada en años: un número entero entre 0 y 30." };
  }

  return {
    ficha: {
      nombre: d.nombre,
      especie: d.especie,
      raza: d.raza || null,
      sexo: d.sexo,
      color: d.color || null,
      castrado: d.castrado,
      enfermedades: d.enfermedades || null,
      alimentacion: d.alimentacion || null,
      edadAproximada: edad,
    },
  };
}

export const nombreSexo: Record<Sexo, string> = { macho: "Macho", hembra: "Hembra" };
export const nombreCastrado: Record<Castrado, string> = { si: "Sí", no: "No", no_se_sabe: "No se sabe" };

// Número de afiliado con seis dígitos (CU-13 RN-06).
export function formatearAfiliado(numero: number): string {
  return String(numero).padStart(6, "0");
}
