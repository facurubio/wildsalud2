# WildSalud — Proyecto

## Descripción del proyecto

WildSalud es una aplicación sanitaria para mascotas, tipo "obra social", pensado para una red de veterinarias asociadas: el dueño paga una cuota mensual por cada mascota y accede a un número limitado de prestaciones (consultas, vacunas, radiografías, ecografías, laboratorio, cirugías, internaciones) según el plan contratado.

El núcleo del sistema es resolver, al instante y para cualquier veterinario de la red, si un paciente está identificado, quién es su dueño y si su cobertura se encuentra activa o suspendida por falta de pago, con corte automático del servicio ante falta de pago y reglas de consumo por plan.

El sistema define tres roles:

- Administrador (dueño de WildSalud, gestiona altas, pagos y planes).
- Veterinario asociado (consulta y registra uso de prestaciones)
- Dueño afiliado (consulta su cobertura y edita datos de contacto)

La aplicación tiene como principal usuario al administrador, quien se encarga de la gestión de altas, modificaciones y bajas de veterinarios asociados, dueños afiliados y mascotas, además del registro de pagos y la administración de los planes de cobertura.

## Usuarios

- **Administrador:** El dueño de la obra social. Único super-usuario. Controla altas/bajas de veterinarios y dueños afiliados, registra pagos, define planes.
- **Veterinario asociado:** Profesional que trabaja en una veterinaria adherida a WildSalud y que puede consultar la cobertura de una mascota y registrar el uso de prestaciones durante su atención.
- **Dueño afiliado:** Cliente final, dueño de una o más mascotas. No gestiona su propia alta (la hace el administrador); solo puede editar algunos de sus datos personales y consultar el estado de su cobertura.

## Casos de uso

### Administrador

1. Iniciar sesión / cerrar sesión
2. Alta / edición / baja de veterinarios asociados.
3. Alta / edición / baja de dueños afiliados y mascotas.
4. Definir y editar planes de cobertura
5. Registrar pagos manualmente
6. Dar de baja plan de una mascota
7. Ver panel global de mascotas, coberturas y estados de pago.
8. Consultar historial de pagos por mascota y agrupado por dueño.
9. Asignar un plan a una mascota.
10. Cambiar el plan de una mascota.
11. Reactivar una cobertura suspendida por falta de pago mediante el registro del pago correspondiente.
12. Corregir/anular un consumo cargado incorrectamente
13. Buscar/filtrar dueños afiliados y mascotas por estado

### Veterinario asociado

1. Iniciar sesión / cerrar sesión
2. Buscar mascota/ dueño afiliado por número de afiliado de la mascota, DNI del dueño u otros datos disponibles. Ej: nombre de la mascota.
3. Consultar ficha del paciente y estado de cobertura
4. Registrar consumo de una prestación (marcar uso)
5. Ver alerta si la prestación está agotada o la cobertura se encuentra suspendida por falta de pago.
6. Recuperar acceso/contraseña

**Restricción explícita:** El veterinario no puede dar de alta ni de baja a dueños afiliados, ni modificar datos personales o de pago. Solo interactúa con la ficha de la mascota que tiene delante.

### Dueño afiliado

1. Iniciar sesión / cerrar sesión
2. Consultar sus mascotas, plan asociado y estado de cobertura
3. Consultar prestaciones disponibles/consumidas de su plan
4. Modificar teléfono y dirección
5. Ver y recibir alertas de vencimiento próximo
6. Recuperar acceso/contraseña

### Casos de uso automáticos / del sistema

1. Suspensión automática de la cobertura al comenzar el día 14 si no se registró el pago del período.
2. Notificación de vencimiento próximo
3. La cobertura de una mascota comenzará a partir de la fecha en que sea dada de alta y se registre su primer pago.
4. Las prestaciones con periodicidad mensual reiniciarán su saldo al comenzar cada nuevo mes calendario.
5. Las prestaciones con periodicidad anual reiniciarán su saldo al comenzar cada nuevo año calendario.
6. El reinicio del saldo de las prestaciones es independiente de la fecha de alta de la mascota y no modifica la regla de vencimiento de la cobertura, que continúa siendo el día 13 de cada mes.
7. Aviso de agotamiento de una prestación
8. Propagación instantánea del estado de cobertura
9. Reactivar cobertura automáticamente al registrar el pago
10. Bloquear consumo no autorizado por el plan

## Requisitos funcionales

### Autenticación

1. El sistema debe requerir autenticación para acceder a funciones privadas.
2. Cada usuario debe acceder mediante una cuenta individual.
3. El sistema debe aplicar permisos de acuerdo con el rol autenticado.
4. Un usuario dado de baja no debe poder iniciar nuevas sesiones.
5. El sistema debe disponer de un mecanismo de recuperación de acceso para veterinarios y dueños afiliados.

### Identificación / ficha de la mascota

1. Registrar datos de la mascota:
   - foto
   - nombre
   - especie
   - raza
   - sexo
   - color
   - castrado/a
   - enfermedades previas o crónicas
   - alimentación
   - edad aproximada
2. Asociar cada mascota a un único dueño (relación 1 dueño → N mascotas).
3. Asignar el plan de cobertura por mascota, no por dueño (dos mascotas del mismo dueño pueden tener planes distintos).
4. Identificar a cada dueño con su dni y a su mascota con un número de afiliado, usable como criterio de búsqueda rápida.

### Dueño afiliado

1. Registrar datos del dueño:
   - Nombre
   - Apellido
   - DNI
   - Dirección
   - Teléfono
   - Email
   - Forma de pago
2. Permitir que el dueño afiliado edite únicamente su teléfono y dirección; el resto de su ficha no es editable por él.
3. El alta del dueño y de la mascota la gestiona el administrador.

### Veterinario asociado

1. Para cada veterinario asociado se deberán registrar, como mínimo, los siguientes datos:
   - Nombre.
   - Apellido.
   - DNI.
   - Veterinaria en la que trabaja.
   - Teléfono.
   - Email.
   - Estado de la cuenta (activo/inactivo).
2. Cada veterinario deberá poseer una cuenta individual para acceder al sistema.
3. El email registrado podrá utilizarse como identificador de acceso y para la recuperación de la cuenta.
4. El alta, modificación y baja de los datos del veterinario será gestionada exclusivamente por el administrador.
5. Cuando un veterinario sea dado de baja, su cuenta deberá quedar inhabilitada para nuevos accesos, manteniendo su información histórica y los consumos de prestaciones que haya registrado.

### Planes y coberturas

1. Definir planes con ítems (consultas, vacunas, radiografías, ecografías, laboratorio, cirugías, internaciones), cada uno con límite de uso, periodicidad (mensual/anual) y condición de no acumulabilidad.
2. Permitir planes distintos por mascota, incluso dentro del mismo grupo familiar.
3. El plan debe registrar nombre, precio/cuota mensual y estado activo/inactivo.
4. El administrador podrá modificar el precio, las prestaciones, los límites y demás condiciones de un plan existente.
5. Las modificaciones realizadas sobre un plan se aplicarán también a todas las mascotas que se encuentren asociadas a dicho plan.
6. Las modificaciones realizadas sobre un plan entrarán en vigencia a partir del primer día del mes calendario siguiente a la fecha en que fueron realizadas.
7. Hasta la finalización del mes en curso se mantendrán vigentes las condiciones anteriores del plan.
8. La modificación de un plan no deberá modificar ni eliminar el historial de pagos, consumos y condiciones registradas con anterioridad al cambio.
9. Cada prestación de un plan podrá configurarse para quedar habilitada a partir de una determinada cantidad de períodos de cobertura pagos.
10. El cómputo para la habilitación progresiva de prestaciones comenzará desde el alta de la mascota y la registración de su primer pago.
11. Solo se contabilizarán para la antigüedad de cobertura los períodos que hayan sido abonados completamente.
12. Si la cobertura de la mascota se suspende por falta de pago, el cómputo de antigüedad para la habilitación de nuevas prestaciones se detendrá durante los períodos impagos.
13. Al reactivarse la cobertura mediante el pago correspondiente, el cómputo de antigüedad continuará desde la cantidad de períodos pagos acumulados previamente.
14. El sistema debe impedir el consumo de una prestación mientras la mascota no haya alcanzado la cantidad de períodos pagos requerida para su habilitación.
15. El administrador podrá cambiar el plan asociado a una mascota. El cambio entrará en vigencia a partir del primer día del mes calendario siguiente.
16. Hasta la entrada en vigencia del nuevo plan, la mascota conservará las condiciones, prestaciones, límites y precio correspondientes al plan anterior.

### Pagos y estado de cobertura

1. El pago de la cobertura se realiza de manera independiente por cada mascota.
2. Cada mascota posee su propio estado de cobertura, independientemente del estado de cobertura de otras mascotas pertenecientes al mismo dueño.
3. El vencimiento mensual de la cobertura es el día 13 de cada mes. La mascota mantiene la cobertura activa durante todo el día 13.
4. Si al comenzar el día 14 no se encuentra registrado el pago correspondiente al período vigente, la cobertura de la mascota se suspende automáticamente por falta de pago.
5. Cuando se registra el pago correspondiente al período adeudado, la cobertura de la mascota debe reactivarse inmediatamente.
6. No se permiten pagos anticipados correspondientes a períodos futuros.
7. No se permiten pagos parciales. Para considerar una cuota como abonada debe registrarse el importe completo correspondiente al plan de la mascota.
8. Cada pago debe estar asociado como mínimo a:
   - Mascota.
   - Período correspondiente.
   - Fecha de pago.
   - Importe.
   - Forma de pago.
   - Usuario administrador que registró el pago.
9. El registro manual de pagos es una acción exclusiva del administrador.
10. El sistema debe mantener un historial de pagos por mascota. El administrador podrá consultar también los pagos agrupados por dueño.
11. Si el administrador registra un pago incorrectamente, podrá corregirlo. Toda modificación deberá quedar auditada registrando:
    - Valor anterior.
    - Valor nuevo.
    - Usuario que realizó la modificación.
    - Fecha y hora de la modificación.
    - Motivo de la corrección.
12. Una modificación de un pago nunca debe reemplazar silenciosamente la información anterior.
13. No podrá existir más de un pago válido correspondiente a la misma mascota y período.
14. El estado de cobertura deberá poder distinguir, como mínimo, entre:
    - Al día.
    - Suspendida por falta de pago.
    - Dada de baja.

### Control de prestaciones

1. Registrar cada consumo de prestación: fecha, tipo, paciente, veterinario que lo cargó.
2. Calcular en tiempo real el saldo disponible de cada ítem del plan.
3. Alertar cuando una prestación se agota dentro del período vigente.
4. Antes de registrar un consumo, el sistema debe verificar que la mascota tenga cobertura activa.
5. Antes de registrar un consumo, debe verificar que la prestación esté incluida en el plan.
6. Debe verificar que la prestación se encuentre habilitada según las reglas del plan.
7. Debe verificar que exista saldo disponible para el período correspondiente.
8. Si alguna validación falla, el consumo no debe registrarse y el sistema debe informar el motivo.
9. Los consumos registrados incorrectamente deben poder corregirse o anularse únicamente por el administrador conservando el registro original y dejando auditados usuario, fecha, motivo y modificación realizada.
10. Cuando un consumo sea anulado o modificado por el administrador, el sistema deberá recalcular automáticamente el saldo disponible de la prestación correspondiente.
11. Si la anulación o modificación corresponde a un consumo válido dentro del período vigente, la prestación consumida deberá volver a quedar disponible, siempre que las reglas y límites actuales del plan lo permitan.
12. Si un consumo es corregido, el sistema deberá actualizar el saldo de las prestaciones afectadas de acuerdo con la información corregida.
13. Toda corrección o anulación de un consumo deberá conservar el registro original y quedar auditada con usuario responsable, fecha y hora, motivo y detalle de la modificación realizada.

### Notificaciones

1. Enviar notificación (email/WhatsApp) 48 hs antes del vencimiento. Solo se envía si todavía no está registrado el pago del período.
2. Mostrar alertas de vencimiento y de agotamiento de prestaciones en la interfaz de cada usuario según corresponda.
3. El sistema debe registrar si el intento de envío de una notificación fue exitoso o fallido.

### Roles y permisos

- El administrador será responsable de crear y gestionar las cuentas de los veterinarios asociados.
- La cuenta del dueño afiliado será creada o habilitada a partir del alta realizada por el administrador. El dueño no podrá registrarse por cuenta propia.
- Cada cuenta de usuario será individual y estará asociada a un único rol.
- Un dueño afiliado tendrá una única cuenta de acceso, desde la cual podrá consultar todas las mascotas que tenga asociadas.
- Los veterinarios y dueños afiliados podrán recuperar el acceso a su cuenta mediante el mecanismo de recuperación definido por el sistema.
- Cuando un veterinario o dueño afiliado sea dado de baja, su cuenta deberá quedar inhabilitada para nuevos accesos.
- El veterinario podrá consultar toda la información registrada en la ficha del paciente al momento del alta y sus posteriores actualizaciones, incluyendo los datos identificatorios y sanitarios de la mascota.
- El veterinario podrá consultar el número de afiliado de la mascota, el plan contratado, el estado de cobertura y las prestaciones disponibles y consumidas.
- El veterinario podrá consultar nombre, apellido, DNI y teléfono del dueño de la mascota.
- El veterinario no podrá consultar información relacionada con pagos, forma de pago ni historial de pagos.
- El veterinario no podrá modificar los datos personales del dueño, los datos administrativos de la mascota, el plan contratado ni el estado de cobertura.
- El administrador posee permisos especiales para corregir pagos registrados incorrectamente y corregir o anular consumos de prestaciones cargados por error.
- Toda acción de corrección realizada por el administrador deberá quedar auditada, registrando como mínimo el usuario responsable, la fecha y hora, el motivo de la modificación y los valores anteriores cuando corresponda.
- Los permisos especiales del administrador no permiten omitir silenciosamente las reglas de cobertura, límites de prestaciones o estados de cobertura definidos por el sistema.

### Trazabilidad

- Mantener registro auditable (quién, qué, cuándo) de altas, bajas, suspensiones por falta de pago, reactivaciones, modificaciones de planes, pagos y sus correcciones, consumos y sus correcciones.

## Requisitos no funcionales

- Los datos del sistema deberán utilizar borrado lógico. La baja de un registro no deberá eliminar físicamente su información de la base de datos.
- Los registros dados de baja deberán conservarse para mantener el historial, la trazabilidad y la auditoría del sistema.
- Los registros dados de baja no deberán aparecer como activos ni estar disponibles para nuevas operaciones, salvo en consultas históricas realizadas por usuarios autorizados.
- La baja lógica deberá registrar, cuando corresponda, la fecha y hora de la baja y el usuario responsable de realizarla.
- **Rendimiento:** las consultas principales del sistema, especialmente la búsqueda de mascotas, la consulta de la ficha del paciente, el estado de cobertura y las prestaciones disponibles, deberán responder de forma ágil para no interrumpir la atención veterinaria.
- Como objetivo inicial, las consultas habituales deberán resolverse en un tiempo menor a 2 segundos bajo condiciones normales de uso.
- Las operaciones que modifican información crítica, como el registro de pagos o consumos de prestaciones, deberán confirmar su resultado al usuario una vez que la operación haya sido procesada correctamente.
- **Disponibilidad:** el sistema deberá estar disponible durante la operación habitual de administradores, veterinarios y dueños afiliados, salvo períodos de mantenimiento programado o fallas excepcionales.
- Las tareas automáticas críticas, como la suspensión de cobertura por falta de pago, la reactivación al registrar un pago, el reinicio de prestaciones y el envío de notificaciones, deberán ejecutarse de manera confiable y dejar registro en caso de error.
- **Seguridad y confidencialidad:** DNI, dirección y teléfono son datos sensibles; un dueño afiliado no debe poder ver información de otros dueños afiliados, y el acceso de veterinarios se limita a los datos necesarios para su función.
- **Seguridad y confidencialidad:** el acceso a la información deberá estar restringido según el rol y los permisos de cada usuario.
- Un dueño afiliado solo podrá acceder a su propia información y a la de las mascotas que tenga asociadas.
- Un veterinario solo podrá acceder a la información autorizada de las mascotas que consulte, según las restricciones definidas para su rol.
- Toda comunicación entre los usuarios y el sistema deberá realizarse mediante conexiones seguras y cifradas.
- Las contraseñas de los usuarios deberán almacenarse de forma segura y nunca en texto plano.
- Las validaciones de permisos deberán realizarse en el sistema y no depender únicamente de ocultar opciones en la interfaz.
- Las operaciones críticas, como el registro de pagos y consumos de prestaciones, deberán protegerse contra registros duplicados provocados por errores, reintentos de red o múltiples acciones consecutivas del usuario.
- El sistema deberá preservar la integridad de los datos y evitar que una prestación sea consumida por encima de los límites establecidos por el plan.
- **Integridad de pagos:** los pagos registrados deben poder corregirse ante un error de carga, pero ninguna corrección puede ser una edición silenciosa, siempre queda auditada (quién, cuándo, motivo).
- **Usabilidad / baja fricción**, especialmente en el flujo de pago.
- **Escalabilidad:** pensado para crecer de los primeros clientes a un volumen de 500-600 dueños afiliados y múltiples veterinarias asociadas.
- **Compatibilidad multiplataforma / diseño responsive:** uso esperado desde el celular, tanto por dueños afiliados como por veterinarios en consultorio.
- **Auditabilidad:** toda acción crítica (pago, alta, baja) debe quedar registrada con fecha/hora y usuario responsable.
- **Cumplimiento normativo:** tratamiento de datos personales conforme a la Ley 25.326 de Protección de Datos Personales (Argentina).
- **Integrabilidad:** diseño preparado para conectar servicios externos (MercadoPago, email/WhatsApp) sin acoplar el core del sistema a ellos.
- El sistema deberá realizar copias de seguridad automáticas y periódicas de la información almacenada.
- Se deberá realizar como mínimo una copia de seguridad diaria de la base de datos.
- Las copias de seguridad deberán almacenarse de forma segura y separada de la instancia principal de la base de datos.
- El sistema deberá permitir restaurar la información a partir de una copia de seguridad ante una pérdida, corrupción o falla grave.
- Las copias de seguridad deberán conservarse durante un período suficiente para permitir la recuperación ante errores detectados con posterioridad.
- El procedimiento de restauración deberá verificarse periódicamente para asegurar que las copias generadas sean utilizables.
