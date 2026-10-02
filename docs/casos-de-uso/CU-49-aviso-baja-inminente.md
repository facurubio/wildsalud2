# CU-49 — Enviar aviso de baja inminente

| Campo | Valor |
|-------|-------|
| **Actor principal** | Sistema (proceso automático programado) |
| **Objetivo** | Avisarle por email al dueño, un mes antes, que la cobertura de su mascota se va a dar de baja por deuda si no la regulariza. |
| **Disparador** | Todos los días a las 09:00 (hora de Argentina). |
| **Relaciones** | La baja la hace CU-45. Para evitarla se paga con CU-26. El día de la baja se envía CU-50. En la aplicación, el dueño ve la alerta equivalente en CU-43. |

## Precondiciones

Ninguna.

## Flujo principal

1. A las 09:00 se inicia el proceso.
2. El sistema busca las coberturas *Suspendidas por falta de pago* cuya fecha de baja (D8) es **dentro de un mes exacto**: el mismo día del mes siguiente.
3. Para cada una, arma el email al dueño con: nombre de la mascota, número de afiliado, fecha de baja, cuotas adeudadas, importe para reactivarla y cómo pagar. Aclara que si se da de baja, la deuda queda pendiente y la antigüedad se pierde.
4. El sistema envía el email al email registrado del dueño.
5. El sistema registra cada envío con su resultado y el resultado de la ejecución.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 2 | No hay coberturas a un mes de la baja. | No se envía ningún aviso; se registra la ejecución con 0 envíos. |
| **FA-02** | 4 | El envío falla. | Se reintenta hasta 3 veces en 24 horas; después queda *Fallido*. |
| **FA-03** | 1 | El proceso no corrió un día (por ejemplo, el servidor estuvo caído). | En la siguiente ejecución se envían los avisos que quedaron pendientes, si la baja todavía no ocurrió. |
| **FA-04** | 1 | El proceso se ejecuta más de una vez el mismo día. | No se repiten avisos. |

## Excepciones

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **EX-01** | 1 a 5 | Falla el proceso completo. | Se registra el error y se reintenta; los avisos ya enviados no se repiten. |

## Postcondiciones

- **Éxito:** cada dueño con una cobertura a un mes de la baja recibió un email, y cada envío quedó registrado con su resultado.
- **Fracaso parcial:** los envíos fallidos quedan registrados como *Fallido*.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Cuándo se avisa.** Un mes antes de la fecha de baja por deuda: si la cobertura se suspendió el 14/07, la baja es el 14/10 y el aviso sale el 14/09. Si el día no existe en el mes, el último día del mes. | D8, D25 |
| **RN-02** | **Horario.** A las 09:00 de ese día. | D143 |
| **RN-03** | **Un solo aviso por suspensión.** Cada período de suspensión genera un solo aviso de baja inminente. Si la cobertura se reactiva y vuelve a suspenderse, el nuevo período tiene su propio aviso. | RNF-INT-01 |
| **RN-04** | **Qué se informa.** Fecha de baja, cuotas e importe para reactivar (cada período al precio de su mes) y la consecuencia de la baja: la deuda queda congelada y una cobertura nueva empieza con antigüedad desde cero. | D4, D6, D9, D27 |
| **RN-05** | **Canal, registro y reintentos.** Solo email; cada envío queda registrado con su resultado; hasta 3 reintentos en 24 horas. | D43, RF-NOT-03, RNF-DIS-02, D143 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Envío de aviso | Mascota, dueño, tipo (*Baja inminente*), canal (*email*), email de destino, fecha y hora, intentos y resultado. |
| Ejecución del proceso | Fecha y hora, avisos enviados y fallidos, errores. |

## Escenarios de aceptación

```gherkin
@CU-49
Feature: CU-49 Enviar aviso de baja inminente
  Como sistema
  Quiero avisarle al dueño un mes antes de la baja por deuda
  Para que tenga tiempo de regularizar el pago

  Background:
    Given existe el plan "Plan Base" con precio mensual 10000
    And la dueña "Carla Gómez" tiene el email "carla.gomez@gmail.com"
    And "Carla Gómez" tiene la mascota "Luna" (afiliado "000123") con el plan "Plan Base"

  @flujo-principal @D25 @D8
  Scenario: Aviso un mes antes de la baja
    Given la cobertura de "Luna" está suspendida desde el "14/07/2026 00:00" con los períodos "2026-07" a "2026-09" impagos
    When se ejecuta el proceso de aviso de baja inminente del "14/09/2026 09:00"
    Then se envía un email a "carla.gomez@gmail.com" con la mascota "Luna" y fecha de baja "14/10/2026"
    And el email indica 3 cuotas adeudadas e importe para reactivar 30000
    And el envío queda registrado con tipo "Baja inminente" y resultado "Enviado"

  @RN-01 @D8
  Scenario Outline: El aviso sale exactamente un mes antes
    Given la cobertura de "Luna" está suspendida desde el "<suspensión>"
    When se ejecuta el proceso de aviso de baja inminente del "<ejecución>"
    Then <resultado>

    Examples:
      | suspensión       | ejecución        | resultado                                  |
      | 14/07/2026 00:00 | 13/09/2026 09:00 | no se envía el aviso de "Luna"             |
      | 14/07/2026 00:00 | 14/09/2026 09:00 | se envía el aviso de "Luna"                |
      | 30/11/2026 10:00 | 28/01/2027 09:00 | se envía el aviso de "Luna"                |

  @RN-03 @RNF-INT-01
  Scenario: No se repite el aviso
    Given la cobertura de "Luna" está suspendida desde el "14/07/2026 00:00"
    And el "14/09/2026 09:00" se envió el aviso de baja inminente de "Luna"
    When se ejecuta el proceso de aviso de baja inminente del "15/09/2026 09:00"
    Then no se envía otro aviso de "Luna"

  @RN-01
  Scenario: Una cobertura reactivada no recibe el aviso
    Given la cobertura de "Luna" estuvo suspendida desde el "14/07/2026 00:00" y se reactivó el "10/09/2026"
    When se ejecuta el proceso de aviso de baja inminente del "14/09/2026 09:00"
    Then no se envía el aviso de "Luna"

  @FA-03 @RNF-DIS-02
  Scenario: Un día sin ejecución no hace perder el aviso
    Given la cobertura de "Luna" está suspendida desde el "14/07/2026 00:00"
    And el proceso no se ejecutó el "14/09/2026"
    When se ejecuta el proceso de aviso de baja inminente del "15/09/2026 09:00"
    Then se envía el aviso de "Luna"

  @FA-02 @RN-05
  Scenario: El envío falla todas las veces
    Given la cobertura de "Luna" está suspendida desde el "14/07/2026 00:00"
    And el envío de email falla 4 veces seguidas
    When se ejecuta el proceso de aviso de baja inminente del "14/09/2026 09:00"
    Then el envío queda registrado con 4 intentos y resultado "Fallido"

  @FA-01
  Scenario: Sin coberturas a un mes de la baja
    Given ninguna cobertura tiene la baja dentro de un mes
    When se ejecuta el proceso de aviso de baja inminente del "14/09/2026 09:00"
    Then se registra la ejecución con 0 envíos
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-NOT-03 | Paso 5, RN-05 |
| RNF-DIS-02 | RN-05, FA-02, FA-03, EX-01 |
| RNF-INT-01 | RN-03, FA-04 |
| D4, D6, D9, D27 | RN-04 |
| D8, D25 | RN-01 |
| D43 | RN-05 |
| D143 | RN-02, RN-05 |
