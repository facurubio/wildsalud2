# CU-24 — Dar de baja el plan de una mascota

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Dar de baja voluntariamente la cobertura de una mascota, que queda registrada sin plan. |
| **Disparador** | El dueño pide dejar de tener la cobertura de su mascota. |
| **Relaciones** | Si la cobertura está al día, la baja queda programada y la aplica CU-46 Aplicar cambios programados; se puede cancelar con CU-25. Reemplaza a un cambio de plan pendiente (CU-23). La deuda que quede congelada se paga en CU-26 Registrar pago. Para dar de baja la mascota completa se usa CU-15. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. La mascota tiene una cobertura vigente (*Al día* o *Suspendida*).

## Flujo principal

*Cobertura al día: baja programada.*

1. El administrador elige **Dar de baja el plan** desde la ficha de la mascota.
2. El sistema muestra el plan actual, el estado de la cobertura y la fecha en que regiría la baja: día 1 del mes siguiente.
3. El administrador confirma.
4. El sistema valida las reglas **RN-01 a RN-03**.
5. El sistema registra la **baja programada** como cambio pendiente, con fecha de vigencia el día 1 del mes siguiente.
6. El sistema deja el registro de auditoría.
7. El sistema confirma: *"La baja del plan de {mascota} rige desde el {fecha}. Hasta entonces mantiene su cobertura."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 2 a 7 | La cobertura está **suspendida** por falta de pago. | El sistema avisa que la baja será **inmediata** y muestra los períodos que quedarán como deuda congelada. Al confirmar, la cobertura pasa a *Dada de baja* con motivo *voluntaria*, se congelan los períodos vencidos antes del mes en curso, se cancela cualquier cambio pendiente y el sistema confirma: *"La cobertura de {mascota} quedó dada de baja."* |
| **FA-02** | 2 | Ya existe un cambio de plan pendiente. | El sistema avisa que la baja **reemplaza** al cambio pendiente. Si el administrador confirma, el cambio anterior pasa a *Reemplazado*. |
| **FA-03** | 3 | El administrador cancela. | No se registra ninguna baja; el cambio pendiente anterior, si existía, sigue igual. |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | La mascota no tiene cobertura vigente. | *"{mascota} no tiene una cobertura vigente."* |
| **EX-02** | 4 | Ya hay una baja programada pendiente. | *"La baja del plan de {mascota} ya está programada para el {fecha}."* |
| **EX-03** | 3 | La misma confirmación llega dos veces. | Se registra **una sola** baja. |

## Postcondiciones

- **Éxito (cobertura al día):** la cobertura tiene una baja programada pendiente para el día 1 del mes siguiente y hasta entonces sigue *Al día* con su plan.
- **Éxito (cobertura suspendida):** la cobertura queda *Dada de baja* con motivo *voluntaria*, fecha y hora de baja y administrador responsable. Los períodos vencidos antes del mes en curso quedan como deuda congelada. La mascota sigue registrada, sin plan.
- **Fracaso:** no cambia la cobertura ni los cambios pendientes.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Cuándo rige.** Con la cobertura *Al día*, la baja rige desde las 00:00 del día 1 del mes siguiente (el mes ya pagado se mantiene cubierto). Con la cobertura *Suspendida*, la baja es inmediata. El estado se evalúa en el momento de la confirmación. | D18, D53, D54 |
| **RN-02** | **Un solo cambio pendiente.** La baja programada es un cambio pendiente: reemplaza, con confirmación, a un cambio de plan pendiente. No puede haber dos bajas programadas. | D20 |
| **RN-03** | **La mascota sigue registrada.** Dar de baja el plan no da de baja la mascota: queda sin plan y se le puede volver a asignar uno (CU-22). | D10 |
| **RN-04** | **Motivo de la baja.** La baja se registra con motivo *voluntaria*, fecha y hora, y administrador responsable. | D16, RNF-BAJ-04 |
| **RN-05** | **Deuda congelada.** Al hacerse efectiva la baja se congelan los períodos impagos **vencidos antes del mes de la baja**. Esa deuda debe pagarse (CU-26) antes de crear una cobertura nueva para la mascota o para otra mascota del dueño. | D27, D28, D29 |
| **RN-06** | **Baja inmediata cancela lo pendiente.** Si la baja es inmediata, se cancela cualquier cambio pendiente de la cobertura. | D20 |
| **RN-07** | **Borrado lógico.** La cobertura no se elimina: queda con su historial de pagos y consumos. | RNF-BAJ-01, RNF-BAJ-02 |
| **RN-08** | **Baja programada con el mes impago.** Si se programa la baja entre el 1 y el 13 sin haber pagado el mes y el dueño no paga, la cobertura se suspende el 14 y la baja se aplica igual el día 1: ese mes queda como deuda congelada. La suspensión no cancela la baja programada ni la vuelve inmediata. | D60, D62 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Baja programada | Cobertura, tipo *Baja programada*, fecha de vigencia, estado *Pendiente*, administrador y fecha y hora de registro. |
| Baja inmediata | Estado *Dada de baja*, motivo *voluntaria*, fecha y hora de baja, administrador. |
| Deuda congelada | Los períodos impagos vencidos antes del mes de la baja, marcados como congelados. |
| Auditoría | Registro de la baja (programada o inmediata) y de los cambios reemplazados o cancelados. |

## Escenarios de aceptación

```gherkin
@CU-24
Feature: CU-24 Dar de baja el plan de una mascota
  Como administrador
  Quiero dar de baja la cobertura de una mascota a pedido del dueño
  Para que deje de tener plan sin perder su historial

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And la mascota "Luna" tiene una cobertura con el plan "Plan Base"

  @flujo-principal @D18
  Scenario: Con la cobertura al día, la baja queda programada para el mes siguiente
    Given la cobertura de "Luna" está "Al día" con la cuota de octubre 2026 pagada
    When el administrador da de baja el plan de "Luna" y confirma
    Then "Luna" tiene una baja programada con vigencia "01/11/2026 00:00"
    And la cobertura de "Luna" sigue "Al día" con el plan "Plan Base"
    And el sistema informa "La baja del plan de Luna rige desde el 01/11/2026. Hasta entonces mantiene su cobertura."

  @FA-01 @D18 @D27 @D16
  Scenario: Con la cobertura suspendida, la baja es inmediata y congela la deuda
    Given la cobertura de "Luna" está "Suspendida por falta de pago" desde el "14/09/2026 00:00"
    And los períodos "2026-09" y "2026-10" de "Luna" están impagos
    When el administrador da de baja el plan de "Luna" y confirma
    Then la cobertura de "Luna" queda "Dada de baja" con motivo "voluntaria" y registrada por "Marta Ruiz"
    And el período "2026-09" queda como deuda congelada
    And el período "2026-10" no queda como deuda congelada
    And "Luna" sigue registrada sin plan
    And el sistema informa "La cobertura de Luna quedó dada de baja."

  @FA-01 @RN-06
  Scenario: La baja inmediata cancela el cambio pendiente
    Given la cobertura de "Luna" está "Suspendida por falta de pago"
    And "Luna" tiene un cambio pendiente al plan "Plan Plus" con vigencia "01/11/2026"
    When el administrador da de baja el plan de "Luna" y confirma
    Then el cambio al plan "Plan Plus" queda "Cancelado"

  @FA-02 @D20
  Scenario: La baja programada reemplaza a un cambio de plan pendiente
    Given la cobertura de "Luna" está "Al día"
    And "Luna" tiene un cambio pendiente al plan "Plan Plus" con vigencia "01/11/2026"
    When el administrador da de baja el plan de "Luna" y confirma el reemplazo
    Then el cambio al plan "Plan Plus" queda "Reemplazado"
    And "Luna" tiene una baja programada con vigencia "01/11/2026 00:00"

  @FA-03
  Scenario: El administrador cancela
    Given la cobertura de "Luna" está "Al día"
    When el administrador elige dar de baja el plan de "Luna" y cancela
    Then "Luna" no tiene ninguna baja programada
    And la cobertura de "Luna" sigue "Al día"

  @EX-01 @D10
  Scenario: Mascota sin cobertura vigente
    Given la cobertura de "Luna" está "Dada de baja"
    When el administrador intenta dar de baja el plan de "Luna"
    Then el sistema informa "Luna no tiene una cobertura vigente."

  @EX-02 @D20
  Scenario: Ya hay una baja programada
    Given la cobertura de "Luna" está "Al día"
    And "Luna" tiene una baja programada con vigencia "01/11/2026"
    When el administrador intenta dar de baja el plan de "Luna"
    Then el sistema informa "La baja del plan de Luna ya está programada para el 01/11/2026."

  @RN-08 @D27 @D62
  Scenario: Baja programada con el mes impago congela ese mes
    Given la fecha y hora actual es "05/10/2026 10:00"
    And la cobertura de "Luna" está "Al día" con la cuota de octubre 2026 impaga
    And el administrador programó la baja del plan de "Luna" con vigencia "01/11/2026"
    And la cuota de octubre 2026 de "Luna" no se paga
    When llega el "01/11/2026 00:00"
    Then la cobertura de "Luna" queda "Dada de baja" con motivo "voluntaria"
    And el período "2026-10" queda como deuda congelada

  @EX-03 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces registra una sola baja
    Given la cobertura de "Luna" está "Al día"
    When el administrador confirma la baja del plan de "Luna" y la misma confirmación se envía dos veces
    Then "Luna" tiene una única baja programada
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PAG-14 | RN-04, FA-01 |
| RF-TRA-01, RNF-AUD-01 | Paso 6 |
| RNF-BAJ-01, RNF-BAJ-02 | RN-07 |
| RNF-BAJ-04 | RN-04 |
| RNF-INT-01 | EX-03 |
| D10 | RN-03, EX-01 |
| D16 | RN-04 |
| D18, D53, D54 | RN-01, FA-01 |
| D20 | RN-02, RN-06, FA-02, EX-02 |
| D27, D28, D29 | RN-05 |
| D60, D62 | RN-08 |
