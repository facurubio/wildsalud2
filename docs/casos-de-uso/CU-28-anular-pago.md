# CU-28 — Anular pago

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Anular un pago registrado por error, dejando constancia del motivo, y recalcular la cobertura afectada. |
| **Disparador** | El administrador detecta que registró un pago que no correspondía (por ejemplo, un pago que el dueño nunca hizo). |
| **Relaciones** | Los pagos se consultan en CU-34 Consultar historial de pagos por mascota. Para reemplazar el pago por otro correcto se usa CU-29 Corregir pago, que incluye esta anulación. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El pago existe y está *Válido*.

## Flujo principal

1. El administrador elige **Anular** sobre un pago del historial de la mascota.
2. El sistema muestra los datos del pago y **cómo queda la cobertura** si se anula: períodos pagos, estado resultante y, si corresponde, que la cobertura se suspenderá.
3. El administrador escribe el **motivo** de la anulación y confirma.
4. El sistema valida las reglas **RN-01**, **RN-02** y **RN-09**.
5. El sistema marca el pago como **Anulado**, con motivo, administrador y fecha y hora. El pago no se elimina.
6. El sistema recalcula la antigüedad y el estado de la cobertura según **RN-03 a RN-05**. Si la cobertura se suspende, cancela su cambio de plan pendiente (**RN-08**).
7. El sistema deja el registro de auditoría de la anulación y, si corresponde, de la suspensión.
8. El sistema confirma: *"Pago anulado."* Si la cobertura se suspendió, agrega: *"La cobertura de {mascota} quedó suspendida por falta de pago."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 6 | El período anulado es el mes en curso y todavía no pasó el día 13. | La cobertura sigue *Al día*; el período vuelve a figurar como pendiente de pago. |
| **FA-02** | 6 | El pago anulado era de deuda congelada (cobertura dada de baja). | El período vuelve a figurar como deuda congelada. La cobertura sigue *Dada de baja*. |
| **FA-03** | 3 | El administrador cancela. | El pago sigue *Válido*. |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | No se escribió un motivo. | *"Indicá el motivo de la anulación."* |
| **EX-02** | 4 | El pago ya estaba anulado (por ejemplo, por otro administrador). | *"El pago ya está anulado."* |
| **EX-03** | 3 | La misma confirmación llega dos veces. | El pago se anula **una sola** vez. |
| **EX-04** | 4 | Es el primer pago de la cobertura (el que se registró al asignar el plan). | *"No se puede anular el primer pago de una cobertura."* |

## Postcondiciones

- **Éxito:** el pago queda *Anulado*, visible en el historial con su motivo. La antigüedad de la cobertura bajó en 1 y su estado quedó recalculado. Los consumos registrados mientras el pago era válido no cambian.
- **Fracaso:** el pago y la cobertura no cambian.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Motivo obligatorio.** Toda anulación registra motivo, administrador, y fecha y hora. | RF-PAG-11, RF-ROL-13 |
| **RN-02** | **Sin edición ni borrado.** El pago no se modifica ni se elimina: pasa a *Anulado* y queda en el historial. | RF-PAG-12, RNF-INT-03, RNF-BAJ-01, D39 |
| **RN-03** | **Antigüedad.** El período anulado deja de contar como pago: la antigüedad de la cobertura baja en 1. | RF-PLA-11, D12 |
| **RN-04** | **Suspensión inmediata.** Si al anular el período queda impago **y ya venció** (es un mes anterior o el mes en curso después del día 13), la cobertura se suspende **en ese momento**. La fecha de suspensión es la de la anulación, no la del vencimiento original. | D36, D54 |
| **RN-05** | **Consumos válidos.** Los consumos registrados mientras el pago era válido siguen siendo válidos. | D36 |
| **RN-06** | **Las reglas no se saltean.** Anular no permite dejar la cobertura en un estado que las reglas no admiten: el estado siempre se recalcula con las reglas generales. | RF-ROL-14 |
| **RN-07** | **Huecos en la deuda.** Si se anula un período intermedio, ese período pasa a ser el más antiguo impago y es el primero que se paga en CU-26. | D5 |
| **RN-08** | **La suspensión cancela el cambio de plan pendiente.** Si la anulación suspende la cobertura, su cambio de plan pendiente se cancela automáticamente. Una baja programada se mantiene. | D60, D62 |
| **RN-09** | **El primer pago no se anula.** El pago que se registró al asignar el plan (CU-22) no se puede anular. Su fecha o forma de pago se pueden corregir con CU-29. | D65 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Pago | Estado *Anulado*, motivo, administrador y fecha y hora de la anulación. |
| Cobertura | Antigüedad y estado recalculados. Si se suspende: fecha y hora de la suspensión (la de la anulación). |
| Cambio pendiente | Si la cobertura se suspende y tenía un cambio de plan pendiente: estado *Cancelado*. |
| Auditoría | Anulación del pago (valor anterior: *Válido*; valor nuevo: *Anulado*; motivo) y, si corresponde, la suspensión. |

## Escenarios de aceptación

```gherkin
@CU-28
Feature: CU-28 Anular pago
  Como administrador
  Quiero anular un pago registrado por error
  Para que el historial y el estado de la cobertura sean correctos

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And la mascota "Luna" tiene una cobertura "Al día" con el plan "Plan Base" y 5 períodos pagos
    And el período "2026-10" de "Luna" tiene un pago válido

  @flujo-principal @RN-04 @D36
  Scenario: Anular el pago de un período vencido suspende la cobertura en ese momento
    When el administrador anula el pago del período "2026-10" de "Luna" con motivo "Pago cargado por error" y confirma
    Then el pago queda "Anulado" con motivo "Pago cargado por error" y registrado por "Marta Ruiz"
    And la cobertura de "Luna" queda "Suspendida por falta de pago" desde el "20/10/2026 10:00"
    And la cobertura de "Luna" tiene 4 períodos pagos
    And el sistema informa "Pago anulado. La cobertura de Luna quedó suspendida por falta de pago."

  @FA-01 @D17
  Scenario: Anular el pago del mes en curso antes del día 13 no suspende
    Given la fecha y hora actual es "10/10/2026 10:00"
    When el administrador anula el pago del período "2026-10" de "Luna" con motivo "Pago duplicado" y confirma
    Then la cobertura de "Luna" sigue "Al día"
    And el período "2026-10" figura como pendiente de pago

  @RN-08 @D60
  Scenario: Si la anulación suspende la cobertura, se cancela el cambio de plan pendiente
    Given "Luna" tiene un cambio pendiente al plan "Plan Plus" con vigencia "01/11/2026"
    When el administrador anula el pago del período "2026-10" de "Luna" con motivo "Pago cargado por error" y confirma
    Then la cobertura de "Luna" queda "Suspendida por falta de pago"
    And el cambio al plan "Plan Plus" queda "Cancelado"

  @RN-05 @D36
  Scenario: Los consumos registrados mientras el pago era válido siguen válidos
    Given el "15/10/2026" se registró una "Consulta" para "Luna"
    When el administrador anula el pago del período "2026-10" de "Luna" con motivo "Pago cargado por error" y confirma
    Then la "Consulta" del "15/10/2026" sigue "Válida"

  @FA-02 @D27
  Scenario: Anular un pago de deuda congelada vuelve a dejar el período adeudado
    Given "Toby" tiene una cobertura "Dada de baja" y el período congelado "2026-07" tiene un pago válido
    When el administrador anula ese pago con motivo "Pago cargado a la mascota equivocada" y confirma
    Then el período "2026-07" de "Toby" vuelve a figurar como deuda congelada
    And la cobertura de "Toby" sigue "Dada de baja"

  @RN-07 @D5
  Scenario: Anular un período intermedio lo vuelve el primero a pagar
    Given los períodos "2026-08", "2026-09" y "2026-10" de "Luna" tienen pagos válidos
    When el administrador anula el pago del período "2026-08" de "Luna" con motivo "Pago cargado por error" y confirma
    Then la cobertura de "Luna" queda "Suspendida por falta de pago"
    And el primer período a pagar de "Luna" es "2026-08"

  @EX-04 @RN-09 @D65
  Scenario: No se puede anular el primer pago de una cobertura
    Given la cobertura de "Luna" se creó el "15/05/2026" con el pago del período "2026-05"
    When el administrador intenta anular el pago del período "2026-05" de "Luna" con motivo "Error"
    Then el pago sigue "Válido"
    And el sistema informa "No se puede anular el primer pago de una cobertura."

  @EX-01 @RF-PAG-11
  Scenario: El motivo es obligatorio
    When el administrador intenta anular el pago del período "2026-10" de "Luna" sin motivo
    Then el pago sigue "Válido"
    And el sistema informa "Indicá el motivo de la anulación."

  @EX-02
  Scenario: El pago ya estaba anulado
    Given el pago del período "2026-10" de "Luna" ya fue anulado por el administrador "Jorge Paz"
    When el administrador intenta anular ese pago con motivo "Error"
    Then el sistema informa "El pago ya está anulado."

  @FA-03
  Scenario: El administrador cancela la anulación
    When el administrador elige anular el pago del período "2026-10" de "Luna" y cancela
    Then el pago sigue "Válido"
    And la cobertura de "Luna" sigue "Al día"

  @EX-03 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces anula una sola vez
    When el administrador confirma la anulación del pago del período "2026-10" de "Luna" y la misma confirmación se envía dos veces
    Then la auditoría registra una sola anulación
    And la cobertura de "Luna" tiene 4 períodos pagos
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PAG-11 | Paso 3, RN-01, EX-01 |
| RF-PAG-12 | RN-02 |
| RF-PLA-11 | RN-03 |
| RF-ROL-12 | Actor principal |
| RF-ROL-13 | RN-01 |
| RF-ROL-14 | RN-06 |
| RF-TRA-01, RNF-AUD-01 | Paso 7 |
| RNF-BAJ-01, RNF-INT-03 | RN-02 |
| RNF-INT-01 | EX-03 |
| D5 | RN-07 |
| D12 | RN-03 |
| D17 | FA-01 |
| D27 | FA-02 |
| D36, D54 | RN-04, RN-05 |
| D39 | RN-02 |
| D60, D62 | RN-08 |
| D65 | RN-09, EX-04 |
