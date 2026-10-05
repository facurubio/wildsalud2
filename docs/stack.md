# Stack técnico — WildSalud

Registro de las decisiones técnicas: con qué se construye WildSalud, por qué, qué se descartó y qué haría falta para cambiar cada cosa.
Complementa a [decisiones.md](decisiones.md), que registra las decisiones de negocio.

Los números (T1, T2, …) son identificadores estables, como los D de las decisiones de negocio.

> Estado: vigente desde el 05/10/2026, para la v1 ([alcance-v1.md](alcance-v1.md)). Se revisa cuando cambie alguna de las condiciones de la sección 1.

## 1. Condiciones de las que parten las decisiones

Las decisiones de este documento responden a estas condiciones. Si alguna cambia, hay que revisarlas.

- **Un solo desarrollador** lleva todo el proyecto.
- **Una sola aplicación:** la web, que usan el administrador y los veterinarios (más adelante, los dueños).
- **Pocos usuarios** y ningún proceso pesado.
- **Sin costo y sin tarjeta cargada** para la v1.
- **Datos reales** desde la entrega del 07/10/2026.

## 2. Resumen

| # | Decisión | En una línea |
|---|----------|--------------|
| T1 | Next.js con TypeScript | Pantallas y lógica de servidor en un mismo proyecto. |
| T2 | Backend dentro del mismo proyecto | La separación entre frontend y backend está en el código, no en dos servidores. |
| T3 | Vercel para publicar | Corre Next.js gratis, sin tarjeta y sin apagarse. |
| T4 | Supabase como base, sesión y archivos | PostgreSQL, inicio de sesión con Google y fotos en un solo servicio. |
| T5 | Sin ORM: SQL y `supabase-js` | La base se describe en SQL; las operaciones de varios pasos son funciones de PostgreSQL. |
| T6 | Firebase descartado | No suma nada que no tengamos y no tiene tope de gasto. |
| T7 | PWA posible más adelante, sin uso sin conexión | Se puede instalar en el celular; no registra nada sin internet. |

## 3. Decisiones

### T1. Next.js con TypeScript

**Decisión.** La aplicación se construye con Next.js en TypeScript.

**Por qué.**
- Permite escribir las pantallas (frontend) y la lógica que corre en el servidor (backend) en el mismo proyecto y en el mismo lenguaje.
- Las reglas de negocio (si la cobertura está suspendida, si quedan prestaciones, la auditoría) tienen que correr en el servidor. Si corrieran en el navegador, alguien podría saltearlas.
- Puede revisar la sesión antes de mostrar cualquier pantalla (*middleware*): vencimiento a las 4 horas sin actividad, usuarios *Inactivos* y cuentas de Google no vinculadas (D88).
- Supabase tiene guía y librería oficiales para Next.js, y Vercel lo publica sin configuración.
- Es el framework más usado y documentado, lo que reduce las sorpresas.

**En contra.** Es más complejo de lo que esta app necesita: varias de sus ventajas (posicionamiento en buscadores, páginas públicas rápidas) no le sirven a un sistema interno. Al principio cuesta distinguir qué corre en el servidor y qué en el navegador.

**Descartado.**
- *React solo (Vite) hablándole directo a Supabase:* más simple, pero todas las reglas de negocio tendrían que vivir en la base (permisos y funciones), que es más difícil de escribir y probar.
- *SvelteKit, Remix:* funcionarían igual de bien, pero tienen menos material y no aportan nada que haga falta.

**Cómo se cambia.** Es el cambio más costoso: habría que rehacer las pantallas. Las reglas de negocio (ver la sección 4) y la base de datos se conservan.

### T2. Backend dentro del mismo proyecto

**Decisión.** No hay un backend separado (Express, NestJS). El backend es la parte de servidor de Next.js.

**Por qué.**
- En la industria se separan cuando hay varias aplicaciones que usan la misma API (web, Android, iPhone), equipos distintos para cada parte, cargas grandes que escalan por separado, backends en otro lenguaje o procesos largos. En WildSalud no se da ninguno de esos casos.
- Un backend separado necesita un servidor encendido todo el tiempo. Los gratuitos sin tarjeta se apagan cuando no se usan, y la primera consulta tarda cerca de un minuto en responder.
- Duplica el trabajo: dos publicaciones, dos configuraciones, el doble de ambientes, permisos entre los dos (CORS), pasar la sesión de uno al otro y compartir los tipos.

**Cómo se cambia.** Las reglas de negocio viven en una carpeta propia, independiente de Next.js (sección 4). Para separar el backend se mueven a un proyecto nuevo y las pantallas pasan a llamarlo. El momento más probable para hacerlo es si se hace una app nativa para los dueños.

### T3. Vercel para publicar

**Decisión.** La aplicación se publica en Vercel, plan Hobby (gratis).

**Por qué.** Corre Next.js con su parte de servidor sin costo, sin tarjeta y sin apagarse cuando no hay uso.

**En contra.** El plan Hobby es para uso personal no comercial. Si la veterinaria opera con la app, Vercel podría pausar el proyecto (no cobrar). Es un riesgo aceptado en [alcance-v1.md](alcance-v1.md).

**Cómo se cambia.**
- *A Vercel Pro* (unos US$20 por mes): un cambio de plan, sin tocar el código. Viene con un margen de gasto extra de US$200 y pausa la app al alcanzarlo; hay que **bajar ese margen a casi cero** al contratarlo. La pausa puede tardar unos minutos en activarse.
- *A otro servicio* (Firebase App Hosting, Netlify, un servidor propio): se publica el mismo código, se copian las variables de entorno y se apunta el dominio. Lleva horas, porque la app no usa funciones exclusivas de Vercel.

### T4. Supabase como base de datos, sesión y archivos

**Decisión.** Supabase, plan Free, con dos proyectos: uno de prueba para el desarrollo y otro real. El desarrollo nunca toca el real.

**Por qué.**
- La base es PostgreSQL, relacional, y el modelo ([modelo-datos.md](modelo-datos.md)) depende de restricciones que solo una base relacional garantiza.
- Resuelve el inicio de sesión con Google y el guardado de las fotos de las mascotas.
- Es gratis y sin tarjeta.

**En contra.** El plan Free no incluye copias de seguridad: si se pierde la base, se pierden los datos (riesgo aceptado en [alcance-v1.md](alcance-v1.md)).

**Cómo se cambia.**
- *A Supabase Pro* (unos US$25 por mes): un cambio de plan, sin tocar el código. Incluye copias diarias. Tiene un **tope de gasto activado por defecto**: si se pasa la cuota incluida, bloquea ese uso hasta el mes siguiente en vez de cobrar el exceso. Es el primer pago que conviene hacer apenas haya datos reales, idealmente a cargo de la veterinaria.
- *A otra base PostgreSQL:* los datos se exportan con herramientas estándar. Lo costoso (días o semanas) es reemplazar el inicio de sesión y el guardado de fotos.

### T5. Sin ORM: SQL y `supabase-js`

**Decisión.** No se usa un ORM (Prisma, Drizzle, TypeORM).
- La base se describe **solo con archivos SQL** (migraciones de Supabase). Es la única fuente de verdad.
- Las **consultas simples** se hacen con `supabase-js` y los tipos de TypeScript que genera Supabase.
- Las **operaciones que modifican varias tablas** (por ejemplo, alta de mascota con cobertura, primer pago y auditoría) son **funciones de PostgreSQL** que se llaman con `supabase.rpc(...)`. Se guarda todo o no se guarda nada.

**Por qué.**
- El combo backend separado + ORM es el estándar porque un backend propio necesita una herramienta para hablar con la base. Supabase ya cubre esa parte y genera los tipos.
- El modelo usa restricciones que un ORM no sabe describir (nombres únicos sin distinguir mayúsculas ni acentos, un solo pago válido por mascota y período, mascota del pago igual a la de su cobertura). Con un ORM igual habría SQL escrito a mano, y dos descripciones de la base que pueden contradecirse.
- Un ORM se conecta a PostgreSQL por su cuenta, y en Vercel eso obliga a configurar el *pooler* de conexiones.

**En contra.** Algunas reglas viven en funciones de PostgreSQL, que se escriben en SQL y son más incómodas de probar y depurar que el código TypeScript. A cambio, la base garantiza que los datos queden siempre bien.

**Cómo se cambia.** Un ORM como Drizzle puede leer la base existente y generar su esquema. Puede convivir con lo que ya está: se usa en lo nuevo y lo viejo sigue funcionando.

### T6. Firebase descartado

**Decisión.** No se usa Firebase, ni como base ni como servidor.

**Por qué.**
- *Como base:* Firestore no es relacional. Las garantías del modelo de datos habría que programarlas a mano.
- *Como servidor:* Cloud Functions y App Hosting exigen el plan Blaze, que pide una cuenta de facturación con tarjeta. Google Cloud **no tiene un tope que corte el gasto**: las alertas de presupuesto solo avisan. Un error de código que se ejecute en bucle llega a la tarjeta.

**Cuándo reconsiderarlo.** Firebase App Hosting corre Next.js tal cual y permite uso comercial. Es una salida si Vercel pausa la app.

### T7. PWA posible más adelante, sin uso sin conexión

**Decisión.** La v1 es una aplicación web común. Más adelante se puede convertir en PWA para instalarla en el celular.

**Por qué.**
- Convertirla en PWA es agregar un manifiesto, un ícono y un *service worker*. No cambia nada del servidor y se puede hacer en cualquier versión.
- **No se registra nada sin conexión.** Sin internet el sistema no puede verificar si la cobertura está suspendida o si quedan prestaciones antes de registrar un consumo.

## 4. Reglas de construcción

Reglas para el código que mantienen abiertas las salidas de la sección 3.

1. **No usar funciones exclusivas de Vercel**, para poder mudar la aplicación (T3).
2. **Reglas de negocio en una carpeta propia**, en TypeScript común que no dependa de Next.js. Las pantallas solo llaman a esas funciones (T1, T2).
3. **Un único lugar del código que habla con Supabase.** Las pantallas nunca llaman a Supabase directamente. Si Supabase cambia, se modifica ese lugar y no toda la aplicación (T4).
4. **La base se describe en SQL estándar de PostgreSQL**, en migraciones versionadas en el repositorio (T5).
5. **Toda regla que proteja los datos corre en el servidor o en la base**, nunca solo en el navegador (T1).

## 5. Qué tan difícil es cambiar cada cosa

| Cambio | Dificultad | Qué implica |
|--------|------------|-------------|
| Pasar Supabase o Vercel a un plan pago (o volver al gratis) | Fácil | Un cambio en el panel. Sin tocar código ni datos. |
| Mudar la aplicación de Vercel a otro servicio | Fácil | Publicar el mismo código en otro lado. Horas. |
| Agregar un ORM | Intermedia | Generar su esquema desde la base y usarlo en lo nuevo. |
| Separar el backend (Express, NestJS) | Intermedia | Mover la carpeta de reglas a un proyecto nuevo. |
| Dejar Supabase por otra base PostgreSQL | Difícil | Reemplazar inicio de sesión y fotos. Días o semanas. |
| Dejar Next.js | Difícil | Rehacer las pantallas. Se conservan las reglas y la base. |

## Fuentes

- [Supabase: Control your costs](https://supabase.com/docs/guides/platform/cost-control) — tope de gasto del plan Pro.
- [Vercel: Spend Management](https://vercel.com/docs/spend-management) — margen de gasto y pausa del plan Pro.
