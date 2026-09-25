# Decisiones de diseño — WildSalud

Registro de las decisiones tomadas para resolver ambigüedades del documento de requisitos
(`Proyecto Rubio, Facundo.pdf`) antes de escribir los casos de uso detallados y el modelo de datos.

> Estado: sesión de definición cerrada (46 decisiones), pendiente de confirmación final.

## Período y pagos

| # | Tema | Decisión |
|---|------|----------|
| D1 | Qué es un período | El período es el **mes calendario** (se identifica como `AAAA-MM`). La cuota del mes vence el **día 13 de ese mismo mes**; el día 14, sin pago, la cobertura se suspende. Saldos de prestaciones, versiones de plan y precio de la cuota se alinean al mismo mes. |
| D2 | Primer pago al dar de alta | El primer pago corresponde a la **cuota completa del mes en curso**, aunque el alta sea a mitad de mes. Cuenta como 1 período pago. |
| D3 | Alta sin pago | **No existe** una mascota con cobertura "pendiente": el alta de la cobertura exige registrar el primer pago en el mismo momento. |
| D4 | Deuda | Para reactivar una cobertura suspendida hay que pagar **todos los períodos adeudados más el mes en curso**. |
| D5 | Orden de pago de la deuda | Se paga siempre **el período adeudado más antiguo primero**. La cobertura se reactiva recién cuando no queda ningún período impago hasta el mes en curso inclusive. No se puede pagar más allá del mes en curso. |
| D6 | Precio de un período adeudado | Cada período se paga al **precio del plan vigente el día 1 de ese mes**. |
| D7 | Forma de pago | El dueño tiene una **forma de pago preferida** (se propone por defecto); cada pago guarda la forma **real** usada. |

## Estado de cobertura

| # | Tema | Decisión |
|---|------|----------|
| D8 | Baja automática por deuda | La cobertura se da de baja automáticamente cuando se cumplen **3 meses completos desde la suspensión**. Ej.: sin pago de julio → suspendida el 14/07 → dada de baja el 14/10. |
| D9 | Reingreso después de una baja | Se trata como una **cobertura nueva** con antigüedad 0, sin importar el motivo de la baja. Si quedó deuda, se congela a la fecha de baja y debe pagarse antes de crear la nueva cobertura.|
| D27 | Deuda congelada | Al darse de baja, se congelan los períodos **vencidos antes del mes de la baja**. Ej.: baja el 14/10 → se congelan julio, agosto y septiembre (octubre no). |
| D28 | Pago de deuda congelada | Se paga **período por período**, del más antiguo al más nuevo. Mientras quede deuda no se puede crear una cobertura nueva. Esos pagos **no suman antigüedad** a la cobertura nueva. |
| D29 | Deuda y otras mascotas del dueño | Si el dueño tiene deuda de **cualquiera** de sus mascotas, **no se puede dar de alta** otra mascota suya. |
| D38 | Qué cuenta como deuda | **Cualquier** período impago y vencido: tanto de una cobertura suspendida como la deuda congelada de una cobertura dada de baja. |
| D39 | Corrección de pagos | El pago **no se edita**: se **anula** el original (con motivo) y se registra un **pago nuevo** enlazado al anulado. |
| D10 | Baja de plan vs. baja de mascota | *Dar de baja el plan*: la cobertura pasa a "Dada de baja" y la mascota queda registrada sin plan, reasignable. *Dar de baja la mascota*: baja lógica de la mascota, que da de baja también su cobertura. |
| D16 | Estados de cobertura | **Al día**, **Suspendida por falta de pago** y **Dada de baja**. La baja guarda un **motivo** aparte: *voluntaria*, *por deuda* o *por baja de la mascota*. |
| D17 | Del día 1 al 13 sin pagar | La cobertura sigue **al día** hasta el 13 inclusive y se pueden registrar consumos. Si no se paga, el mes pasa a ser deuda. |
| D18 | Baja voluntaria del plan | Rige desde el **1 del mes siguiente** (baja programada): el mes ya pagado se mantiene cubierto. Si la cobertura está suspendida, la baja es **inmediata**. |
| D19 | Cambio de plan con deuda | Solo se puede cambiar el plan de una cobertura **al día**. |
| D20 | Cambios pendientes | Puede haber **un solo cambio pendiente** por mascota (cambio de plan o baja programada); el administrador puede cancelarlo o reemplazarlo antes de que entre en vigencia. |

## Antigüedad y planes

| # | Tema | Decisión |
|---|------|----------|
| D11 | Antigüedad al cambiar de plan | La antigüedad pertenece a la **cobertura de la mascota**, no al plan: se conserva al cambiar de plan. |
| D12 | Antigüedad de períodos pagados tarde | La antigüedad es la **cantidad de períodos pagos**, sin importar cuándo se pagaron. Un período impago no suma; cuando se paga, suma. *(Ajusta la redacción de los requisitos 12 y 13 de "Planes y coberturas".)* |
| D30 | Prestaciones anuales al cambiar de plan | Los consumos del año **se siguen contando** aunque cambie el plan. Saldo = límite del plan vigente − consumos del período (mes o año según la prestación). |
| D31 | Tipos de prestación | Es un **catálogo que gestiona el administrador**; arranca con los 7 del documento y se pueden agregar otros. |
| D32 | Prestaciones sin límite | El límite es **opcional**: vacío significa ilimitada. Las demás validaciones se aplican igual. |
| D21 | Plan inactivo | Un plan inactivo **no se puede asignar** a nuevas mascotas; las que ya lo tienen **lo conservan**. |

## Usuarios y entidades

| # | Tema | Decisión |
|---|------|----------|
| D13 | Veterinaria | Es un **dato de texto** del veterinario, no una entidad. |
| D14 | Veterinaria en el consumo | Cada consumo guarda una **copia de la veterinaria** del veterinario al momento de registrarlo. |
| D15 | Administradores | "Administrador" es un **rol**: hoy hay una persona, pero el sistema admite varias. |
| D22 | Baja de un dueño | **En cascada**: se dan de baja el dueño, su cuenta, sus mascotas y sus coberturas, con confirmación previa que muestra todo lo afectado. |
| D23 | Número de afiliado | Lo **genera el sistema** al dar de alta la mascota; es único, nunca se reutiliza y la mascota lo **conserva** aunque tenga una cobertura nueva. |
| D24 | Acceso a la cuenta | El inicio de sesión se hace **solo con Google o Apple**, para todos los roles. No hay contraseñas propias del sistema; nadie se registra por su cuenta. "Recuperar contraseña" deja de ser un caso de uso del sistema (lo maneja el proveedor). |
| D37 | Vinculación de la cuenta | Por **invitación**: el administrador da de alta a la persona, que recibe un enlace de un solo uso; el primer ingreso con Google/Apple desde ese enlace **vincula esa cuenta** al usuario por el identificador del proveedor (no por email). Si pierde el acceso, el administrador **reenvía la invitación** para vincular otra cuenta. |
| D25 | Notificaciones adicionales | Además del aviso 48 hs antes del vencimiento (día 11), se avisa cuando la cobertura **se suspende** y un mes antes de la **baja automática**. |
| D26 | Fecha del consumo | Es siempre el **momento en que se registra**; no se cargan consumos con fecha anterior. Los errores los corrige el administrador. |
| D33 | Ficha de la mascota | La ficha completa (datos de salud, identificatorios y administrativos) la **crea y modifica solo el administrador**. El veterinario solo la consulta. |
| D34 | Consumos del veterinario | El veterinario **solo registra consumos nuevos**; no puede corregir ni anular los que cargó. Las correcciones y anulaciones las hace el administrador y quedan auditadas. |
| D35 | Corrección de consumos de períodos cerrados | El administrador puede corregir o anular consumos de **cualquier período**. En un período cerrado solo cambia el historial y el saldo de ese período; no devuelve saldo al período actual. |
| D40 | Corrección de consumos | El consumo **se edita** y queda un registro de auditoría con valor anterior, valor nuevo, usuario, fecha y hora, y motivo. |
| D41 | Edad de la mascota | Se guarda la **edad aproximada en años** tal como se cargó. |
| D42 | Transferencia de mascota | **Fuera de alcance**: se da de baja con el dueño actual y se da de alta con el nuevo (nuevo número de afiliado, antigüedad 0). |
| D43 | Canal de notificaciones | **Solo email** en una primera etapa, detrás de un mecanismo reemplazable para sumar WhatsApp sin tocar el núcleo. Se guarda canal y resultado (éxito/fallo) de cada envío. |
| D44 | Reingreso de una persona | Si vuelve un dueño o veterinario dado de baja, se **reactiva su registro existente** con su historial. El DNI es único **dentro de cada rol** (ver D46). |
| D45 | Identificador del dueño | Cada entidad tiene un **identificador interno** que usa solo el sistema y nunca se muestra. El dueño se identifica en el negocio por su **DNI** (único); no tiene número de socio visible. |
| D46 | Persona con dos roles | Si una persona es veterinario y dueño, son **dos usuarios separados**, cada uno vinculado a una cuenta de Google/Apple distinta. Se mantiene la regla de **un único rol por cuenta**. |
| D36 | Anulación de un pago | Si al anular un pago el período queda impago y vencido, la cobertura **se suspende en ese momento**. Los consumos registrados mientras tanto **siguen siendo válidos** y quedan auditados. |
