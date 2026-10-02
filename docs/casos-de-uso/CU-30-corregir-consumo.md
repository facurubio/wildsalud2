# CU-30 — Corregir consumo

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Corregir un consumo que un veterinario registró con un error, dejando constancia del valor anterior y del motivo, y recalcular los saldos afectados. |
| **Disparador** | El administrador detecta, o un veterinario le avisa, que un consumo se cargó con la prestación equivocada o en la mascota equivocada. |
| **Relaciones** | Los consumos los registra el veterinario en CU-39 y se consultan en CU-38 y CU-41. Para quitar un consumo por completo se usa CU-31 Anular consumo. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El consumo existe y está *Válido*.

## Flujo principal

1. El administrador elige **Corregir** sobre un consumo del historial de la mascota.
2. El sistema muestra el consumo: mascota, número de afiliado, prestación, fecha y hora, veterinario, veterinaria y período al que descuenta.
3. El administrador cambia la **prestación** y/o la **mascota**, y escribe el **motivo** de la corrección.
4. El sistema muestra cómo quedan los saldos afectados, del consumo original y del corregido.
5. El administrador confirma.
6. El sistema valida las reglas **RN-01 a RN-04**.
7. El sistema **edita** el consumo con los datos nuevos. La fecha y hora, el veterinario y la veterinaria no cambian.
8. El sistema recalcula los saldos de las prestaciones afectadas (**RN-05**).
9. El sistema deja el registro de auditoría con el valor anterior, el valor nuevo, el motivo, el administrador y la fecha y hora.
10. El sistema confirma: *"Consumo corregido."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 8 | El consumo es de un **período cerrado** (un mes o un año anterior). | Se corrige igual, pero solo cambian el historial y el saldo de ese período; no se devuelve saldo al período actual. |
| **FA-02** | 3 o 5 | El administrador cancela. | El consumo no cambia. |

## Excepciones

En todas las excepciones **el consumo no cambia**, y el sistema informa el motivo.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 6 | No se escribió un motivo. | *"Indicá el motivo de la corrección."* |
| **EX-02** | 6 | No se cambió ningún dato. | *"No hay cambios para guardar."* |
| **EX-03** | 6 | Con los datos nuevos, el consumo no cumple las reglas de CU-39 en la fecha del consumo: la mascota no tenía cobertura activa, la prestación no estaba en su plan, no estaba habilitada o no quedaba saldo. | El mismo mensaje de la excepción correspondiente de CU-39 (EX-01 a EX-05). |
| **EX-04** | 6 | El consumo ya fue anulado o corregido por otro administrador. | *"Los datos del consumo cambiaron mientras los editabas. Revisalos y volvé a guardar."* |
| **EX-05** | 1 | Un usuario que no es administrador intenta corregir un consumo (por ejemplo, el veterinario que lo registró). | *"No tenés permiso para hacer esta operación."* |
| **EX-06** | 5 | La misma confirmación llega dos veces. | La corrección se aplica **una sola** vez. |

## Postcondiciones

- **Éxito:** el consumo tiene los datos corregidos, los saldos afectados quedaron recalculados y la auditoría conserva el valor original.
- **Fracaso:** el consumo y los saldos no cambian.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo el administrador.** El veterinario no corrige consumos, ni siquiera los que cargó él. | RF-PRE-09, RF-ROL-12, D34, D110 |
| **RN-02** | **Qué se corrige.** La prestación y la mascota. La fecha y hora, el veterinario y la veterinaria son los del registro original y no se corrigen. | D26, D14, D138 |
| **RN-03** | **Motivo obligatorio.** Toda corrección registra motivo, administrador, fecha y hora, valor anterior y valor nuevo. | RF-PRE-13, RF-ROL-13, D40 |
| **RN-04** | **Las reglas no se saltean.** El consumo corregido tiene que cumplir las reglas de CU-39 (cobertura activa, prestación incluida, habilitación y saldo) evaluadas en la fecha del consumo, sin contar el propio consumo que se corrige. | RF-ROL-14, RNF-INT-02, D138 |
| **RN-05** | **Recálculo de saldos.** Se recalcula el saldo de la prestación original y el de la corregida. Si el consumo es del período vigente, la prestación original vuelve a quedar disponible en la medida en que el plan actual lo permita. | RF-PRE-10, RF-PRE-11, RF-PRE-12 |
| **RN-06** | **Períodos cerrados.** Se pueden corregir consumos de cualquier período; en uno cerrado solo cambian el historial y el saldo de ese período. | D35 |
| **RN-07** | **Sin reemplazo silencioso.** El consumo se edita, pero la auditoría conserva los datos originales. | RF-PRE-13, D40, RNF-AUD-01 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Consumo | Prestación y/o mascota corregidas. |
| Auditoría | Valor anterior, valor nuevo, motivo, administrador, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-30
Feature: CU-30 Corregir consumo
  Como administrador
  Quiero corregir un consumo cargado con un error
  Para que los saldos y el historial sean correctos

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And existe el plan "Plan Base" con las prestaciones:
      | prestación  | límite | periodicidad | períodos pagos para habilitarla |
      | Consulta    | 2      | mensual      | 1                               |
      | Vacuna      |        | mensual      | 1                               |
      | Radiografía | 1      | anual        | 3                               |
    And "Luna" y "Toby" tienen cobertura "Al día" con el plan "Plan Base" y 4 períodos pagos
    And el "15/10/2026 11:00" la veterinaria "Ana López" de "Patitas" registró una "Consulta" para "Luna"

  @flujo-principal @RF-PRE-12 @D40
  Scenario: Corregir la prestación de un consumo del mes en curso
    When el administrador corrige ese consumo cambiando la prestación a "Vacuna" con motivo "Era una vacuna" y confirma
    Then el consumo del "15/10/2026 11:00" de "Luna" es una "Vacuna" registrada por "Ana López" en "Patitas"
    And el saldo de "Consulta" de "Luna" para 2026-10 es 2
    And la auditoría registra valor anterior "Consulta", valor nuevo "Vacuna", motivo "Era una vacuna" y usuario "Marta Ruiz"
    And el sistema informa "Consumo corregido."

  @flujo-principal @RN-05
  Scenario: Corregir la mascota de un consumo
    When el administrador corrige ese consumo cambiando la mascota a "Toby" con motivo "Mascota equivocada" y confirma
    Then el consumo del "15/10/2026 11:00" pertenece a "Toby"
    And el saldo de "Consulta" de "Luna" para 2026-10 es 2
    And el saldo de "Consulta" de "Toby" para 2026-10 es 1

  @FA-01 @RN-06 @D35
  Scenario: Corregir un consumo de un período cerrado
    Given el "10/09/2026" se registró una "Consulta" para "Luna"
    When el administrador corrige ese consumo cambiando la prestación a "Vacuna" con motivo "Error de carga" y confirma
    Then el saldo de "Consulta" de "Luna" para 2026-09 aumenta en 1
    And el saldo de "Consulta" de "Luna" para 2026-10 no cambia

  @EX-03 @RN-04 @RF-ROL-14
  Scenario Outline: El consumo corregido tiene que cumplir las reglas
    Given <condición>
    When el administrador corrige ese consumo cambiando <cambio> con motivo "Corrección"
    Then el consumo no cambia
    And el sistema informa "<mensaje>"

    Examples:
      | condición                                                  | cambio                               | mensaje                                                          |
      | "Toby" ya consumió 2 "Consulta" en octubre 2026            | la mascota a "Toby"                  | Consulta está agotada para el período 2026-10.                   |
      | "Luna" tiene 4 períodos pagos                              | la prestación a "Ecografía"          | Ecografía no está incluida en el plan Plan Base.                 |
      | la cobertura de "Toby" estaba suspendida el "15/10/2026"   | la mascota a "Toby"                  | La cobertura de Toby está suspendida por falta de pago.          |

  @RN-02 @D26
  Scenario: La fecha y el veterinario no se corrigen
    When el administrador abre la corrección de ese consumo
    Then la fecha y hora, el veterinario y la veterinaria se muestran como solo lectura

  @EX-01 @RN-03
  Scenario: El motivo es obligatorio
    When el administrador corrige ese consumo cambiando la prestación a "Vacuna" sin motivo
    Then el consumo no cambia
    And el sistema informa "Indicá el motivo de la corrección."

  @EX-02
  Scenario: Guardar sin cambios
    When el administrador guarda la corrección de ese consumo sin cambiar datos, con motivo "Revisión"
    Then el sistema informa "No hay cambios para guardar."

  @EX-04
  Scenario: Otro administrador anuló el consumo mientras tanto
    Given "Marta Ruiz" abrió la corrección de ese consumo
    And el administrador "Jorge Paz" anuló ese consumo
    When "Marta Ruiz" cambia la prestación a "Vacuna" con motivo "Error" y confirma
    Then el consumo sigue "Anulado"
    And el sistema informa "Los datos del consumo cambiaron mientras los editabas. Revisalos y volvé a guardar."

  @FA-02
  Scenario: El administrador cancela
    When el administrador cambia la prestación de ese consumo a "Vacuna" y cancela
    Then el consumo sigue siendo una "Consulta"

  @EX-05 @RN-01 @D34 @D110
  Scenario: El veterinario no puede corregir su propio consumo
    Given la veterinaria "Ana López" inició sesión
    When "Ana López" intenta corregir ese consumo sin usar la pantalla
    Then el consumo no cambia
    And el sistema informa "No tenés permiso para hacer esta operación."

  @EX-06 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces corrige una sola vez
    When el administrador confirma la corrección de ese consumo a "Vacuna" y la misma confirmación se envía dos veces
    Then la auditoría registra una sola corrección de ese consumo
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PRE-09, RF-ROL-12 | Actor principal, RN-01 |
| RF-PRE-10, RF-PRE-11, RF-PRE-12 | Paso 8, RN-05 |
| RF-PRE-13, RF-ROL-13 | Paso 9, RN-03, RN-07 |
| RF-ROL-14, RNF-INT-02 | RN-04, EX-03 |
| RNF-AUD-01 | RN-07 |
| RNF-INT-01 | EX-06 |
| D14, D26 | RN-02 |
| D34, D110 | RN-01, EX-05 |
| D35 | RN-06, FA-01 |
| D40 | Paso 7, RN-03, RN-07 |
| D138 | RN-02, RN-04 |
