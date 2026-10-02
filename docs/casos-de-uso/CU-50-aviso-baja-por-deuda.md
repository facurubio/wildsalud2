# CU-50 — Enviar aviso de baja por deuda

| Campo | Valor |
|-------|-------|
| **Actor principal** | Sistema |
| **Objetivo** | Avisarle por email al dueño que la cobertura de su mascota se dio de baja por deuda, cuánto quedó adeudado y cómo volver a tener cobertura. |
| **Disparador** | CU-45 da de baja una cobertura por deuda. |
| **Relaciones** | Lo dispara CU-45 Dar de baja cobertura por deuda. La deuda se paga con CU-26 y después se puede asignar un plan con CU-22. En la aplicación, el dueño ve la alerta equivalente en CU-43. |

## Precondiciones

1. Una cobertura acaba de pasar a *Dada de baja* con motivo *por deuda*.

## Flujo principal

1. El sistema recibe la baja por deuda de una cobertura.
2. El sistema arma el email al dueño con: nombre de la mascota, número de afiliado, fecha de baja, períodos que quedaron como deuda congelada con su importe total, y cómo volver a tener cobertura (pagar la deuda y contratar un plan nuevo, con antigüedad desde cero).
3. A las 09:00 de ese día, el sistema envía el email al email registrado del dueño.
4. El sistema registra el envío con su resultado.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | El envío falla. | Se reintenta hasta 3 veces en 24 horas; después queda *Fallido*. |

## Excepciones

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **EX-01** | 1 a 4 | Falla el proceso. | Se registra el error y se reintenta; el aviso no se duplica. |

## Postcondiciones

- **Éxito:** el dueño recibió un email por la baja y el envío quedó registrado con su resultado.
- **Fracaso:** el envío queda registrado como *Fallido*.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Cuándo se envía.** Solo por la **baja por deuda** (CU-45), el día de la baja. Las bajas voluntarias o por baja de la mascota o del dueño no envían este aviso. | D68, D99 |
| **RN-02** | **Horario.** A las 09:00 del día de la baja. | D143 |
| **RN-03** | **Qué se informa.** La deuda congelada (los períodos vencidos antes del mes de la baja, cada uno al precio de su mes) y cómo volver: pagar esa deuda (CU-26) y contratar un plan nuevo (CU-22), con antigüedad desde cero. | D6, D9, D27, D28 |
| **RN-04** | **Canal, registro y reintentos.** Solo email; cada envío queda registrado con su resultado; hasta 3 reintentos en 24 horas. | D43, RF-NOT-03, RNF-DIS-02, D143 |
| **RN-05** | **Una sola vez.** Cada baja genera un solo aviso. | RNF-INT-01 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Envío de aviso | Mascota, dueño, tipo (*Baja por deuda*), canal (*email*), email de destino, fecha y hora, intentos y resultado. |

## Escenarios de aceptación

```gherkin
@CU-50
Feature: CU-50 Enviar aviso de baja por deuda
  Como sistema
  Quiero avisarle al dueño que la cobertura se dio de baja por deuda
  Para que sepa cuánto debe y cómo volver a tener cobertura

  Background:
    Given existe el plan "Plan Base" con precio mensual 10000
    And la dueña "Carla Gómez" tiene el email "carla.gomez@gmail.com"
    And "Carla Gómez" tiene la mascota "Luna" (afiliado "000123") con el plan "Plan Base"

  @flujo-principal @D68 @D27
  Scenario: Aviso el día de la baja por deuda
    Given la cobertura de "Luna" se dio de baja por deuda el "14/10/2026 00:00" con los períodos "2026-07", "2026-08" y "2026-09" congelados
    When llega el "14/10/2026 09:00"
    Then se envía un email a "carla.gomez@gmail.com" con la mascota "Luna", fecha de baja "14/10/2026" y deuda de 3 cuotas por 30000
    And el email explica que para volver hay que pagar la deuda y contratar un plan nuevo, con antigüedad desde cero
    And el envío queda registrado con tipo "Baja por deuda" y resultado "Enviado"

  @RN-01 @D99
  Scenario Outline: Otras bajas no envían este aviso
    Given la cobertura de "Luna" se dio de baja con motivo "<motivo>" el "01/11/2026"
    When llega el "01/11/2026 09:00"
    Then no se envía el aviso de baja por deuda de "Luna"

    Examples:
      | motivo                  |
      | voluntaria              |
      | por baja de la mascota  |

  @FA-01 @RN-04 @RNF-DIS-02
  Scenario: El envío falla todas las veces
    Given la cobertura de "Luna" se dio de baja por deuda el "14/10/2026 00:00"
    And el envío de email falla 4 veces seguidas
    When llega el "14/10/2026 09:00"
    Then el envío queda registrado con 4 intentos y resultado "Fallido"

  @RN-05 @RNF-INT-01
  Scenario: Una baja genera un solo aviso
    Given la cobertura de "Luna" se dio de baja por deuda el "14/10/2026 00:00"
    And el proceso de baja por deuda se ejecutó dos veces
    When llega el "14/10/2026 09:00"
    Then se envía un solo aviso de baja por deuda de "Luna"
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-NOT-03 | Paso 4, RN-04 |
| RNF-DIS-02 | RN-04, FA-01, EX-01 |
| RNF-INT-01 | RN-05 |
| D6, D9, D27, D28 | RN-03 |
| D43 | RN-04 |
| D68, D99 | RN-01 |
| D143 | RN-02, RN-04 |
