# CU-44 — Suspender cobertura por falta de pago

| Campo | Valor |
|-------|-------|
| **Actor principal** | Sistema (proceso automático programado) |
| **Objetivo** | Suspender las coberturas que no tienen registrado el pago del mes en curso al comenzar el día 14. |
| **Disparador** | Llegan las 00:00 del día 14 de cada mes (hora de Argentina). |
| **Relaciones** | Dispara CU-48 Enviar aviso de suspensión. La fecha de suspensión inicia el plazo de CU-45 Dar de baja cobertura por deuda. La reactivación ocurre en CU-26 Registrar pago. |

## Precondiciones

Ninguna.

## Flujo principal

1. A las 00:00 del día 14 se inicia el proceso.
2. El sistema busca las coberturas *Al día* que no tienen un pago válido del mes en curso.
3. Para cada una, el sistema cambia el estado a **Suspendida por falta de pago** con fecha de suspensión el día 14 a las 00:00 y, si tiene un **cambio de plan pendiente**, lo cancela. Una baja programada se mantiene.
4. El sistema deja el registro de auditoría de cada suspensión, con el usuario *Sistema*.
5. El sistema dispara el aviso de suspensión al dueño de cada mascota suspendida (CU-48).
6. El sistema registra el resultado de la ejecución: fecha y hora, coberturas suspendidas y errores.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 2 | No hay coberturas para suspender. | Se registra la ejecución con 0 coberturas suspendidas. |
| **FA-02** | 1 | El proceso se ejecuta con demora (por ejemplo, el servidor estuvo caído). | La fecha de suspensión sigue siendo el día 14 a las 00:00, no la hora de ejecución. Mientras tanto, el sistema ya mostraba la cobertura como suspendida (D54). |
| **FA-03** | 1 | El proceso se ejecuta más de una vez para el mismo día 14 (reintento o ejecución manual). | Las coberturas ya suspendidas no se vuelven a procesar: no se duplican suspensiones, auditoría ni avisos. |

## Excepciones

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **EX-01** | 3 a 5 | Falla el procesamiento de una cobertura. | Se registra el error con la cobertura afectada y el proceso **continúa** con las demás. La cobertura pendiente se reintenta en la próxima ejecución. |
| **EX-02** | 1 a 6 | Falla el proceso completo. | Se registra el error y el proceso se reintenta. El estado mostrado a los usuarios sigue siendo correcto porque se calcula en el momento (D54). |

## Postcondiciones

- **Éxito:** toda cobertura que llegó al día 14 sin el pago del mes está *Suspendida por falta de pago* con fecha de suspensión el día 14 a las 00:00, auditada y con su aviso disparado. Sus cambios de plan pendientes quedaron cancelados.
- **Fracaso parcial:** las coberturas con error quedan registradas para reintento; su estado calculado ya es *Suspendida*.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Condición de suspensión.** Se suspende una cobertura *Al día* que al comenzar el día 14 no tiene un pago válido del mes en curso. La cobertura está al día durante todo el día 13. | RF-PAG-03, RF-PAG-04, D1, D17 |
| **RN-02** | **Fecha de suspensión.** Es el día 14 a las 00:00 (hora de Argentina), aunque el proceso se ejecute más tarde. | D53, D54 |
| **RN-03** | **Una sola vez.** Ejecutar el proceso de nuevo no duplica suspensiones, auditoría ni avisos. | RNF-DIS-02, RNF-INT-01 |
| **RN-04** | **Cada mascota por separado.** La suspensión de una mascota no afecta a las otras del mismo dueño. | RF-PAG-02 |
| **RN-05** | **Qué no cambia.** La suspensión no modifica los pagos, la antigüedad ni los consumos ya registrados. | D12 |
| **RN-06** | **Inicio del plazo de baja.** La fecha de suspensión es la que usa CU-45 para contar los 3 meses de la baja por deuda. | D8 |
| **RN-07** | **Confiabilidad.** El proceso deja registro de cada ejecución y de cada error. | RNF-DIS-02 |
| **RN-08** | **Cambios pendientes.** La suspensión cancela automáticamente el cambio de plan pendiente; el administrador lo vuelve a programar si el dueño salda la deuda. Una baja programada **no** se cancela: se aplica el día 1 y el mes impago queda como deuda congelada. | D60, D62 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Cobertura | Estado *Suspendida por falta de pago*, fecha y hora de suspensión, origen *Proceso automático*. |
| Cambio pendiente | Si la cobertura tenía un cambio de plan pendiente: estado *Cancelado*, con usuario *Sistema*. |
| Auditoría | Cada suspensión y cada cambio cancelado, con usuario *Sistema*. |
| Ejecución del proceso | Fecha y hora, cantidad de coberturas suspendidas, errores con la cobertura afectada. |

## Escenarios de aceptación

```gherkin
@CU-44
Feature: CU-44 Suspender cobertura por falta de pago
  Como sistema
  Quiero suspender las coberturas sin el pago del mes al comenzar el día 14
  Para cortar el servicio ante la falta de pago

  Background:
    Given existe el plan "Plan Base" con precio mensual 10000
    And la mascota "Luna" de "Carla Gómez" tiene una cobertura "Al día" con el plan "Plan Base"

  @flujo-principal @RF-PAG-04 @D53
  Scenario: Suspender una cobertura sin el pago del mes
    Given la cuota de octubre 2026 de "Luna" está impaga
    When se ejecuta el proceso de suspensión del "14/10/2026 00:00"
    Then la cobertura de "Luna" queda "Suspendida por falta de pago" con fecha de suspensión "14/10/2026 00:00"
    And la auditoría registra la suspensión de "Luna" con usuario "Sistema"
    And se dispara el aviso de suspensión a "Carla Gómez"

  @RN-01 @RF-PAG-03 @D17
  Scenario Outline: Solo se suspenden las coberturas sin el pago del mes en curso
    Given la cuota de octubre 2026 de "Luna" está "<cuota>"
    When se ejecuta el proceso de suspensión del "14/10/2026 00:00"
    Then la cobertura de "Luna" queda "<estado>"

    Examples:
      | cuota                                   | estado                       |
      | impaga                                  | Suspendida por falta de pago |
      | pagada                                  | Al día                       |
      | pagada con un pago que después se anuló | Suspendida por falta de pago |

  @RN-04 @RF-PAG-02
  Scenario: Cada mascota se evalúa por separado
    Given "Carla Gómez" también tiene la mascota "Toby" con cobertura "Al día"
    And la cuota de octubre 2026 de "Luna" está impaga
    And la cuota de octubre 2026 de "Toby" está pagada
    When se ejecuta el proceso de suspensión del "14/10/2026 00:00"
    Then la cobertura de "Luna" queda "Suspendida por falta de pago"
    And la cobertura de "Toby" sigue "Al día"

  @FA-02 @D54
  Scenario: Antes de que corra el proceso, el estado ya se muestra suspendido
    Given la cuota de octubre 2026 de "Luna" está impaga
    And la fecha y hora actual es "14/10/2026 06:30"
    And el proceso de suspensión todavía no se ejecutó
    When se consulta el estado de cobertura de "Luna"
    Then el estado es "Suspendida por falta de pago"

  @FA-02 @RN-02 @D53
  Scenario: Un proceso demorado no cambia la fecha de suspensión
    Given la cuota de octubre 2026 de "Luna" está impaga
    When el proceso de suspensión del 14/10/2026 se ejecuta recién a las "14/10/2026 06:30"
    Then la cobertura de "Luna" tiene fecha de suspensión "14/10/2026 00:00"

  @FA-03 @RN-03 @RNF-DIS-02
  Scenario: Ejecutar el proceso dos veces no duplica nada
    Given la cuota de octubre 2026 de "Luna" está impaga
    When se ejecuta el proceso de suspensión del "14/10/2026 00:00" dos veces
    Then la auditoría registra una sola suspensión de "Luna"
    And se dispara un solo aviso de suspensión a "Carla Gómez"

  @FA-01
  Scenario: Sin coberturas para suspender
    Given todas las coberturas tienen pagada la cuota de octubre 2026
    When se ejecuta el proceso de suspensión del "14/10/2026 00:00"
    Then se registra la ejecución con 0 coberturas suspendidas

  @EX-01 @RNF-DIS-02
  Scenario: El error en una cobertura no frena a las demás
    Given "Carla Gómez" también tiene la mascota "Toby" con cobertura "Al día"
    And las cuotas de octubre 2026 de "Luna" y "Toby" están impagas
    And el procesamiento de "Toby" falla
    When se ejecuta el proceso de suspensión del "14/10/2026 00:00"
    Then la cobertura de "Luna" queda "Suspendida por falta de pago"
    And la ejecución registra un error para "Toby"
    And "Toby" se vuelve a procesar en la próxima ejecución

  @RN-08 @D60 @D62
  Scenario Outline: La suspensión cancela el cambio de plan pendiente pero no la baja programada
    Given la cuota de octubre 2026 de "Luna" está impaga
    And "Luna" tiene pendiente <pendiente> con vigencia "01/11/2026"
    When se ejecuta el proceso de suspensión del "14/10/2026 00:00"
    Then la cobertura de "Luna" queda "Suspendida por falta de pago"
    And el cambio pendiente queda "<estado del cambio>"

    Examples:
      | pendiente                     | estado del cambio |
      | un cambio al plan "Plan Plus" | Cancelado         |
      | una baja programada           | Pendiente         |

  @RN-05 @D12
  Scenario: La suspensión no cambia pagos ni consumos
    Given "Luna" tiene 6 períodos pagos y una "Consulta" registrada el "05/10/2026"
    And la cuota de octubre 2026 de "Luna" está impaga
    When se ejecuta el proceso de suspensión del "14/10/2026 00:00"
    Then la cobertura de "Luna" sigue teniendo 6 períodos pagos
    And la "Consulta" del "05/10/2026" sigue "Válida"
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PAG-02 | RN-04 |
| RF-PAG-03, RF-PAG-04 | RN-01 |
| RF-TRA-01, RNF-AUD-01 | Paso 4 |
| RNF-DIS-02 | Paso 6, RN-03, RN-07, EX-01, EX-02 |
| RNF-INT-01 | RN-03, FA-03 |
| D1, D17 | RN-01 |
| D8 | RN-06 |
| D12 | RN-05 |
| D25 | Paso 5 |
| D53, D54 | RN-02, FA-02 |
| D60, D62 | Paso 3, RN-08 |
