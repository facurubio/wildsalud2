# CU-22 — Asignar plan a una mascota

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Crear una cobertura para una mascota con un plan, registrando en el mismo acto el pago de la cuota del mes en curso. |
| **Disparador** | Se da de alta una mascota nueva, o una mascota sin cobertura vigente (su plan anterior fue dado de baja) vuelve a contratar un plan. |
| **Relaciones** | Incluido por CU-13 Dar de alta mascota (`«include»`). También se inicia solo desde la ficha de una mascota sin cobertura vigente. La deuda de una cobertura anterior se paga en CU-26 Registrar pago. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. La mascota está registrada y no está dada de baja.
3. La mascota no tiene una cobertura vigente (nunca tuvo una o la última está *Dada de baja*).

## Flujo principal

1. El administrador elige **Asignar plan** desde la ficha de la mascota (o el paso llega incluido desde CU-13).
2. El sistema muestra los planes **activos**, cada uno con su precio para el mes en curso.
3. El administrador elige un plan.
4. El sistema muestra el primer pago a registrar: período (mes en curso), importe y forma de pago, con la forma de pago preferida del dueño propuesta por defecto, y la fecha de pago, con la fecha de hoy propuesta por defecto.
5. El administrador confirma o cambia la forma de pago y la fecha de pago, y confirma.
6. El sistema valida las reglas **RN-01 a RN-06** y **RN-09**.
7. El sistema crea la cobertura en estado **Al día** con el plan elegido y registra el pago del mes en curso, en una sola operación.
8. El sistema deja el registro de auditoría del alta de la cobertura y del pago.
9. El sistema confirma la asignación y muestra el plan, el estado *Al día* y 1 período pago.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 5 | El administrador cambia la forma de pago propuesta. | Se registra la forma de pago elegida; la preferida del dueño no cambia. |
| **FA-02** | 3 o 5 | El administrador cancela. | No se crea la cobertura ni el pago. Si el caso venía incluido desde CU-13, lo que ocurre con la mascota lo define CU-13. |

## Excepciones

En todas las excepciones **no se crea la cobertura ni el pago**, y el sistema informa el motivo.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 6 | La mascota ya tiene una cobertura vigente (*Al día* o *Suspendida*). | *"{mascota} ya tiene una cobertura vigente."* |
| **EX-02** | 6 | La mascota tiene deuda congelada de una cobertura anterior. | *"{mascota} tiene deuda pendiente de una cobertura anterior. Registrá esos pagos antes de asignar un plan."* |
| **EX-03** | 6 | El dueño tiene deuda de otra de sus mascotas. | *"{dueño} tiene deuda pendiente de {otra mascota}. No se puede asignar un plan hasta saldarla."* |
| **EX-04** | 6 | El plan elegido se desactivó entre que se mostró la lista y la confirmación. | *"El plan {plan} está inactivo y no se puede asignar."* |
| **EX-05** | 6 | La fecha de pago es posterior a hoy. | *"La fecha de pago no puede ser posterior a hoy."* |
| **EX-06** | 5 | La misma confirmación llega dos veces (doble clic o reintento de red). | Se crea **una sola** cobertura con **un solo** pago; el segundo envío devuelve el mismo resultado. |

## Postcondiciones

- **Éxito:** la mascota tiene una cobertura nueva *Al día* con el plan elegido y 1 período pago. El pago del mes en curso queda registrado. La cobertura y el pago quedan en el historial de auditoría (CU-36).
- **Fracaso:** no se crea ninguna cobertura ni ningún pago.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Una cobertura vigente por mascota.** Una mascota puede tener varias coberturas a lo largo del tiempo, pero solo una que no esté *Dada de baja*. | D9, D10 |
| **RN-02** | **Sin deuda propia.** Si la mascota tiene deuda congelada de una cobertura anterior, hay que pagarla (CU-26) antes de asignar un plan. | D9, D28 |
| **RN-03** | **Sin deuda del dueño.** Si el dueño tiene deuda de cualquiera de sus mascotas (de una cobertura suspendida o congelada), no se puede asignar un plan a ninguna de sus mascotas, ni al darla de alta ni al volver a asignarle un plan. | D29, D38, D55 |
| **RN-04** | **Solo planes activos.** Un plan inactivo no se puede asignar. | RF-PLA-03, D21 |
| **RN-05** | **Primer pago obligatorio.** La cobertura se crea junto con el pago de la cuota **completa del mes en curso**, aunque el alta sea a mitad de mes. Si el pago no se puede registrar, la cobertura no se crea. | RF-PLA-10, D2, D3 |
| **RN-06** | **Importe.** El importe es el precio del plan vigente el día 1 del mes en curso; si el plan se creó durante el mes, es el precio con el que se creó. Lo calcula el sistema y no se edita. | RF-PAG-07, D6, D56, D58 |
| **RN-07** | **Cobertura nueva, antigüedad nueva.** La cobertura empieza con 1 período pago (el del primer pago). La antigüedad de coberturas anteriores de la misma mascota no se suma. | RF-PLA-10, D2, D9 |
| **RN-08** | **Plan por mascota.** El plan se asigna a la mascota, no al dueño: dos mascotas del mismo dueño pueden tener planes distintos. | RF-MAS-03, RF-PLA-02 |
| **RN-09** | **Fecha de pago.** Es la fecha en que el dueño pagó: por defecto hoy, puede ser anterior pero no posterior a hoy. Es informativa: la cobertura empieza en el momento en que se registra, no en la fecha de pago. | D57 |
| **RN-10** | **Forma de pago.** Se elige de la lista fija (Efectivo, Transferencia bancaria, Tarjeta de débito, Tarjeta de crédito); por defecto, la preferida del dueño. | D7, D59 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Cobertura | Mascota, plan, fecha y hora de inicio, estado *Al día*. |
| Pago | Mascota, cobertura, período (`AAAA-MM` del mes en curso), fecha de pago, importe, forma de pago, administrador que lo registró, estado *Válido*. |
| Auditoría | Alta de la cobertura y registro del pago, con usuario, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-22
Feature: CU-22 Asignar plan a una mascota
  Como administrador
  Quiero asignarle un plan a una mascota registrando su primer pago
  Para que quede con cobertura activa

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And existen los planes:
      | plan      | precio mensual | estado   |
      | Plan Base | 10000          | Activo   |
      | Plan Plus | 15000          | Activo   |
      | Plan Old  | 8000           | Inactivo |
    And la dueña "Carla Gómez" tiene forma de pago preferida "Transferencia bancaria"
    And la mascota "Luna" con número de afiliado "000123" pertenece a "Carla Gómez" y no tiene cobertura vigente

  @flujo-principal @RF-PLA-10 @D2 @D3 @D6
  Scenario: Asignar un plan a mitad de mes cobra la cuota completa del mes en curso
    When el administrador asigna el plan "Plan Base" a "Luna" y confirma el pago
    Then "Luna" tiene una cobertura "Al día" con el plan "Plan Base"
    And se registra un pago de "Luna" por el período "2026-10" con importe 10000
    And el pago tiene forma de pago "Transferencia bancaria" y fue registrado por "Marta Ruiz"
    And la cobertura de "Luna" tiene 1 período pago

  @FA-01 @D7
  Scenario: Cambiar la forma de pago propuesta no modifica la preferida del dueño
    When el administrador asigna el plan "Plan Base" a "Luna" con forma de pago "Efectivo"
    Then el pago del período "2026-10" tiene forma de pago "Efectivo"
    And la forma de pago preferida de "Carla Gómez" sigue siendo "Transferencia bancaria"

  @FA-02
  Scenario: El administrador cancela la asignación
    When el administrador elige el plan "Plan Base" para "Luna" y cancela
    Then "Luna" no tiene cobertura vigente
    And no se registra ningún pago

  @EX-01 @D9
 Scenario Outline: No se puede asignar un plan a una mascota que ya tiene una cobertura sin dar de baja
    Given "Luna" tiene una cobertura "<estado>" con el plan "Plan Base"
    When el administrador intenta asignar el plan "Plan Plus" a "Luna"
    Then no se crea ninguna cobertura
    And el sistema informa "<mensaje>"

    Examples:
      | estado  | mensaje        |
      | Al día  | Luna ya tiene una cobertura al día con el plan Plan Base. Para pasarla a otro plan, usá Cambiar plan.|
      | Suspendida por falta de pago | Luna tiene una cobertura suspendida por falta de pago. Para asignarle otro plan, primero regularizá la deuda |

  @EX-02 @D28
  Scenario: Deuda congelada de la propia mascota
    Given "Luna" tuvo una cobertura dada de baja con los períodos "2026-07" y "2026-08" congelados sin pagar
    When el administrador intenta asignar el plan "Plan Base" a "Luna"
    Then no se crea ninguna cobertura
    And el sistema informa "Luna tiene deuda pendiente de una cobertura anterior. Registrá esos pagos antes de asignar un plan."

  @EX-03 @D29 @D38 @D55
  Scenario Outline: Deuda de otra mascota del mismo dueño
    Given "Carla Gómez" también tiene la mascota "Toby" con <situación>
    When el administrador intenta asignar el plan "Plan Base" a "Luna"
    Then no se crea ninguna cobertura
    And el sistema informa "Carla Gómez tiene deuda pendiente de Toby. No se puede asignar un plan hasta saldarla."

    Examples:
      | situación                                                     |
      | cobertura suspendida por falta de pago del período 2026-10    |
      | deuda congelada del período 2026-06                           |

  @RN-03 @D29
  Scenario: Otra mascota del dueño sin deuda no bloquea la asignación
    Given "Carla Gómez" también tiene la mascota "Toby" con cobertura "Al día"
    When el administrador asigna el plan "Plan Base" a "Luna" y confirma el pago
    Then "Luna" tiene una cobertura "Al día" con el plan "Plan Base"

  @EX-04 @RF-PLA-03 @D21
  Scenario: Un plan inactivo no se puede asignar
    When el administrador intenta asignar el plan "Plan Old" a "Luna"
    Then no se crea ninguna cobertura
    And el sistema informa "El plan Plan Old está inactivo y no se puede asignar."

  @EX-05 @RN-09 @D57
  Scenario Outline: Validación de la fecha de pago
    When el administrador asigna el plan "Plan Base" a "Luna" con fecha de pago "<fecha de pago>"
    Then el resultado es "<resultado>"

    Examples:
      | fecha de pago | resultado                                        |
      | 20/10/2026    | cobertura creada                                 |
      | 18/10/2026    | cobertura creada                                 |
      | 21/10/2026    | La fecha de pago no puede ser posterior a hoy.   |

  @RN-06 @D6
  Scenario: El importe es el precio vigente el día 1 del mes en curso
    Given el precio de "Plan Base" era 10000 hasta septiembre de 2026 y es 12000 desde el 01/10/2026
    When el administrador asigna el plan "Plan Base" a "Luna" y confirma el pago
    Then se registra un pago de "Luna" por el período "2026-10" con importe 12000

  @RN-09 @D57
  Scenario: La cobertura empieza cuando se registra, no en la fecha de pago
    When el administrador asigna el plan "Plan Base" a "Luna" con fecha de pago "18/10/2026"
    Then la cobertura de "Luna" tiene fecha de inicio "20/10/2026 10:00"
    And el pago del período "2026-10" tiene fecha de pago "18/10/2026"

  @RN-06 @D56
  Scenario: Un plan creado a mitad de mes se asigna con el precio con el que se creó
    Given el administrador creó el plan "Plan Nuevo" el "15/10/2026" con precio mensual 9000
    When el administrador asigna el plan "Plan Nuevo" a "Luna" y confirma el pago
    Then se registra un pago de "Luna" por el período "2026-10" con importe 9000

  @RN-07 @D9
  Scenario: Una cobertura nueva no hereda la antigüedad de una anterior
    Given "Luna" tuvo una cobertura dada de baja con 8 períodos pagos y sin deuda
    When el administrador asigna el plan "Plan Base" a "Luna" y confirma el pago
    Then la nueva cobertura de "Luna" tiene 1 período pago

  @EX-06 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces crea una sola cobertura
    When el administrador confirma la asignación del plan "Plan Base" a "Luna" y la misma confirmación se envía dos veces
    Then "Luna" tiene una sola cobertura vigente
    And se registra un solo pago por el período "2026-10"
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-MAS-03, RF-PLA-02 | RN-08 |
| RF-PLA-03 | RN-04, EX-04 |
| RF-PLA-10 | Paso 7, RN-05, RN-07 |
| RF-PAG-07 | RN-06 |
| RF-PAG-08 | Paso 7, Datos que se registran |
| RF-PAG-09 | Actor principal |
| RF-TRA-01, RNF-AUD-01 | Paso 8 |
| RNF-INT-01 | EX-06 |
| D2, D3 | RN-05 |
| D6 | RN-06 |
| D7 | Paso 4, FA-01, RN-10 |
| D9, D10 | RN-01, RN-07, EX-01 |
| D21 | RN-04, EX-04 |
| D28 | RN-02, EX-02 |
| D29, D38, D55 | RN-03, EX-03 |
| D56, D58 | RN-06 |
| D57 | RN-09, EX-05 |
| D59 | RN-10 |
