// Validaciones y comparaciones de los datos de veterinarios y dueños (CU-04, CU-05, CU-06, CU-08, CU-09).
// Funciones puras: no leen la base ni el reloj.

export const MENSAJE_DNI = "Ingresá un DNI válido, de 7 u 8 dígitos.";
export const MENSAJE_TELEFONO = "Ingresá un teléfono válido, con código de área.";
export const MENSAJE_EMAIL = "Ingresá un email válido.";
export const MENSAJE_MOTIVO_BAJA = "Indicá el motivo de la baja.";
export const MENSAJE_SIN_CAMBIOS = "No hay cambios para guardar.";

export type Persona = { nombre: string; apellido: string };

export function nombreCompleto(persona: Persona): string {
  return `${persona.nombre} ${persona.apellido}`;
}

// ---------------------------------------------------------------------------
// Formatos (RN-02 de CU-04, CU-05, CU-08 y CU-09)
// ---------------------------------------------------------------------------

// DNI de 7 u 8 dígitos; se aceptan puntos y se guardan solo los dígitos. Devuelve null si no es válido.
export function leerDni(texto: string): string | null {
  const limpio = texto.trim().replace(/\./g, "");
  return /^\d{7,8}$/.test(limpio) ? limpio : null;
}

// Teléfono con código de área: entre 10 y 13 dígitos; se admiten espacios, guiones y el prefijo +54.
// Se guarda como lo escribió la persona, con los espacios repetidos reducidos a uno. Devuelve null si no es válido.
export function leerTelefono(texto: string): string | null {
  const limpio = texto.trim().replace(/\s+/g, " ");
  if (!/^\+?[\d -]+$/.test(limpio)) return null;
  const digitos = limpio.replace(/\D/g, "");
  if (limpio.startsWith("+") && !digitos.startsWith("54")) return null;
  return digitos.length >= 10 && digitos.length <= 13 ? limpio : null;
}

// Email con formato válido, guardado en minúsculas. Devuelve null si no es válido.
export function leerEmail(texto: string): string | null {
  const limpio = texto.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio) ? limpio : null;
}

// ---------------------------------------------------------------------------
// Forma de pago preferida (RN-06 de CU-08, RN-05 de CU-09)
// ---------------------------------------------------------------------------

export const FORMAS_DE_PAGO = [
  { valor: "efectivo", texto: "Efectivo" },
  { valor: "transferencia", texto: "Transferencia bancaria" },
  { valor: "tarjeta_debito", texto: "Tarjeta de débito" },
  { valor: "tarjeta_credito", texto: "Tarjeta de crédito" },
] as const;

export type FormaDePago = (typeof FORMAS_DE_PAGO)[number]["valor"];

export function textoFormaDePago(valor: string): string {
  return FORMAS_DE_PAGO.find((f) => f.valor === valor)?.texto ?? valor;
}

function leerFormaDePago(texto: string): FormaDePago | null {
  return FORMAS_DE_PAGO.find((f) => f.valor === texto)?.valor ?? null;
}

// ---------------------------------------------------------------------------
// Veterinario (CU-04 y CU-05)
// ---------------------------------------------------------------------------

export type DatosVeterinario = {
  nombre: string;
  apellido: string;
  dni: string;
  veterinaria: string;
  telefono: string;
  email: string;
};

export type ResultadoValidacion<T> = { datos: T; errores?: never } | { datos?: never; errores: string[] };

const faltaCampo = (campo: string) => `Completá el campo ${campo}.`; // EX-01
const faltaDireccion = (campo: string) => `Completá ${campo} de la dirección.`; // EX-02

// Validación de formato y datos obligatorios (RN-01 y RN-02). Informa todos los campos con error a la vez (RN-10).
export function validarVeterinario(entrada: DatosVeterinario): ResultadoValidacion<DatosVeterinario> {
  const errores: string[] = [];

  const nombre = entrada.nombre.trim();
  if (!nombre) errores.push(faltaCampo("nombre"));
  const apellido = entrada.apellido.trim();
  if (!apellido) errores.push(faltaCampo("apellido"));

  const dni = leerDni(entrada.dni);
  if (!entrada.dni.trim()) errores.push(faltaCampo("DNI"));
  else if (!dni) errores.push(MENSAJE_DNI);

  const veterinaria = entrada.veterinaria.trim();
  if (!veterinaria) errores.push(faltaCampo("veterinaria"));

  const telefono = leerTelefono(entrada.telefono);
  if (!entrada.telefono.trim()) errores.push(faltaCampo("teléfono"));
  else if (!telefono) errores.push(MENSAJE_TELEFONO);

  const email = leerEmail(entrada.email);
  if (!entrada.email.trim()) errores.push(faltaCampo("email"));
  else if (!email) errores.push(MENSAJE_EMAIL);

  if (errores.length > 0 || !dni || !telefono || !email) return { errores };
  return { datos: { nombre, apellido, dni, veterinaria, telefono, email } };
}

// ---------------------------------------------------------------------------
// Dueño (CU-08 y CU-09)
// ---------------------------------------------------------------------------

export type DatosDueno = {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  calle: string;
  numero: string;
  piso: string; // opcional: vacío si no tiene
  departamento: string; // opcional: vacío si no tiene
  localidad: string;
  provincia: string;
  codigoPostal: string;
  formaPago: string;
};

export type DatosDuenoValidados = Omit<DatosDueno, "formaPago"> & { formaPago: FormaDePago };

export function validarDueno(entrada: DatosDueno): ResultadoValidacion<DatosDuenoValidados> {
  const errores: string[] = [];
  const obligatorio = (valor: string, mensaje: string) => {
    const limpio = valor.trim();
    if (!limpio) errores.push(mensaje);
    return limpio;
  };

  const nombre = obligatorio(entrada.nombre, faltaCampo("nombre"));
  const apellido = obligatorio(entrada.apellido, faltaCampo("apellido"));

  const dni = leerDni(entrada.dni);
  if (!entrada.dni.trim()) errores.push(faltaCampo("DNI"));
  else if (!dni) errores.push(MENSAJE_DNI);

  const email = leerEmail(entrada.email);
  if (!entrada.email.trim()) errores.push(faltaCampo("email"));
  else if (!email) errores.push(MENSAJE_EMAIL);

  const telefono = leerTelefono(entrada.telefono);
  if (!entrada.telefono.trim()) errores.push(faltaCampo("teléfono"));
  else if (!telefono) errores.push(MENSAJE_TELEFONO);

  const calle = obligatorio(entrada.calle, faltaDireccion("calle"));
  const numero = obligatorio(entrada.numero, faltaDireccion("número"));
  const localidad = obligatorio(entrada.localidad, faltaDireccion("localidad"));
  const provincia = obligatorio(entrada.provincia, faltaDireccion("provincia"));
  const codigoPostal = obligatorio(entrada.codigoPostal, faltaDireccion("código postal"));

  const formaPago = leerFormaDePago(entrada.formaPago.trim());
  if (!formaPago) errores.push(faltaCampo("forma de pago preferida"));

  if (errores.length > 0 || !dni || !email || !telefono || !formaPago) return { errores };
  return {
    datos: {
      nombre,
      apellido,
      dni,
      email,
      telefono,
      calle,
      numero,
      piso: entrada.piso.trim(),
      departamento: entrada.departamento.trim(),
      localidad,
      provincia,
      codigoPostal,
      formaPago,
    },
  };
}

// "Mitre 550 3° B, Rosario, Santa Fe, 2000"
export function formatearDireccion(d: Pick<DatosDueno, "calle" | "numero" | "piso" | "departamento" | "localidad" | "provincia" | "codigoPostal">): string {
  const domicilio = [`${d.calle} ${d.numero}`, d.piso ? `${d.piso}°` : "", d.departamento].filter(Boolean).join(" ");
  return [domicilio, d.localidad, d.provincia, d.codigoPostal].join(", ");
}

// ---------------------------------------------------------------------------
// Duplicados (RN-03, RN-04 y RN-05)
// ---------------------------------------------------------------------------

export type RolPersona = "veterinario" | "dueno";

const sustantivo: Record<RolPersona, string> = { veterinario: "veterinario", dueno: "dueño" };

export type PersonaExistente = Persona & { estadoCuenta: "invitado" | "activo" | "inactivo" };

// El DNI ya es de otro. En el alta, si es de alguien dado de baja se indica reactivarlo (RN-05);
// en la edición, el DNI no puede ser el de otro en ningún estado (RN-03).
export function mensajeDniRepetido(
  rol: RolPersona,
  dni: string,
  otro: PersonaExistente,
  operacion: "alta" | "edicion",
): string {
  if (operacion === "alta" && otro.estadoCuenta === "inactivo") {
    return `El DNI ${dni} corresponde a ${nombreCompleto(otro)}, con la cuenta inactiva. Para que vuelva, reactivá su cuenta desde su ficha.`;
  }
  return `Ya existe un ${sustantivo[rol]} con el DNI ${dni}: ${nombreCompleto(otro)}.`;
}

export function mensajeEmailRepetido(rol: RolPersona, email: string, otro: Persona): string {
  return `El email ${email} ya está registrado para el ${sustantivo[rol]} ${nombreCompleto(otro)}.`;
}

// ---------------------------------------------------------------------------
// Edición: cambios, huella y motivo de baja
// ---------------------------------------------------------------------------

export type Cambio = { dato: string; anterior: string; nuevo: string };

type DatoDescripto = { dato: string; valor: string };

// Los datos de un veterinario como se muestran y se auditan, en el orden del formulario.
export function describirVeterinario(d: DatosVeterinario): DatoDescripto[] {
  return [
    { dato: "nombre", valor: d.nombre },
    { dato: "apellido", valor: d.apellido },
    { dato: "DNI", valor: d.dni },
    { dato: "veterinaria", valor: d.veterinaria },
    { dato: "teléfono", valor: d.telefono },
    { dato: "email", valor: d.email },
  ];
}

// Solo los datos editables de un veterinario, de una ficha o de una fila de la base.
export function datosDeVeterinario(v: DatosVeterinario): DatosVeterinario {
  return {
    nombre: v.nombre,
    apellido: v.apellido,
    dni: v.dni,
    veterinaria: v.veterinaria,
    telefono: v.telefono,
    email: v.email,
  };
}

// Solo los datos editables de un dueño, de una ficha o de una fila de la base.
export function datosDeDueno(d: DatosDueno): DatosDueno {
  return {
    nombre: d.nombre,
    apellido: d.apellido,
    dni: d.dni,
    email: d.email,
    telefono: d.telefono,
    calle: d.calle,
    numero: d.numero,
    piso: d.piso,
    departamento: d.departamento,
    localidad: d.localidad,
    provincia: d.provincia,
    codigoPostal: d.codigoPostal,
    formaPago: d.formaPago,
  };
}

// La dirección se audita como un solo dato (CU-09: "cambio de dirección").
export function describirDueno(d: DatosDueno): DatoDescripto[] {
  return [
    { dato: "nombre", valor: d.nombre },
    { dato: "apellido", valor: d.apellido },
    { dato: "DNI", valor: d.dni },
    { dato: "email", valor: d.email },
    { dato: "teléfono", valor: d.telefono },
    { dato: "dirección", valor: formatearDireccion(d) },
    { dato: "forma de pago preferida", valor: textoFormaDePago(d.formaPago) },
  ];
}

// Datos modificados, con su valor anterior y su valor nuevo (RN-08 de CU-05, RN-09 de CU-09).
export function calcularCambios(anterior: DatoDescripto[], nuevo: DatoDescripto[]): Cambio[] {
  const cambios: Cambio[] = [];
  for (const n of nuevo) {
    const a = anterior.find((x) => x.dato === n.dato);
    if (a && a.valor !== n.valor) cambios.push({ dato: n.dato, anterior: a.valor, nuevo: n.valor });
  }
  return cambios;
}

// Identifica el estado de los datos que se abrieron para editar. Si al guardar es distinta,
// alguien los modificó mientras tanto y no se sobrescriben en silencio (RN-09 de CU-05, RN-08 de CU-09).
export function huellaDeDatos(datos: Record<string, string | null | undefined>): string {
  return JSON.stringify(Object.keys(datos).sort().map((clave) => [clave, datos[clave] ?? ""]));
}

// Devuelve el motivo sin espacios sobrantes, o null si está vacío (RN-08 de CU-06).
export function leerMotivoBaja(texto: string): string | null {
  const limpio = texto.trim();
  return limpio ? limpio : null;
}
