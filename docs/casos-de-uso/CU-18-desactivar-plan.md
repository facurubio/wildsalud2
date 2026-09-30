# CU-18 — Desactivar plan

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Dejar de ofrecer un plan, sin quitárselo a las mascotas que ya lo tienen. |
| **Disparador** | WildSalud discontinúa un plan. |
| **Relaciones** | Cancela los cambios de plan pendientes hacia ese plan (programados en CU-23). Se revierte con CU-19 Reactivar plan. Un plan inactivo se puede eliminar con CU-52. Un plan inactivo no se puede asignar en CU-22 ni elegir como destino en CU-23. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El plan está *Activo*.

## Flujo principal

1. El administrador elige **Desactivar** en un plan.
2. El sistema muestra qué va a pasar:
   - la cantidad de mascotas que **conservan** el plan;
   - la lista de mascotas con un **cambio pendiente hacia este plan**, que se va a cancelar (mascota, número de afiliado, dueño y fecha del cambio).
3. El administrador confirma.
4. El sistema valida la regla **RN-01**.
5. El sistema cambia el plan a **Inactivo** y cancela los cambios pendientes hacia él.
6. El sistema deja el registro de auditoría de la desactivación y de cada cambio cancelado.
7. El sistema confirma: *"Se desactivó el plan {plan}. Cambios pendientes cancelados: {N}."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 2 | No hay cambios pendientes hacia el plan. | El sistema lo informa y, al confirmar, solo desactiva el plan: *"Se desactivó el plan {plan}."* |
| **FA-02** | 3 | El administrador cancela. | El plan sigue *Activo* y los cambios pendientes no se tocan. |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | El plan ya está inactivo (por ejemplo, lo desactivó otro administrador). | *"El plan {plan} ya está inactivo."* |
| **EX-02** | 1 | Un usuario que no es administrador intenta desactivar un plan. | *"No tenés permiso para hacer esta operación."* |
| **EX-03** | 3 | La misma confirmación llega dos veces. | El plan se desactiva **una sola** vez. |

## Postcondiciones

- **Éxito:** el plan está *Inactivo*: no se puede asignar a mascotas nuevas ni elegir como destino de un cambio de plan. Las mascotas que lo tenían lo conservan con sus condiciones. Los cambios pendientes hacia el plan quedaron *Cancelados*.
- **Fracaso:** el plan y los cambios pendientes no cambian.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo planes activos.** Se desactiva un plan que esté *Activo*. | RF-PLA-03 |
| **RN-02** | **Las mascotas lo conservan.** Las mascotas que ya tienen el plan siguen con él, con su precio, prestaciones y antigüedad. El plan inactivo se puede seguir editando (CU-17). | D21 |
| **RN-03** | **Cambios pendientes cancelados.** Se cancelan los cambios de plan pendientes cuyo destino es este plan, y el sistema los muestra antes de confirmar, como en la baja de un dueño (D22). Las mascotas afectadas siguen con su plan actual. | D61, D22 |
| **RN-04** | **Sin asignaciones nuevas.** Un plan inactivo no se puede asignar (CU-22) ni elegir como destino de un cambio de plan (CU-23). | D21 |
| **RN-05** | **Sin aviso a los dueños.** La desactivación y la cancelación de los cambios pendientes no envían emails. | D130 |
| **RN-06** | **Permisos y auditoría.** Solo el administrador desactiva planes; la desactivación y cada cambio cancelado quedan auditados. | RF-TRA-01, RNF-AUD-01, RNF-SEG-07, D110 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Plan | Estado *Inactivo*, fecha y hora, administrador. |
| Cambios pendientes | Los que tenían este plan como destino pasan a *Cancelado*. |
| Auditoría | Desactivación y cada cambio cancelado. |

## Escenarios de aceptación

```gherkin
@CU-18
Feature: CU-18 Desactivar plan
  Como administrador
  Quiero dejar de ofrecer un plan
  Sin quitárselo a las mascotas que ya lo tienen

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And existen los planes activos "Plan Base" y "Plan Plus"
    And las mascotas "Luna" y "Toby" tienen el plan "Plan Plus"

  @flujo-principal @D61 @D22
  Scenario: Desactivar un plan con cambios pendientes hacia él
    Given "Rocco" tiene el plan "Plan Base" y un cambio pendiente al plan "Plan Plus" con vigencia "01/11/2026"
    When el administrador elige desactivar "Plan Plus"
    Then el sistema muestra que 2 mascotas conservan el plan
    And el sistema muestra que se cancelará el cambio pendiente de "Rocco" del "01/11/2026"

  @flujo-principal @RN-02 @RN-03 @D21 @D61
  Scenario: Al confirmar, el plan queda inactivo y se cancelan los cambios hacia él
    Given "Rocco" tiene el plan "Plan Base" y un cambio pendiente al plan "Plan Plus" con vigencia "01/11/2026"
    When el administrador desactiva "Plan Plus" y confirma
    Then "Plan Plus" queda "Inactivo"
    And el cambio pendiente de "Rocco" queda "Cancelado"
    And "Luna" y "Toby" siguen teniendo el plan "Plan Plus"
    And el sistema informa "Se desactivó el plan Plan Plus. Cambios pendientes cancelados: 1."

  @FA-01
  Scenario: Desactivar un plan sin cambios pendientes
    When el administrador desactiva "Plan Plus" y confirma
    Then "Plan Plus" queda "Inactivo"
    And el sistema informa "Se desactivó el plan Plan Plus."

  @RN-04 @D21
  Scenario Outline: Un plan inactivo no se puede elegir
    Given "Plan Plus" está "Inactivo"
    When el administrador intenta <acción>
    Then el sistema informa "El plan Plan Plus está inactivo y no se puede asignar."

    Examples:
      | acción                                                   |
      | asignar el plan "Plan Plus" a "Milo"                     |
      | cambiar el plan de "Rocco" a "Plan Plus"                 |

  @RN-02 @D21
  Scenario: Las mascotas que tienen el plan lo siguen usando
    Given "Plan Plus" está "Inactivo"
    And la cobertura de "Luna" está "Al día"
    When un veterinario registra una "Consulta" para "Luna"
    Then el consumo queda registrado

  @FA-02
  Scenario: El administrador cancela
    Given "Rocco" tiene un cambio pendiente al plan "Plan Plus"
    When el administrador elige desactivar "Plan Plus" y cancela
    Then "Plan Plus" sigue "Activo"
    And el cambio pendiente de "Rocco" sigue "Pendiente"

  @EX-01
  Scenario: El plan ya está inactivo
    Given el administrador "Jorge Paz" desactivó "Plan Plus"
    When "Marta Ruiz" intenta desactivar "Plan Plus"
    Then el sistema informa "El plan Plan Plus ya está inactivo."

  @RN-05 @D130
  Scenario: No se envían avisos a los dueños
    Given "Rocco" de "Pedro Sosa" tiene un cambio pendiente al plan "Plan Plus"
    When el administrador desactiva "Plan Plus" y confirma
    Then no se envía ningún email a "Pedro Sosa"

  @EX-02 @RNF-SEG-07 @D110
  Scenario: Solo el administrador desactiva planes
    Given el veterinario "Ana López" inició sesión
    When "Ana López" intenta desactivar "Plan Plus" sin usar la pantalla
    Then "Plan Plus" sigue "Activo"
    And el sistema informa "No tenés permiso para hacer esta operación."

  @EX-03 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces desactiva una sola vez
    When el administrador confirma la desactivación de "Plan Plus" y la misma confirmación se envía dos veces
    Then la auditoría registra una sola desactivación de "Plan Plus"
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PLA-03 | RN-01, EX-01 |
| RF-TRA-01, RNF-AUD-01 | Paso 6, RN-06 |
| RNF-INT-01 | EX-03 |
| RNF-SEG-07, D110 | EX-02 |
| D21 | RN-02, RN-04 |
| D22, D61 | Paso 2, RN-03 |
| D130 | RN-05 |
