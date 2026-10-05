# CU-29 — Corregir pago

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Corregir un pago registrado con datos incorrectos, anulando el original y registrando uno nuevo enlazado, en una sola operación. |
| **Disparador** | El administrador detecta un error en la fecha de pago o en la forma de pago de un pago. |
| **Relaciones** | Incluye CU-28 Anular pago (`«include»`) y las reglas de registro de CU-26 Registrar pago. Si el pago se cargó a la mascota equivocada no se usa este caso: se anula en esa mascota (CU-28) y se registra en la correcta (CU-26). |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El pago existe, está *Válido* y no es el primer pago de su cobertura.

## Flujo principal

1. El administrador elige **Corregir** sobre un pago del historial de la mascota.
2. El sistema muestra los datos actuales del pago y permite cambiar **fecha de pago** y **forma de pago**. La mascota no se puede cambiar.
3. El administrador cambia los datos que correspondan y escribe el **motivo** de la corrección.
4. El sistema muestra el resumen: pago original y pago nuevo, de la misma mascota, el mismo período y el mismo importe.
5. El administrador confirma.
6. El sistema valida las reglas **RN-01 a RN-03** y **RN-05**.
7. En una sola operación, el sistema **anula** el pago original con el motivo (CU-28) y **registra** el pago nuevo, enlazado al anulado.
8. La cobertura de la mascota no cambia: sigue con la misma antigüedad y el mismo estado.
9. El sistema deja el registro de auditoría con el valor anterior, el valor nuevo, el motivo, el administrador, y la fecha y hora.
10. El sistema confirma: *"Pago corregido."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 o 5 | El administrador cancela. | El pago original sigue *Válido* y no se registra nada. |

## Excepciones

En todas las excepciones **no se anula ni se registra nada**: el pago original sigue *Válido*.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 6 | No se escribió un motivo. | *"Indicá el motivo de la corrección."* |
| **EX-02** | 6 | No se cambió ningún dato. | *"No hay cambios para corregir."* |
| **EX-03** | 6 | La fecha de pago nueva es posterior a hoy. | *"La fecha de pago no puede ser posterior a hoy."* |
| **EX-04** | 6 | El pago ya fue anulado o corregido por otro administrador. | *"El pago ya está anulado."* |
| **EX-05** | 5 | La misma confirmación llega dos veces. | La corrección se aplica **una sola** vez. |
| **EX-06** | 1 | El pago es el primero de la cobertura. | *"No se puede corregir el primer pago de una cobertura."* |

## Postcondiciones

- **Éxito:** el pago original queda *Anulado* con motivo y enlazado al pago nuevo, que queda *Válido*, de la misma mascota y el mismo período. La cobertura no cambia de antigüedad ni de estado.
- **Fracaso:** el pago original sigue *Válido* y no cambia ninguna cobertura.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Corrección = anulación + pago nuevo.** El pago no se edita: se anula el original y se registra uno nuevo enlazado. Las dos cosas ocurren juntas o no ocurre ninguna. | RF-PAG-11, RF-PAG-12, D39 |
| **RN-02** | **Qué se puede corregir.** Solo la fecha de pago y la forma de pago. La **mascota no se cambia**: la corrección es sobre el pago de cada mascota. Si el pago se cargó a la mascota equivocada, se anula (CU-28) y se registra en la correcta (CU-26). | D66 |
| **RN-03** | **Misma mascota, mismo período, mismo importe.** El pago nuevo es de la misma mascota, el mismo período y el mismo importe que el anulado; no se eligen ni se recalculan. Como la operación es única, la cobertura **no pasa por suspendida** en el medio y nunca hay dos pagos válidos del mismo período. | RF-PAG-13, D39, D54 |
| **RN-04** | **Auditoría completa.** Se registra el valor anterior, el valor nuevo, el administrador, la fecha y hora y el motivo. | RF-PAG-11, RF-ROL-13, RNF-INT-03 |
| **RN-05** | **El primer pago no se corrige.** El primer pago de una cobertura (el que se registró al asignar el plan) no se puede corregir de ninguna manera. | D65 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Pago original | Estado *Anulado*, motivo, administrador, fecha y hora, referencia al pago nuevo. |
| Pago nuevo | Datos completos del pago (como en CU-26) y referencia al pago que corrige. |
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

  @RN-02 @D66
  Scenario: La corrección no permite cambiar la mascota
    When el administrador elige corregir el pago del período "2026-10" de "Luna"
    Then puede cambiar la fecha de pago y la forma de pago
    And no puede cambiar la mascota del pago

  @EX-01
  Scenario: El motivo es obligatorio
    When el administrador intenta corregir la forma de pago del pago del período "2026-10" de "Luna" sin motivo
    Then el pago original sigue "Válido"
    And el sistema informa "Indicá el motivo de la corrección."

  @EX-02
  Scenario: Sin cambios no hay corrección
    When el administrador intenta corregir el pago del período "2026-10" de "Luna" sin cambiar ningún dato, con motivo "Revisión"
    Then el sistema informa "No hay cambios para corregir."

  @EX-03
  Scenario: La fecha de pago nueva no puede ser futura
    When el administrador intenta corregir la fecha de pago del período "2026-10" de "Luna" a "25/10/2026" con motivo "Fecha mal cargada"
    Then el pago original sigue "Válido"
    And el sistema informa "La fecha de pago no puede ser posterior a hoy."

  @EX-06 @RN-05 @D65
  Scenario Outline: El primer pago de una cobertura no se corrige
    Given la cobertura de "Luna" se creó el "15/05/2026" con el pago del período "2026-05"
    When el administrador intenta corregir el pago del período "2026-05" de "Luna" cambiando <dato> con motivo "Error de carga"
    Then el pago sigue "Válido" sin cambios
    And el sistema informa "No se puede corregir el primer pago de una cobertura."

    Examples:
      | dato                                   |
      | la fecha de pago a "14/05/2026"        |
      | la forma de pago a "Tarjeta de débito" |

  @EX-05 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces corrige una sola vez
    When el administrador confirma la corrección de la forma de pago del período "2026-10" de "Luna" y la misma confirmación se envía dos veces
    Then existe un solo pago válido del período "2026-10" de "Luna"
    And existe un solo pago anulado del período "2026-10" de "Luna"
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PAG-11 | Pasos 3 y 9, RN-01, RN-04 |
| RF-PAG-12 | RN-01 |
| RF-PAG-13 | RN-03 |
| RF-ROL-12 | Actor principal |
| RF-ROL-13 | RN-04 |
| RF-TRA-01, RNF-AUD-01 | Paso 9 |
| RNF-INT-01 | EX-05 |
| RNF-INT-03 | RN-04 |
| D39 | RN-01, RN-03 |
| D54 | RN-03 |
| D65 | RN-05, EX-06 |
| D66 | Paso 2, RN-02 |
