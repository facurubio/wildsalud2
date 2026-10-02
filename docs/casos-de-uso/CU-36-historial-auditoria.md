# CU-36 — Consultar historial de auditoría

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Revisar quién hizo qué y cuándo en el sistema, con los valores anteriores y nuevos de cada cambio. |
| **Disparador** | El administrador necesita investigar un cambio (por ejemplo, un reclamo por un pago o una baja). |
| **Relaciones** | Muestra lo que registran todos los casos que modifican información y los procesos automáticos (CU-44 a CU-46). Desde las fichas (mascota, dueño, veterinario, plan) se puede abrir con el filtro de esa entidad. |

## Precondiciones

1. El administrador inició sesión (CU-02).

## Flujo principal

1. El administrador elige **Historial de auditoría**.
2. El sistema muestra los registros del más reciente al más antiguo, paginados de a 50. De cada registro: fecha y hora, usuario (o *Sistema*), acción, entidad afectada, valor anterior y valor nuevo, y motivo si lo hay.
3. El administrador puede filtrar por rango de fechas, usuario, tipo de acción y entidad (**RN-02**).
4. El administrador elige un registro y el sistema muestra su detalle completo.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 1 | Se abre desde la ficha de una entidad (mascota, dueño, veterinario, plan, pago o consumo). | El historial se muestra filtrado por esa entidad. |
| **FA-02** | 3 | No hay registros con esos filtros. | Se muestra *"No hay registros con esos filtros."* |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 3 | La fecha desde es posterior a la fecha hasta. | *"La fecha desde no puede ser posterior a la fecha hasta."* |
| **EX-02** | 1 | Un usuario que no es administrador intenta ver la auditoría. | *"No tenés permiso para hacer esta operación."* |
| **EX-03** | 4 | Alguien intenta modificar o borrar un registro de auditoría. | *"No tenés permiso para hacer esta operación."* El registro no cambia. |

## Postcondiciones

- **Éxito:** el administrador ve los registros de auditoría que cumplen los filtros.
- **Fracaso:** no se muestra ningún dato.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Qué se registra.** Altas, ediciones, bajas y reactivaciones de personas, mascotas y planes; suspensiones, reactivaciones y bajas de coberturas; cambios de plan; pagos y sus anulaciones y correcciones; consumos y sus correcciones y anulaciones; inicios y cierres de sesión, vinculaciones de cuenta y reenvíos de invitación. No se registran las consultas ni los intentos rechazados. | RF-TRA-01, RNF-AUD-01, D76, D85, D94, D71 |
| **RN-02** | **Filtros.** Rango de fechas, usuario (incluido *Sistema*), tipo de acción y entidad. Se combinan entre sí. | D141 |
| **RN-03** | **Inmodificable.** Los registros de auditoría no se pueden editar ni borrar, ni siquiera por el administrador. | RF-ROL-14, RNF-AUD-01 |
| **RN-04** | **Conservación.** Los registros se conservan mientras exista el sistema. | RNF-BAJ-02, D141 |
| **RN-05** | **Solo el administrador.** | RNF-SEG-02, D110 |

## Escenarios de aceptación

```gherkin
@CU-36
Feature: CU-36 Consultar historial de auditoría
  Como administrador
  Quiero revisar quién hizo qué y cuándo
  Para investigar cambios y reclamos

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00"
    And el administrador "Marta Ruiz" inició sesión
    And existen los registros de auditoría:
      | fecha y hora     | usuario    | acción                  | entidad          | anterior | nuevo    | motivo                   |
      | 14/10/2026 00:00 | Sistema    | Suspensión de cobertura | Toby (000124)    | Al día   | Suspendida |                        |
      | 15/10/2026 11:00 | Ana López  | Registro de consumo     | Luna (000123)    |          | Consulta |                          |
      | 16/10/2026 09:30 | Jorge Paz  | Anulación de pago       | Pago 2026-10 Luna | Válido  | Anulado  | Pago cargado por error   |
      | 18/10/2026 12:00 | Marta Ruiz | Edición de dueño        | Carla Gómez      | 11 5555-1234 | 11 6666-9876 |                  |

  @flujo-principal @RF-TRA-01 @RNF-AUD-01
  Scenario: Ver los registros del más reciente al más antiguo
    When el administrador abre el historial de auditoría
    Then ve primero el registro del "18/10/2026 12:00" de "Marta Ruiz" y último el del "14/10/2026 00:00" de "Sistema"
    And cada registro muestra fecha y hora, usuario, acción, entidad, valor anterior, valor nuevo y motivo

  @RN-02 @D141
  Scenario Outline: Filtrar la auditoría
    When el administrador filtra el historial de auditoría por <filtro>
    Then ve solo el registro del "<fecha>"

    Examples:
      | filtro                               | fecha            |
      | usuario "Sistema"                    | 14/10/2026 00:00 |
      | acción "Anulación de pago"           | 16/10/2026 09:30 |
      | fechas del "15/10/2026" al "15/10/2026" | 15/10/2026 11:00 |

  @FA-01
  Scenario: Abrir la auditoría desde la ficha de una mascota
    When el administrador abre el historial de auditoría desde la ficha de "Luna"
    Then ve los registros del "15/10/2026 11:00" y del "16/10/2026 09:30"

  @RN-03
  Scenario: La auditoría no se puede modificar
    When el administrador intenta borrar el registro del "16/10/2026 09:30" sin usar la pantalla
    Then el registro sigue existiendo sin cambios
    And el sistema informa "No tenés permiso para hacer esta operación."

  @RN-01 @D71
  Scenario: Las consultas no quedan en la auditoría
    Given la veterinaria "Ana López" abrió la ficha de "Luna" el "19/10/2026 10:00"
    When el administrador abre el historial de auditoría
    Then no hay ningún registro del "19/10/2026 10:00"

  @EX-01
  Scenario: Rango de fechas inválido
    When el administrador filtra el historial de auditoría del "18/10/2026" al "15/10/2026"
    Then el sistema informa "La fecha desde no puede ser posterior a la fecha hasta."

  @FA-02
  Scenario: Sin registros con esos filtros
    When el administrador filtra el historial de auditoría por usuario "Pablo Díaz"
    Then ve el mensaje "No hay registros con esos filtros."

  @EX-02 @RN-05 @D110
  Scenario: Solo el administrador ve la auditoría
    Given el veterinario "Ana López" inició sesión
    When "Ana López" intenta abrir el historial de auditoría
    Then no ve ningún dato
    And el sistema informa "No tenés permiso para hacer esta operación."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-TRA-01, RNF-AUD-01 | Paso 2, RN-01, RN-03 |
| RF-ROL-14 | RN-03, EX-03 |
| RNF-BAJ-02 | RN-04 |
| RNF-SEG-02, D110 | RN-05, EX-02 |
| D71, D76, D85, D94 | RN-01 |
| D141 | RN-02, RN-04 |
