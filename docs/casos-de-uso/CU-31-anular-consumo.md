# CU-31 — Anular consumo

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Anular un consumo que no debía registrarse, conservando el registro original, y devolver el saldo si corresponde. |
| **Disparador** | El administrador detecta, o un veterinario le avisa, que se registró un consumo que no ocurrió (por ejemplo, cargado dos veces). |
| **Relaciones** | Los consumos los registra el veterinario en CU-39. Para cambiar la prestación o la mascota se usa CU-30 Corregir consumo. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El consumo existe y está *Válido*.

## Flujo principal

1. El administrador elige **Anular** sobre un consumo del historial de la mascota.
2. El sistema muestra el consumo y cómo queda el saldo de la prestación si se anula.
3. El administrador escribe el **motivo** de la anulación y confirma.
4. El sistema valida las reglas **RN-01 y RN-02**.
5. El sistema marca el consumo como **Anulado**, con motivo, administrador y fecha y hora. El consumo no se elimina.
6. El sistema recalcula el saldo de la prestación (**RN-03**).
7. El sistema deja el registro de auditoría.
8. El sistema confirma: *"Consumo anulado."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 6 | El consumo es de un **período cerrado**. | Se anula igual, pero solo cambian el historial y el saldo de ese período; no se devuelve saldo al período actual. |
| **FA-02** | 3 | El administrador cancela. | El consumo sigue *Válido*. |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | No se escribió un motivo. | *"Indicá el motivo de la anulación."* |
| **EX-02** | 4 | El consumo ya estaba anulado (por ejemplo, por otro administrador). | *"El consumo ya está anulado."* |
| **EX-03** | 1 | Un usuario que no es administrador intenta anular un consumo. | *"No tenés permiso para hacer esta operación."* |
| **EX-04** | 3 | La misma confirmación llega dos veces. | El consumo se anula **una sola** vez. |

## Postcondiciones

- **Éxito:** el consumo queda *Anulado*, con su motivo, y deja de contar para el saldo. Ya no se muestra en las consultas del dueño (CU-41) ni del veterinario (CU-38), pero sigue en el historial del administrador y en la auditoría.
- **Fracaso:** el consumo sigue *Válido*.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo el administrador.** El veterinario no anula consumos, ni siquiera los que cargó él. | RF-PRE-09, RF-ROL-12, D34, D110 |
| **RN-02** | **Motivo obligatorio.** Toda anulación registra motivo, administrador, fecha y hora. | RF-PRE-13, RF-ROL-13 |
| **RN-03** | **Devolución de saldo.** Si el consumo es del período vigente, la prestación vuelve a quedar disponible, siempre que el plan actual lo permita (por ejemplo, si la prestación sigue en el plan). | RF-PRE-10, RF-PRE-11, D30 |
| **RN-04** | **Períodos cerrados.** Se pueden anular consumos de cualquier período; en uno cerrado solo cambian el historial y el saldo de ese período. | D35 |
| **RN-05** | **Sin borrado.** El consumo no se elimina: queda *Anulado* con los datos originales. | RF-PRE-13, RNF-BAJ-01, RNF-AUD-01 |
| **RN-06** | **Definitivo.** Un consumo anulado no se puede volver a validar. Si se anuló por error, el veterinario lo registra de nuevo (CU-39), con la fecha de ese momento. | D26, D139 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Consumo | Estado *Anulado*, motivo, administrador, fecha y hora de la anulación. |
| Auditoría | Anulación del consumo, con motivo. |

## Escenarios de aceptación

```gherkin
@CU-31
Feature: CU-31 Anular consumo
  Como administrador
  Quiero anular un consumo que no debía registrarse
  Para que el saldo de la mascota sea correcto

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And "Luna" tiene cobertura "Al día" con el plan "Plan Base", que incluye 2 "Consulta" mensuales
    And "Luna" consumió 2 "Consulta" en octubre 2026, la segunda el "15/10/2026 11:00" cargada dos veces por error

  @flujo-principal @RF-PRE-11 @RN-03
  Scenario: Anular un consumo del mes devuelve el saldo
    When el administrador anula el consumo del "15/10/2026 11:00" con motivo "Cargado dos veces" y confirma
    Then el consumo queda "Anulado" con motivo "Cargado dos veces" y registrado por "Marta Ruiz"
    And el saldo de "Consulta" de "Luna" para 2026-10 es 1
    And el sistema informa "Consumo anulado."

  @FA-01 @RN-04 @D35
  Scenario: Anular un consumo de un período cerrado no devuelve saldo al mes actual
    Given "Luna" consumió 2 "Consulta" en septiembre 2026
    When el administrador anula una "Consulta" de septiembre con motivo "Error de carga" y confirma
    Then el saldo de "Consulta" de "Luna" para 2026-09 es 1
    And el saldo de "Consulta" de "Luna" para 2026-10 sigue siendo 0

  @RN-03 @D30
  Scenario: Si la prestación ya no está en el plan, no se devuelve saldo
    Given "Luna" consumió una "Radiografía" el "05/10/2026"
    And desde el "01/10/2026" el plan de "Luna" ya no incluye "Radiografía"
    When el administrador anula esa "Radiografía" con motivo "Error de carga" y confirma
    Then el consumo queda "Anulado"
    And "Luna" no tiene saldo de "Radiografía"

  @RN-05
  Scenario: El consumo anulado no lo ven el dueño ni el veterinario
    Given el administrador anuló el consumo del "15/10/2026 11:00" con motivo "Cargado dos veces"
    When "Carla Gómez" consulta las prestaciones de "Luna"
    Then no ve el consumo del "15/10/2026 11:00"

  @EX-01 @RN-02
  Scenario: El motivo es obligatorio
    When el administrador intenta anular el consumo del "15/10/2026 11:00" sin motivo
    Then el consumo sigue "Válido"
    And el sistema informa "Indicá el motivo de la anulación."

  @EX-02
  Scenario: El consumo ya estaba anulado
    Given el administrador "Jorge Paz" anuló el consumo del "15/10/2026 11:00"
    When "Marta Ruiz" intenta anularlo con motivo "Cargado dos veces"
    Then el sistema informa "El consumo ya está anulado."

  @RN-06 @D139
  Scenario: Una anulación no se puede deshacer
    Given el administrador anuló el consumo del "15/10/2026 11:00"
    When el administrador abre ese consumo
    Then no tiene la opción de volver a validarlo

  @FA-02
  Scenario: El administrador cancela
    When el administrador elige anular el consumo del "15/10/2026 11:00" y cancela
    Then el consumo sigue "Válido"

  @EX-03 @RN-01 @D34 @D110
  Scenario: El veterinario no puede anular un consumo
    Given la veterinaria "Ana López" inició sesión
    When "Ana López" intenta anular el consumo del "15/10/2026 11:00" sin usar la pantalla
    Then el consumo sigue "Válido"
    And el sistema informa "No tenés permiso para hacer esta operación."

  @EX-04 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces anula una sola vez
    When el administrador confirma la anulación del consumo del "15/10/2026 11:00" y la misma confirmación se envía dos veces
    Then la auditoría registra una sola anulación de ese consumo
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PRE-09, RF-ROL-12 | Actor principal, RN-01 |
| RF-PRE-10, RF-PRE-11 | Paso 6, RN-03 |
| RF-PRE-13, RF-ROL-13 | Paso 5, RN-02, RN-05 |
| RNF-AUD-01, RNF-BAJ-01 | Paso 7, RN-05 |
| RNF-INT-01 | EX-04 |
| D26 | RN-06 |
| D30 | RN-03 |
| D34, D110 | RN-01, EX-03 |
| D35 | RN-04, FA-01 |
| D139 | RN-06 |
