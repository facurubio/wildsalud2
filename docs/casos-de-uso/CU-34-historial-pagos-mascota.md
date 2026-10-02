# CU-34 — Consultar historial de pagos por mascota

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Ver todos los pagos de una mascota, incluidos los anulados y los de coberturas anteriores, y su situación de deuda. |
| **Disparador** | El administrador necesita revisar qué pagó una mascota (por ejemplo, ante un reclamo del dueño). |
| **Relaciones** | Se llega desde la ficha de la mascota (CU-33). Desde un pago se inician CU-28 Anular pago y CU-29 Corregir pago; desde la deuda, CU-26 Registrar pago. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. La mascota existe (puede estar dada de baja).

## Flujo principal

1. El administrador elige **Historial de pagos** en la ficha de la mascota.
2. El sistema muestra un **resumen**: estado de cobertura, períodos pagos de la cobertura vigente y deuda pendiente (períodos e importe), si la hay.
3. El sistema muestra los **pagos** agrupados por cobertura, del más reciente al más antiguo. De cada pago: período, fecha de pago, importe, forma de pago, administrador que lo registró, fecha y hora de registro y estado (*Válido* o *Anulado*).
4. De los pagos anulados, el sistema muestra el motivo, quién lo anuló y, si fue una corrección, el pago que lo reemplazó.
5. El administrador puede filtrar por cobertura o por año.
6. El administrador puede elegir **Anular** (CU-28) o **Corregir** (CU-29) en un pago válido que no sea el primero de su cobertura.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | La mascota no tiene pagos. | Se muestra *"{mascota} no tiene pagos registrados."* |
| **FA-02** | 6 | El pago es el primero de su cobertura. | No se ofrecen Anular ni Corregir (D65). |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 1 | Un usuario que no es administrador intenta ver el historial de pagos (por ejemplo, un veterinario). | *"No tenés permiso para hacer esta operación."* |

## Postcondiciones

- **Éxito:** el administrador ve el historial completo de pagos de la mascota.
- **Fracaso:** no se muestra ningún dato.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Historial completo.** Se muestran todos los pagos de la mascota, de todas sus coberturas, incluidos los de deuda congelada. | RF-PAG-10 |
| **RN-02** | **Nada se oculta.** Los pagos anulados se muestran con su motivo y el enlace al pago que los corrigió, si lo hay. | RF-PAG-11, RF-PAG-12, D39 |
| **RN-03** | **Deuda.** El resumen muestra los períodos impagos vencidos y su importe total, cada uno al precio de su mes. | D6, D38 |
| **RN-04** | **Primer pago intocable.** El primer pago de cada cobertura no se puede anular ni corregir. | D65 |
| **RN-05** | **Solo el administrador.** El veterinario no ve información de pagos. El dueño no ve el historial de pagos (D74). | RF-ROL-10, D74, D110 |

## Escenarios de aceptación

```gherkin
@CU-34
Feature: CU-34 Consultar historial de pagos por mascota
  Como administrador
  Quiero ver todos los pagos de una mascota
  Para revisar su situación y corregir errores

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00"
    And el administrador "Marta Ruiz" inició sesión
    And "Luna" tuvo una cobertura con el plan "Plan Base" dada de baja por deuda el "14/03/2026", con pagos de "2025-10" a "2025-11"
    And "Luna" tiene una cobertura vigente desde el "05/05/2026", con pagos de "2026-05" a "2026-09"
    And el pago de "2026-08" se anuló con motivo "Forma de pago equivocada" y se reemplazó por otro

  @flujo-principal @RF-PAG-10 @RN-01
  Scenario: Ver todos los pagos agrupados por cobertura
    When el administrador consulta el historial de pagos de "Luna"
    Then ve los pagos de la cobertura vigente, de "2026-09" a "2026-05"
    And ve los pagos de la cobertura anterior, de "2025-11" a "2025-10"
    And cada pago muestra período, fecha de pago, importe, forma de pago, administrador y estado

  @RN-02 @RF-PAG-12 @D39
  Scenario: Los pagos anulados se muestran con su motivo
    When el administrador consulta el historial de pagos de "Luna"
    Then ve el pago anulado de "2026-08" con motivo "Forma de pago equivocada"
    And ve el enlace al pago que lo reemplazó

  @RN-03 @D38
  Scenario: El resumen muestra la deuda
    Given el período "2026-10" de "Luna" está impago y la cobertura está suspendida desde el "14/10/2026"
    When el administrador consulta el historial de pagos de "Luna"
    Then el resumen muestra "Suspendida por falta de pago" y deuda "2026-10" por 10000

  @FA-02 @RN-04 @D65
  Scenario: El primer pago de cada cobertura no se puede tocar
    When el administrador consulta el historial de pagos de "Luna"
    Then el pago de "2026-05" no ofrece "Anular" ni "Corregir"
    And el pago de "2026-09" ofrece "Anular" y "Corregir"

  @flujo-principal
  Scenario: Filtrar por año
    When el administrador consulta el historial de pagos de "Luna" del año 2025
    Then ve solo los pagos de "2025-10" y "2025-11"

  @FA-01
  Scenario: Mascota sin pagos
    Given la mascota "Mora" no tiene pagos
    When el administrador consulta el historial de pagos de "Mora"
    Then ve el mensaje "Mora no tiene pagos registrados."

  @EX-01 @RN-05 @RF-ROL-10 @D110
  Scenario: El veterinario no ve pagos
    Given el veterinario "Ana López" inició sesión
    When "Ana López" intenta ver el historial de pagos de "Luna"
    Then no ve ningún dato
    And el sistema informa "No tenés permiso para hacer esta operación."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PAG-10 | Paso 3, RN-01 |
| RF-PAG-11, RF-PAG-12, D39 | Paso 4, RN-02 |
| RF-ROL-10, D74, D110 | RN-05, EX-01 |
| D6, D38 | RN-03 |
| D65 | RN-04, FA-02 |
