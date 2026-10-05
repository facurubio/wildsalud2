// CU-20 RN-01: datos de un tipo de prestación. Devuelve el mensaje del primer error, o null.
export const LARGO_NOMBRE = 40;
export const LARGO_DESCRIPCION = 200;

export function validarTipoPrestacion(datos: { nombre: string; descripcion: string }): string | null {
  if (!datos.nombre) return "Completá el campo nombre."; // EX-01
  if (datos.nombre.length > LARGO_NOMBRE) return `El campo nombre no puede tener más de ${LARGO_NOMBRE} caracteres.`; // EX-03
  if (datos.descripcion.length > LARGO_DESCRIPCION) {
    return `El campo descripción no puede tener más de ${LARGO_DESCRIPCION} caracteres.`; // EX-03
  }
  return null;
}
