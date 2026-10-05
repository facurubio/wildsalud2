import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacidad · WildSalud" };

// Política de privacidad. Pública: la pide Google para publicar el ingreso con Google.
// El texto lo tiene que revisar el administrador de WildSalud.
export default function PaginaPrivacidad() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-10 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold">Política de privacidad</h1>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Qué es WildSalud</h2>
        <p>
          WildSalud es el sistema con el que una red de veterinarias administra la cobertura de salud de las mascotas
          afiliadas: planes, pagos y prestaciones utilizadas.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Qué datos guardamos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>De los dueños: nombre, apellido, DNI, email, teléfono, dirección y forma de pago preferida.</li>
          <li>De los veterinarios: nombre, apellido, DNI, email, teléfono y veterinaria.</li>
          <li>De las mascotas: los datos de su ficha, su plan, sus pagos y las prestaciones utilizadas.</li>
          <li>
            Al ingresar con Google, solo el identificador de la cuenta. No vemos ni guardamos contraseñas, y no usamos
            el nombre, la foto ni otros datos del perfil de Google.
          </li>
          <li>Un registro de las acciones realizadas en el sistema, para poder controlarlas.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Para qué los usamos</h2>
        <p>
          Solo para administrar la cobertura: identificar a la mascota y a su dueño, controlar los pagos y las
          prestaciones, y comunicarnos por temas de la cobertura. No los vendemos ni los compartimos con terceros para
          otros fines.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Tus derechos</h2>
        <p>
          Podés pedir acceder a tus datos, corregirlos o actualizarlos, conforme a la Ley 25.326 de Protección de los
          Datos Personales. Para hacerlo, comunicate con el administrador de WildSalud en la veterinaria.
        </p>
      </section>

      <p>
        <Link href="/ingresar" className="underline">
          Volver al ingreso
        </Link>
      </p>
    </main>
  );
}
