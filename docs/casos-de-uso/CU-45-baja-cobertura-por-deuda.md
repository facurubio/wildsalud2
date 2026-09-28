# CU-45 — Dar de baja cobertura por deuda

| Campo | Valor |
|-------|-------|
| **Actor principal** | Sistema (proceso automático programado) |
| **Objetivo** | Dar de baja las coberturas que llevan 3 meses completos suspendidas por falta de pago, congelando su deuda. |
| **Disparador** | Todos los días a las 00:00 (hora de Argentina). |
| **Relaciones** | El plazo se cuenta desde la suspensión (CU-44 o CU-28). Un mes antes, CU-49 envía el aviso de baja inminente, y el día de la baja CU-50 envía el aviso de baja. La deuda congelada se paga en CU-26 Registrar pago. |

## Precondiciones

Ninguna.

## Flujo principal

1. A las 00:00 se inicia el proceso.
2. El sistema busca las coberturas *Suspendidas por falta de pago* cuyo **plazo de baja** (RN-01) venció.
3. Para cada una, el sistema cambia el estado a **Dada de baja** con motivo *por deuda* y fecha de baja igual al vencimiento del plazo.
4. El sistema **congela** los períodos impagos vencidos antes del mes de la baja.
5. El sistema cancela cualquier cambio pendiente de la cobertura.
6. El sistema deja el registro de auditoría de cada baja, con el usuario *Sistema*, y dispara el aviso de baja por deuda al dueño (CU-50).
7. El sistema registra el resultado de la ejecución: fecha y hora, coberturas dadas de baja y errores.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 2 | No hay coberturas con el plazo vencido. | Se registra la ejecución con 0 bajas. |
| **FA-02** | 1 | El proceso se ejecuta con demora. | La fecha de baja sigue siendo la del vencimiento del plazo. Mientras tanto, el sistema ya mostraba la cobertura como dada de baja (D54). |
| **FA-03** | 1 | El proceso se ejecuta más de una vez el mismo día. | Las coberturas ya dadas de baja no se vuelven a procesar. |

## Excepciones

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **EX-01** | 3 a 6 | Falla el procesamiento de una cobertura. | Se registra el error y el proceso **continúa** con las demás. La cobertura se reintenta en la próxima ejecución. |
| **EX-02** | 1 a 7 | Falla el proceso completo. | Se registra el error y el proceso se reintenta. El estado mostrado sigue siendo correcto (D54). |

## Postcondiciones

- **Éxito:** cada cobertura con el plazo vencido está *Dada de baja* con motivo *por deuda*, su deuda quedó congelada, sus cambios pendientes quedaron cancelados y la mascota sigue registrada sin plan.
- **Fracaso parcial:** las coberturas con error quedan registradas para reintento; su estado calculado ya es *Dada de baja*.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Plazo de baja.** Vence a las 00:00 del mismo día del tercer mes siguiente a la fecha de suspensión (hora de Argentina). Si ese día no existe en el mes, vence el último día del mes. Ej.: suspendida el 14/07 → baja el 14/10; suspendida el 31/01 → baja el 30/04. | D8, D53 |
| **RN-02** | **Los pagos parciales no reinician el plazo.** Mientras la cobertura siga suspendida, el plazo se cuenta desde la misma fecha de suspensión, aunque se hayan pagado algunos períodos. Solo una reactivación (CU-26) lo termina. | D4, D8, D67 |
| **RN-03** | **Deuda congelada.** Se congelan los períodos impagos vencidos antes del mes de la baja. El mes de la baja no se congela. | D27 |
| **RN-04** | **Cambios pendientes.** Se cancela cualquier cambio de plan o baja programada pendiente. | D20 |
| **RN-05** | **La mascota sigue registrada.** Queda sin plan; para volver a tener cobertura hay que pagar la deuda congelada (CU-26) y asignar un plan (CU-22), con antigüedad desde cero. | D9, D10, D28 |
| **RN-06** | **Motivo y fecha.** La baja se registra con motivo *por deuda*, fecha y hora de baja, y usuario *Sistema*. | D16, RNF-BAJ-04 |
| **RN-07** | **Borrado lógico y confiabilidad.** La cobertura no se elimina. Ejecutar el proceso de nuevo no duplica bajas, auditoría ni avisos, y cada ejecución deja registro. | RNF-BAJ-01, RNF-DIS-02 |
| **RN-08** | **Aviso de baja.** El día de la baja se envía un aviso al dueño (CU-50). | D68 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Cobertura | Estado *Dada de baja*, motivo *por deuda*, fecha y hora de baja. |
| Deuda congelada | Los períodos impagos vencidos antes del mes de la baja, marcados como congelados. |
| Cambios pendientes | Estado *Cancelado*, si había alguno. |
| Auditoría | Cada baja, con usuario *Sistema*. |
| Ejecución del proceso | Fecha y hora, cantidad de bajas, errores con la cobertura afectada. |

## Escenarios de aceptación

```gherkin
@CU-45
Feature: CU-45 Dar de baja cobertura por deuda
  Como sistema
  Quiero dar de baja las coberturas con 3 meses completos de suspensión
  Para cerrar las coberturas impagas y congelar su deuda

  Background:
    Given existe el plan "Plan Base" con precio mensual 10000
    And la mascota "Luna" de "Carla Gómez" tiene una cobertura con el plan "Plan Base"

  @flujo-principal @D8 @D27 @D16
  Scenario: Baja a los 3 meses de la suspensión
    Given la cobertura de "Luna" está "Suspendida por falta de pago" desde el "14/07/2026 00:00"
    And los períodos "2026-07", "2026-08", "2026-09" y "2026-10" de "Luna" están impagos
    When se ejecuta el proceso de baja por deuda del "14/10/2026 00:00"
    Then la cobertura de "Luna" queda "Dada de baja" con motivo "por deuda" y fecha de baja "14/10/2026 00:00"
    And los períodos "2026-07", "2026-08" y "2026-09" quedan como deuda congelada
    And el período "2026-10" no queda como deuda congelada
    And "Luna" sigue registrada sin plan
    And la auditoría registra la baja de "Luna" con usuario "Sistema"
    And se dispara el aviso de baja por deuda a "Carla Gómez"

  @RN-01 @D8
  Scenario Outline: Cálculo del plazo de baja
    Given la cobertura de "Luna" está "Suspendida por falta de pago" desde el "<suspensión>"
    When se ejecuta el proceso de baja por deuda del "<ejecución>"
    Then la cobertura de "Luna" queda "<estado>"

    Examples:
      | suspensión       | ejecución        | estado                       |
      | 14/07/2026 00:00 | 13/10/2026 00:00 | Suspendida por falta de pago |
      | 14/07/2026 00:00 | 14/10/2026 00:00 | Dada de baja                 |
      | 20/10/2026 10:00 | 20/01/2027 00:00 | Dada de baja                 |
      | 31/01/2027 09:00 | 30/04/2027 00:00 | Dada de baja                 |

  @RN-02 @D4 @D67
  Scenario: Un pago parcial no reinicia el plazo
    Given la cobertura de "Luna" está "Suspendida por falta de pago" desde el "14/07/2026 00:00"
    And el "10/08/2026" se registró el pago del período "2026-07" de "Luna"
    And los períodos "2026-08", "2026-09" y "2026-10" de "Luna" están impagos
    When se ejecuta el proceso de baja por deuda del "14/10/2026 00:00"
    Then la cobertura de "Luna" queda "Dada de baja" con motivo "por deuda"
    And los períodos "2026-08" y "2026-09" quedan como deuda congelada

  @RN-02
  Scenario: Una cobertura reactivada no se da de baja
    Given la cobertura de "Luna" estuvo suspendida desde el "14/07/2026 00:00"
    And el "20/09/2026" se registró el pago de todos sus períodos adeudados y quedó "Al día"
    When se ejecuta el proceso de baja por deuda del "14/10/2026 00:00"
    Then la cobertura de "Luna" sigue "Al día"

  @RN-04 @D20
  Scenario: La baja cancela los cambios pendientes
    Given la cobertura de "Luna" está "Suspendida por falta de pago" desde el "14/07/2026 00:00"
    And "Luna" tiene un cambio pendiente al plan "Plan Plus" con vigencia "01/11/2026"
    When se ejecuta el proceso de baja por deuda del "14/10/2026 00:00"
    Then el cambio al plan "Plan Plus" queda "Cancelado"

  @FA-02 @D54
  Scenario: Antes de que corra el proceso, el estado ya se muestra dado de baja
    Given la cobertura de "Luna" está "Suspendida por falta de pago" desde el "14/07/2026 00:00"
    And la fecha y hora actual es "14/10/2026 07:00"
    And el proceso de baja por deuda todavía no se ejecutó
    When se consulta el estado de cobertura de "Luna"
    Then el estado es "Dada de baja"

  @FA-03 @RN-07 @RNF-DIS-02
  Scenario: Ejecutar el proceso dos veces no duplica la baja
    Given la cobertura de "Luna" está "Suspendida por falta de pago" desde el "14/07/2026 00:00"
    When se ejecuta el proceso de baja por deuda del "14/10/2026 00:00" dos veces
    Then la auditoría registra una sola baja de "Luna"
    And se dispara un solo aviso de baja por deuda a "Carla Gómez"

  @EX-01 @RNF-DIS-02
  Scenario: El error en una cobertura no frena a las demás
    Given las coberturas de "Luna" y "Toby" están suspendidas desde el "14/07/2026 00:00"
    And el procesamiento de "Toby" falla
    When se ejecuta el proceso de baja por deuda del "14/10/2026 00:00"
    Then la cobertura de "Luna" queda "Dada de baja"
    And la ejecución registra un error para "Toby"
    And "Toby" se vuelve a procesar en la próxima ejecución
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PAG-14 | Paso 3, RN-06 |
| RF-TRA-01, RNF-AUD-01 | Paso 6 |
| RNF-BAJ-01, RNF-BAJ-04 | RN-06, RN-07 |
| RNF-DIS-02 | Paso 7, RN-07, EX-01, EX-02 |
| D4, D8, D67 | RN-01, RN-02 |
| D68 | Paso 6, RN-08 |
| D9, D10, D28 | RN-05 |
| D16 | RN-06 |
| D20 | RN-04 |
| D27 | Paso 4, RN-03 |
| D53, D54 | RN-01, FA-02 |
