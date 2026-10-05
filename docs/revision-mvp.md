# Revisión de WildSalud para MVP

Fecha: 2 de octubre de 2026.

Este informe contiene observaciones y propuestas para revisar. **No reemplaza requisitos ni incorpora decisiones de negocio aprobadas.**

## Evaluación

La especificación funcional tiene detalle suficiente para comenzar la implementación, después de cerrar las contradicciones críticas señaladas abajo. Cubre el circuito central: afiliación, primer pago, consulta de cobertura, consumo, vencimiento, suspensión y regularización. El alcance incluye además numerosas operaciones de administración y corrección que pueden distribuirse en entregas.

En este repositorio hay documentación, pero no código de la aplicación, esquema de base de datos, configuración de despliegue ni pruebas ejecutables. Por eso esta revisión evalúa la especificación y su preparación para construir un MVP; no acredita que exista un producto terminado o listo para producción.

Se revisaron requisitos, decisiones, reglas de los 51 casos de uso y escenarios de aceptación de los circuitos críticos. Una comprobación estática recorrió los 54 Markdown originales: 109 requisitos, 142 decisiones registradas —una de ellas reemplazada— y 625 escenarios. No aparecieron referencias a requisitos o decisiones inexistentes ni enlaces a archivos inexistentes. Esto no demuestra consistencia semántica ni valida todos los enlaces a encabezados.

## Qué conservar

- Separación de dueño, mascota y cobertura, con pagos y consumos por mascota.
- Versiones de condiciones de planes y preservación del historial.
- Validaciones de permisos en el servidor.
- Reglas explícitas de concurrencia, reintentos y operaciones «todo o nada».
- Hora de Argentina y estado calculado sin depender exclusivamente de los procesos programados.
- Pagos manuales y exclusión de historia clínica y WhatsApp para la primera etapa.

## Corregir antes de cerrar el modelo de datos

### 1. Reingreso en el mismo mes y unicidad del pago

**Origen:** RF-PAG-13 en `proyecto.md`; CU-15 RN-04; CU-22 RN-05; CU-51 RN-05.

Ejemplo: una mascota paga octubre, se da de baja el 20/10 por pedido del dueño y se reactiva el 25/10. El pago original se conserva válido y la reactivación exige otro pago de octubre. RF-PAG-13 prohíbe dos pagos válidos para la misma mascota y período.

**Decisión necesaria:** definir si el reingreso se permite ese mes y cómo se cobra. Cambiar la unicidad a cobertura + período sería una solución técnica posible, pero implica admitir dos cuotas de la misma mascota en el mismo mes; no debe introducirse sin decidir esa política comercial. Alternativas: impedir el reingreso hasta el mes siguiente o definir una aplicación del pago ya realizado. Agregar un escenario de aceptación de este recorrido completo.

**Resuelto (05/10/2026):** se mantiene RF-PAG-13 (un pago válido por mascota y período). Si la mascota ya tiene pagado el mes en curso por una cobertura dada de baja, no se le puede asignar un plan ni reactivarla hasta el día 1 del mes siguiente (D144, CU-22 RN-11 y EX-08, CU-51 RN-13 y EX-10).

### 2. Corrección de pagos entre mascotas con importes distintos

**Origen:** CU-29 FA-01 y RN-02 (versión anterior).

La versión revisada de CU-29 permitía trasladar un pago a otra mascota, y el sistema calculaba el importe de la mascota de destino. Un pago original de $10.000 podía convertirse en uno válido de $15.000 aunque solo se hubieran recibido $10.000.

**Resuelto (05/10/2026):** la corrección de un pago es sobre el pago de cada mascota y **no permite cambiar la mascota** (D66, CU-29 RN-02). Solo se corrigen la fecha de pago y la forma de pago; el pago nuevo es de la misma mascota, el mismo período y el mismo importe (CU-29 RN-03). Si un pago se cargó a la mascota equivocada, se anula en esa mascota (CU-28) y se registra en la correcta (CU-26), con las reglas de registro habituales. Las diferencias de importe entre las dos mascotas se resuelven fuera del sistema antes de registrar el pago correcto.

### 3. El primer pago no tiene salida ante errores

**Origen:** D65; CU-28 EX-04; CU-29 EX-06.

La prohibición abarca incluso errores de fecha o forma de pago. Además, si se registró por error un alta con primer pago que nunca existió, dar de baja la cobertura conserva el pago falso y no resuelve el problema.

**Propuesta:** permitir corregir datos informativos sin eliminar la condición de primer pago. Para un alta incorrecta, definir una reversión administrativa auditada, con condiciones expresas sobre consumos existentes y efectos sobre cobertura y antigüedad. No habilitar borrados silenciosos.

### 4. Deuda anterior que reaparece después de una cobertura nueva

**Origen:** CU-26 precondición 2; CU-28 FA-02; CU-22 RN-02 y RN-03.

Recorrido posible: se paga deuda congelada de una cobertura anterior, se crea una cobertura nueva y luego se anula uno de esos pagos antiguos. CU-28 vuelve a generar deuda congelada, pero CU-26 afirma que cobertura vigente y deuda congelada nunca coexisten.

**Decisión necesaria:** permitir y definir expresamente esa coexistencia, o restringir esa anulación con un procedimiento de resolución. Especificar qué ocurre con la cobertura nueva, las demás mascotas del dueño, las alertas y los próximos pagos. Probar también una anulación después de cambiar el dueño de la mascota: puede trasladar deuda histórica al dueño actual.

### 5. Períodos y saldos después de cambios de condiciones

**Origen:** D30, D35; CU-17 RN-01; CU-39 RN-04; CU-41 RN-05.

Está resuelto que un cambio de plan conserva consumos anuales. Falta una regla explícita para cambiar una prestación de mensual a anual o viceversa, y para decidir si los consumos de una cobertura anterior cuentan al crear otra cobertura en el mismo año.

Ejemplo: una radiografía de septiembre se registró cuando la prestación era mensual; en octubre pasa a anual. Hay que decidir si aquella radiografía descuenta del saldo anual. Si descuenta, anularla ahora puede cambiar el saldo actual, aunque D35 diga que corregir un período cerrado no devuelve saldo al actual.

**Propuesta:** definir el alcance del contador —mascota o cobertura— y las reglas de transición de periodicidad. El cálculo debe apoyarse en fechas y tipos de prestación, con la política acordada, y conservar la versión que autorizó cada consumo. Para el MVP se puede restringir el cambio de periodicidad si todavía no hay una regla segura.

### 6. Procesos demorados y reconstrucción del estado histórico

**Origen:** D54, D60; CU-26; CU-28 RN-04; CU-30 RN-04; CU-44; CU-45 RN-02; CU-46 FA-02.

Calcular el estado en cada consulta es correcto, pero no resuelve por sí solo sus efectos históricos. Si la suspensión del 14 no se materializó y el dueño paga el 15, deben conservarse la suspensión ocurrida, la reactivación y la cancelación del cambio de plan pendiente. Un proceso que mire únicamente el pago y estado actuales puede perder ese recorrido.

También falta distinguir una anulación que inicia una suspensión de otra realizada sobre una cobertura que ya estaba suspendida: CU-28 asigna la fecha de la anulación, mientras CU-45 conserva el plazo hasta que haya reactivación. No conviene reiniciar el plazo por una segunda anulación.

CU-30 exige evaluar un consumo corregido en su fecha original. Hay que conservar la cobertura, versión, antigüedad y autorizaciones que existían entonces, considerando que D36 mantiene válidos consumos anteriores a la anulación de un pago.

**Propuesta:** describir una única evaluación temporal compartida por consultas, operaciones y procesos; registrar fechas efectivas y fechas de procesamiento; recuperar transiciones vencidas antes de aplicar nuevas operaciones. Agregar pruebas de procesos demorados, pagos antes del reintento y nuevas anulaciones durante una suspensión existente.

### 7. Protección de datos y conservación

**Origen:** RNF-LEG-01; D108; D141; CU-36 RN-04.

D108 excluye los pedidos de supresión y D141 conserva auditoría para siempre. Esto requiere revisión frente a los artículos 4, 6 y 16 de la [Ley 25.326 vigente](https://www.argentina.gob.ar/normativa/nacional/64790/actualizacion). Hay excepciones a la supresión por obligaciones de conservación; no justifican excluir todos los pedidos. Definir un procedimiento manual verificable, información al titular y política de conservación, incluyendo auditoría y respaldos. En RNF-SEG-01 conviene hablar de datos personales: DNI, domicilio y teléfono no son automáticamente datos sensibles en la definición legal del artículo 2.

## Ajustes adicionales

- **Historial financiero del dueño:** D121 y CU-35 reasignan todos los pagos históricos al dueño actual. Es una decisión explícita, no un error de consistencia, pero dificulta responder quién pagó originalmente. Recomiendo conservar el dueño al momento del registro y el historial de titularidad, manteniendo la consulta por dueño actual si resulta útil.
- **Mes de baja sin deuda:** D27 excluye el mes de baja incluso si ya venció; D113 permite baja entre el 1 y el 13 tras consumir sin pagar ese mes. Validar comercialmente esta política y mostrar sus efectos antes de confirmar. No es necesario agregar una regla nueva si ese beneficio es deliberado.
- **Aviso de vencimiento:** CU-47 RN-02 dice «48 horas antes del fin del plazo», pero el 11 a las 09:00 hasta el 14 a las 00:00 son 63 horas. Mantener el horario de negocio elegido y corregir el texto, o ajustar el horario si las 48 horas son un requisito literal.
- **Auditoría de emails:** D143 y CU-47 a CU-50 indican que los envíos se consultan en CU-36, pero CU-36 no incluye esos envíos en sus acciones, filtros o escenarios. Completar esa integración, incluido el detalle de intentos fallidos.
- **Acceso con dos roles:** D46 obliga a una persona que sea veterinaria y dueña a usar dos cuentas distintas del proveedor. Es consistente, pero conviene validar esta fricción con un usuario real antes de implementar.
- **Edad de la mascota:** D41 conserva una edad que no cambia con los años. Mostrar «edad estimada al registrar» y su fecha evita presentarla como edad actual; opcionalmente modelar fecha de nacimiento estimada.

## Qué falta para poder lanzar un piloto

1. **Alcance de la primera entrega y criterio de terminado.** Definir cuáles de los 51 casos deben funcionar en el piloto y cuáles se posponen. Posponer una función exige aclarar cómo se resolverá esa operación durante el piloto.
2. **Modelo de datos y estados.** Entidades, relaciones, condiciones de unicidad, dinero en ARS con precisión definida, versiones de planes, historial de cobertura y titularidad, pagos, consumos, invitaciones, sesiones, auditoría y envíos. Los saldos no deberían ser un valor editable sin respaldo en los consumos.
3. **Diseño técnico breve.** Una aplicación web responsive con una base relacional y tareas programadas alcanza como punto de partida. Recomiendo evaluar PostgreSQL por el peso de las operaciones transaccionales: sus [transacciones](https://www.postgresql.org/docs/current/tutorial-transactions.html) permiten agrupar cambios para que se confirmen o reviertan juntos. La exclusión de consumos concurrentes debe diseñarse y probarse además de usar transacciones.
4. **Pantallas principales.** Prototipar alta con primer pago, registro de pago, búsqueda/ficha/consumo veterinario y «Mis mascotas». Validar que se puedan usar desde un celular en una atención real.
5. **Operación y recuperación.** Concretar los RNF-BAK existentes: retención, cobertura de imágenes, pérdida máxima tolerable, tiempo objetivo de recuperación, responsable y ensayo de restauración. Definir alertas para fallas de procesos, emails y respaldo, y un procedimiento si la aplicación no está disponible durante una consulta.
6. **Pruebas ejecutables.** Los Gherkin actuales son especificaciones. Automatizar primero las reglas temporales, autorizaciones, duplicados, concurrencia y correcciones; después los recorridos principales de interfaz.
7. **Procedimiento de liquidación a veterinarias.** La documentación registra prestaciones, pero no explica si WildSalud paga a la veterinaria, cuánto, cómo se concilia ni quién resuelve diferencias. Si existe esa obligación, puede resolverse manualmente al comienzo, pero debe tener un procedimiento documentado antes del piloto. No hace falta incluir un módulo de liquidaciones para probar el MVP.

La comprobación estática no encontró referencias a RF-PLA-12 y RF-PLA-13 dentro de los CU, aunque el comportamiento se expresa mediante D12 y las reglas de antigüedad. Completar su trazabilidad. Los requisitos de disponibilidad y respaldos necesitan un plan de validación operativo; no requieren forzosamente casos de uso nuevos.

También aparecen flujos o excepciones sin etiqueta explícita de escenario, por ejemplo CU-29 EX-04, CU-44 EX-02 y CU-47 EX-01. Revisarlos manualmente y completar las pruebas de falla total, rollback y recuperación. La ausencia de una etiqueta, por sí sola, no prueba que el comportamiento esté completamente sin cobertura.

## Orden recomendado con Claude Code

1. Resolver los puntos 3 a 7 (el 1 y el 2 ya están resueltos) y actualizar decisiones, requisitos y escenarios afectados como una sola tarea de documentación.
2. Cerrar el alcance del piloto y elaborar el modelo de datos, diagramas de estados y un diseño técnico breve.
3. Construir un recorrido completo: administrador invita personas, crea mascota con plan y pago; veterinario consulta y consume; dueño ve la cobertura y saldo actualizado.
4. Implementar y probar vencimientos, suspensión, pagos de deuda, baja por deuda, cambios programados y correcciones incluidas en el alcance. Usar un reloj controlable para probar fechas sin esperar meses reales.
5. Completar seguridad, monitoreo, notificaciones y restauración; desplegar un entorno de prueba.
6. Hacer un piloto propuesto de 2 veterinarias y 10–20 dueños. Acordar previamente indicadores: consulta de cobertura en menos de 2 segundos bajo carga definida, ausencia de duplicados y excesos de consumo, coincidencia entre dinero recibido y pagos registrados, tiempo de operación y consultas de soporte.

No ampliaría funciones ahora. El mayor valor siguiente está en resolver las reglas cruzadas y demostrar un circuito completo funcionando.

### Encargo inicial sugerido

> Revisá docs/revision-mvp.md junto con proyecto.md, decisiones.md y los casos de uso. Prepará propuestas para resolver los hallazgos críticos y señalá las decisiones comerciales que debo tomar. No conviertas las recomendaciones del informe en reglas aprobadas. Después de cerrar esas decisiones, sincronizá requisitos, decisiones y Gherkin, y prepará un modelo de datos y estados para el alcance acordado del piloto. Todavía no implementes toda la aplicación.
