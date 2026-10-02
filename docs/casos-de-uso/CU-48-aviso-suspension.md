# CU-48 — Enviar aviso de suspensión

| Campo | Valor |
|-------|-------|
| **Actor principal** | Sistema |
| **Objetivo** | Avisarle por email al dueño que la cobertura de su mascota se suspendió por falta de pago y qué tiene que pagar para reactivarla. |
| **Disparador** | Una cobertura se suspende: por el proceso del día 14 (CU-44) o por la anulación de un pago (CU-28). |
| **Relaciones** | Lo disparan CU-44 Suspender cobertura por falta de pago y CU-28 Anular pago. La reactivación se hace con CU-26. Un mes antes de la baja se envía CU-49. |

## Precondiciones

1. Una cobertura acaba de pasar a *Suspendida por falta de pago*.

## Flujo principal

1. El sistema recibe la suspensión de una cobertura.
2. El sistema arma el email al dueño con: nombre de la mascota, número de afiliado, fecha de suspensión, cuotas adeudadas, importe para reactivarla (todas las adeudadas más el mes en curso), fecha en que se dará de baja si no se regulariza y cómo pagar.
3. El sistema envía el email al email registrado del dueño, en el horario de **RN-02**.
4. El sistema registra el envío: mascota, dueño, tipo de aviso, canal, fecha y hora, y resultado.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | El envío falla. | Se reintenta hasta 3 veces en 24 horas. Si el último intento falla, queda *Fallido*. |
| **FA-02** | 3 | Antes del envío, la cobertura se reactivó (se pagó toda la deuda). | No se envía el aviso. |
| **FA-03** | 1 | La suspensión viene de la anulación de un pago (CU-28). | El aviso se envía igual, con la fecha de suspensión de la anulación. |

## Excepciones

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **EX-01** | 1 a 4 | Falla el proceso. | Se registra el error y se reintenta; el aviso no se duplica. |

## Postcondiciones

- **Éxito:** el dueño recibió un email por la suspensión y el envío quedó registrado con su resultado.
- **Fracaso:** el envío queda registrado como *Fallido*.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Cuándo se envía.** Cada vez que una cobertura pasa a *Suspendida por falta de pago*, por cualquier motivo. | D25, D36 |
| **RN-02** | **Horario.** Si la suspensión ocurre a la medianoche (CU-44), el aviso sale a las 09:00 de ese día. Si ocurre durante el día (CU-28), sale en el momento. | D143 |
| **RN-03** | **Importe para reactivar.** La suma de los períodos adeudados más el mes en curso, cada uno al precio de su mes. | D4, D6 |
| **RN-04** | **Fecha de baja.** Se informa la fecha en que se dará de baja la cobertura si no se regulariza: tres meses completos desde la suspensión. | D8 |
| **RN-05** | **Canal, registro y reintentos.** Solo email; cada envío queda registrado con su resultado; hasta 3 reintentos en 24 horas. | D43, RF-NOT-03, RNF-DIS-02, D143 |
| **RN-06** | **Una sola vez por suspensión.** Un mismo evento de suspensión genera un solo aviso. | RNF-INT-01 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Envío de aviso | Mascota, dueño, tipo (*Suspensión*), canal (*email*), email de destino, fecha y hora, intentos y resultado. |

## Escenarios de aceptación

```gherkin
@CU-48
Feature: CU-48 Enviar aviso de suspensión
  Como sistema
  Quiero avisarle al dueño que la cobertura de su mascota se suspendió
  Para que sepa cuánto pagar para reactivarla

  Background:
    Given existe el plan "Plan Base" con precio mensual 10000
    And la dueña "Carla Gómez" tiene el email "carla.gomez@gmail.com"
    And "Carla Gómez" tiene la mascota "Luna" (afiliado "000123") con el plan "Plan Base"

  @flujo-principal @D25 @RF-NOT-03 @D143
  Scenario: Aviso por la suspensión del día 14
    Given la cuota de octubre 2026 de "Luna" está impaga
    And la cobertura de "Luna" se suspendió el "14/10/2026 00:00"
    When llega el "14/10/2026 09:00"
    Then se envía un email a "carla.gomez@gmail.com" con la mascota "Luna", 1 cuota adeudada, importe para reactivar 10000 y fecha de baja "14/01/2027"
    And el envío queda registrado con tipo "Suspensión", canal "email" y resultado "Enviado"

  @FA-03 @RN-02 @D36
  Scenario: Aviso por una suspensión causada por la anulación de un pago
    Given el "20/10/2026 10:00" el administrador anuló el pago de octubre 2026 de "Luna" y la cobertura se suspendió
    When se procesa esa suspensión
    Then se envía en el momento un email a "carla.gomez@gmail.com" con fecha de suspensión "20/10/2026" y fecha de baja "20/01/2027"

  @RN-03 @D4 @D6
  Scenario: El importe para reactivar suma todas las cuotas adeudadas
    Given la cobertura de "Luna" se suspendió el "14/10/2026 00:00" y ya debía el período "2026-09"
    When llega el "14/10/2026 09:00"
    Then el email indica 2 cuotas adeudadas e importe para reactivar 20000

  @FA-02
  Scenario: Si se reactivó antes del envío, no se avisa
    Given la cobertura de "Luna" se suspendió el "14/10/2026 00:00"
    And el "14/10/2026 08:30" se registró el pago de toda la deuda de "Luna"
    When llega el "14/10/2026 09:00"
    Then no se envía el aviso de suspensión de "Luna"

  @FA-01 @RN-05 @RNF-DIS-02
  Scenario: El envío falla todas las veces
    Given la cobertura de "Luna" se suspendió el "14/10/2026 00:00"
    And el envío de email falla 4 veces seguidas
    When llega el "14/10/2026 09:00"
    Then el envío queda registrado con 4 intentos y resultado "Fallido"

  @RN-06 @RNF-INT-01
  Scenario: Una suspensión genera un solo aviso
    Given la cobertura de "Luna" se suspendió el "14/10/2026 00:00"
    And el proceso de suspensión se ejecutó dos veces
    When llega el "14/10/2026 09:00"
    Then se envía un solo aviso de suspensión de "Luna"
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-NOT-03 | Paso 4, RN-05 |
| RNF-DIS-02 | RN-05, FA-01, EX-01 |
| RNF-INT-01 | RN-06 |
| D4, D6 | RN-03 |
| D8 | RN-04 |
| D25, D36 | RN-01, FA-03 |
| D43 | RN-05 |
| D143 | RN-02, RN-05 |
