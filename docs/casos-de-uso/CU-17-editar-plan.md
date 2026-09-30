# CU-17 — Editar plan

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Modificar el precio, las prestaciones, los límites o las condiciones de un plan, con vigencia desde el mes siguiente para todas las mascotas que lo tienen. |
| **Disparador** | WildSalud decide actualizar un plan (por ejemplo, un aumento de precio o una prestación nueva). |
| **Relaciones** | La versión nueva la hace vigente CU-46 Aplicar cambios programados el día 1. Los tipos de prestación salen del catálogo (CU-20, CU-21). Las validaciones son las de CU-16 Crear plan. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El plan existe (activo o inactivo).

## Flujo principal

1. El administrador elige **Editar** en un plan.
2. El sistema muestra la versión vigente del plan (precio y prestaciones), la cantidad de mascotas que lo tienen y, si existe, la versión pendiente para el mes siguiente.
3. El administrador modifica el precio y/o las prestaciones: agrega o quita prestaciones, o cambia límites, periodicidad o períodos pagos para habilitarlas.
4. El sistema muestra un resumen de los cambios, la fecha en que rigen (día 1 del mes siguiente) y la cantidad de mascotas afectadas.
5. El administrador confirma.
6. El sistema valida las reglas **RN-01 a RN-04**.
7. El sistema registra una **versión nueva** del plan con vigencia desde las 00:00 del día 1 del mes siguiente. La versión actual sigue rigiendo hasta entonces.
8. El sistema deja el registro de auditoría con los valores anteriores y nuevos.
9. El sistema confirma: *"Los cambios en {plan} rigen desde el {fecha}. Mascotas afectadas: {N}."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 2 a 7 | Ya hay una versión pendiente para el mes siguiente. | El sistema parte de la versión pendiente. Al confirmar, la versión nueva **reemplaza** a la pendiente; sigue habiendo una sola versión futura. |
| **FA-02** | 2 | El administrador elige **Descartar cambios pendientes**. | La versión pendiente se elimina de la programación (queda en la auditoría) y el plan sigue con su versión vigente el mes siguiente. El sistema confirma: *"Se descartaron los cambios pendientes de {plan}."* |
| **FA-03** | 3 | El administrador cambia solo el **nombre** del plan. | El nombre cambia **en el momento**, sin versión nueva, porque no es una condición del plan. El sistema confirma: *"Se cambió el nombre del plan a {plan}."* |
| **FA-04** | 3 o 5 | El administrador cancela. | No se registra ningún cambio. |

## Excepciones

En todas las excepciones **no se registra ningún cambio**, y el sistema informa el motivo.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 6 | Los datos no cumplen las validaciones de CU-16 (precio, nombre duplicado, prestación repetida, valores de una prestación, plan sin prestaciones). | El mismo mensaje de la excepción correspondiente de CU-16. |
| **EX-02** | 6 | No se modificó ningún dato. | *"No hay cambios para guardar."* |
| **EX-03** | 6 | Otro administrador modificó el plan mientras este editaba. | *"Los datos de {plan} cambiaron mientras los editabas. Revisalos y volvé a guardar."* |
| **EX-04** | 1 | Un usuario que no es administrador intenta editar un plan. | *"No tenés permiso para hacer esta operación."* |
| **EX-05** | 5 | La misma confirmación llega dos veces. | Se registra **una sola** versión nueva. |

## Postcondiciones

- **Éxito:** el plan tiene una única versión pendiente con vigencia el día 1 del mes siguiente (o un nombre nuevo, si solo se cambió el nombre). Hasta esa fecha, todas las mascotas con el plan siguen con la versión vigente.
- **Fracaso:** el plan no cambia.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Vigencia el mes siguiente.** Los cambios de precio, prestaciones, límites, periodicidad y habilitación rigen desde las 00:00 del día 1 del mes siguiente (hora de Argentina). Hasta el fin del mes en curso se mantienen las condiciones anteriores. | RF-PLA-06, RF-PLA-07, D1, D53 |
| **RN-02** | **Para todas las mascotas del plan.** La versión nueva aplica a todas las mascotas que tengan el plan, incluidas las que llegan a él por un cambio de plan con vigencia ese mismo día 1. | RF-PLA-04, RF-PLA-05 |
| **RN-03** | **Una sola versión futura.** Un plan tiene a lo sumo una versión pendiente. Editar de nuevo antes del día 1 la reemplaza; también se la puede descartar. | D127 |
| **RN-04** | **Mismas validaciones que al crear.** Las de CU-16 RN-01 a RN-04. | RF-PLA-03, D126 |
| **RN-05** | **Historial intacto.** La versión nueva no cambia pagos, consumos ni condiciones de meses anteriores. Cada mes se rige por la versión vigente el día 1 de ese mes, también para cobrar deudas (D6). | RF-PLA-08, D6 |
| **RN-06** | **Efecto sobre los saldos.** Si se quita una prestación, desde el día 1 ya no se puede consumir. Si se baja un límite anual por debajo de lo ya consumido en el año, el saldo queda en 0. | D30, RNF-INT-02 |
| **RN-07** | **Nombre.** El nombre no es una condición del plan: se cambia en el momento, sin versión nueva, y sigue siendo único. | D128 |
| **RN-08** | **Planes inactivos.** Un plan inactivo también se puede editar, porque las mascotas que ya lo tienen lo conservan (D21). | D21, D129 |
| **RN-09** | **Permisos y auditoría.** Solo el administrador edita planes. Cada cambio queda auditado con valor anterior y valor nuevo. | RF-TRA-01, RNF-AUD-01, RNF-SEG-07, D85, D110 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Versión del plan | Precio y prestaciones nuevos, vigente desde el día 1 del mes siguiente, estado *Pendiente* (pasa a *Vigente* en CU-46). Si reemplaza a otra pendiente, esa queda *Descartada*. |
| Plan | Nombre, si se cambió (FA-03). |
| Auditoría | Valores anteriores y nuevos, administrador, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-17
Feature: CU-17 Editar plan
  Como administrador
  Quiero modificar las condiciones de un plan
  Para actualizarlo sin afectar el mes en curso

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And existe el plan "Plan Base" activo, con precio mensual 10000 y las prestaciones:
      | prestación  | límite | periodicidad | períodos pagos para habilitarla |
      | Consulta    | 2      | mensual      | 1                               |
      | Radiografía | 2      | anual        | 3                               |
    And las mascotas "Luna" y "Toby" tienen el plan "Plan Base"

  @flujo-principal @RF-PLA-06 @RF-PLA-07 @RF-PLA-05
  Scenario: Un aumento de precio rige desde el mes siguiente para todas las mascotas
    When el administrador cambia el precio de "Plan Base" a 12000 y confirma
    Then "Plan Base" tiene una versión pendiente con precio 12000 vigente desde el "01/11/2026 00:00"
    And la cuota de octubre 2026 de "Luna" y de "Toby" sigue siendo 10000
    And la cuota de noviembre 2026 de "Luna" y de "Toby" es 12000
    And el sistema informa "Los cambios en Plan Base rigen desde el 01/11/2026. Mascotas afectadas: 2."

  @RN-01 @D1 @D53
  Scenario Outline: Las condiciones anteriores rigen hasta el fin del mes
    Given el administrador cambió el límite de "Consulta" de "Plan Base" a 4
    And "Luna" consumió 2 "Consulta" en el mes de "<momento>"
    And la fecha y hora actual es "<momento>"
    When un veterinario registra una "Consulta" para "Luna"
    Then el resultado es "<resultado>"

    Examples:
      | momento          | resultado                                       |
      | 31/10/2026 23:59 | Consulta está agotada para el período 2026-10.  |
      | 01/11/2026 00:00 | registrado                                      |

  @FA-01 @RN-03 @D127
  Scenario: Una edición nueva reemplaza a la versión pendiente
    Given "Plan Base" tiene una versión pendiente con precio 12000 vigente desde el "01/11/2026"
    When el administrador cambia el precio de "Plan Base" a 11500 y confirma
    Then "Plan Base" tiene una única versión pendiente, con precio 11500
    And la versión con precio 12000 queda "Descartada"

  @FA-02 @RN-03 @D127
  Scenario: Descartar los cambios pendientes
    Given "Plan Base" tiene una versión pendiente con precio 12000 vigente desde el "01/11/2026"
    When el administrador descarta los cambios pendientes de "Plan Base"
    Then "Plan Base" no tiene versiones pendientes
    And la cuota de noviembre 2026 de "Luna" es 10000
    And el sistema informa "Se descartaron los cambios pendientes de Plan Base."

  @FA-03 @RN-07 @D128
  Scenario: El nombre cambia en el momento
    When el administrador cambia el nombre de "Plan Base" a "Plan Esencial" y confirma
    Then el plan se llama "Plan Esencial" desde el "20/10/2026 10:00"
    And no se genera una versión nueva
    And el sistema informa "Se cambió el nombre del plan a Plan Esencial."

  @RN-06 @D30
  Scenario: Quitar una prestación la deja sin uso desde el mes siguiente
    Given el administrador quitó "Radiografía" de "Plan Base" y confirmó
    And la fecha y hora actual es "01/11/2026 09:00"
    When un veterinario intenta registrar una "Radiografía" para "Luna"
    Then el sistema informa "Radiografía no está incluida en el plan Plan Base."

  @RN-06 @D30 @RNF-INT-02
  Scenario: Bajar un límite anual por debajo de lo consumido deja el saldo en 0
    Given "Luna" consumió 2 "Radiografía" en 2026
    And el administrador bajó el límite anual de "Radiografía" de "Plan Base" a 1
    And la fecha y hora actual es "01/11/2026 09:00"
    When se consulta el saldo de "Radiografía" de "Luna" para 2026
    Then el saldo es 0

  @RN-05 @RF-PLA-08 @D6
  Scenario: La deuda de un mes anterior se cobra con el precio de ese mes
    Given el administrador cambió el precio de "Plan Base" a 12000 con vigencia "01/11/2026"
    And la cobertura de "Toby" tiene el período "2026-10" impago
    And la fecha y hora actual es "05/11/2026 10:00"
    When el administrador registra el pago de todos los períodos de "Toby"
    Then el pago de "2026-10" tiene importe 10000 y el de "2026-11" tiene importe 12000

  @RN-08 @D21 @D129
  Scenario: Se puede editar un plan inactivo
    Given existe el plan "Plan Old" inactivo con precio 8000, que todavía tiene la mascota "Milo"
    When el administrador cambia el precio de "Plan Old" a 9000 y confirma
    Then "Plan Old" tiene una versión pendiente con precio 9000 vigente desde el "01/11/2026"

  @EX-01 @RN-04
  Scenario: Se aplican las mismas validaciones que al crear
    When el administrador intenta cambiar el precio de "Plan Base" a 0
    Then no se registra ningún cambio
    And el sistema informa "El precio tiene que ser mayor que cero."

  @EX-02
  Scenario: Guardar sin cambios
    When el administrador guarda "Plan Base" sin modificar ningún dato
    Then el sistema informa "No hay cambios para guardar."

  @EX-03
  Scenario: Otro administrador modificó el plan mientras tanto
    Given "Marta Ruiz" abrió la edición de "Plan Base"
    And el administrador "Jorge Paz" cambió el precio de "Plan Base" a 11000
    When "Marta Ruiz" cambia el precio de "Plan Base" a 12000 y guarda
    Then la versión pendiente de "Plan Base" tiene precio 11000
    And el sistema informa "Los datos de Plan Base cambiaron mientras los editabas. Revisalos y volvé a guardar."

  @EX-04 @RNF-SEG-07 @D110
  Scenario: Solo el administrador edita planes
    Given el veterinario "Ana López" inició sesión
    When "Ana López" intenta cambiar el precio de "Plan Base" sin usar la pantalla
    Then "Plan Base" no cambia
    And el sistema informa "No tenés permiso para hacer esta operación."

  @EX-05 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces registra una sola versión
    When el administrador confirma el cambio de precio de "Plan Base" a 12000 y la misma confirmación se envía dos veces
    Then "Plan Base" tiene una única versión pendiente

  @RN-09 @D85
  Scenario: Los cambios quedan auditados
    When el administrador cambia el precio de "Plan Base" a 12000 y confirma
    Then la auditoría registra valor anterior 10000, valor nuevo 12000, usuario "Marta Ruiz" y fecha "20/10/2026 10:00"
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PLA-03 | RN-04, EX-01 |
| RF-PLA-04, RF-PLA-05 | Paso 3, RN-02 |
| RF-PLA-06, RF-PLA-07 | Paso 7, RN-01 |
| RF-PLA-08 | RN-05 |
| RF-TRA-01, RNF-AUD-01, D85 | Paso 8, RN-09 |
| RNF-INT-01 | EX-05 |
| RNF-INT-02, D30 | RN-06 |
| RNF-SEG-07, D110 | EX-04 |
| D1, D53 | RN-01 |
| D6 | RN-05 |
| D21 | RN-08 |
| D126 a D129 | RN-03, RN-04, RN-07, RN-08 |
