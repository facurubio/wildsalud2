# CU-26 — Registrar pago

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Registrar el pago de uno o más períodos adeudados de una mascota: de su cobertura vigente (reactivándola si se salda la deuda) o de la deuda congelada de una cobertura dada de baja. |
| **Disparador** | El dueño paga la cuota de su mascota (del mes en curso o adeudada) o la deuda de una cobertura anterior. |
| **Relaciones** | La mascota se ubica con CU-33 Buscar/filtrar. Los errores se corrigen con CU-28 Anular pago y CU-29 Corregir pago. El primer pago de una cobertura se registra en CU-22. La deuda congelada se origina en CU-24, CU-45, CU-46 o en la baja de la mascota o del dueño (CU-15, CU-10); una vez saldada, se puede usar CU-22 Asignar plan. Este caso incluye el antiguo CU-27 Registrar pago de deuda congelada. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. La mascota tiene una cobertura vigente (*Al día* o *Suspendida*) **o** deuda congelada de una cobertura *Dada de baja*. Nunca ocurren las dos cosas a la vez, porque la deuda congelada se paga antes de asignar un plan nuevo.

## Flujo principal

*Pago de la cobertura vigente.*

1. El administrador elige **Registrar pago** desde la ficha de la mascota.
2. El sistema muestra la mascota, su número de afiliado, el dueño, el plan, el estado de la cobertura y la lista de **períodos a pagar**: todos los impagos desde el más antiguo hasta el mes en curso inclusive, cada uno con su importe. Si la mascota no tiene cobertura vigente pero sí deuda congelada, el caso sigue por **FA-04**.
3. El administrador indica cuántos períodos paga (siempre consecutivos desde el más antiguo; por defecto, todos), la forma de pago (por defecto, la preferida del dueño) y la fecha de pago (por defecto, hoy).
4. El sistema muestra un resumen: períodos, importe de cada uno, total y cómo queda la cobertura después del pago.
5. El administrador confirma.
6. El sistema valida las reglas **RN-01 a RN-05** y **RN-08**.
7. El sistema registra **un pago por cada período**.
8. El sistema recalcula la antigüedad y el estado de la cobertura. Si no queda ningún período impago hasta el mes en curso inclusive, la cobertura queda **Al día** (reactivación, si estaba suspendida).
9. El sistema deja el registro de auditoría de cada pago y, si corresponde, de la reactivación.
10. El sistema confirma: *"Pago registrado. La cobertura de {mascota} está al día."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 8 y 10 | Con los períodos pagados todavía quedan impagos (se pagó solo una parte de la deuda). | La cobertura sigue *Suspendida*. El sistema confirma: *"Pago registrado. La cobertura de {mascota} sigue suspendida: falta pagar {N} períodos hasta {período actual}."* |
| **FA-02** | 3 | El administrador cambia la forma de pago propuesta. | Se registra la forma elegida; la preferida del dueño no cambia. |
| **FA-03** | 3 o 5 | El administrador cancela. | No se registra ningún pago. |
| **FA-04** | 2 | **Deuda congelada.** La mascota no tiene cobertura vigente, pero sí deuda congelada de una cobertura dada de baja. | El sistema muestra la cobertura dada de baja (plan, fecha y motivo de la baja) y la lista de **períodos congelados impagos** con su importe. Los pasos 3 a 7 son iguales, pero los pagos quedan asociados a la cobertura dada de baja, que **no se reactiva** y **no suma antigüedad**. El sistema confirma: *"Pago registrado. La deuda de {mascota} quedó saldada."* o, si todavía quedan períodos, *"Pago registrado. {mascota} todavía debe {N} períodos de su cobertura anterior."* |

## Excepciones

En todas las excepciones **no se registra ningún pago**, y el sistema informa el motivo.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 2 | La cobertura está vigente y no tiene períodos impagos hasta el mes en curso (el mes en curso ya está pago). | *"No hay períodos pendientes de pago para {mascota}. No se permiten pagos anticipados."* |
| **EX-02** | 2 | La mascota no tiene cobertura vigente ni deuda congelada. | *"{mascota} no tiene una cobertura vigente ni deuda pendiente."* |
| **EX-03** | 6 | La fecha de pago es posterior a hoy. | *"La fecha de pago no puede ser posterior a hoy."* |
| **EX-04** | 6 | Otro administrador registró el pago de alguno de los períodos mientras tanto. | *"El período {período} de {mascota} ya tiene un pago registrado."* |
| **EX-05** | 6 | Los períodos elegidos no empiezan por el más antiguo o no son consecutivos. | *"Los períodos se pagan en orden, empezando por {período más antiguo}."* |
| **EX-06** | 6 | La situación de la cobertura cambió entre que se mostró la pantalla y la confirmación (por ejemplo, se cumplió el plazo de baja por deuda). | *"La situación de la cobertura de {mascota} cambió. Revisá los períodos a pagar."* |
| **EX-07** | 5 | La misma confirmación llega dos veces. | Se registra **un solo** pago por período; el segundo envío devuelve el mismo resultado. |

## Postcondiciones

- **Éxito (cobertura vigente):** hay un pago *Válido* por cada período pagado, la antigüedad de la cobertura aumentó en la misma cantidad y el estado de la cobertura quedó recalculado. Si quedó *Al día* estando suspendida, la reactivación queda registrada.
- **Éxito (deuda congelada):** hay un pago *Válido* por cada período pagado, asociado a la cobertura dada de baja, que sigue *Dada de baja*. Si la deuda quedó en cero, la mascota puede recibir un plan nuevo (CU-22) y la deuda deja de bloquear al dueño.
- **Fracaso:** no se registra ningún pago y la cobertura no cambia.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Orden de pago.** Los períodos se pagan del más antiguo al más nuevo, sin saltear ninguno. Se pueden pagar varios en una sola operación. | D5, D28, D63 |
| **RN-02** | **Qué períodos se pagan.** Con cobertura vigente: los impagos hasta el mes en curso inclusive, nunca meses futuros. Con deuda congelada: solo los períodos congelados, es decir, los impagos vencidos antes del mes de la baja. | RF-PAG-06, D5, D27 |
| **RN-03** | **Un pago por período.** Cada período tiene como máximo un pago válido. Pagar varios períodos en una operación genera un pago por período. | RF-PAG-13, D63 |
| **RN-04** | **Importe completo y calculado.** El importe de cada período es el precio del plan que tenía la cobertura en ese mes, según la versión vigente el día 1 de ese mes. Lo calcula el sistema y no se edita. | RF-PAG-07, D6, D58 |
| **RN-05** | **Estado evaluado al confirmar.** La situación de la cobertura se evalúa en el momento de la confirmación: si ya se cumplió el plazo de baja por deuda, la cobertura está dada de baja y se paga como deuda congelada, aunque el proceso CU-45 no se haya ejecutado. | D8, D54 |
| **RN-06** | **Reactivación.** Una cobertura suspendida vuelve a *Al día* recién cuando no queda ningún período impago hasta el mes en curso inclusive, y en ese mismo momento. Pagar solo una parte de la deuda no la reactiva. Una cobertura dada de baja nunca se reactiva. | RF-PAG-05, D4, D5, D9 |
| **RN-07** | **Antigüedad.** Cada período pagado de una cobertura vigente suma 1 a su antigüedad, sin importar cuándo se pague. Los pagos de deuda congelada no suman antigüedad a ninguna cobertura nueva. | RF-PLA-11, D12, D28 |
| **RN-08** | **Datos del pago.** Cada pago guarda mascota, cobertura, período, fecha de pago, importe, forma de pago (la realmente usada, de la lista fija) y administrador. La fecha de pago puede ser anterior pero no posterior a hoy, y es informativa: la reactivación ocurre en el momento del registro. | RF-PAG-08, D7, D57, D59 |
| **RN-09** | **Independencia por mascota.** El pago y el estado de cobertura son de cada mascota: pagar la cuota de una mascota no afecta a las otras del mismo dueño. | RF-PAG-01, RF-PAG-02 |
| **RN-10** | **Desbloqueo.** Cuando la deuda congelada queda en cero, la mascota puede recibir un plan (CU-22) y el dueño deja de estar bloqueado por esa deuda. | D28, D29, D38, D55 |
| **RN-11** | **Deuda de mascota o dueño dados de baja.** La deuda congelada se puede pagar aunque la mascota o el dueño estén dados de baja. | D64 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Pago (uno por período) | Mascota, cobertura (vigente o dada de baja), período (`AAAA-MM`), fecha de pago, importe, forma de pago, administrador, fecha y hora de registro, estado *Válido*. |
| Cobertura vigente | Antigüedad (períodos pagos) y estado recalculados. Si se reactiva: fecha y hora de la reactivación. |
| Auditoría | Cada pago y, si corresponde, la reactivación. |

## Escenarios de aceptación

```gherkin
@CU-26
Feature: CU-26 Registrar pago
  Como administrador
  Quiero registrar los pagos adeudados de una mascota
  Para mantener su cobertura al día, reactivarla o saldar la deuda de una cobertura anterior

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And existe el plan "Plan Base" con precio mensual 10000
    And la dueña "Carla Gómez" tiene forma de pago preferida "Transferencia bancaria"
    And la mascota "Luna" pertenece a "Carla Gómez"

  @flujo-principal @RF-PAG-08 @RN-07
  Scenario: Pagar la cuota del mes en curso dentro del plazo
    Given la fecha y hora actual es "10/10/2026 10:00"
    And la cobertura de "Luna" con el plan "Plan Base" está "Al día" con 4 períodos pagos y la cuota de octubre 2026 impaga
    When el administrador registra el pago de "Luna" con los valores por defecto y confirma
    Then se registra un pago de "Luna" por el período "2026-10" con importe 10000 y forma de pago "Transferencia bancaria"
    And la cobertura de "Luna" está "Al día" con 5 períodos pagos
    And el sistema informa "Pago registrado. La cobertura de Luna está al día."

  @flujo-principal @RF-PAG-05 @D4 @RN-06
  Scenario: Pagar toda la deuda reactiva la cobertura en el momento
    Given la cobertura de "Luna" está "Suspendida por falta de pago" con los períodos "2026-09" y "2026-10" impagos
    When el administrador registra el pago de todos los períodos de "Luna" y confirma
    Then se registran 2 pagos de "Luna": "2026-09" y "2026-10"
    And la cobertura de "Luna" está "Al día"
    And la auditoría registra la reactivación de la cobertura de "Luna" el "20/10/2026 10:00"

  @FA-01 @D4 @D5 @D63
  Scenario: Pagar solo una parte de la deuda no reactiva la cobertura
    Given la cobertura de "Luna" está "Suspendida por falta de pago" con los períodos "2026-08", "2026-09" y "2026-10" impagos
    When el administrador registra el pago de 1 período de "Luna" y confirma
    Then se registra un pago de "Luna" por el período "2026-08"
    And la cobertura de "Luna" sigue "Suspendida por falta de pago"
    And el sistema informa "Pago registrado. La cobertura de Luna sigue suspendida: falta pagar 2 períodos hasta 2026-10."

  @RN-06 @D4
  Scenario: Para reactivar también hay que pagar el mes en curso aunque no haya vencido
    Given la fecha y hora actual es "05/11/2026 10:00"
    And la cobertura de "Luna" está "Suspendida por falta de pago" con el período "2026-10" impago
    When el administrador registra el pago de 1 período de "Luna" y confirma
    Then se registra un pago de "Luna" por el período "2026-10"
    And la cobertura de "Luna" sigue "Suspendida por falta de pago"
    And el período "2026-11" figura como pendiente de pago

  @RN-04 @D6
  Scenario Outline: Cada período se paga al precio de su mes
    Given la cobertura de "Luna" está "Suspendida por falta de pago" con los períodos "2026-09" y "2026-10" impagos
    And <condición>
    When el administrador registra el pago de todos los períodos de "Luna" y confirma
    Then el pago de "2026-09" tiene importe <importe 09> y el de "2026-10" tiene importe <importe 10>

    Examples:
      | condición                                                                        | importe 09 | importe 10 |
      | el precio de "Plan Base" pasó de 10000 a 12000 el 01/10/2026                     | 10000      | 12000      |
      | "Luna" pasó del plan "Plan Base" al plan "Plan Plus" de 15000 el 01/10/2026     | 10000      | 15000      |

  @FA-02 @D7
  Scenario: Cambiar la forma de pago propuesta no modifica la preferida
    Given la cobertura de "Luna" está "Al día" con la cuota de octubre 2026 impaga
    When el administrador registra el pago de "Luna" con forma de pago "Efectivo" y confirma
    Then el pago del período "2026-10" tiene forma de pago "Efectivo"
    And la forma de pago preferida de "Carla Gómez" sigue siendo "Transferencia bancaria"

  @FA-04 @D28 @RN-10
  Scenario: Saldar toda la deuda congelada
    Given la fecha y hora actual es "20/11/2026 10:00"
    And la cobertura de "Luna" fue dada de baja por deuda el "14/10/2026" con los períodos "2026-07", "2026-08" y "2026-09" congelados
    When el administrador registra el pago de todos los períodos de "Luna" y confirma
    Then se registran 3 pagos de "Luna": "2026-07", "2026-08" y "2026-09", asociados a la cobertura dada de baja
    And la cobertura dada de baja de "Luna" sigue "Dada de baja"
    And "Luna" no tiene deuda pendiente
    And el sistema informa "Pago registrado. La deuda de Luna quedó saldada."

  @FA-04 @D5 @D63
  Scenario: Pagar una parte de la deuda congelada
    Given la fecha y hora actual es "20/11/2026 10:00"
    And la cobertura de "Luna" fue dada de baja por deuda el "14/10/2026" con los períodos "2026-07", "2026-08" y "2026-09" congelados
    When el administrador registra el pago de 1 período de "Luna" y confirma
    Then se registra un pago de "Luna" por el período "2026-07"
    And el sistema informa "Pago registrado. Luna todavía debe 2 períodos de su cobertura anterior."

  @RN-02 @D27
  Scenario: El mes de la baja no forma parte de la deuda congelada
    Given la fecha y hora actual es "20/11/2026 10:00"
    And la cobertura de "Luna" fue dada de baja por deuda el "14/10/2026" con los períodos "2026-07" a "2026-10" impagos
    When el administrador elige registrar un pago de "Luna"
    Then los períodos a pagar son "2026-07", "2026-08" y "2026-09"
    And el período "2026-10" no figura como deuda

  @RN-07 @RN-10 @D28 @D29
  Scenario: Con la deuda congelada saldada se puede asignar un plan, sin antigüedad heredada
    Given la cobertura de "Luna" fue dada de baja con los períodos "2026-07" y "2026-08" congelados
    And el administrador registró el pago de todos los períodos congelados de "Luna"
    When el administrador asigna el plan "Plan Base" a "Luna" y confirma el pago
    Then "Luna" tiene una cobertura "Al día" con 1 período pago

  @FA-04 @RN-11 @D64
  Scenario: Se puede pagar la deuda congelada de una mascota dada de baja
    Given la fecha y hora actual es "20/11/2026 10:00"
    And "Luna" está dada de baja y su última cobertura quedó con el período "2026-08" congelado
    When el administrador registra el pago de todos los períodos de "Luna" y confirma
    Then se registra un pago de "Luna" por el período "2026-08"
    And "Carla Gómez" no tiene deuda pendiente

  @FA-04 @RN-05 @D8 @D54
  Scenario: Si ya venció el plazo de baja, se cobra como deuda congelada aunque el proceso no haya corrido
    Given la cobertura de "Luna" está suspendida desde el "14/07/2026 00:00" con los períodos "2026-07" a "2026-10" impagos
    And la fecha y hora actual es "14/10/2026 08:00"
    And el proceso de baja por deuda todavía no se ejecutó
    When el administrador elige registrar un pago de "Luna"
    Then el sistema muestra la cobertura como "Dada de baja" por deuda
    And los períodos a pagar son "2026-07", "2026-08" y "2026-09"

  @EX-01 @RF-PAG-06
  Scenario: No se permiten pagos anticipados
    Given la cobertura de "Luna" está "Al día" con la cuota de octubre 2026 pagada
    When el administrador intenta registrar un pago de "Luna"
    Then no se registra ningún pago
    And el sistema informa "No hay períodos pendientes de pago para Luna. No se permiten pagos anticipados."

  @EX-02
  Scenario: Mascota sin cobertura vigente ni deuda
    Given "Luna" no tiene cobertura vigente ni deuda congelada
    When el administrador intenta registrar un pago de "Luna"
    Then el sistema informa "Luna no tiene una cobertura vigente ni deuda pendiente."

  @EX-03 @RN-08 @D57
  Scenario: La fecha de pago no puede ser futura
    Given la cobertura de "Luna" está "Al día" con la cuota de octubre 2026 impaga
    When el administrador intenta registrar el pago de "Luna" con fecha de pago "21/10/2026"
    Then no se registra ningún pago
    And el sistema informa "La fecha de pago no puede ser posterior a hoy."

  @EX-04 @RF-PAG-13
  Scenario: Dos administradores registran a la vez el mismo período
    Given la cobertura de "Luna" está "Al día" con la cuota de octubre 2026 impaga
    And el administrador "Jorge Paz" también inició sesión
    When "Marta Ruiz" y "Jorge Paz" registran el pago del período "2026-10" de "Luna" al mismo tiempo
    Then se registra un solo pago válido por el período "2026-10"
    And el otro administrador recibe "El período 2026-10 de Luna ya tiene un pago registrado."

  @EX-05 @D5
  Scenario: Los períodos se pagan en orden
    Given la cobertura de "Luna" está "Suspendida por falta de pago" con los períodos "2026-09" y "2026-10" impagos
    When el administrador intenta registrar solo el pago del período "2026-10" de "Luna"
    Then no se registra ningún pago
    And el sistema informa "Los períodos se pagan en orden, empezando por 2026-09."

  @EX-06 @RN-05 @D54
  Scenario: La situación de la cobertura cambia antes de confirmar
    Given la cobertura de "Luna" está suspendida desde el "14/07/2026 00:00" con los períodos "2026-07" a "2026-10" impagos
    And el "13/10/2026 23:58" el administrador abrió el registro de pago de "Luna" con los períodos "2026-07" a "2026-10"
    When el administrador confirma el pago el "14/10/2026 00:01"
    Then no se registra ningún pago
    And el sistema informa "La situación de la cobertura de Luna cambió. Revisá los períodos a pagar."

  @EX-07 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces registra un solo pago
    Given la cobertura de "Luna" está "Al día" con la cuota de octubre 2026 impaga
    When el administrador confirma el pago de "Luna" y la misma confirmación se envía dos veces
    Then se registra un solo pago por el período "2026-10"

  @RN-09 @RF-PAG-02
  Scenario: El pago de una mascota no afecta a las otras del mismo dueño
    Given "Carla Gómez" también tiene la mascota "Toby" con cobertura "Suspendida por falta de pago"
    And la cobertura de "Luna" está "Al día" con la cuota de octubre 2026 impaga
    When el administrador registra el pago de "Luna" y confirma
    Then la cobertura de "Toby" sigue "Suspendida por falta de pago"
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PAG-01, RF-PAG-02 | RN-09 |
| RF-PAG-05 | Paso 8, RN-06 |
| RF-PAG-06 | RN-02, EX-01 |
| RF-PAG-07 | RN-04 |
| RF-PAG-08 | Paso 7, RN-08 |
| RF-PAG-09 | Actor principal |
| RF-PAG-13 | RN-03, EX-04 |
| RF-PLA-11 | RN-07 |
| RF-TRA-01, RNF-AUD-01 | Paso 9 |
| RNF-INT-01 | EX-07 |
| RNF-USA-01 | Paso 10 |
| RNF-USA-02, D63 | Paso 3 (varios períodos en una operación), RN-01 |
| D4, D5 | RN-01, RN-06, FA-01, EX-05 |
| D6, D58 | RN-04 |
| D7, D57, D59 | Paso 3, FA-02, RN-08 |
| D8, D54 | RN-05, EX-06 |
| D9, D12 | RN-06, RN-07 |
| D27 | RN-02 |
| D28, D29, D38, D55 | FA-04, RN-07, RN-10 |
| D64 | RN-11 |
