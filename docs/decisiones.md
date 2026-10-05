# Decisiones de diseño — WildSalud

Registro de las decisiones tomadas para resolver ambigüedades del documento de requisitos
([proyecto.md](proyecto.md)) antes de escribir los casos de uso detallados y el modelo de datos.

Los números (D1, D2, …) son identificadores estables en el orden en que se tomaron las decisiones;
las secciones las agrupan por tema. Un número que no aparece corresponde a una decisión descartada.

> Estado: vigente. Se agregan decisiones a medida que se confirman los supuestos de cada tanda de casos de uso.

## Período y pagos

| #   | Tema                       | Decisión                                                                                                                                                                                                                                                          |
| --- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Qué es un período          | El período es el **mes calendario** (se identifica como `AAAA-MM`). La cuota del mes vence el **día 13 de ese mismo mes**; el día 14, sin pago, la cobertura se suspende. Saldos de prestaciones, versiones de plan y precio de la cuota se alinean al mismo mes. |
| D2  | Primer pago al dar de alta | El primer pago corresponde a la **cuota completa del mes en curso**, aunque el alta sea a mitad de mes. Cuenta como 1 período pago.                                                                                                                               |
| D3  | Alta sin pago              | **No existe** una mascota con cobertura "pendiente": el alta de la cobertura exige registrar el primer pago en el mismo momento.                                                                                                                                  |
| D6  | Precio de un período       | Cada período se paga al **precio del plan vigente el día 1 de ese mes**, también cuando se paga como deuda.                                                                                                                                                       |
| D7  | Forma de pago              | El dueño tiene una **forma de pago preferida** (se propone por defecto); cada pago guarda la forma **real** usada.                                                                                                                                                |
| D36 | Anulación de un pago       | Si al anular un pago el período queda impago y vencido, la cobertura **se suspende en ese momento**. Los consumos registrados mientras tanto **siguen siendo válidos** y quedan auditados.                                                                        |
| D39 | Corrección de pagos        | El pago **no se edita**: se **anula** el original (con motivo) y se registra un **pago nuevo** enlazado al anulado.                                                                                                                                               |
| D53 | Hora de referencia         | Todas las reglas de fecha (vencimiento del 13, suspensión del 14, cambio de mes y de año, avisos) usan la **hora de Argentina**. |
| D54 | Estado calculado en el momento | El estado de cobertura se **calcula con la fecha y hora de cada operación o consulta**; no depende de que los procesos automáticos (suspensión, baja por deuda, cambios programados) ya se hayan ejecutado. |
| D57 | Fecha de pago | Es la fecha en que el dueño pagó: por defecto hoy, puede ser anterior pero **nunca posterior** a hoy. Es **informativa**: la cobertura se crea o se reactiva en el momento en que se registra el pago, no en esa fecha. |
| D58 | Importe del pago | **No es editable**: lo calcula el sistema según el plan y el período (D6). |
| D63 | Varios períodos en una operación | El administrador puede pagar **varios períodos en una sola operación**, siempre consecutivos y **empezando por el más antiguo**. Se registra un pago por período. |
| D65 | Primer pago de una cobertura | El primer pago de una cobertura (el que se registra al asignar el plan) **no se puede anular ni corregir de ninguna manera**. |
| D66 | Datos corregibles de un pago | Solo se corrigen **fecha de pago** y **forma de pago**; el pago nuevo es de la misma mascota, el mismo período y el mismo importe. La **mascota no se cambia**: un pago cargado a la mascota equivocada se anula (CU-28) y se registra en la correcta (CU-26). |
| D59 | Formas de pago | **Lista fija**: Efectivo, Transferencia bancaria, Tarjeta de débito y Tarjeta de crédito. |
| D144 | Reingreso en el mismo mes | Si la mascota ya tiene un **pago válido del mes en curso** (de una cobertura que se dio de baja ese mes), **no se le puede asignar un plan hasta el día 1 del mes siguiente**, tampoco al reactivarla. Así hay un solo pago válido por mascota y período (RF-PAG-13) y el mes no se cobra dos veces. |

## Deuda y baja automática

| #   | Tema                             | Decisión                                                                                                                                                                                                         |
| --- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D4  | Reactivación                     | Para reactivar una cobertura suspendida hay que pagar **todos los períodos adeudados más el mes en curso**.                                                                                                      |
| D5  | Orden de pago de la deuda        | Se paga siempre **el período adeudado más antiguo primero**. La cobertura se reactiva recién cuando no queda ningún período impago hasta el mes en curso inclusive. No se puede pagar más allá del mes en curso. |
| D8  | Baja automática por deuda        | La cobertura se da de baja automáticamente cuando se cumplen **3 meses completos desde la suspensión**. Ej.: sin pago de julio → suspendida el 14/07 → dada de baja el 14/10.                                    |
| D27 | Deuda congelada                  | Al darse de baja, se congelan los períodos **vencidos antes del mes de la baja**. Ej.: baja el 14/10 → se congelan julio, agosto y septiembre (octubre no).                                                      |
| D28 | Pago de deuda congelada          | Se paga **período por período**, del más antiguo al más nuevo. Mientras quede deuda no se puede crear una cobertura nueva. Esos pagos **no suman antigüedad** a la cobertura nueva.                              |
| D29 | Deuda y otras mascotas del dueño | Si el dueño tiene deuda de **cualquiera** de sus mascotas, **no se puede dar de alta** otra mascota suya.                                                                                                        |
| D38 | Qué cuenta como deuda            | **Cualquier** período impago y vencido: tanto de una cobertura suspendida como la deuda congelada de una cobertura dada de baja.                                                                                 |
| D55 | Deuda del dueño y asignación de planes | Si el dueño tiene deuda de cualquiera de sus mascotas, **no se puede asignar un plan a ninguna** de sus mascotas: ni al dar de alta una mascota nueva ni al volver a asignar un plan a una que ya existía. |
| D64 | Deuda congelada de mascota o dueño dados de baja | La deuda congelada **se puede pagar aunque la mascota o el dueño estén dados de baja**. Es la única forma de que el dueño deje de estar bloqueado por esa deuda. |
| D113 | Baja inmediata y mes en curso | La baja de un dueño o de una mascota es inmediata, aunque el mes esté pago, y **no hay reintegro**. Si ocurre entre el día 1 y el 13 con el mes impago, ese mes **no genera deuda**, aunque haya habido consumos (se mantiene D27). |
| D67 | Pagos parciales y plazo de baja | Pagar una parte de la deuda **no reinicia ni extiende** el plazo de 3 meses para la baja por deuda: se sigue contando desde la misma fecha de suspensión. |

## Estado de la cobertura

| #   | Tema                             | Decisión                                                                                                                                                                                                   |
| --- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D9  | Reingreso después de una baja    | Se trata como una **cobertura nueva** con antigüedad 0, sin importar el motivo de la baja. Si quedó deuda, se congela a la fecha de baja y debe pagarse antes de crear la nueva cobertura (ver D27 y D28). |
| D10 | Baja de plan vs. baja de mascota | _Dar de baja el plan_: la cobertura pasa a "Dada de baja" y la mascota queda registrada sin plan, reasignable. _Dar de baja la mascota_: baja lógica de la mascota, que da de baja también su cobertura.   |
| D16 | Estados de cobertura             | **Al día**, **Suspendida por falta de pago** y **Dada de baja**. La baja guarda un **motivo** aparte: _voluntaria_, _por deuda_ o _por baja de la mascota_.                                                |
| D17 | Del día 1 al 13 sin pagar        | La cobertura sigue **al día** hasta el 13 inclusive y se pueden registrar consumos. Si no se paga, el mes pasa a ser deuda.                                                                                |
| D18 | Baja voluntaria del plan         | Rige desde el **1 del mes siguiente** (baja programada): el mes ya pagado se mantiene cubierto. Si la cobertura está suspendida, la baja es **inmediata**.                                                 |
| D62 | Baja programada con el mes impago | Si la baja se programa entre el 1 y el 13 sin haber pagado el mes y el dueño no paga, la cobertura **se suspende el 14** y la baja **se aplica igual el día 1** del mes siguiente. Ese mes queda como **deuda congelada**. La suspensión no convierte la baja programada en inmediata. |

## Planes y cambios de plan

| #   | Tema                     | Decisión                                                                                                                                                                  |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D19 | Cambio de plan con deuda | Solo se puede cambiar el plan de una cobertura **al día**.                                                                                                                |
| D20 | Cambios pendientes       | Puede haber **un solo cambio pendiente** por mascota (cambio de plan o baja programada); el administrador puede cancelarlo o reemplazarlo antes de que entre en vigencia. |
| D21 | Plan inactivo            | Un plan inactivo **no se puede asignar** a nuevas mascotas; las que ya lo tienen **lo conservan**.                                                                        |
| D56 | Plan recién creado | Un plan creado a mitad de mes **se puede asignar de inmediato**, con el precio con el que se creó. |
| D60 | Suspensión y cambio de plan pendiente | Cuando una cobertura se suspende (el día 14 o por la anulación de un pago), **se cancela automáticamente su cambio de plan pendiente**. Si después el dueño salda la deuda, el administrador lo vuelve a programar. Una baja programada **no** se cancela (ver D62). |
| D61 | Desactivar un plan con cambios pendientes | Al desactivar un plan **se cancelan los cambios pendientes hacia ese plan**. Antes de confirmar, el sistema le muestra al administrador qué mascotas se ven afectadas, igual que en la baja de un dueño (D22). |
| D31 | Tipos de prestación      | Es un **catálogo que gestiona el administrador**; arranca con los 7 del documento y se pueden agregar otros.                                                              |
| D32 | Prestaciones sin límite  | El límite es **opcional**: vacío significa ilimitada. Las demás validaciones se aplican igual.                                                                            |

## Antigüedad y saldos

| #   | Tema                                    | Decisión                                                                                                                                                                                                         |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D11 | Antigüedad al cambiar de plan           | La antigüedad pertenece a la **cobertura de la mascota**, no al plan: se conserva al cambiar de plan.                                                                                                            |
| D12 | Antigüedad de períodos pagados tarde    | La antigüedad es la **cantidad de períodos pagos**, sin importar cuándo se pagaron. Un período impago no suma; cuando se paga, suma. _(Ajusta la redacción de los requisitos 12 y 13 de "Planes y coberturas".)_ |
| D30 | Prestaciones anuales al cambiar de plan | Los consumos del año **se siguen contando** aunque cambie el plan. Saldo = límite del plan vigente − consumos del período (mes o año según la prestación).                                                       |

## Consumos

| #   | Tema                                        | Decisión                                                                                                                                                                                   |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D14 | Veterinaria en el consumo                   | Cada consumo guarda una **copia de la veterinaria** del veterinario al momento de registrarlo.                                                                                             |
| D26 | Fecha del consumo                           | Es siempre el **momento en que se registra**; no se cargan consumos con fecha anterior. Los errores los corrige el administrador.                                                          |
| D34 | Consumos del veterinario                    | El veterinario **solo registra consumos nuevos**; no puede corregir ni anular los que cargó. Las correcciones y anulaciones las hace el administrador y quedan auditadas.                  |
| D35 | Corrección de consumos de períodos cerrados | El administrador puede corregir o anular consumos de **cualquier período**. En un período cerrado solo cambia el historial y el saldo de ese período; no devuelve saldo al período actual. |
| D40 | Corrección de consumos                      | El consumo **se edita** y queda un registro de auditoría con valor anterior, valor nuevo, usuario, fecha y hora, y motivo.                                                                 |

## Mascota

| #   | Tema                     | Decisión                                                                                                                                              |
| --- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| D23 | Número de afiliado       | Lo **genera el sistema** al dar de alta la mascota; es único, nunca se reutiliza y la mascota lo **conserva** aunque tenga una cobertura nueva.       |
| D33 | Ficha de la mascota      | La ficha completa (datos de salud, identificatorios y administrativos) la **crea y modifica solo el administrador**. El veterinario solo la consulta. |
| D41 | Edad de la mascota       | Se guarda la **edad aproximada en años** tal como se cargó.                                                                                           |
| D42 | Transferencia de mascota | ~~Fuera de alcance~~. **Reemplazada por D119**: el cambio de dueño se hace editando la mascota. |

## Usuarios y acceso

| #   | Tema                     | Decisión                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D13 | Veterinaria              | Es un **dato de texto** del veterinario, no una entidad.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| D15 | Administradores          | "Administrador" es un **rol**: hoy hay una persona, pero el sistema admite varias.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| D22 | Baja de un dueño         | **En cascada**: se dan de baja el dueño, su cuenta, sus mascotas y sus coberturas, con confirmación previa que muestra todo lo afectado.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| D24 | Acceso a la cuenta       | El inicio de sesión se hace **solo con Google o Apple**, para todos los roles. No hay contraseñas propias del sistema; nadie se registra por su cuenta. "Recuperar contraseña" deja de ser un caso de uso del sistema (lo maneja el proveedor).                                                                                                                                                                                                                                                                                                                                                                                                   |
| D37 | Vinculación de la cuenta | Por **invitación**: el administrador da de alta a la persona, que recibe un enlace de un solo uso; el primer ingreso con Google/Apple desde ese enlace **vincula esa cuenta** al usuario por el identificador del proveedor (no por email). **Recuperación del acceso:** si la persona olvida la contraseña de Google/Apple, la recupera con el propio proveedor y el sistema no interviene. Si pierde esa cuenta o quiere usar otra, **solo el administrador** le **reenvía la invitación al email registrado** (el mismo, salvo que el administrador lo haya actualizado) para vincular la nueva. No hay recuperación autogestionada por ahora. |
| D44 | Reingreso de una persona | Si vuelve un dueño o veterinario dado de baja, se **reactiva su registro existente** con su historial. El DNI es único **dentro de cada rol** (ver D46).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| D45 | Identificadores          | Cada entidad tiene un **identificador interno** que usa solo el sistema y nunca se muestra. El dueño se identifica en el negocio por su **DNI** (único); no tiene número de socio visible.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| D46 | Persona con dos roles    | Si una persona es veterinario y dueño, son **dos usuarios separados**, cada uno vinculado a una cuenta de Google/Apple distinta. Se mantiene la regla de **un único rol por cuenta**. Excepción para administradores: D145.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| D47 | Estados de la cuenta     | Toda cuenta de usuario (veterinario, dueño) pasa por **Invitado → Activo → Inactivo**. _Invitado_: dada de alta pero sin cuenta de Google/Apple vinculada todavía.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| D50 | Alta de administradores  | Los administradores se cargan por **configuración inicial del sistema**; no hay caso de uso para darlos de alta o de baja.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| D145 | Administrador que también es veterinario | Un administrador puede ser **también veterinario asociado con la misma cuenta**: entra una sola vez y, además de sus funciones de administrador, busca mascotas, consulta fichas y registra consumos (CU-37 a CU-39). Cada consumo que registra queda a su nombre como veterinario, con su veterinaria. Sus datos de veterinario se cargan por configuración, igual que el administrador (D112), y no aparece en la gestión de veterinarios (CU-04 a CU-07). Ajusta D46 y RF-ROL-03 **solo para administradores**: una persona veterinaria y dueña sigue teniendo dos usuarios. |

## Notificaciones

| #   | Tema                       | Decisión                                                                                                                                                                   |
| --- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D25 | Notificaciones adicionales | Además del aviso 48 hs antes del vencimiento (día 11), se avisa cuando la cobertura **se suspende** y un mes antes de la **baja automática**.                              |
| D43 | Canal de notificaciones    | **Solo email** en una primera etapa, detrás de un mecanismo reemplazable para sumar WhatsApp sin tocar el núcleo. Se guarda canal y resultado (éxito/fallo) de cada envío. |
| D68 | Aviso de baja por deuda | Además del aviso un mes antes (D25), se envía un **aviso al dueño el día en que la cobertura se da de baja por deuda**. |
| D143 | Envío de avisos por email | Los avisos que salen de un proceso de medianoche se envían **a las 09:00** de ese día; el de una suspensión por anulación de un pago, en el momento. **Un email por mascota.** Si falla, se **reintenta hasta 3 veces en 24 horas** y después queda *Fallido*. Los envíos se consultan en el historial de auditoría (CU-36). |

## Alcance

| #   | Tema           | Decisión                                                                                                                               |
| --- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| D48 | Pagos en línea | **MercadoPago queda fuera de alcance**: los pagos son manuales. El diseño queda preparado para integrarlo después sin tocar el núcleo. |
| D51 | Unidad de consumo | Cada consumo registrado **descuenta una unidad** de la prestación. No hay campo de cantidad. |
| D52 | Historia clínica | La **historia clínica queda fuera de alcance**: el consumo no lleva observaciones ni texto libre del veterinario. |
| D108 | Derecho de supresión (Ley 25.326) | **Fuera de alcance**: el sistema solo hace borrado lógico y no contempla el pedido de borrado definitivo de datos personales. |

## Consultas del veterinario

| # | Tema | Decisión |
|---|------|----------|
| D69 | Búsqueda de mascotas | Se busca por **nombre de la mascota**, **número de afiliado**, **DNI del dueño** o **apellido del dueño**. Número de afiliado y DNI: coincidencia exacta. Nombre y apellido: coincidencia parcial con un mínimo de **3 letras**. Los resultados se muestran **paginados** de a 20. |
| D70 | Datos en los resultados de búsqueda | Los resultados **no muestran el DNI ni el teléfono** del dueño; se ven recién en la ficha. |
| D71 | Accesos a fichas | **No se registra** en la auditoría cuándo un veterinario abre una ficha. |
| D72 | Lo que no ve el veterinario en la ficha | No ve el **historial de consumos** de períodos anteriores ni los **cambios de plan pendientes**; solo los consumos del período en curso. |
| D73 | Mascotas que aparecen en la búsqueda | Todas las mascotas **no dadas de baja**, tengan o no cobertura vigente, cada una con su estado (*Al día*, *Suspendida por falta de pago* o *Sin cobertura vigente*). Las dadas de baja no aparecen. |

## Consultas y datos del dueño

| # | Tema | Decisión |
|---|------|----------|
| D74 | Lo que ve el dueño de cada mascota | Plan, estado de cobertura, si la **cuota del mes** está paga o pendiente, **cuánto debe** (para reactivar o por deuda congelada) y los **cambios pendientes**. No ve el historial de pagos. |
| D75 | Dirección y teléfono | La dirección se guarda **estructurada**: calle, número, piso y departamento (opcionales), localidad, provincia y código postal. El teléfono se valida **con código de área**. |
| D76 | Auditoría de datos personales | Los cambios de **teléfono y dirección** quedan auditados con valor anterior, valor nuevo, usuario, fecha y hora. |
| D77 | Alertas en la aplicación | Se **calculan en el momento** según la situación de cada mascota y desaparecen solas cuando esa situación termina. No se guardan ni se marcan como leídas. |
| D78 | Alerta de vencimiento próximo | Se muestra **del día 11 al 13** inclusive, con la cuota del mes impaga (igual que el email de 48 hs antes). |
| D79 | Consumos que ve el dueño | El dueño ve **solo los consumos del período en curso** de cada prestación. No ve consumos de períodos anteriores ni de coberturas anteriores. |

## Personas: datos, altas, bajas y reactivaciones

| # | Tema | Decisión |
|---|------|----------|
| D80 | Datos obligatorios de personas | Todos los datos de RF-VET-01 y RF-DUE-01 son obligatorios, salvo piso y departamento. DNI de 7 u 8 dígitos, guardado sin puntos. Email con formato válido, guardado en minúsculas. Teléfono según D75. |
| D81 | Email único | El email es **único dentro de cada rol**, incluidos los dados de baja, sin distinguir mayúsculas. Puede repetirse entre un veterinario y un dueño. |
| D82 | Alta con DNI de alguien dado de baja | Se **rechaza** y el mensaje indica **reactivarlo**; no se crea otro registro. |
| D83 | Edición por el administrador | El administrador edita **todos los datos**, incluidos DNI y email. A alguien *Inactivo* no se lo edita: primero se lo reactiva. |
| D84 | Cambio de email | No cambia la cuenta de Google/Apple vinculada. Si la persona está *Invitado*, la invitación anterior queda sin efecto y se envía una nueva al email nuevo. |
| D85 | Auditoría de ediciones | **Toda edición** que hace el administrador sobre datos de veterinarios, dueños y fichas de mascotas queda auditada con valor anterior y valor nuevo. Amplía D76. |
| D86 | Listas de gestión | Las listas de veterinarios, dueños y mascotas (con búsqueda y filtros) son navegación dentro de los casos de uso, no casos aparte. |
| D96 | Baja de alguien *Invitado* | Se puede dar de baja a un veterinario o dueño que todavía está *Invitado*; su invitación queda sin efecto. |
| D97 | Reactivación de una cuenta | Al reactivar a un veterinario o dueño, la cuenta **vuelve a *Invitado***: se descarta la vinculación anterior y se le envía una **invitación nueva** para vincular otra vez su cuenta de Google/Apple (no hay contraseña propia, D24). Mientras está dado de baja, su cuenta de Google/Apple sigue reservada y no se puede vincular a otro usuario. |
| D98 | Motivo de baja de personas | La baja de un veterinario y la de un dueño exigen un **motivo en texto libre obligatorio**. |
| D99 | Emails por baja y reactivación | La **reactivación** envía la invitación de D97. La **baja no** envía ningún email. |
| D100 | Baja de dueño en cascada | Se cancelan los cambios pendientes. Cada cobertura queda con motivo *por baja de la mascota* y cada mascota con motivo *por baja del dueño*. |

## Cuentas, invitaciones y sesión

| # | Tema | Decisión |
|---|------|----------|
| D87 | Vencimiento de la invitación | El enlace de invitación **vence a las 24 horas** y solo sirve el último generado: al generar una invitación nueva para un usuario (reenvío, cambio de email o reactivación), las anteriores sin usar pasan a *Vencida*, aunque falle el envío de la nueva. Si el envío falla, el administrador la reenvía (CU-12). |
| D88 | Cuenta de proveedor no vinculada | Si alguien entra con una cuenta de Google/Apple que no está vinculada a ningún usuario, se lo rechaza aunque su email coincida con el de un usuario, sin revelar si ese email existe. |
| D89 | Cuenta de proveedor ya vinculada | Si una invitación se usa con una cuenta de Google/Apple ya vinculada a otro usuario (activo o dado de baja), se rechaza y la invitación sigue en estado *Invitado*. |
| D90 | Vencimiento de la sesión | La sesión vence a las **4 horas sin actividad**, igual para todos los roles. |
| D91 | Reenvío a un usuario *Activo* | No lo desvincula hasta que use el enlace nuevo; en ese momento la cuenta nueva reemplaza a la anterior y se cierran sus sesiones abiertas. |
| D92 | Usuario *Inactivo* | No puede iniciar sesión, no puede usar una invitación pendiente y no se le puede reenviar una: primero hay que reactivarlo. |
| D93 | Invitación con otra sesión abierta | Si se abre una invitación con la sesión de otro usuario abierta en el navegador, el sistema lo avisa y cierra esa sesión antes de seguir. |
| D94 | Auditoría de acceso | Quedan auditados los inicios y cierres de sesión, las vinculaciones de cuenta y los reenvíos de invitación. Los intentos rechazados no. |
| D95 | Cerrar sesión | Cierra solo la sesión de WildSalud y solo en ese dispositivo; no cierra la sesión de Google/Apple ni otras sesiones. |
| D112 | Administradores cargados por configuración | La configuración inicial crea al administrador en estado *Invitado* y le envía la invitación; la vincula con CU-01. Si pierde su cuenta de Google/Apple, se resuelve por configuración (no con CU-12). |
| D111 | Estados de la invitación | Solo tres: ***Invitado*** (se envió y todavía no se usó), ***Vigente*** (el usuario la aceptó y vinculó su cuenta) y ***Vencida*** (pasaron 24 horas sin usarla, o dejó de servir porque se generó otra invitación para el mismo usuario o porque se dio de baja a la persona). |
| D109 | Pantalla de inicio por rol | Dueño: CU-40 Consultar mis mascotas. Veterinario: CU-37 Buscar mascota. Administrador: CU-32 Ver panel global. |
| D110 | Mensaje de permiso | Cuando un usuario intenta hacer o ver algo que no le corresponde, el mensaje es siempre *"No tenés permiso para hacer esta operación."* |

## Mascotas: ficha, alta, baja y reactivación

| # | Tema | Decisión |
|---|------|----------|
| D101 | Alta de mascota "todo o nada" | La mascota, su número de afiliado, la cobertura y el primer pago se crean en una sola operación. Si algo falla o se cancela, no queda nada registrado. |
| D102 | Formato del número de afiliado | Seis dígitos correlativos con ceros a la izquierda (por ejemplo, `000125`), asignados al confirmar el alta. Nunca se repiten. |
| D103 | Datos de la ficha | Obligatorios: nombre, especie (**texto libre**), sexo, castrado/a (admite *No se sabe*) y edad aproximada (entero de 0 a 30). El resto es opcional. |
| D104 | Alta con dueño *Invitado* | Se puede dar de alta una mascota de un dueño que todavía está *Invitado*. Un dueño dado de baja no. |
| D105 | Posible duplicado | Si el dueño ya tiene una mascota con el mismo nombre y especie, el sistema avisa pero no bloquea el alta. |
| D106 | Motivo de baja de mascota | Obligatorio, de una lista fija: *Fallecimiento*, *Pedido del dueño* u *Otro* (con detalle). La baja en cascada usa *por baja del dueño* (D100). El cambio de dueño no es un motivo de baja (D119). |
| D107 | Reactivar mascota | Se agrega el caso **CU-51 Reactivar mascota**: la mascota conserva su número de afiliado y su historial, e incluye CU-22 Asignar plan (cobertura nueva con primer pago). |
| D114 | Foto de la mascota | Opcional, una sola. Se aceptan **JPG, PNG y HEIC de hasta 20 MB** (fotos de iPhone). El sistema la **reduce automáticamente** a un JPG de 1600 px en el lado mayor y guarda solo esa versión. |
| D116 | Baja por fallecimiento | Una mascota dada de baja por *Fallecimiento* **no se puede reactivar**. Por eso, al elegir ese motivo, el sistema pide una **doble confirmación** antes de darla de baja. |
| D117 | Motivo de reactivación de mascota | La reactivación de una mascota no pide motivo. |
| D118 | Ficha al reactivar | Durante la reactivación la ficha se muestra solo para lectura; al terminar, el sistema ofrece editarla con CU-14. |
| D119 | Cambio de dueño | No se da de baja una mascota por cambio de dueño: el administrador **cambia el dueño asignado** editando la mascota (CU-14). Reemplaza a D42. |
| D120 | Aviso de duplicado ampliado | El aviso de posible duplicado del alta también revisa las mascotas **dadas de baja** del dueño y sugiere reactivarlas con CU-51, salvo que la baja haya sido por *Fallecimiento*. No bloquea el alta. |
| D121 | Pagos y dueño | Los pagos **no guardan el dueño**: pertenecen a la mascota. Los pagos agrupados por dueño (CU-35) se agrupan por el dueño **actual** de cada mascota. |
| D122 | Qué se conserva al cambiar de dueño | La mascota conserva **todo**: número de afiliado, cobertura con su plan, estado y antigüedad, cambio pendiente, pagos y consumos. |
| D123 | Cambio de dueño con deuda | Si la mascota tiene deuda, **no se puede cambiar de dueño** hasta saldarla. |
| D124 | Dueño nuevo | Tiene que estar *Invitado* o *Activo*, ser distinto del actual y **no tener deuda** de otras mascotas (D55). |
| D125 | Visibilidad tras el cambio de dueño | El dueño anterior **deja de ver** la mascota; el nuevo la ve como propia (con D79). |

## Consultas del dueño: mascotas dadas de baja

| # | Tema | Decisión |
|---|------|----------|
| D115 | Deuda de mascotas dadas de baja | En "Mis mascotas" (CU-40) hay una sección **Mascotas dadas de baja** con cada una y su deuda pendiente, si tiene. Además, mientras exista esa deuda, se muestra una **alerta** (CU-43) porque bloquea asignar planes a sus mascotas (D55). |

## Planes y catálogo de prestaciones

| # | Tema | Decisión |
|---|------|----------|
| D126 | Validaciones del plan | El nombre es único entre los planes **no eliminados** (activos o inactivos), sin distinguir mayúsculas ni acentos. El precio es mayor que cero. El plan tiene al menos una prestación y ningún tipo se repite. El límite es un entero mayor que cero o vacío (ilimitada). Los períodos pagos para habilitarla son 1 o más. |
| D127 | Una sola versión pendiente | Si el plan se edita varias veces antes del día 1, cada edición reemplaza a la versión pendiente anterior. La versión pendiente se puede descartar. |
| D128 | Nombre del plan | Cambia en el momento, sin versión nueva, porque no es una condición del plan. |
| D129 | Edición de planes inactivos | Se pueden editar, porque las mascotas que ya los tienen los conservan (D21). |
| D130 | Aviso al desactivar un plan | No se envía email a los dueños cuyo cambio pendiente se cancela; el administrador ve la lista antes de confirmar. |
| D131 | Reactivar un plan | Los cambios de plan cancelados al desactivarlo no se restauran. |
| D132 | Datos del tipo de prestación | Solo nombre (obligatorio, único, hasta 40 caracteres) y descripción (opcional, hasta 200). Límite, periodicidad y habilitación son de cada plan. |
| D133 | Baja de tipos de prestación | Los tipos no se dan de baja; para dejar de cubrir uno se lo quita de los planes. |
| D134 | Eliminar plan | Se agrega **CU-52 Eliminar plan**. Solo se puede eliminar un plan **inactivo**. La eliminación es lógica: el plan desaparece de las listas y su nombre queda libre para crear otro plan. |
| D135 | Renombrar un tipo de prestación | El nombre corregido se ve **en todo el sistema**, incluidos los consumos y planes anteriores, porque es el mismo tipo. El nombre anterior queda en la auditoría. |
| D136 | Eliminar un plan en uso | No se puede eliminar un plan mientras alguna mascota lo tenga en una cobertura vigente. |
| D137 | Eliminar es definitivo | Un plan eliminado no se puede restaurar. |

## Correcciones y consultas del administrador

| # | Tema | Decisión |
|---|------|----------|
| D138 | Qué se corrige de un consumo | Solo la **prestación** y la **mascota**. La fecha y hora, el veterinario y la veterinaria son los del registro original. El consumo corregido tiene que cumplir las reglas de CU-39 en la fecha en que se registró. |
| D139 | Anulación de consumo | Es **definitiva**: un consumo anulado no se vuelve a validar; si se anuló por error, el veterinario lo registra de nuevo. |
| D140 | Búsqueda del administrador | Por los mismos datos que el veterinario (D69) más el **email del dueño**; filtros por estado de cobertura, deuda, plan y estado de la cuenta del dueño. Sin texto ni filtros lista todo. Puede incluir dados de baja. |
| D141 | Auditoría | Se filtra por fechas, usuario, tipo de acción y entidad (50 registros por página). Los registros se **conservan siempre**, no se modifican y **no se exportan**. |
| D142 | Panel global del administrador | Muestra **solo tres listas**: cuotas del mes por vencer (del 1 al 13, impagas), coberturas suspendidas por falta de pago y bajas por deuda en los próximos 30 días. Desde cada elemento se llega a registrar el pago. |
