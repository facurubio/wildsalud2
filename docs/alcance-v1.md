# Alcance de la v1 — WildSalud

Fecha de entrega: **miércoles 7 de octubre de 2026**.

La v1 es la primera versión que usa el administrador (el dueño de la veterinaria) con **datos reales**, arrancando con el sistema vacío. Su objetivo es que él y los veterinarios puedan empezar a trabajar y den feedback para las próximas versiones. Se entrega de forma **incremental**: cada versión agrega casos de uso sin cambiar lo que ya está cargado.

Lo que no figura en este documento se rige por [proyecto.md](proyecto.md), [decisiones.md](decisiones.md) y los [casos de uso](casos-de-uso/README.md).

## 1. Qué entra

Usan la v1 el **administrador** y los **veterinarios asociados**. Los dueños afiliados no ingresan al sistema todavía.

| Área | Casos de uso |
|------|--------------|
| Acceso | CU-02 Iniciar sesión · CU-03 Cerrar sesión · CU-01 Vincular cuenta por invitación (simplificado) |
| Planes | CU-20 Crear tipo de prestación · CU-16 Crear plan |
| Veterinarios | CU-04 Dar de alta · CU-05 Editar · CU-06 Dar de baja |
| Dueños | CU-08 Dar de alta · CU-09 Editar |
| Mascotas y pagos | CU-13 Dar de alta mascota (con plan y primer pago, CU-22) · CU-14 Editar mascota · CU-26 Registrar pago · CU-28 Anular pago |
| Atención | CU-37 Buscar mascota · CU-38 Consultar ficha y cobertura · CU-39 Registrar consumo · CU-31 Anular consumo |
| Auditoría | Se registran todas las acciones desde el primer día, sin pantalla de consulta (CU-36 queda para después) |

CU-37, CU-38 y CU-39 los usan los veterinarios y también el administrador, que es veterinario y entra con la misma cuenta (D145).

## 2. Reglas propias de la v1

Estas reglas valen solo para la v1 y se reemplazan cuando llegue el caso de uso completo. No son decisiones nuevas de negocio: por eso viven acá y no en `decisiones.md`.

- **Solo Google.** Se inicia sesión únicamente con Google. Apple queda afuera porque su cuenta de desarrollador es paga.
- **Invitación por WhatsApp, sin emails.** La v1 no envía emails. Al dar de alta un veterinario, el sistema genera el enlace de invitación de un solo uso (D37) y el administrador lo copia y lo envía por WhatsApp. Si el enlace vence o se pierde, el administrador genera uno nuevo desde la ficha del veterinario.
- **Catálogo vacío.** Los tipos de prestación arrancan vacíos (D31 prevé cargar los 7 del documento): el administrador crea los suyos con CU-20, porque en la v1 no se pueden editar.
- **Dueños sin cuenta.** Los dueños se cargan con todos sus datos, pero no se les genera invitación hasta que exista el portal del dueño.
- **Administrador inicial.** La cuenta del administrador, con sus datos de veterinario, se carga por configuración (D50, D145), antes de la entrega.
- **Edición de planes solo sin mascotas.** Un plan se puede editar libremente mientras ninguna mascota lo tenga. Cuando una mascota ya lo tiene, queda bloqueado hasta que llegue CU-17 Editar plan. Si hace falta otro precio o condiciones, se crea un plan nuevo.
- **Suspensión calculada, sin proceso ni aviso.** El estado *Suspendida por falta de pago* se calcula en el momento de cada consulta (D54): desde el día 14 sin pago del mes, el veterinario la ve suspendida y no puede registrar consumos; al pagar la deuda (CU-26) vuelve a estar *Al día*. El proceso programado de CU-44 y el aviso de CU-48 no entran.
- **Ficha sin foto.** La foto de la mascota (CU-13 y CU-14) queda para después de la entrega.
- **Inicio = búsqueda de mascotas.** Veterinarios y administrador entran a la búsqueda (CU-37); el panel global (CU-32) llega después. Sin texto, se ve el listado de todas las mascotas (D140 para el administrador, D146 para el veterinario).
- **Alta de mascota desde la sección Mascotas.** El dueño se elige en el mismo formulario por su DNI (también se puede empezar desde la ficha del dueño). Las reglas de CU-13 no cambian: el dueño tiene que existir, no estar dado de baja y no tener deuda.
- **Infraestructura sin costo.** Next.js (TypeScript), Supabase Free y Vercel Hobby, sin ninguna tarjeta cargada (el porqué está en [stack.md](stack.md)). Hay una base de prueba para el desarrollo y otra real; el desarrollo nunca toca la real.

### Riesgos aceptados

- **Sin copias de seguridad.** Supabase Free no las incluye y se decidió no armarlas por ahora. Si se pierde la base, se pierden los datos cargados.
- **Uso comercial en Vercel Hobby.** El plan gratuito de Vercel es para uso personal no comercial. Si la veterinaria opera con la app, Vercel podría pausar el proyecto (no cobrar). La app no usa funciones exclusivas de Vercel, para poder mudarla si hace falta.
- **Datos personales.** Se cargan DNI, teléfono y dirección reales de los clientes. Conviene que el administrador les informe que sus datos se registran en el sistema.

## 3. Qué queda para después

| Falta | Qué se hace mientras tanto |
|-------|----------------------------|
| CU-15 Dar de baja mascota · CU-24 Dar de baja el plan · CU-10 Dar de baja dueño | El administrador anota el pedido. **Prioridad antes del 01/11**, porque una baja pedida en octubre rige desde el 1 del mes siguiente. |
| CU-32 Panel global · CU-34 Historial de pagos por mascota | Buscar la mascota y ver su ficha. **Prioridad antes del 14/11**, primera fecha en que puede haber suspensiones. |
| CU-17 Editar plan · CU-18/19 Desactivar y reactivar plan · CU-52 Eliminar plan · CU-21 Editar tipo de prestación | Crear un plan o tipo nuevo. Un tipo cargado con error se informa al desarrollador. |
| CU-23 Cambiar plan · CU-25 Cancelar cambio pendiente · CU-46 Aplicar cambios programados | No se puede cambiar el plan de una mascota todavía. |
| CU-14 FA-03 Cambiar el dueño de una mascota | No disponible todavía. |
| Foto de la mascota (CU-13, CU-14) | La ficha se carga sin foto. |
| CU-29 Corregir pago | Anular el pago (CU-28) y registrarlo de nuevo (CU-26). El primer pago no se puede anular ni corregir (D65): si un alta se cargó con error, se informa al desarrollador. |
| CU-30 Corregir consumo | Anular el consumo (CU-31) y que el veterinario lo registre de nuevo. |
| CU-07 Reactivar veterinario · CU-11 Reactivar dueño · CU-51 Reactivar mascota | No disponible. |
| CU-12 Reenviar invitación (por email) | Generar un enlace nuevo y enviarlo por WhatsApp (sección 2). |
| CU-33 Buscar y filtrar · CU-35 Pagos por dueño · CU-36 Auditoría | Buscar la mascota (CU-37). La auditoría se guarda y se consulta a pedido del desarrollador. |
| CU-40 a CU-43 Portal del dueño | El dueño consulta su cobertura con el administrador. |
| CU-44 proceso de suspensión · CU-47 a CU-50 Avisos por email | El administrador avisa a los dueños por WhatsApp. |
| CU-45 Baja por deuda | No puede ocurrir antes del 14/02/2027 (tres meses después de la primera suspensión posible). |
| Copias de seguridad | Riesgo aceptado (sección 2). |

## 4. Cuándo está terminada

La v1 está terminada cuando, en la app publicada y con cuentas reales de Google, se puede hacer este recorrido completo **tanto desde una computadora como desde un celular** (diseño responsive, RNF-CMP):

1. El administrador ingresa con Google.
2. Crea los tipos de prestación y un plan; lo edita mientras no tiene mascotas.
3. Da de alta un veterinario y le envía el enlace por WhatsApp; el veterinario vincula su cuenta y entra.
4. Da de alta un dueño y una mascota con plan y primer pago.
5. El veterinario busca la mascota, ve su cobertura *Al día* con las prestaciones disponibles y registra un consumo; el saldo se actualiza.
6. El administrador anula ese consumo y el saldo vuelve a estar disponible.
7. El administrador registra y anula un pago que no sea el primero.
8. El administrador da de baja al veterinario y ese veterinario ya no puede entrar.
9. Cada acción quedó registrada en la auditoría.

Además:

- Con un reloj simulado en el día 14 sin pago del mes, la cobertura se ve *Suspendida*, no permite consumos y vuelve a *Al día* al registrar el pago.
- Las pruebas automáticas de esas reglas pasan.
- Ningún servicio usado tiene una tarjeta cargada.
