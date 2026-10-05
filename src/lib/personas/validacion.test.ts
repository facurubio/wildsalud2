import { describe, expect, it } from "vitest";
import {
  calcularCambios,
  describirDueno,
  describirVeterinario,
  formatearDireccion,
  huellaDeDatos,
  leerDni,
  leerEmail,
  leerMotivoBaja,
  leerTelefono,
  mensajeDniRepetido,
  mensajeEmailRepetido,
  validarDueno,
  validarVeterinario,
  type DatosDueno,
  type DatosVeterinario,
} from "./validacion";

const ana: DatosVeterinario = {
  nombre: "Ana",
  apellido: "López",
  dni: "27333444",
  veterinaria: "Patitas",
  telefono: "11 4444-5555",
  email: "ana.lopez@gmail.com",
};

const carla: DatosDueno = {
  nombre: "Carla",
  apellido: "Gómez",
  dni: "30111222",
  email: "carla.gomez@gmail.com",
  telefono: "11 5555-1234",
  calle: "Av. Corrientes",
  numero: "1234",
  piso: "",
  departamento: "",
  localidad: "CABA",
  provincia: "Buenos Aires",
  codigoPostal: "1043",
  formaPago: "transferencia",
};

describe("DNI (CU-04 EX-02, CU-08 EX-03, RN-02)", () => {
  it.each([
    ["27333444", "27333444"],
    ["27.333.444", "27333444"],
    ["7333444", "7333444"],
    ["5111222", "5111222"],
    ["30.111.222", "30111222"],
    ["733344", null],
    ["511122", null],
    ["273334445", null],
    ["301112223", null],
    ["27333444A", null],
    ["30111A22", null],
    ["", null],
  ])("%s", (texto, esperado) => {
    expect(leerDni(texto)).toBe(esperado);
  });
});

describe("teléfono (CU-04 EX-03, CU-08 EX-04, RN-02)", () => {
  it.each([
    ["11 4444-5555", "11 4444-5555"],
    ["+54 11 4444-5555", "+54 11 4444-5555"],
    ["+54 9 11 4444-5555", "+54 9 11 4444-5555"],
    ["+54 351 444-5555", "+54 351 444-5555"],
    ["11 5555-1234", "11 5555-1234"],
    ["  11   6666-9876 ", "11 6666-9876"],
    ["4444-5555", null],
    ["5555-1234", null],
    ["+54 9 11 4444-55556", null],
    ["abc123", null],
    ["+34 11 4444-5555", null],
    ["", null],
  ])("%s", (texto, esperado) => {
    expect(leerTelefono(texto)).toBe(esperado);
  });
});

describe("email (CU-04 EX-04, CU-08 EX-05, RN-02)", () => {
  it.each([
    ["ana.lopez@gmail.com", "ana.lopez@gmail.com"],
    ["ANA.LOPEZ@GMAIL.COM", "ana.lopez@gmail.com"],
    ["Carla.Gomez@Gmail.com", "carla.gomez@gmail.com"],
    ["ana.lopez@", null],
    ["ana.lopez.gmail.com", null],
    ["ana lopez@gmail.com", null],
    ["carla gomez@gmail.com", null],
    ["", null],
  ])("%s", (texto, esperado) => {
    expect(leerEmail(texto)).toBe(esperado);
  });
});

describe("CU-04 alta de veterinario", () => {
  it("normaliza los datos válidos: DNI solo dígitos y email en minúsculas", () => {
    expect(validarVeterinario({ ...ana, dni: "27.333.444", email: "ANA.LOPEZ@GMAIL.COM", nombre: " Ana " })).toEqual({
      datos: ana,
    });
  });

  it.each([
    ["nombre", "nombre"],
    ["apellido", "apellido"],
    ["dni", "DNI"],
    ["veterinaria", "veterinaria"],
    ["telefono", "teléfono"],
    ["email", "email"],
  ] as const)("EX-01: falta %s", (clave, etiqueta) => {
    expect(validarVeterinario({ ...ana, [clave]: "  " })).toEqual({ errores: [`Completá el campo ${etiqueta}.`] });
  });

  it("informa todos los campos con error a la vez, en el orden del formulario (RN-10)", () => {
    expect(validarVeterinario({ ...ana, nombre: "", dni: "733344", telefono: "4444-5555", email: "ana.lopez@" })).toEqual({
      errores: [
        "Completá el campo nombre.",
        "Ingresá un DNI válido, de 7 u 8 dígitos.",
        "Ingresá un teléfono válido, con código de área.",
        "Ingresá un email válido.",
      ],
    });
  });
});

describe("CU-08 alta de dueño", () => {
  it("normaliza los datos válidos", () => {
    expect(validarDueno({ ...carla, dni: "30.111.222", email: "Carla.Gomez@Gmail.com" })).toEqual({ datos: carla });
  });

  it.each([
    ["nombre", "Completá el campo nombre."],
    ["apellido", "Completá el campo apellido."],
    ["dni", "Completá el campo DNI."],
    ["email", "Completá el campo email."],
    ["telefono", "Completá el campo teléfono."],
    ["formaPago", "Completá el campo forma de pago preferida."],
    ["calle", "Completá calle de la dirección."],
    ["numero", "Completá número de la dirección."],
    ["localidad", "Completá localidad de la dirección."],
    ["provincia", "Completá provincia de la dirección."],
    ["codigoPostal", "Completá código postal de la dirección."],
  ] as const)("EX-01 y EX-02: falta %s", (clave, mensaje) => {
    expect(validarDueno({ ...carla, [clave]: "" })).toEqual({ errores: [mensaje] });
  });

  it("piso y departamento son opcionales", () => {
    expect(validarDueno({ ...carla, piso: "", departamento: "" }).datos).toBeDefined();
    expect(validarDueno({ ...carla, piso: "3", departamento: "B" }).datos).toMatchObject({ piso: "3", departamento: "B" });
  });

  it("la forma de pago tiene que ser de la lista fija (RN-06)", () => {
    expect(validarDueno({ ...carla, formaPago: "cheque" })).toEqual({
      errores: ["Completá el campo forma de pago preferida."],
    });
    for (const forma of ["efectivo", "transferencia", "tarjeta_debito", "tarjeta_credito"]) {
      expect(validarDueno({ ...carla, formaPago: forma }).datos?.formaPago).toBe(forma);
    }
  });

  it("valida el formato del DNI, el teléfono y el email", () => {
    expect(validarDueno({ ...carla, dni: "511122", telefono: "5555-1234", email: "carla.gomez@" })).toEqual({
      errores: [
        "Ingresá un DNI válido, de 7 u 8 dígitos.",
        "Ingresá un email válido.",
        "Ingresá un teléfono válido, con código de área.",
      ],
    });
  });
});

describe("dirección (CU-09)", () => {
  it("la arma como la muestra el caso", () => {
    expect(formatearDireccion(carla)).toBe("Av. Corrientes 1234, CABA, Buenos Aires, 1043");
    expect(
      formatearDireccion({ ...carla, calle: "Mitre", numero: "550", piso: "3", departamento: "B", localidad: "Rosario", provincia: "Santa Fe", codigoPostal: "2000" }),
    ).toBe("Mitre 550 3° B, Rosario, Santa Fe, 2000");
  });
});

describe("DNI y email repetidos (CU-04 EX-05 a EX-07, CU-05 EX-05 y EX-06, CU-08 EX-06 a EX-08)", () => {
  const pablo = { nombre: "Pablo", apellido: "Díaz" };

  it.each(["invitado", "activo"] as const)("alta de veterinario: DNI de uno %s", (estadoCuenta) => {
    expect(mensajeDniRepetido("veterinario", "25111222", { ...pablo, estadoCuenta }, "alta")).toBe(
      "Ya existe un veterinario con el DNI 25111222: Pablo Díaz.",
    );
  });

  it("alta: el DNI de alguien dado de baja indica reactivarlo (RN-05)", () => {
    const ana = { nombre: "Ana", apellido: "López", estadoCuenta: "inactivo" } as const;
    expect(mensajeDniRepetido("veterinario", "27333444", ana, "alta")).toBe(
      "El DNI 27333444 corresponde a Ana López, con la cuenta inactiva. Para que vuelva, reactivá su cuenta desde su ficha.",
    );
    expect(mensajeDniRepetido("dueno", "30111222", { nombre: "Carla", apellido: "Gómez", estadoCuenta: "inactivo" }, "alta")).toBe(
      "El DNI 30111222 corresponde a Carla Gómez, con la cuenta inactiva. Para que vuelva, reactivá su cuenta desde su ficha.",
    );
  });

  it("edición: el DNI de otro, en cualquier estado, informa que ya existe", () => {
    expect(mensajeDniRepetido("veterinario", "25111222", { ...pablo, estadoCuenta: "inactivo" }, "edicion")).toBe(
      "Ya existe un veterinario con el DNI 25111222: Pablo Díaz.",
    );
    expect(mensajeDniRepetido("dueno", "28999888", { nombre: "Pedro", apellido: "Sosa", estadoCuenta: "inactivo" }, "edicion")).toBe(
      "Ya existe un dueño con el DNI 28999888: Pedro Sosa.",
    );
  });

  it("email repetido", () => {
    expect(mensajeEmailRepetido("veterinario", "pablo.diaz@gmail.com", pablo)).toBe(
      "El email pablo.diaz@gmail.com ya está registrado para el veterinario Pablo Díaz.",
    );
    expect(mensajeEmailRepetido("dueno", "pedro.sosa@gmail.com", { nombre: "Pedro", apellido: "Sosa" })).toBe(
      "El email pedro.sosa@gmail.com ya está registrado para el dueño Pedro Sosa.",
    );
  });
});

describe("CU-05 cambios de un veterinario (RN-08, EX-07)", () => {
  it("cada dato modificado queda con su valor anterior y nuevo", () => {
    const nuevo = { ...ana, veterinaria: "Huellas", telefono: "11 6666-9876" };
    expect(calcularCambios(describirVeterinario(ana), describirVeterinario(nuevo))).toEqual([
      { dato: "veterinaria", anterior: "Patitas", nuevo: "Huellas" },
      { dato: "teléfono", anterior: "11 4444-5555", nuevo: "11 6666-9876" },
    ]);
  });

  it("sin modificar nada no hay cambios", () => {
    expect(calcularCambios(describirVeterinario(ana), describirVeterinario({ ...ana }))).toEqual([]);
  });

  it("corregir el DNI es un cambio como cualquier otro", () => {
    expect(calcularCambios(describirVeterinario(ana), describirVeterinario({ ...ana, dni: "27333445" }))).toEqual([
      { dato: "DNI", anterior: "27333444", nuevo: "27333445" },
    ]);
  });
});

describe("CU-09 cambios de un dueño (RN-09, EX-08)", () => {
  it("el teléfono y la dirección se auditan como datos separados; la dirección, como un solo dato", () => {
    const nuevo: DatosDueno = {
      ...carla,
      telefono: "11 6666-9876",
      calle: "Mitre",
      numero: "550",
      piso: "3",
      departamento: "B",
      localidad: "Rosario",
      provincia: "Santa Fe",
      codigoPostal: "2000",
    };
    expect(calcularCambios(describirDueno(carla), describirDueno(nuevo))).toEqual([
      { dato: "teléfono", anterior: "11 5555-1234", nuevo: "11 6666-9876" },
      {
        dato: "dirección",
        anterior: "Av. Corrientes 1234, CABA, Buenos Aires, 1043",
        nuevo: "Mitre 550 3° B, Rosario, Santa Fe, 2000",
      },
    ]);
  });

  it("la forma de pago se audita con su texto", () => {
    expect(calcularCambios(describirDueno(carla), describirDueno({ ...carla, formaPago: "efectivo" }))).toEqual([
      { dato: "forma de pago preferida", anterior: "Transferencia bancaria", nuevo: "Efectivo" },
    ]);
  });

  it("sin modificar nada no hay cambios", () => {
    expect(calcularCambios(describirDueno(carla), describirDueno({ ...carla }))).toEqual([]);
  });
});

describe("huella de los datos abiertos (CU-05 EX-08, CU-09 EX-09)", () => {
  it("es igual si los datos no cambiaron, sin importar el orden de las claves", () => {
    expect(huellaDeDatos({ a: "1", b: "2" })).toBe(huellaDeDatos({ b: "2", a: "1" }));
  });

  it("cambia si alguien modificó un dato mientras tanto", () => {
    expect(huellaDeDatos({ ...ana })).not.toBe(huellaDeDatos({ ...ana, telefono: "11 7777-0000" }));
  });

  it("un dato vacío y uno nulo son lo mismo", () => {
    expect(huellaDeDatos({ piso: null })).toBe(huellaDeDatos({ piso: "" }));
  });
});

describe("CU-06 motivo de la baja (EX-03)", () => {
  it.each([[""], ["   "], ["\n\t"]])("vacío o solo espacios: %j", (texto) => {
    expect(leerMotivoBaja(texto)).toBeNull();
  });

  it("devuelve el motivo sin espacios sobrantes", () => {
    expect(leerMotivoBaja("  Dejó de trabajar en Patitas ")).toBe("Dejó de trabajar en Patitas");
  });
});
