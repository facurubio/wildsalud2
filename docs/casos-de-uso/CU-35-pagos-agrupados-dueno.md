# CU-35 — Consultar pagos agrupados por dueño

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Ver en un solo lugar los pagos de todas las mascotas de un dueño, con totales. |
| **Disparador** | El administrador necesita revisar la situación de pagos de un dueño con varias mascotas (por ejemplo, para explicarle qué debe). |
| **Relaciones** | Se llega desde la ficha del dueño (CU-33). Desde cada mascota se abre CU-34 Consultar historial de pagos por mascota. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El dueño existe (puede estar dado de baja).

## Flujo principal

1. El administrador elige **Pagos** en la ficha del dueño.
2. El sistema muestra un **resumen del dueño**: cantidad de mascotas, total pagado en el rango elegido y deuda total pendiente.
3. El sistema muestra, por cada **mascota actual** del dueño (incluidas las dadas de baja), sus pagos válidos en el rango, el subtotal y su deuda pendiente.
4. El administrador puede cambiar el rango de períodos (por defecto, los últimos 12 meses).
5. El administrador puede elegir una mascota para ver su historial completo (CU-34).

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | El dueño no tiene pagos en el rango. | Se muestra *"No hay pagos de {dueño} en ese período."* |
| **FA-02** | 3 | Hay pagos anulados en el rango. | No suman en los totales; se ven en el historial de cada mascota (CU-34). |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | La fecha de inicio del rango es posterior a la de fin. | *"El período desde no puede ser posterior al período hasta."* |
| **EX-02** | 1 | Un usuario que no es administrador intenta ver los pagos de un dueño. | *"No tenés permiso para hacer esta operación."* |

## Postcondiciones

- **Éxito:** el administrador ve los pagos y la deuda de todas las mascotas del dueño.
- **Fracaso:** no se muestra ningún dato.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Agrupados por dueño actual.** Los pagos no guardan el dueño: se muestran los de las mascotas que el dueño tiene **hoy**. Si una mascota cambió de dueño, todos sus pagos (también los anteriores al cambio) aparecen bajo el dueño nuevo. | RF-PAG-10, D121 |
| **RN-02** | **Totales con pagos válidos.** Los totales suman solo pagos válidos; los anulados no suman. | RF-PAG-12, D39 |
| **RN-03** | **Deuda.** La deuda de cada mascota son sus períodos impagos vencidos, de coberturas suspendidas o congelados, cada uno al precio de su mes. | D6, D38 |
| **RN-04** | **Mascotas dadas de baja.** Se incluyen, porque pueden tener pagos y deuda. | D115, RNF-BAJ-03 |
| **RN-05** | **Solo el administrador.** | RF-ROL-10, D110 |

## Escenarios de aceptación

```gherkin
@CU-35
Feature: CU-35 Consultar pagos agrupados por dueño
  Como administrador
  Quiero ver los pagos de todas las mascotas de un dueño
  Para entender su situación completa

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00"
    And el administrador "Marta Ruiz" inició sesión
    And "Carla Gómez" tiene las mascotas "Luna" y "Toby" con el plan "Plan Base" de 10000
    And "Luna" tiene pagos válidos de "2026-07" a "2026-10"
    And "Toby" tiene pagos válidos de "2026-07" y "2026-08" y los períodos "2026-09" y "2026-10" impagos, suspendido desde el "14/09/2026"

  @flujo-principal @RF-PAG-10 @RN-03
  Scenario: Ver los pagos y la deuda de un dueño
    When el administrador consulta los pagos de "Carla Gómez"
    Then ve:
      | mascota | pagos en el rango | subtotal | deuda |
      | Luna    | 4                 | 40000    | 0     |
      | Toby    | 2                 | 20000    | 20000 |
    And el total pagado es 60000 y la deuda total es 20000

  @RN-01 @D121
  Scenario: Una mascota que cambió de dueño lleva sus pagos al dueño nuevo
    Given el "15/10/2026" el administrador cambió el dueño de "Luna" a "Pedro Sosa"
    When el administrador consulta los pagos de "Pedro Sosa"
    Then ve los pagos de "Luna" de "2026-07" a "2026-10"
    And al consultar los pagos de "Carla Gómez" no ve a "Luna"

  @FA-02 @RN-02 @D39
  Scenario: Los pagos anulados no suman
    Given el pago de "2026-10" de "Luna" fue anulado
    When el administrador consulta los pagos de "Carla Gómez"
    Then el subtotal de "Luna" es 30000

  @RN-04 @D115
  Scenario: Las mascotas dadas de baja se incluyen con su deuda
    Given "Carla Gómez" tiene la mascota "Milo" dada de baja con el período "2026-06" congelado
    When el administrador consulta los pagos de "Carla Gómez"
    Then ve a "Milo" con deuda 10000

  @flujo-principal
  Scenario: Cambiar el rango de períodos
    When el administrador consulta los pagos de "Carla Gómez" de "2026-09" a "2026-10"
    Then ve 2 pagos de "Luna" y ninguno de "Toby"

  @EX-01
  Scenario: Rango inválido
    When el administrador consulta los pagos de "Carla Gómez" de "2026-10" a "2026-07"
    Then el sistema informa "El período desde no puede ser posterior al período hasta."

  @FA-01
  Scenario: Sin pagos en el rango
    When el administrador consulta los pagos de "Carla Gómez" de "2025-01" a "2025-03"
    Then ve el mensaje "No hay pagos de Carla Gómez en ese período."

  @EX-02 @RN-05 @D110
  Scenario: Solo el administrador ve los pagos
    Given el veterinario "Ana López" inició sesión
    When "Ana López" intenta ver los pagos de "Carla Gómez"
    Then no ve ningún dato
    And el sistema informa "No tenés permiso para hacer esta operación."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PAG-10 | Paso 3, RN-01 |
| RF-PAG-12, D39 | RN-02, FA-02 |
| RF-ROL-10, D110 | RN-05, EX-02 |
| RNF-BAJ-03, D115 | RN-04 |
| D6, D38 | RN-03 |
| D121 | RN-01 |
