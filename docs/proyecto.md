# WildSalud — Proyecto

## Cómo leer este documento

**Identificadores.** Cada requisito funcional y no funcional tiene un identificador estable con el formato `PREFIJO-NN` (dos dígitos, numerados desde 01 dentro de cada prefijo). Los casos de uso y demás documentos citan los requisitos por este identificador. Las secciones "Descripción del proyecto", "Usuarios" y "Casos de uso" no llevan identificadores.

| Prefijo | Sección |
|---------|---------|
| `RF-AUT` | Requisitos funcionales — Autenticación |
| `RF-MAS` | Requisitos funcionales — Identificación / ficha de la mascota |
| `RF-DUE` | Requisitos funcionales — Dueño afiliado |
| `RF-VET` | Requisitos funcionales — Veterinario asociado |
| `RF-PLA` | Requisitos funcionales — Planes y coberturas |
| `RF-PAG` | Requisitos funcionales — Pagos y estado de cobertura |
| `RF-PRE` | Requisitos funcionales — Control de prestaciones |
| `RF-NOT` | Requisitos funcionales — Notificaciones |
| `RF-ROL` | Requisitos funcionales — Roles y permisos |
| `RF-TRA` | Requisitos funcionales — Trazabilidad |
| `RNF-BAJ` | Requisitos no funcionales — Borrado lógico |
| `RNF-REN` | Requisitos no funcionales — Rendimiento |
| `RNF-USA` | Requisitos no funcionales — Usabilidad |
| `RNF-DIS` | Requisitos no funcionales — Disponibilidad y confiabilidad de tareas automáticas |
| `RNF-SEG` | Requisitos no funcionales — Seguridad y confidencialidad |
| `RNF-INT` | Requisitos no funcionales — Integridad de los datos |
| `RNF-ESC` | Requisitos no funcionales — Escalabilidad |
| `RNF-CMP` | Requisitos no funcionales — Compatibilidad multiplataforma / diseño responsive |
| `RNF-AUD` | Requisitos no funcionales — Auditabilidad |
| `RNF-LEG` | Requisitos no funcionales — Cumplimiento normativo |
| `RNF-ITG` | Requisitos no funcionales — Integrabilidad |
| `RNF-BAK` | Requisitos no funcionales — Copias de seguridad |

**Texto original.** El texto de los requisitos y de las demás secciones no se modificó: solo se agregaron los identificadores, las notas de trazabilidad y esta sección.

**Notas de trazabilidad.** Debajo de un ítem puede aparecer una nota que lo vincula con las decisiones de diseño registradas en [decisiones.md](decisiones.md). Una nota puede citar varias decisiones y resume brevemente su efecto:

| Nota | Significado |
|------|-------------|
| **Precisado por Dn** | La decisión aclara algo ambiguo sin contradecir el texto. |
| **Ajustado por Dn** | La decisión cambia parcialmente lo que dice el texto; donde difieren, rige la decisión. |
| **Reemplazado por Dn** | El requisito ya no aplica tal como está escrito; rige la decisión. |

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
  > **Ajustado por [D15](decisiones.md#usuarios-y-acceso):** "Administrador" es un rol: hoy lo ejerce una persona, pero el sistema admite varios administradores.
- **Veterinario asociado:** Profesional que trabaja en una veterinaria adherida a WildSalud y que puede consultar la cobertura de una mascota y registrar el uso de prestaciones durante su atención.
- **Dueño afiliado:** Cliente final, dueño de una o más mascotas. No gestiona su propia alta (la hace el administrador); solo puede editar algunos de sus datos personales y consultar el estado de su cobertura.

## Casos de uso

### Administrador

1. Iniciar sesión / cerrar sesión
2. Alta / edición / baja de veterinarios asociados.
3. Alta / edición / baja de dueños afiliados y mascotas.
   > **Precisado por [D22](decisiones.md#usuarios-y-acceso), [D29](decisiones.md#deuda-y-baja-automática), [D38](decisiones.md#deuda-y-baja-automática):** la baja de un dueño es en cascada (cuenta, mascotas y coberturas); no se puede dar de alta una mascota si el dueño tiene deuda de cualquiera de sus mascotas.
4. Definir y editar planes de cobertura
5. Registrar pagos manualmente
6. Dar de baja plan de una mascota
   > **Precisado por [D10](decisiones.md#estado-de-la-cobertura), [D18](decisiones.md#estado-de-la-cobertura):** dar de baja el plan deja a la mascota registrada sin plan; la baja voluntaria rige desde el 1 del mes siguiente, o de inmediato si la cobertura está suspendida.
7. Ver panel global de mascotas, coberturas y estados de pago.
8. Consultar historial de pagos por mascota y agrupado por dueño.
9. Asignar un plan a una mascota.
10. Cambiar el plan de una mascota.
11. Reactivar una cobertura suspendida por falta de pago mediante el registro del pago correspondiente.
    > **Ajustado por [D4](decisiones.md#deuda-y-baja-automática), [D5](decisiones.md#deuda-y-baja-automática):** para reactivar hay que pagar todos los períodos adeudados más el mes en curso, del más antiguo al más nuevo.
12. Corregir/anular un consumo cargado incorrectamente
13. Buscar/filtrar dueños afiliados y mascotas por estado

### Veterinario asociado

1. Iniciar sesión / cerrar sesión
2. Buscar mascota/ dueño afiliado por número de afiliado de la mascota, DNI del dueño u otros datos disponibles. Ej: nombre de la mascota.
3. Consultar ficha del paciente y estado de cobertura
4. Registrar consumo de una prestación (marcar uso)
5. Ver alerta si la prestación está agotada o la cobertura se encuentra suspendida por falta de pago.
6. Recuperar acceso/contraseña
   > **Reemplazado por [D24](decisiones.md#usuarios-y-acceso), [D37](decisiones.md#usuarios-y-acceso):** el acceso es solo con Google o Apple; la contraseña de Google/Apple se recupera con el propio proveedor; si se pierde la cuenta, solo el administrador reenvía la invitación al email registrado para vincular una nueva.

**Restricción explícita:** El veterinario no puede dar de alta ni de baja a dueños afiliados, ni modificar datos personales o de pago. Solo interactúa con la ficha de la mascota que tiene delante.

### Dueño afiliado

1. Iniciar sesión / cerrar sesión
2. Consultar sus mascotas, plan asociado y estado de cobertura
3. Consultar prestaciones disponibles/consumidas de su plan
4. Modificar teléfono y dirección
5. Ver y recibir alertas de vencimiento próximo
6. Recuperar acceso/contraseña
   > **Reemplazado por [D24](decisiones.md#usuarios-y-acceso), [D37](decisiones.md#usuarios-y-acceso):** el acceso es solo con Google o Apple; la contraseña de Google/Apple se recupera con el propio proveedor; si se pierde la cuenta, solo el administrador reenvía la invitación al email registrado para vincular una nueva.

### Casos de uso automáticos / del sistema

1. Suspensión automática de la cobertura al comenzar el día 14 si no se registró el pago del período.
2. Notificación de vencimiento próximo
3. La cobertura de una mascota comenzará a partir de la fecha en que sea dada de alta y se registre su primer pago.
   > **Precisado por [D2](decisiones.md#período-y-pagos), [D3](decisiones.md#período-y-pagos):** el alta de la cobertura exige registrar en el mismo momento el primer pago, que es la cuota completa del mes en curso.
4. Las prestaciones con periodicidad mensual reiniciarán su saldo al comenzar cada nuevo mes calendario.
5. Las prestaciones con periodicidad anual reiniciarán su saldo al comenzar cada nuevo año calendario.
6. El reinicio del saldo de las prestaciones es independiente de la fecha de alta de la mascota y no modifica la regla de vencimiento de la cobertura, que continúa siendo el día 13 de cada mes.
7. Aviso de agotamiento de una prestación
8. Propagación instantánea del estado de cobertura
9. Reactivar cobertura automáticamente al registrar el pago
   > **Ajustado por [D4](decisiones.md#deuda-y-baja-automática), [D5](decisiones.md#deuda-y-baja-automática):** la reactivación ocurre recién cuando no queda ningún período impago hasta el mes en curso inclusive.
10. Bloquear consumo no autorizado por el plan

## Requisitos funcionales

### Autenticación

- **RF-AUT-01** — El sistema debe requerir autenticación para acceder a funciones privadas.
  > **Precisado por [D24](decisiones.md#usuarios-y-acceso):** la autenticación es solo con Google o Apple, para todos los roles; el sistema no tiene contraseñas propias.
- **RF-AUT-02** — Cada usuario debe acceder mediante una cuenta individual.
- **RF-AUT-03** — El sistema debe aplicar permisos de acuerdo con el rol autenticado.
- **RF-AUT-04** — Un usuario dado de baja no debe poder iniciar nuevas sesiones.
- **RF-AUT-05** — El sistema debe disponer de un mecanismo de recuperación de acceso para veterinarios y dueños afiliados.
  > **Reemplazado por [D24](decisiones.md#usuarios-y-acceso), [D37](decisiones.md#usuarios-y-acceso):** el acceso es solo con Google o Apple; la contraseña de Google/Apple se recupera con el propio proveedor; si se pierde la cuenta, solo el administrador reenvía la invitación al email registrado para vincular una nueva.

### Identificación / ficha de la mascota

- **RF-MAS-01** — Registrar datos de la mascota:
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
  > **Precisado por [D41](decisiones.md#mascota):** la edad aproximada se guarda en años, tal como se cargó.
- **RF-MAS-02** — Asociar cada mascota a un único dueño (relación 1 dueño → N mascotas).
  > **Precisado por [D42](decisiones.md#mascota):** la transferencia de una mascota a otro dueño está fuera de alcance: se da de baja y se da de alta con el nuevo dueño.
- **RF-MAS-03** — Asignar el plan de cobertura por mascota, no por dueño (dos mascotas del mismo dueño pueden tener planes distintos).
- **RF-MAS-04** — Identificar a cada dueño con su dni y a su mascota con un número de afiliado, usable como criterio de búsqueda rápida.
  > **Precisado por [D23](decisiones.md#mascota), [D45](decisiones.md#usuarios-y-acceso):** el número de afiliado lo genera el sistema, es único, nunca se reutiliza y se conserva entre coberturas; el DNI del dueño es único y no hay número de socio visible.

### Dueño afiliado

- **RF-DUE-01** — Registrar datos del dueño:
   - Nombre
   - Apellido
   - DNI
   - Dirección
   - Teléfono
   - Email
   - Forma de pago
  > **Precisado por [D7](decisiones.md#período-y-pagos):** la forma de pago del dueño es la preferida y se propone por defecto; cada pago guarda la forma realmente usada.
- **RF-DUE-02** — Permitir que el dueño afiliado edite únicamente su teléfono y dirección; el resto de su ficha no es editable por él.
- **RF-DUE-03** — El alta del dueño y de la mascota la gestiona el administrador.
  > **Precisado por [D29](decisiones.md#deuda-y-baja-automática), [D38](decisiones.md#deuda-y-baja-automática):** no se puede dar de alta otra mascota si el dueño tiene cualquier período impago y vencido de alguna de sus mascotas, incluida deuda congelada.

### Veterinario asociado

- **RF-VET-01** — Para cada veterinario asociado se deberán registrar, como mínimo, los siguientes datos:
   - Nombre.
   - Apellido.
   - DNI.
   - Veterinaria en la que trabaja.
   - Teléfono.
   - Email.
   - Estado de la cuenta (activo/inactivo).
  > **Precisado por [D13](decisiones.md#usuarios-y-acceso), [D14](decisiones.md#consumos):** la veterinaria es un dato de texto del veterinario; cada consumo guarda una copia de ella al momento de registrarse.
- **RF-VET-02** — Cada veterinario deberá poseer una cuenta individual para acceder al sistema.
- **RF-VET-03** — El email registrado podrá utilizarse como identificador de acceso y para la recuperación de la cuenta.
  > **Reemplazado por [D24](decisiones.md#usuarios-y-acceso), [D37](decisiones.md#usuarios-y-acceso):** el acceso es con Google o Apple y la cuenta se vincula por invitación mediante el identificador del proveedor, no por email; la contraseña de Google/Apple se recupera con el propio proveedor; si se pierde la cuenta, solo el administrador reenvía la invitación al email registrado para vincular una nueva.
- **RF-VET-04** — El alta, modificación y baja de los datos del veterinario será gestionada exclusivamente por el administrador.
- **RF-VET-05** — Cuando un veterinario sea dado de baja, su cuenta deberá quedar inhabilitada para nuevos accesos, manteniendo su información histórica y los consumos de prestaciones que haya registrado.
  > **Precisado por [D44](decisiones.md#usuarios-y-acceso):** si el veterinario vuelve, se reactiva su registro existente con su historial.

### Planes y coberturas

- **RF-PLA-01** — Definir planes con ítems (consultas, vacunas, radiografías, ecografías, laboratorio, cirugías, internaciones), cada uno con límite de uso, periodicidad (mensual/anual) y condición de no acumulabilidad.
  > **Ajustado por [D31](decisiones.md#planes-y-cambios-de-plan), [D32](decisiones.md#planes-y-cambios-de-plan):** los tipos de prestación son un catálogo que gestiona el administrador (arranca con estos 7 y admite otros); el límite es opcional y vacío significa ilimitada.
- **RF-PLA-02** — Permitir planes distintos por mascota, incluso dentro del mismo grupo familiar.
- **RF-PLA-03** — El plan debe registrar nombre, precio/cuota mensual y estado activo/inactivo.
  > **Precisado por [D21](decisiones.md#planes-y-cambios-de-plan):** un plan inactivo no se puede asignar a nuevas mascotas; las que ya lo tienen lo conservan.
- **RF-PLA-04** — El administrador podrá modificar el precio, las prestaciones, los límites y demás condiciones de un plan existente.
- **RF-PLA-05** — Las modificaciones realizadas sobre un plan se aplicarán también a todas las mascotas que se encuentren asociadas a dicho plan.
- **RF-PLA-06** — Las modificaciones realizadas sobre un plan entrarán en vigencia a partir del primer día del mes calendario siguiente a la fecha en que fueron realizadas.
  > **Precisado por [D1](decisiones.md#período-y-pagos), [D6](decisiones.md#período-y-pagos):** las versiones del plan se alinean al mes calendario; cada período se paga al precio del plan vigente el día 1 de ese mes.
- **RF-PLA-07** — Hasta la finalización del mes en curso se mantendrán vigentes las condiciones anteriores del plan.
- **RF-PLA-08** — La modificación de un plan no deberá modificar ni eliminar el historial de pagos, consumos y condiciones registradas con anterioridad al cambio.
- **RF-PLA-09** — Cada prestación de un plan podrá configurarse para quedar habilitada a partir de una determinada cantidad de períodos de cobertura pagos.
- **RF-PLA-10** — El cómputo para la habilitación progresiva de prestaciones comenzará desde el alta de la mascota y la registración de su primer pago.
  > **Precisado por [D2](decisiones.md#período-y-pagos), [D3](decisiones.md#período-y-pagos), [D9](decisiones.md#estado-de-la-cobertura), [D11](decisiones.md#antigüedad-y-saldos):** el primer pago es la cuota completa del mes del alta y cuenta como 1 período; no hay cobertura sin primer pago; tras una baja, la cobertura nueva empieza con antigüedad 0; la antigüedad es de la cobertura, no del plan.
- **RF-PLA-11** — Solo se contabilizarán para la antigüedad de cobertura los períodos que hayan sido abonados completamente.
  > **Precisado por [D28](decisiones.md#deuda-y-baja-automática):** los pagos de deuda congelada de una cobertura anterior no suman antigüedad a la cobertura nueva.
- **RF-PLA-12** — Si la cobertura de la mascota se suspende por falta de pago, el cómputo de antigüedad para la habilitación de nuevas prestaciones se detendrá durante los períodos impagos.
  > **Ajustado por [D12](decisiones.md#antigüedad-y-saldos):** la antigüedad es la cantidad de períodos pagos, sin importar cuándo se pagaron; un período impago no suma, pero sí suma cuando se paga tarde.
- **RF-PLA-13** — Al reactivarse la cobertura mediante el pago correspondiente, el cómputo de antigüedad continuará desde la cantidad de períodos pagos acumulados previamente.
  > **Ajustado por [D12](decisiones.md#antigüedad-y-saldos), [D4](decisiones.md#deuda-y-baja-automática):** como la reactivación exige pagar todos los períodos adeudados más el mes en curso, todos esos períodos suman a la antigüedad.
- **RF-PLA-14** — El sistema debe impedir el consumo de una prestación mientras la mascota no haya alcanzado la cantidad de períodos pagos requerida para su habilitación.
- **RF-PLA-15** — El administrador podrá cambiar el plan asociado a una mascota. El cambio entrará en vigencia a partir del primer día del mes calendario siguiente.
  > **Precisado por [D19](decisiones.md#planes-y-cambios-de-plan), [D20](decisiones.md#planes-y-cambios-de-plan):** solo se puede cambiar el plan de una cobertura al día; hay un único cambio pendiente por mascota, que el administrador puede cancelar o reemplazar antes de su vigencia.
- **RF-PLA-16** — Hasta la entrada en vigencia del nuevo plan, la mascota conservará las condiciones, prestaciones, límites y precio correspondientes al plan anterior.
  > **Precisado por [D30](decisiones.md#antigüedad-y-saldos):** al entrar en vigencia el plan nuevo, los consumos anuales del año se siguen contando contra el límite del plan nuevo.

### Pagos y estado de cobertura

- **RF-PAG-01** — El pago de la cobertura se realiza de manera independiente por cada mascota.
- **RF-PAG-02** — Cada mascota posee su propio estado de cobertura, independientemente del estado de cobertura de otras mascotas pertenecientes al mismo dueño.
- **RF-PAG-03** — El vencimiento mensual de la cobertura es el día 13 de cada mes. La mascota mantiene la cobertura activa durante todo el día 13.
  > **Precisado por [D1](decisiones.md#período-y-pagos), [D17](decisiones.md#estado-de-la-cobertura):** el período es el mes calendario y su cuota vence el 13 de ese mismo mes; del 1 al 13 sin pagar la cobertura sigue al día y admite consumos.
- **RF-PAG-04** — Si al comenzar el día 14 no se encuentra registrado el pago correspondiente al período vigente, la cobertura de la mascota se suspende automáticamente por falta de pago.
  > **Precisado por [D1](decisiones.md#período-y-pagos):** el período vigente es el mes calendario en curso (AAAA-MM).
- **RF-PAG-05** — Cuando se registra el pago correspondiente al período adeudado, la cobertura de la mascota debe reactivarse inmediatamente.
  > **Ajustado por [D4](decisiones.md#deuda-y-baja-automática), [D5](decisiones.md#deuda-y-baja-automática):** hay que pagar toda la deuda más el mes en curso, del período más antiguo al más nuevo; la cobertura se reactiva recién cuando no queda ningún período impago.
- **RF-PAG-06** — No se permiten pagos anticipados correspondientes a períodos futuros.
  > **Precisado por [D5](decisiones.md#deuda-y-baja-automática):** se puede pagar como máximo hasta el mes en curso inclusive.
- **RF-PAG-07** — No se permiten pagos parciales. Para considerar una cuota como abonada debe registrarse el importe completo correspondiente al plan de la mascota.
  > **Precisado por [D6](decisiones.md#período-y-pagos):** el importe es el precio del plan vigente el día 1 del mes del período, también cuando se paga como deuda.
- **RF-PAG-08** — Cada pago debe estar asociado como mínimo a:
   - Mascota.
   - Período correspondiente.
   - Fecha de pago.
   - Importe.
   - Forma de pago.
   - Usuario administrador que registró el pago.
  > **Precisado por [D7](decisiones.md#período-y-pagos):** la forma de pago registrada es la realmente usada; la preferida del dueño solo se propone por defecto.
- **RF-PAG-09** — El registro manual de pagos es una acción exclusiva del administrador.
- **RF-PAG-10** — El sistema debe mantener un historial de pagos por mascota. El administrador podrá consultar también los pagos agrupados por dueño.
- **RF-PAG-11** — Si el administrador registra un pago incorrectamente, podrá corregirlo. Toda modificación deberá quedar auditada registrando:
    - Valor anterior.
    - Valor nuevo.
    - Usuario que realizó la modificación.
    - Fecha y hora de la modificación.
    - Motivo de la corrección.
  > **Ajustado por [D39](decisiones.md#período-y-pagos), [D36](decisiones.md#período-y-pagos):** el pago no se edita: se anula con motivo y se registra un pago nuevo enlazado; si al anular el período queda impago y vencido, la cobertura se suspende en ese momento y los consumos ya registrados siguen siendo válidos.
- **RF-PAG-12** — Una modificación de un pago nunca debe reemplazar silenciosamente la información anterior.
  > **Precisado por [D39](decisiones.md#período-y-pagos):** la corrección se hace anulando el pago original y registrando uno nuevo enlazado.
- **RF-PAG-13** — No podrá existir más de un pago válido correspondiente a la misma mascota y período.
- **RF-PAG-14** — El estado de cobertura deberá poder distinguir, como mínimo, entre:
    - Al día.
    - Suspendida por falta de pago.
    - Dada de baja.
  > **Precisado por [D16](decisiones.md#estado-de-la-cobertura), [D8](decisiones.md#deuda-y-baja-automática), [D27](decisiones.md#deuda-y-baja-automática), [D28](decisiones.md#deuda-y-baja-automática):** la baja guarda un motivo (voluntaria, por deuda o por baja de la mascota); la baja por deuda es automática a los 3 meses completos de la suspensión y congela los períodos vencidos antes del mes de la baja, que deben pagarse antes de crear una cobertura nueva.

### Control de prestaciones

- **RF-PRE-01** — Registrar cada consumo de prestación: fecha, tipo, paciente, veterinario que lo cargó.
  > **Precisado por [D14](decisiones.md#consumos), [D26](decisiones.md#consumos):** la fecha es siempre el momento del registro (no se cargan consumos con fecha anterior); cada consumo guarda además una copia de la veterinaria.
- **RF-PRE-02** — Calcular en tiempo real el saldo disponible de cada ítem del plan.
  > **Precisado por [D30](decisiones.md#antigüedad-y-saldos), [D32](decisiones.md#planes-y-cambios-de-plan):** saldo = límite del plan vigente − consumos del período (mes o año según la prestación); una prestación sin límite es ilimitada.
- **RF-PRE-03** — Alertar cuando una prestación se agota dentro del período vigente.
- **RF-PRE-04** — Antes de registrar un consumo, el sistema debe verificar que la mascota tenga cobertura activa.
  > **Precisado por [D17](decisiones.md#estado-de-la-cobertura):** del día 1 al 13 sin pagar la cobertura sigue al día y se pueden registrar consumos.
- **RF-PRE-05** — Antes de registrar un consumo, debe verificar que la prestación esté incluida en el plan.
- **RF-PRE-06** — Debe verificar que la prestación se encuentre habilitada según las reglas del plan.
- **RF-PRE-07** — Debe verificar que exista saldo disponible para el período correspondiente.
- **RF-PRE-08** — Si alguna validación falla, el consumo no debe registrarse y el sistema debe informar el motivo.
- **RF-PRE-09** — Los consumos registrados incorrectamente deben poder corregirse o anularse únicamente por el administrador conservando el registro original y dejando auditados usuario, fecha, motivo y modificación realizada.
  > **Precisado por [D34](decisiones.md#consumos), [D40](decisiones.md#consumos):** el veterinario solo registra consumos nuevos; la corrección edita el consumo y deja un registro de auditoría con valor anterior y nuevo.
- **RF-PRE-10** — Cuando un consumo sea anulado o modificado por el administrador, el sistema deberá recalcular automáticamente el saldo disponible de la prestación correspondiente.
- **RF-PRE-11** — Si la anulación o modificación corresponde a un consumo válido dentro del período vigente, la prestación consumida deberá volver a quedar disponible, siempre que las reglas y límites actuales del plan lo permitan.
  > **Precisado por [D35](decisiones.md#consumos):** en un período cerrado la corrección o anulación solo cambia el historial y el saldo de ese período; no devuelve saldo al período actual.
- **RF-PRE-12** — Si un consumo es corregido, el sistema deberá actualizar el saldo de las prestaciones afectadas de acuerdo con la información corregida.
- **RF-PRE-13** — Toda corrección o anulación de un consumo deberá conservar el registro original y quedar auditada con usuario responsable, fecha y hora, motivo y detalle de la modificación realizada.
  > **Precisado por [D35](decisiones.md#consumos), [D40](decisiones.md#consumos):** se pueden corregir o anular consumos de cualquier período; el registro original se conserva en la auditoría (valor anterior y nuevo).

### Notificaciones

- **RF-NOT-01** — Enviar notificación (email/WhatsApp) 48 hs antes del vencimiento. Solo se envía si todavía no está registrado el pago del período.
  > **Ajustado por [D43](decisiones.md#notificaciones), [D25](decisiones.md#notificaciones):** solo email en una primera etapa, con un mecanismo reemplazable para sumar WhatsApp; además se avisa cuando la cobertura se suspende y un mes antes de la baja automática.
- **RF-NOT-02** — Mostrar alertas de vencimiento y de agotamiento de prestaciones en la interfaz de cada usuario según corresponda.
- **RF-NOT-03** — El sistema debe registrar si el intento de envío de una notificación fue exitoso o fallido.
  > **Precisado por [D43](decisiones.md#notificaciones):** se guarda el canal y el resultado (éxito/fallo) de cada envío.

### Roles y permisos

- **RF-ROL-01** — El administrador será responsable de crear y gestionar las cuentas de los veterinarios asociados.
  > **Precisado por [D37](decisiones.md#usuarios-y-acceso):** la cuenta se crea por invitación: el administrador da de alta a la persona y el primer ingreso con Google/Apple desde el enlace vincula la cuenta.
- **RF-ROL-02** — La cuenta del dueño afiliado será creada o habilitada a partir del alta realizada por el administrador. El dueño no podrá registrarse por cuenta propia.
  > **Precisado por [D24](decisiones.md#usuarios-y-acceso), [D37](decisiones.md#usuarios-y-acceso):** la cuenta se habilita por invitación de un solo uso y se vincula a una cuenta de Google o Apple.
- **RF-ROL-03** — Cada cuenta de usuario será individual y estará asociada a un único rol.
  > **Precisado por [D46](decisiones.md#usuarios-y-acceso):** una persona que es veterinario y dueño tiene dos usuarios separados, cada uno vinculado a una cuenta de Google/Apple distinta.
- **RF-ROL-04** — Un dueño afiliado tendrá una única cuenta de acceso, desde la cual podrá consultar todas las mascotas que tenga asociadas.
- **RF-ROL-05** — Los veterinarios y dueños afiliados podrán recuperar el acceso a su cuenta mediante el mecanismo de recuperación definido por el sistema.
  > **Reemplazado por [D24](decisiones.md#usuarios-y-acceso), [D37](decisiones.md#usuarios-y-acceso):** el acceso es solo con Google o Apple; la contraseña de Google/Apple se recupera con el propio proveedor; si se pierde la cuenta, solo el administrador reenvía la invitación al email registrado para vincular una nueva.
- **RF-ROL-06** — Cuando un veterinario o dueño afiliado sea dado de baja, su cuenta deberá quedar inhabilitada para nuevos accesos.
  > **Precisado por [D22](decisiones.md#usuarios-y-acceso), [D44](decisiones.md#usuarios-y-acceso):** la baja de un dueño es en cascada (cuenta, mascotas y coberturas); si la persona vuelve, se reactiva su registro existente.
- **RF-ROL-07** — El veterinario podrá consultar toda la información registrada en la ficha del paciente al momento del alta y sus posteriores actualizaciones, incluyendo los datos identificatorios y sanitarios de la mascota.
  > **Precisado por [D33](decisiones.md#mascota):** la ficha completa la crea y modifica solo el administrador; el veterinario solo la consulta.
- **RF-ROL-08** — El veterinario podrá consultar el número de afiliado de la mascota, el plan contratado, el estado de cobertura y las prestaciones disponibles y consumidas.
- **RF-ROL-09** — El veterinario podrá consultar nombre, apellido, DNI y teléfono del dueño de la mascota.
- **RF-ROL-10** — El veterinario no podrá consultar información relacionada con pagos, forma de pago ni historial de pagos.
- **RF-ROL-11** — El veterinario no podrá modificar los datos personales del dueño, los datos administrativos de la mascota, el plan contratado ni el estado de cobertura.
- **RF-ROL-12** — El administrador posee permisos especiales para corregir pagos registrados incorrectamente y corregir o anular consumos de prestaciones cargados por error.
- **RF-ROL-13** — Toda acción de corrección realizada por el administrador deberá quedar auditada, registrando como mínimo el usuario responsable, la fecha y hora, el motivo de la modificación y los valores anteriores cuando corresponda.
- **RF-ROL-14** — Los permisos especiales del administrador no permiten omitir silenciosamente las reglas de cobertura, límites de prestaciones o estados de cobertura definidos por el sistema.

### Trazabilidad

- **RF-TRA-01** — Mantener registro auditable (quién, qué, cuándo) de altas, bajas, suspensiones por falta de pago, reactivaciones, modificaciones de planes, pagos y sus correcciones, consumos y sus correcciones.

## Requisitos no funcionales

- **RNF-BAJ-01** — Los datos del sistema deberán utilizar borrado lógico. La baja de un registro no deberá eliminar físicamente su información de la base de datos.
- **RNF-BAJ-02** — Los registros dados de baja deberán conservarse para mantener el historial, la trazabilidad y la auditoría del sistema.
- **RNF-BAJ-03** — Los registros dados de baja no deberán aparecer como activos ni estar disponibles para nuevas operaciones, salvo en consultas históricas realizadas por usuarios autorizados.
  > **Precisado por [D44](decisiones.md#usuarios-y-acceso):** un dueño o veterinario dado de baja que vuelve se reactiva sobre su registro existente.
- **RNF-BAJ-04** — La baja lógica deberá registrar, cuando corresponda, la fecha y hora de la baja y el usuario responsable de realizarla.
- **RNF-REN-01** — **Rendimiento:** las consultas principales del sistema, especialmente la búsqueda de mascotas, la consulta de la ficha del paciente, el estado de cobertura y las prestaciones disponibles, deberán responder de forma ágil para no interrumpir la atención veterinaria.
- **RNF-REN-02** — Como objetivo inicial, las consultas habituales deberán resolverse en un tiempo menor a 2 segundos bajo condiciones normales de uso.
- **RNF-USA-01** — Las operaciones que modifican información crítica, como el registro de pagos o consumos de prestaciones, deberán confirmar su resultado al usuario una vez que la operación haya sido procesada correctamente.
- **RNF-DIS-01** — **Disponibilidad:** el sistema deberá estar disponible durante la operación habitual de administradores, veterinarios y dueños afiliados, salvo períodos de mantenimiento programado o fallas excepcionales.
- **RNF-DIS-02** — Las tareas automáticas críticas, como la suspensión de cobertura por falta de pago, la reactivación al registrar un pago, el reinicio de prestaciones y el envío de notificaciones, deberán ejecutarse de manera confiable y dejar registro en caso de error.
- **RNF-SEG-01** — **Seguridad y confidencialidad:** DNI, dirección y teléfono son datos sensibles; un dueño afiliado no debe poder ver información de otros dueños afiliados, y el acceso de veterinarios se limita a los datos necesarios para su función.
- **RNF-SEG-02** — **Seguridad y confidencialidad:** el acceso a la información deberá estar restringido según el rol y los permisos de cada usuario.
- **RNF-SEG-03** — Un dueño afiliado solo podrá acceder a su propia información y a la de las mascotas que tenga asociadas.
- **RNF-SEG-04** — Un veterinario solo podrá acceder a la información autorizada de las mascotas que consulte, según las restricciones definidas para su rol.
- **RNF-SEG-05** — Toda comunicación entre los usuarios y el sistema deberá realizarse mediante conexiones seguras y cifradas.
- **RNF-SEG-06** — Las contraseñas de los usuarios deberán almacenarse de forma segura y nunca en texto plano.
  > **Reemplazado por [D24](decisiones.md#usuarios-y-acceso):** el sistema no almacena contraseñas: la autenticación se delega en Google o Apple.
- **RNF-SEG-07** — Las validaciones de permisos deberán realizarse en el sistema y no depender únicamente de ocultar opciones en la interfaz.
- **RNF-INT-01** — Las operaciones críticas, como el registro de pagos y consumos de prestaciones, deberán protegerse contra registros duplicados provocados por errores, reintentos de red o múltiples acciones consecutivas del usuario.
- **RNF-INT-02** — El sistema deberá preservar la integridad de los datos y evitar que una prestación sea consumida por encima de los límites establecidos por el plan.
- **RNF-INT-03** — **Integridad de pagos:** los pagos registrados deben poder corregirse ante un error de carga, pero ninguna corrección puede ser una edición silenciosa, siempre queda auditada (quién, cuándo, motivo).
  > **Precisado por [D39](decisiones.md#período-y-pagos):** la corrección consiste en anular el pago original con motivo y registrar uno nuevo enlazado.
- **RNF-USA-02** — **Usabilidad / baja fricción**, especialmente en el flujo de pago.
- **RNF-ESC-01** — **Escalabilidad:** pensado para crecer de los primeros clientes a un volumen de 500-600 dueños afiliados y múltiples veterinarias asociadas.
- **RNF-CMP-01** — **Compatibilidad multiplataforma / diseño responsive:** uso esperado desde el celular, tanto por dueños afiliados como por veterinarios en consultorio.
- **RNF-AUD-01** — **Auditabilidad:** toda acción crítica (pago, alta, baja) debe quedar registrada con fecha/hora y usuario responsable.
- **RNF-LEG-01** — **Cumplimiento normativo:** tratamiento de datos personales conforme a la Ley 25.326 de Protección de Datos Personales (Argentina).
- **RNF-ITG-01** — **Integrabilidad:** diseño preparado para conectar servicios externos (MercadoPago, email/WhatsApp) sin acoplar el core del sistema a ellos.
  > **Precisado por [D43](decisiones.md#notificaciones):** las notificaciones salen solo por email en una primera etapa, detrás de un mecanismo reemplazable.
- **RNF-BAK-01** — El sistema deberá realizar copias de seguridad automáticas y periódicas de la información almacenada.
- **RNF-BAK-02** — Se deberá realizar como mínimo una copia de seguridad diaria de la base de datos.
- **RNF-BAK-03** — Las copias de seguridad deberán almacenarse de forma segura y separada de la instancia principal de la base de datos.
- **RNF-BAK-04** — El sistema deberá permitir restaurar la información a partir de una copia de seguridad ante una pérdida, corrupción o falla grave.
- **RNF-BAK-05** — Las copias de seguridad deberán conservarse durante un período suficiente para permitir la recuperación ante errores detectados con posterioridad.
- **RNF-BAK-06** — El procedimiento de restauración deberá verificarse periódicamente para asegurar que las copias generadas sean utilizables.
