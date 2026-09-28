# CU-29 — Corregir pago

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Corregir un pago registrado con datos incorrectos, anulando el original y registrando uno nuevo enlazado, en una sola operación. |
| **Disparador** | El administrador detecta un error en un pago: fecha de pago, forma de pago o mascota equivocada. |
| **Relaciones** | Incluye CU-28 Anular pago (`«include»`) y las reglas de registro de CU-26 Registrar pago (incluido el pago de deuda congelada). |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El pago existe, está *Válido* y no es el primer pago de su cobertura.

## Flujo principal

1. El administrador elige **Corregir** sobre un pago del historial de la mascota.
2. El sistema muestra los datos actuales del pago y permite cambiar **fecha de pago**, **forma de pago** y **mascota**.
3. El administrador cambia los datos que correspondan y escribe el **motivo** de la corrección.
4. El sistema muestra el resumen: pago original, pago nuevo (con el período y el importe que calcula el sistema) y cómo quedan las coberturas afectadas.
5. El administrador confirma.
6. El sistema valida las reglas **RN-01 a RN-04** y **RN-06**.
7. En una sola operación, el sistema **anula** el pago original con el motivo (CU-28) y **registra** el pago nuevo, enlazado al anulado.
8. El sistema recalcula la antigüedad y el estado de las coberturas afectadas.
9. El sistema deja el registro de auditoría con el valor anterior, el valor nuevo, el motivo, el administrador, y la fecha y hora.
10. El sistema confirma: *"Pago corregido."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | Se cambia la **mascota** (el pago se había cargado a otra mascota). | El pago original se anula en la mascota A, con los efectos de CU-28 (puede suspenderla), y el nuevo se registra en la mascota B por **su** período más antiguo impago, con el importe de B. El resumen del paso 4 muestra cómo quedan las dos coberturas. |
| **FA-02** | 3 o 5 | El administrador cancela. | El pago original sigue *Válido* y no se registra nada. |

## Excepciones

En todas las excepciones **no se anula ni se registra nada**: el pago original sigue *Válido*.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 6 | No se escribió un motivo. | *"Indicá el motivo de la corrección."* |
| **EX-02** | 6 | No se cambió ningún dato. | *"No hay cambios para corregir."* |
| **EX-03** | 6 | La mascota nueva no tiene períodos pendientes de pago. | *"No hay períodos pendientes de pago para {mascota}. No se permiten pagos anticipados."* |
| **EX-04** | 6 | La mascota nueva no tiene cobertura vigente ni deuda congelada. | *"{mascota} no tiene una cobertura vigente ni deuda pendiente."* |
| **EX-05** | 6 | La fecha de pago nueva es posterior a hoy. | *"La fecha de pago no puede ser posterior a hoy."* |
| **EX-06** | 6 | El pago ya fue anulado o corregido por otro administrador. | *"El pago ya está anulado."* |
| **EX-07** | 5 | La misma confirmación llega dos veces. | La corrección se aplica **una sola** vez. |
| **EX-08** | 1 | El pago es el primero de la cobertura. | *"No se puede corregir el primer pago de una cobertura."* |

## Postcondiciones

- **Éxito:** el pago original queda *Anulado* con motivo y enlazado al pago nuevo, que queda *Válido*. Las coberturas afectadas quedan con la antigüedad y el estado recalculados.
- **Fracaso:** el pago original sigue *Válido* y no cambia ninguna cobertura.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Corrección = anulación + pago nuevo.** El pago no se edita: se anula el original y se registra uno nuevo enlazado. Las dos cosas ocurren juntas o no ocurre ninguna. | RF-PAG-11, RF-PAG-12, D39 |
| **RN-02** | **Qué se puede corregir.** Fecha de pago, forma de pago y mascota. El período y el importe no se eligen: los calcula el sistema con las reglas de CU-26 (período más antiguo impago, precio de ese mes). | D5, D6, D58, D66 |
| **RN-03** | **Misma mascota, mismo período.** Si no se cambia la mascota, el pago nuevo es del mismo período que el anulado. Como la operación es única, la cobertura **no pasa por suspendida** en el medio. | D39, D54 |
| **RN-04** | **Reglas de pago para la mascota nueva.** Si se cambia la mascota, el pago nuevo tiene que cumplir todas las reglas de CU-26, incluido el flujo de deuda congelada si la mascota nueva solo tiene deuda congelada. | RF-PAG-06, RF-PAG-13, D5 |
| **RN-05** | **Auditoría completa.** Se registra el valor anterior, el valor nuevo, el administrador, la fecha y hora y el motivo. | RF-PAG-11, RF-ROL-13, RNF-INT-03 |
| **RN-06** | **El primer pago no se corrige.** El primer pago de una cobertura (el que se registró al asignar el plan) no se puede corregir de ninguna manera. | D65 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Pago original | Estado *Anulado*, motivo, administrador, fecha y hora, referencia al pago nuevo. |
| Pago nuevo | Datos completos del pago (como en CU-26) y referencia al pago que corrige. |
| Coberturas | Antigüedad y estado recalculados de la o las coberturas afectadas. |
| Auditoría | Valor anterior, valor nuevo, motivo, administrador, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-29
Feature: CU-29 Corregir pago
  Como administrador
  Quiero corregir un pago registrado con datos incorrectos
  Para que el historial sea correcto sin perder el registro original

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And existe el plan "Plan Base" con precio mensual 10000
    And la mascota "Luna" de "Carla Gómez" tiene una cobertura "Al día" con 5 períodos pagos
    And el período "2026-10" de "Luna" tiene un pago válido con forma de pago "Efectivo" y fecha de pago "12/10/2026"

  @flujo-principal @RN-01 @RN-03 @D39
  Scenario: Corregir la forma de pago
    When el administrador corrige el pago del período "2026-10" de "Luna" con forma de pago "Transferencia bancaria" y motivo "Se cargó mal la forma de pago"
    Then el pago original queda "Anulado" con motivo "Se cargó mal la forma de pago"
    And existe un pago válido del período "2026-10" de "Luna" con forma de pago "Transferencia bancaria", enlazado al anulado
    And la cobertura de "Luna" sigue "Al día" con 5 períodos pagos
    And la auditoría registra valor anterior "Efectivo", valor nuevo "Transferencia bancaria", usuario "Marta Ruiz" y el motivo
    And el sistema informa "Pago corregido."

  @RN-03 @D54
  Scenario: Corregir un pago de un período vencido no suspende la cobertura en el medio
    When el administrador corrige la fecha de pago del período "2026-10" de "Luna" a "11/10/2026" con motivo "Fecha mal cargada"
    Then la cobertura de "Luna" nunca figura como "Suspendida por falta de pago"
    And la auditoría no registra ninguna suspensión de "Luna"

  @FA-01 @RN-04
  Scenario: El pago se había cargado a otra mascota
    Given "Carla Gómez" también tiene la mascota "Toby" con cobertura "Al día" y la cuota de octubre 2026 impaga
    When el administrador corrige el pago del período "2026-10" de "Luna" cambiando la mascota a "Toby" con motivo "Mascota equivocada"
    Then el pago de "Luna" queda "Anulado"
    And la cobertura de "Luna" queda "Suspendida por falta de pago" desde el "20/10/2026 10:00"
    And existe un pago válido del período "2026-10" de "Toby", enlazado al anulado

  @EX-01
  Scenario: El motivo es obligatorio
    When el administrador intenta corregir la forma de pago del pago del período "2026-10" de "Luna" sin motivo
    Then el pago original sigue "Válido"
    And el sistema informa "Indicá el motivo de la corrección."

  @EX-02
  Scenario: Sin cambios no hay corrección
    When el administrador intenta corregir el pago del período "2026-10" de "Luna" sin cambiar ningún dato, con motivo "Revisión"
    Then el sistema informa "No hay cambios para corregir."

  @EX-03 @RF-PAG-06
  Scenario: La mascota nueva no tiene nada que pagar
    Given "Carla Gómez" también tiene la mascota "Toby" con cobertura "Al día" y la cuota de octubre 2026 pagada
    When el administrador intenta corregir el pago del período "2026-10" de "Luna" cambiando la mascota a "Toby" con motivo "Mascota equivocada"
    Then el pago de "Luna" sigue "Válido"
    And el sistema informa "No hay períodos pendientes de pago para Toby. No se permiten pagos anticipados."

  @EX-05
  Scenario: La fecha de pago nueva no puede ser futura
    When el administrador intenta corregir la fecha de pago del período "2026-10" de "Luna" a "25/10/2026" con motivo "Fecha mal cargada"
    Then el pago original sigue "Válido"
    And el sistema informa "La fecha de pago no puede ser posterior a hoy."

  @EX-08 @RN-06 @D65
  Scenario Outline: El primer pago de una cobertura no se corrige
    Given la cobertura de "Luna" se creó el "15/05/2026" con el pago del período "2026-05"
    When el administrador intenta corregir el pago del período "2026-05" de "Luna" cambiando <dato> con motivo "Error de carga"
    Then el pago sigue "Válido" sin cambios
    And el sistema informa "No se puede corregir el primer pago de una cobertura."

    Examples:
      | dato                                   |
      | la fecha de pago a "14/05/2026"        |
      | la forma de pago a "Tarjeta de débito" |
      | la mascota a "Toby"                    |

  @EX-07 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces corrige una sola vez
    When el administrador confirma la corrección de la forma de pago del período "2026-10" de "Luna" y la misma confirmación se envía dos veces
    Then existe un solo pago válido del período "2026-10" de "Luna"
    And existe un solo pago anulado del período "2026-10" de "Luna"
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PAG-06 | RN-04, EX-03 |
| RF-PAG-11 | Pasos 3 y 9, RN-01, RN-05 |
| RF-PAG-12 | RN-01 |
| RF-PAG-13 | RN-04 |
| RF-ROL-12 | Actor principal |
| RF-ROL-13 | RN-05 |
| RF-TRA-01, RNF-AUD-01 | Paso 9 |
| RNF-INT-01 | EX-07 |
| RNF-INT-03 | RN-05 |
| D5, D6 | RN-02, RN-04 |
| D39 | RN-01, RN-03 |
| D54 | RN-03 |
| D65 | RN-06, EX-08 |
| D66 | RN-02 |
