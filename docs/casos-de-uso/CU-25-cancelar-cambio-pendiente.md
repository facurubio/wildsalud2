# CU-25 — Cancelar cambio pendiente

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Cancelar un cambio de plan o una baja programada antes de que entre en vigencia. |
| **Disparador** | El dueño se arrepiente de un cambio de plan o de una baja que había pedido. |
| **Relaciones** | Cancela cambios registrados en CU-23 Cambiar plan o CU-24 Dar de baja el plan. Para *reemplazar* un cambio por otro se usan directamente CU-23 o CU-24. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. La mascota tiene un cambio pendiente (cambio de plan o baja programada).

## Flujo principal

1. El administrador elige **Cancelar cambio pendiente** desde la ficha de la mascota.
2. El sistema muestra el cambio pendiente: tipo, plan nuevo (si es un cambio de plan), fecha de vigencia y quién lo registró.
3. El administrador confirma la cancelación.
4. El sistema valida la regla **RN-01**.
5. El sistema marca el cambio como **Cancelado**.
6. El sistema deja el registro de auditoría.
7. El sistema confirma: *"Se canceló el cambio pendiente de {mascota}. Mantiene el plan {plan actual}."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | El administrador no confirma. | El cambio sigue pendiente. |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | El cambio ya entró en vigencia (se llegó a las 00:00 del día 1). | *"El cambio ya entró en vigencia el {fecha} y no se puede cancelar."* |
| **EX-02** | 4 | El cambio ya no está pendiente (fue cancelado, reemplazado o anulado por una baja inmediata). | *"{mascota} no tiene cambios pendientes."* |
| **EX-03** | 3 | La misma confirmación llega dos veces. | El cambio se cancela **una sola** vez; el segundo envío devuelve el mismo resultado. |

## Postcondiciones

- **Éxito:** el cambio queda *Cancelado* y la mascota conserva su plan y su cobertura como estaban.
- **Fracaso:** el cambio pendiente no se modifica.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo antes de la vigencia.** Un cambio se puede cancelar hasta las 23:59:59 del último día del mes (hora de Argentina). Desde las 00:00 del día 1 ya está vigente, aunque el proceso CU-46 todavía no se haya ejecutado. | D20, D53, D54 |
| **RN-02** | **Sin borrado.** El cambio cancelado no se elimina: queda con su estado *Cancelado*, el administrador y la fecha y hora de la cancelación. | RNF-BAJ-01, RF-TRA-01 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Cambio pendiente | Estado *Cancelado*, administrador y fecha y hora de la cancelación. |
| Auditoría | Registro de la cancelación. |

## Escenarios de aceptación

```gherkin
@CU-25
Feature: CU-25 Cancelar cambio pendiente
  Como administrador
  Quiero cancelar un cambio de plan o una baja programada
  Para que la mascota conserve su plan actual

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And la mascota "Luna" tiene una cobertura "Al día" con el plan "Plan Base"

  @flujo-principal @D20
  Scenario Outline: Cancelar un cambio pendiente
    Given "Luna" tiene pendiente <pendiente> con vigencia "01/11/2026"
    When el administrador cancela el cambio pendiente de "Luna" y confirma
    Then el cambio queda "Cancelado"
    And "Luna" no tiene cambios pendientes
    And el sistema informa "Se canceló el cambio pendiente de Luna. Mantiene el plan Plan Base."

    Examples:
      | pendiente                      |
      | un cambio al plan "Plan Plus"  |
      | una baja programada            |

  @FA-01
  Scenario: El administrador no confirma la cancelación
    Given "Luna" tiene pendiente un cambio al plan "Plan Plus" con vigencia "01/11/2026"
    When el administrador elige cancelar el cambio pendiente de "Luna" y no confirma
    Then "Luna" sigue teniendo pendiente el cambio al plan "Plan Plus"

  @EX-01 @RN-01 @D54
  Scenario Outline: Solo se puede cancelar antes de la vigencia
    Given "Luna" tiene pendiente un cambio al plan "Plan Plus" con vigencia "01/11/2026"
    And la fecha y hora actual es "<momento>"
    And el proceso de cambios programados todavía no se ejecutó
    When el administrador cancela el cambio pendiente de "Luna"
    Then el resultado es "<resultado>"

    Examples:
      | momento          | resultado                                                              |
      | 31/10/2026 23:59 | cambio cancelado                                                       |
      | 01/11/2026 00:00 | El cambio ya entró en vigencia el 01/11/2026 y no se puede cancelar.   |

  @EX-02
  Scenario: No hay cambios pendientes
    Given "Luna" no tiene cambios pendientes
    When el administrador intenta cancelar el cambio pendiente de "Luna"
    Then el sistema informa "Luna no tiene cambios pendientes."

  @EX-03 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces cancela una sola vez
    Given "Luna" tiene pendiente un cambio al plan "Plan Plus" con vigencia "01/11/2026"
    When el administrador confirma la cancelación y la misma confirmación se envía dos veces
    Then el cambio queda "Cancelado"
    And la auditoría registra una sola cancelación
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-TRA-01 | Paso 6, RN-02 |
| RNF-BAJ-01 | RN-02 |
| RNF-INT-01 | EX-03 |
| D20 | Flujo principal, RN-01 |
| D53, D54 | RN-01, EX-01 |
