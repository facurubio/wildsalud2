# CU-52 — Eliminar plan

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Quitar definitivamente de las listas un plan inactivo, para que su nombre quede libre y se pueda crear otro plan con ese nombre. |
| **Disparador** | El administrador quiere reutilizar el nombre de un plan discontinuado o limpiar la lista de planes. |
| **Relaciones** | El plan tiene que haberse desactivado antes con CU-18. Después se puede crear un plan con el mismo nombre con CU-16. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El plan está *Inactivo*.

## Flujo principal

1. El administrador elige **Eliminar** en un plan inactivo.
2. El sistema muestra el plan y avisa: *"Eliminar {plan} es definitivo: dejará de aparecer en las listas y su nombre quedará libre. El historial de coberturas, pagos y consumos se conserva."*
3. El administrador confirma.
4. El sistema valida las reglas **RN-01 y RN-02**.
5. El sistema marca el plan como **Eliminado** (borrado lógico) y descarta su versión pendiente, si la tenía.
6. El sistema deja el registro de auditoría.
7. El sistema confirma: *"Se eliminó el plan {plan}."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | El administrador cancela. | El plan sigue *Inactivo*. |

## Excepciones

En todas las excepciones **no se elimina el plan**, y el sistema informa el motivo.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | El plan está activo. | *"Para eliminar el plan {plan}, primero desactivalo."* |
| **EX-02** | 4 | Alguna mascota todavía tiene el plan en una cobertura vigente (*Al día* o *Suspendida*). | *"No se puede eliminar {plan}: todavía lo tienen {N} mascotas."* |
| **EX-03** | 4 | El plan ya fue eliminado (por ejemplo, por otro administrador). | *"El plan {plan} ya fue eliminado."* |
| **EX-04** | 1 | Un usuario que no es administrador intenta eliminar un plan. | *"No tenés permiso para hacer esta operación."* |
| **EX-05** | 3 | La misma confirmación llega dos veces. | El plan se elimina **una sola** vez. |

## Postcondiciones

- **Éxito:** el plan queda *Eliminado*: no aparece en las listas de planes ni se puede editar, reactivar, asignar ni elegir como destino. Su nombre queda libre. Las coberturas, pagos y consumos anteriores lo siguen mostrando con su nombre.
- **Fracaso:** el plan sigue *Inactivo*.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo planes inactivos.** Para eliminar un plan, primero hay que desactivarlo (CU-18). | D134 |
| **RN-02** | **Sin mascotas que lo usen.** No se puede eliminar un plan que alguna mascota tenga en una cobertura vigente. | D136 |
| **RN-03** | **Borrado lógico.** El plan no se borra de la base de datos: pasa a *Eliminado* y conserva sus versiones para el historial de coberturas, pagos y consumos. | RNF-BAJ-01, RNF-BAJ-02, RF-PLA-08 |
| **RN-04** | **Nombre libre.** El nombre de un plan eliminado se puede usar para crear un plan nuevo, que es un plan distinto. | D126, D134 |
| **RN-05** | **Definitivo.** Un plan eliminado no se puede restaurar. | D137 |
| **RN-06** | **Permisos y auditoría.** Solo el administrador elimina planes; la eliminación queda auditada. | RF-TRA-01, RNF-AUD-01, RNF-BAJ-04, RNF-SEG-07, D110 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Plan | Estado *Eliminado*, fecha y hora, administrador. |
| Versión pendiente | Si existía, estado *Descartada*. |
| Auditoría | Eliminación del plan. |

## Escenarios de aceptación

```gherkin
@CU-52
Feature: CU-52 Eliminar plan
  Como administrador
  Quiero eliminar un plan inactivo
  Para que su nombre quede libre y no aparezca más en las listas

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And existe el plan "Plan Old" inactivo, sin mascotas con cobertura vigente
    And existe el plan "Plan Base" activo

  @flujo-principal @D134 @RNF-BAJ-01
  Scenario: Eliminar un plan inactivo
    When el administrador elimina "Plan Old" y confirma
    Then "Plan Old" queda "Eliminado"
    And "Plan Old" no aparece en la lista de planes
    And la auditoría registra la eliminación de "Plan Old" por "Marta Ruiz"
    And el sistema informa "Se eliminó el plan Plan Old."

  @flujo-principal
  Scenario: Antes de confirmar se avisa que es definitivo
    When el administrador elige eliminar "Plan Old"
    Then el sistema muestra "Eliminar Plan Old es definitivo: dejará de aparecer en las listas y su nombre quedará libre. El historial de coberturas, pagos y consumos se conserva."

  @RN-04 @D126 @D134
  Scenario: El nombre de un plan eliminado se puede volver a usar
    Given el administrador eliminó "Plan Old"
    When el administrador crea el plan "Plan Old" con precio mensual 9000 y la prestación "Consulta"
    Then existe un plan "Plan Old" activo con precio mensual 9000
    And es un plan distinto del eliminado

  @RN-03 @RF-PLA-08
  Scenario: El historial sigue mostrando el plan eliminado
    Given "Milo" tuvo una cobertura con el plan "Plan Old", dada de baja en 2025, con pagos registrados
    And el administrador eliminó "Plan Old"
    When el administrador consulta el historial de pagos de "Milo"
    Then los pagos de esa cobertura muestran el plan "Plan Old"

  @RN-03
  Scenario: Eliminar descarta la versión pendiente
    Given "Plan Old" tiene una versión pendiente con precio 9000 vigente desde el "01/11/2026"
    When el administrador elimina "Plan Old" y confirma
    Then la versión pendiente queda "Descartada"

  @EX-01 @RN-01
  Scenario: Un plan activo no se puede eliminar
    When el administrador intenta eliminar "Plan Base"
    Then "Plan Base" sigue "Activo"
    And el sistema informa "Para eliminar el plan Plan Base, primero desactivalo."

  @EX-02 @RN-02 @D136
  Scenario: Un plan que todavía usan mascotas no se puede eliminar
    Given "Luna" y "Toby" tienen el plan "Plan Old" en una cobertura vigente
    When el administrador intenta eliminar "Plan Old"
    Then "Plan Old" sigue "Inactivo"
    And el sistema informa "No se puede eliminar Plan Old: todavía lo tienen 2 mascotas."

  @RN-05 @D137
  Scenario: Un plan eliminado no se puede editar ni reactivar
    Given el administrador eliminó "Plan Old"
    When el administrador busca "Plan Old" para reactivarlo
    Then no lo encuentra en la lista de planes

  @FA-01
  Scenario: El administrador cancela
    When el administrador elige eliminar "Plan Old" y cancela
    Then "Plan Old" sigue "Inactivo"

  @EX-03
  Scenario: El plan ya fue eliminado
    Given el administrador "Jorge Paz" eliminó "Plan Old"
    When "Marta Ruiz" intenta eliminar "Plan Old"
    Then el sistema informa "El plan Plan Old ya fue eliminado."

  @EX-04 @RNF-SEG-07 @D110
  Scenario: Solo el administrador elimina planes
    Given el veterinario "Ana López" inició sesión
    When "Ana López" intenta eliminar "Plan Old" sin usar la pantalla
    Then "Plan Old" sigue "Inactivo"
    And el sistema informa "No tenés permiso para hacer esta operación."

  @EX-05 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces elimina una sola vez
    When el administrador confirma la eliminación de "Plan Old" y la misma confirmación se envía dos veces
    Then la auditoría registra una sola eliminación de "Plan Old"
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PLA-08 | RN-03 |
| RF-TRA-01, RNF-AUD-01, RNF-BAJ-04 | Paso 6, RN-06 |
| RNF-BAJ-01, RNF-BAJ-02 | Paso 5, RN-03 |
| RNF-INT-01 | EX-05 |
| RNF-SEG-07, D110 | EX-04 |
| D126, D134 | RN-01, RN-04 |
| D136, D137 | RN-02, RN-05 |
