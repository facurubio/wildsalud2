# CU-46 — Aplicar cambios programados

| Campo | Valor |
|-------|-------|
| **Actor principal** | Sistema (proceso automático programado) |
| **Objetivo** | Hacer efectivos, al comenzar cada mes, los cambios que se programaron para ese día: versiones nuevas de planes, cambios de plan y bajas programadas. |
| **Disparador** | Llegan las 00:00 del día 1 de cada mes (hora de Argentina). |
| **Relaciones** | Aplica los cambios registrados en CU-17 Editar plan, CU-23 Cambiar plan y CU-24 Dar de baja el plan. Los cambios cancelados en CU-25 no se aplican. La deuda que se congela por una baja se paga en CU-26 Registrar pago. |

## Precondiciones

Ninguna.

## Flujo principal

1. A las 00:00 del día 1 se inicia el proceso.
2. El sistema marca como **vigentes** las versiones de planes que rigen desde ese día (CU-17); la versión anterior de cada plan queda como histórica.
3. El sistema busca los **cambios pendientes** con vigencia ese día.
4. Para cada **cambio de plan**, el sistema asigna el plan nuevo a la cobertura desde ese día y marca el cambio como *Aplicado*.
5. Para cada **baja programada**, el sistema cambia la cobertura a **Dada de baja** con motivo *voluntaria* y fecha de baja el día 1 a las 00:00, congela los períodos impagos vencidos antes de ese mes y marca el cambio como *Aplicado*.
6. El sistema deja el registro de auditoría de cada cambio aplicado, con el usuario *Sistema*.
7. El sistema registra el resultado de la ejecución: fecha y hora, cambios aplicados y errores.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | No hay cambios con vigencia ese día. | Se registra la ejecución con 0 cambios aplicados. |
| **FA-02** | 4 | La cobertura está *Suspendida* y todavía tiene un cambio de plan pendiente (por ejemplo, porque falló su cancelación en CU-44). | El cambio **no se aplica**: se cancela. |
| **FA-03** | 1 | El proceso se ejecuta con demora. | Los cambios rigen desde el día 1 a las 00:00, no desde la hora de ejecución. Mientras tanto, el sistema ya mostraba el plan y el estado nuevos (D54). |
| **FA-04** | 1 | El proceso se ejecuta más de una vez el mismo día. | Los cambios ya aplicados no se vuelven a procesar. |

## Excepciones

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **EX-01** | 4 o 5 | Falla la aplicación de un cambio. | Se registra el error y el proceso **continúa** con los demás. El cambio se reintenta en la próxima ejecución. |
| **EX-02** | 1 a 7 | Falla el proceso completo. | Se registra el error y el proceso se reintenta. El plan y el estado mostrados siguen siendo correctos (D54). |

## Postcondiciones

- **Éxito:** las versiones de plan y los cambios con vigencia ese día están aplicados y auditados. Las coberturas con baja programada quedaron *Dadas de baja* y sus mascotas, registradas sin plan.
- **Fracaso parcial:** los cambios con error quedan registrados para reintento.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Vigencia el día 1.** Todo cambio programado rige desde las 00:00 del día 1 del mes (hora de Argentina), aunque el proceso se ejecute más tarde. | RF-PLA-06, RF-PLA-15, D1, D53, D54 |
| **RN-02** | **Versiones de plan.** La versión nueva de un plan aplica a todas las mascotas con ese plan desde el día 1. El mes anterior se rige por la versión anterior. | RF-PLA-05, RF-PLA-06, RF-PLA-07 |
| **RN-03** | **Cambio de plan.** La cobertura es la misma: conserva su antigüedad, y los consumos del año se siguen contando contra los límites anuales del plan nuevo. | D11, D30 |
| **RN-04** | **Baja programada.** La cobertura queda *Dada de baja* con motivo *voluntaria* y se congelan los períodos impagos vencidos antes del mes de la baja. | D16, D18, D27 |
| **RN-05** | **Solo cambios pendientes.** No se aplican cambios cancelados ni reemplazados. Un cambio de plan se cancela si la cobertura se suspendió o si se desactivó el plan destino antes de la vigencia. | D20, D60, D61 |
| **RN-06** | **Historial intacto.** Aplicar un cambio no modifica pagos, consumos ni condiciones de meses anteriores. | RF-PLA-08 |
| **RN-07** | **Confiabilidad.** Ejecutar el proceso de nuevo no duplica cambios ni auditoría, y cada ejecución deja registro. | RNF-DIS-02 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Versión de plan | Estado *Vigente* para la nueva e *Histórica* para la anterior. |
| Cobertura (cambio de plan) | Plan vigente desde el día 1. |
| Cobertura (baja programada) | Estado *Dada de baja*, motivo *voluntaria*, fecha y hora de baja, períodos congelados. |
| Cambio pendiente | Estado *Aplicado*, fecha y hora de aplicación. |
| Auditoría | Cada cambio aplicado, con usuario *Sistema*. |
| Ejecución del proceso | Fecha y hora, cantidad de cambios aplicados, errores. |

## Escenarios de aceptación

```gherkin
@CU-46
Feature: CU-46 Aplicar cambios programados
  Como sistema
  Quiero aplicar al comenzar cada mes los cambios programados para ese día
  Para que los planes y las coberturas reflejen lo acordado

  Background:
    Given existen los planes:
      | plan      | precio mensual | estado |
      | Plan Base | 10000          | Activo |
      | Plan Plus | 15000          | Activo |
    And la mascota "Luna" de "Carla Gómez" tiene una cobertura "Al día" con el plan "Plan Base" y 6 períodos pagos

  @flujo-principal @RF-PLA-15 @D11
  Scenario: Aplicar un cambio de plan
    Given "Luna" tiene un cambio pendiente al plan "Plan Plus" con vigencia "01/11/2026"
    When se ejecuta el proceso de cambios programados del "01/11/2026 00:00"
    Then el plan vigente de "Luna" desde el "01/11/2026 00:00" es "Plan Plus"
    And la cobertura de "Luna" sigue teniendo 6 períodos pagos
    And el cambio queda "Aplicado"
    And la auditoría registra el cambio de plan de "Luna" con usuario "Sistema"

  @flujo-principal @D18 @D16
  Scenario: Aplicar una baja programada
    Given la cuota de octubre 2026 de "Luna" está pagada
    And "Luna" tiene una baja programada con vigencia "01/11/2026"
    When se ejecuta el proceso de cambios programados del "01/11/2026 00:00"
    Then la cobertura de "Luna" queda "Dada de baja" con motivo "voluntaria" y fecha de baja "01/11/2026 00:00"
    And "Luna" no tiene deuda congelada
    And "Luna" sigue registrada sin plan

  @RN-04 @D27
  Scenario: La baja programada congela el mes anterior impago
    Given la cuota de octubre 2026 de "Luna" está impaga y la cobertura está suspendida desde el "14/10/2026"
    And "Luna" tiene una baja programada con vigencia "01/11/2026"
    When se ejecuta el proceso de cambios programados del "01/11/2026 00:00"
    Then la cobertura de "Luna" queda "Dada de baja" con motivo "voluntaria"
    And el período "2026-10" queda como deuda congelada

  @RN-02 @RF-PLA-05 @RF-PLA-06
  Scenario: Una versión nueva de plan rige para todas las mascotas desde el día 1
    Given el administrador editó el "Plan Base" el "15/10/2026" con precio 12000 desde el "01/11/2026"
    And la mascota "Toby" también tiene el plan "Plan Base"
    When se ejecuta el proceso de cambios programados del "01/11/2026 00:00"
    Then el precio vigente de "Plan Base" es 12000
    And la cuota de noviembre 2026 de "Luna" y de "Toby" es 12000
    And la cuota de octubre 2026 de "Luna" sigue siendo 10000

  @FA-02 @D60
  Scenario: Un cambio de plan de una cobertura suspendida no se aplica
    Given la cobertura de "Luna" está "Suspendida por falta de pago" desde el "14/10/2026"
    And "Luna" todavía tiene un cambio pendiente al plan "Plan Plus" con vigencia "01/11/2026" porque falló su cancelación
    When se ejecuta el proceso de cambios programados del "01/11/2026 00:00"
    Then el cambio al plan "Plan Plus" queda "Cancelado"
    And el plan vigente de "Luna" sigue siendo "Plan Base"

  @RN-05 @D61
  Scenario: Un cambio hacia un plan desactivado no se aplica
    Given "Luna" tenía un cambio pendiente al plan "Plan Plus" con vigencia "01/11/2026"
    And el administrador desactivó el "Plan Plus" el "20/10/2026"
    When se ejecuta el proceso de cambios programados del "01/11/2026 00:00"
    Then el plan vigente de "Luna" sigue siendo "Plan Base"

  @RN-05 @D20
  Scenario: Un cambio cancelado no se aplica
    Given "Luna" tuvo un cambio al plan "Plan Plus" con vigencia "01/11/2026" que fue cancelado
    When se ejecuta el proceso de cambios programados del "01/11/2026 00:00"
    Then el plan vigente de "Luna" sigue siendo "Plan Base"

  @FA-03 @D54
  Scenario: Antes de que corra el proceso, el plan nuevo ya se muestra vigente
    Given "Luna" tiene un cambio pendiente al plan "Plan Plus" con vigencia "01/11/2026"
    And la fecha y hora actual es "01/11/2026 05:00"
    And el proceso de cambios programados todavía no se ejecutó
    When se consulta el plan vigente de "Luna"
    Then el plan es "Plan Plus"

  @FA-04 @RN-07 @RNF-DIS-02
  Scenario: Ejecutar el proceso dos veces no duplica cambios
    Given "Luna" tiene un cambio pendiente al plan "Plan Plus" con vigencia "01/11/2026"
    When se ejecuta el proceso de cambios programados del "01/11/2026 00:00" dos veces
    Then la auditoría registra un solo cambio de plan de "Luna"

  @EX-01 @RNF-DIS-02
  Scenario: El error en un cambio no frena a los demás
    Given "Luna" y "Toby" tienen cambios pendientes con vigencia "01/11/2026"
    And la aplicación del cambio de "Toby" falla
    When se ejecuta el proceso de cambios programados del "01/11/2026 00:00"
    Then el cambio de "Luna" queda "Aplicado"
    And la ejecución registra un error para "Toby"
    And el cambio de "Toby" se vuelve a procesar en la próxima ejecución
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PLA-05, RF-PLA-06, RF-PLA-07 | Paso 2, RN-02 |
| RF-PLA-08 | RN-06 |
| RF-PLA-15, RF-PLA-16 | Paso 4, RN-01 |
| RF-PAG-14 | Paso 5 |
| RF-TRA-01, RNF-AUD-01 | Paso 6 |
| RNF-DIS-02 | Paso 7, RN-07, EX-01, EX-02 |
| D1, D53, D54 | RN-01, FA-03 |
| D11, D30 | RN-03 |
| D16, D18, D27 | Paso 5, RN-04 |
| D20, D60, D61 | RN-05, FA-02 |
