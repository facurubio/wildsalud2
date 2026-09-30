# CU-19 — Reactivar plan

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Volver a ofrecer un plan que estaba inactivo. |
| **Disparador** | WildSalud decide volver a vender un plan discontinuado. |
| **Relaciones** | Revierte CU-18 Desactivar plan. Si hay que cambiar sus condiciones, se usa CU-17. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El plan está *Inactivo*.

## Flujo principal

1. El administrador elige **Reactivar** en un plan inactivo.
2. El sistema muestra el plan con su versión vigente (precio y prestaciones) y, si existe, la versión pendiente.
3. El administrador confirma.
4. El sistema valida la regla **RN-01**.
5. El sistema cambia el plan a **Activo**.
6. El sistema deja el registro de auditoría.
7. El sistema confirma: *"Se reactivó el plan {plan}."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | El administrador cancela. | El plan sigue *Inactivo*. |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | El plan ya está activo (por ejemplo, lo reactivó otro administrador). | *"El plan {plan} ya está activo."* |
| **EX-02** | 1 | Un usuario que no es administrador intenta reactivar un plan. | *"No tenés permiso para hacer esta operación."* |
| **EX-03** | 3 | La misma confirmación llega dos veces. | El plan se reactiva **una sola** vez. |

## Postcondiciones

- **Éxito:** el plan está *Activo* y se puede asignar (CU-22) y elegir como destino de un cambio de plan (CU-23).
- **Fracaso:** el plan sigue *Inactivo*.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo planes inactivos.** Se reactiva un plan que esté *Inactivo*. | RF-PLA-03 |
| **RN-02** | **Mismas condiciones.** El plan vuelve con su versión vigente; reactivarlo no cambia precio ni prestaciones. | RF-PLA-08 |
| **RN-03** | **Lo cancelado no vuelve.** Los cambios de plan que se cancelaron al desactivarlo siguen cancelados; si hace falta, se vuelven a programar con CU-23. | D61, D131 |
| **RN-04** | **Permisos y auditoría.** Solo el administrador reactiva planes; la reactivación queda auditada. | RF-TRA-01, RNF-AUD-01, RNF-SEG-07, D110 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Plan | Estado *Activo*, fecha y hora, administrador. |
| Auditoría | Reactivación del plan. |

## Escenarios de aceptación

```gherkin
@CU-19
Feature: CU-19 Reactivar plan
  Como administrador
  Quiero volver a ofrecer un plan inactivo
  Para poder asignarlo otra vez

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And existe el plan "Plan Old" inactivo con precio mensual 8000

  @flujo-principal @RF-PLA-03
  Scenario: Reactivar un plan inactivo
    When el administrador reactiva "Plan Old" y confirma
    Then "Plan Old" queda "Activo" con precio mensual 8000
    And la auditoría registra la reactivación de "Plan Old" por "Marta Ruiz"
    And el sistema informa "Se reactivó el plan Plan Old."

  @RN-02 @D21
  Scenario: Un plan reactivado se puede asignar
    Given el administrador reactivó "Plan Old"
    When el administrador asigna el plan "Plan Old" a "Milo" y confirma el pago
    Then "Milo" tiene una cobertura "Al día" con el plan "Plan Old"

  @RN-03 @D61 @D131
  Scenario: Los cambios cancelados al desactivarlo no vuelven
    Given el cambio pendiente de "Rocco" al plan "Plan Old" se canceló cuando se desactivó "Plan Old"
    When el administrador reactiva "Plan Old" y confirma
    Then el cambio de "Rocco" sigue "Cancelado"

  @FA-01
  Scenario: El administrador cancela
    When el administrador elige reactivar "Plan Old" y cancela
    Then "Plan Old" sigue "Inactivo"

  @EX-01
  Scenario: El plan ya está activo
    Given el administrador "Jorge Paz" reactivó "Plan Old"
    When "Marta Ruiz" intenta reactivar "Plan Old"
    Then el sistema informa "El plan Plan Old ya está activo."

  @EX-02 @RNF-SEG-07 @D110
  Scenario: Solo el administrador reactiva planes
    Given el veterinario "Ana López" inició sesión
    When "Ana López" intenta reactivar "Plan Old" sin usar la pantalla
    Then "Plan Old" sigue "Inactivo"
    And el sistema informa "No tenés permiso para hacer esta operación."

  @EX-03 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces reactiva una sola vez
    When el administrador confirma la reactivación de "Plan Old" y la misma confirmación se envía dos veces
    Then la auditoría registra una sola reactivación de "Plan Old"
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PLA-03 | RN-01, EX-01 |
| RF-PLA-08 | RN-02 |
| RF-TRA-01, RNF-AUD-01 | Paso 6, RN-04 |
| RNF-INT-01 | EX-03 |
| RNF-SEG-07, D110 | EX-02 |
| D21 | Postcondiciones |
| D61, D131 | RN-03 |
