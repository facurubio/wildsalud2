# CU-47 — Enviar aviso de vencimiento

| Campo | Valor |
|-------|-------|
| **Actor principal** | Sistema (proceso automático programado) |
| **Objetivo** | Avisarle por email al dueño que la cuota del mes de su mascota vence el día 13 y todavía no está paga. |
| **Disparador** | El día 11 de cada mes a las 09:00 (hora de Argentina). |
| **Relaciones** | La cuota se paga con CU-26. Si no se paga, la cobertura se suspende el 14 (CU-44) y se envía CU-48. En la aplicación, el dueño ve la alerta equivalente en CU-43. |

## Precondiciones

Ninguna.

## Flujo principal

1. El día 11 a las 09:00 se inicia el proceso.
2. El sistema busca las coberturas *Al día* que no tienen un pago válido del mes en curso (**RN-01**).
3. Para cada una, el sistema arma el email al dueño (**RN-03**) con: nombre de la mascota, número de afiliado, plan, importe de la cuota, fecha de vencimiento (13 del mes) y cómo pagar.
4. El sistema envía el email al email registrado del dueño.
5. El sistema registra el envío: mascota, dueño, tipo de aviso, canal (*email*), fecha y hora, y resultado (*Enviado* o *Fallido*).
6. El sistema registra el resultado de la ejecución: cantidad de avisos enviados y fallidos.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 2 | No hay cuotas impagas. | No se envía ningún aviso; se registra la ejecución con 0 envíos. |
| **FA-02** | 4 | El envío falla. | Se reintenta hasta 3 veces en las 24 horas siguientes (**RN-05**). Si el último intento falla, el envío queda *Fallido*. |
| **FA-03** | 4 | Entre el inicio del proceso y el envío, el dueño pagó la cuota. | No se envía el aviso de esa mascota. |
| **FA-04** | 1 | El proceso se ejecuta más de una vez para el mismo mes. | No se repiten avisos ya enviados para esa mascota y ese mes. |

## Excepciones

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **EX-01** | 1 a 6 | Falla el proceso completo. | Se registra el error y el proceso se reintenta; los avisos ya enviados no se repiten. |

## Postcondiciones

- **Éxito:** cada dueño con una cuota del mes impaga recibió un email por cada mascota en esa situación, y cada envío quedó registrado con su resultado.
- **Fracaso parcial:** los envíos fallidos quedan registrados como *Fallido*.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **A quién se avisa.** A los dueños de mascotas con cobertura *Al día* y la cuota del mes en curso impaga. Si la cuota ya está paga, no se envía. | RF-NOT-01, D17 |
| **RN-02** | **Cuándo.** El día 11 a las 09:00 (hora de Argentina), 48 horas antes del fin del plazo. | RF-NOT-01, D25, D53, D143 |
| **RN-03** | **Un aviso por mascota.** Si un dueño tiene varias mascotas con la cuota impaga, recibe un email por cada una. | D143 |
| **RN-04** | **Canal.** Solo email, al email registrado del dueño. El envío pasa por un mecanismo reemplazable, para poder sumar WhatsApp sin tocar el resto del sistema. | D43, RNF-ITG-01 |
| **RN-05** | **Registro y reintentos.** Cada envío queda registrado con su canal y su resultado. Si falla, se reintenta hasta 3 veces en 24 horas antes de quedar *Fallido*. Los envíos se consultan en el historial de auditoría (CU-36). | RF-NOT-03, RNF-DIS-02, D143 |
| **RN-06** | **Una sola vez.** Para una misma mascota y un mismo mes se envía un solo aviso de vencimiento. | RNF-INT-01 |
| **RN-07** | **Datos mínimos.** El email no incluye el DNI ni otros datos personales del dueño que no hagan falta. | RNF-LEG-01, RNF-SEG-01 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Envío de aviso | Mascota, dueño, tipo (*Vencimiento*), período, canal (*email*), email de destino, fecha y hora, cantidad de intentos y resultado (*Enviado* o *Fallido*). |
| Ejecución del proceso | Fecha y hora, avisos enviados y fallidos, errores. |

## Escenarios de aceptación

```gherkin
@CU-47
Feature: CU-47 Enviar aviso de vencimiento
  Como sistema
  Quiero avisarle al dueño que la cuota del mes está por vencer
  Para que pague antes de que se suspenda la cobertura

  Background:
    Given existe el plan "Plan Base" con precio mensual 10000
    And la dueña "Carla Gómez" tiene el email "carla.gomez@gmail.com"
    And "Carla Gómez" tiene la mascota "Luna" (afiliado "000123") con cobertura "Al día" y el plan "Plan Base"

  @flujo-principal @RF-NOT-01 @RF-NOT-03
  Scenario: Enviar el aviso cuando la cuota del mes está impaga
    Given la cuota de octubre 2026 de "Luna" está impaga
    When se ejecuta el proceso de aviso de vencimiento del "11/10/2026 09:00"
    Then se envía un email a "carla.gomez@gmail.com" con la mascota "Luna", el afiliado "000123", el importe 10000 y el vencimiento "13/10/2026"
    And el envío queda registrado con tipo "Vencimiento", canal "email" y resultado "Enviado"

  @RN-01 @RF-NOT-01
  Scenario: No se avisa si la cuota ya está paga
    Given la cuota de octubre 2026 de "Luna" está pagada
    When se ejecuta el proceso de aviso de vencimiento del "11/10/2026 09:00"
    Then no se envía ningún email a "carla.gomez@gmail.com"

  @RN-03 @D143
  Scenario: Un aviso por cada mascota con la cuota impaga
    Given "Carla Gómez" también tiene la mascota "Toby" con cobertura "Al día"
    And las cuotas de octubre 2026 de "Luna" y "Toby" están impagas
    When se ejecuta el proceso de aviso de vencimiento del "11/10/2026 09:00"
    Then se envían 2 emails a "carla.gomez@gmail.com", uno por "Luna" y otro por "Toby"

  @FA-02 @RN-05 @RNF-DIS-02 @D143
  Scenario Outline: Reintentos cuando falla el envío
    Given la cuota de octubre 2026 de "Luna" está impaga
    And el envío de email falla <fallas> veces seguidas
    When se ejecuta el proceso de aviso de vencimiento del "11/10/2026 09:00"
    Then el envío queda registrado con <intentos> intentos y resultado "<resultado>"

    Examples:
      | fallas | intentos | resultado |
      | 1      | 2        | Enviado   |
      | 4      | 4        | Fallido   |

  @FA-03
  Scenario: El dueño pagó justo antes del envío
    Given la cuota de octubre 2026 de "Luna" estaba impaga al iniciar el proceso
    And el pago de octubre 2026 de "Luna" se registró antes de enviar su aviso
    When se ejecuta el proceso de aviso de vencimiento del "11/10/2026 09:00"
    Then no se envía el aviso de "Luna"

  @FA-04 @RN-06 @RNF-INT-01
  Scenario: Ejecutar el proceso dos veces no repite avisos
    Given la cuota de octubre 2026 de "Luna" está impaga
    When se ejecuta el proceso de aviso de vencimiento del "11/10/2026 09:00" dos veces
    Then se envía un solo email por "Luna" para octubre 2026

  @FA-01
  Scenario: Sin cuotas impagas
    Given todas las cuotas de octubre 2026 están pagadas
    When se ejecuta el proceso de aviso de vencimiento del "11/10/2026 09:00"
    Then se registra la ejecución con 0 envíos

  @RN-07 @RNF-LEG-01
  Scenario: El email no incluye datos personales innecesarios
    Given la cuota de octubre 2026 de "Luna" está impaga
    When se ejecuta el proceso de aviso de vencimiento del "11/10/2026 09:00"
    Then el email enviado no incluye el DNI de "Carla Gómez"
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-NOT-01 | RN-01, RN-02 |
| RF-NOT-03 | Paso 5, RN-05 |
| RNF-DIS-02 | RN-05, FA-02, EX-01 |
| RNF-INT-01 | RN-06, FA-04 |
| RNF-ITG-01, D43 | RN-04 |
| RNF-LEG-01, RNF-SEG-01 | RN-07 |
| D17 | RN-01 |
| D25, D53 | RN-02 |
| D143 | RN-02, RN-03, RN-05 |
