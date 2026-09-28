# CU-39 — Registrar consumo

| Campo | Valor |
|-------|-------|
| **Actor principal** | Veterinario asociado |
| **Objetivo** | Registrar el uso de una prestación del plan de una mascota durante la atención, descontándola de su saldo. |
| **Disparador** | El veterinario atiende a una mascota afiliada y le brinda una prestación cubierta por el plan (consulta, vacuna, radiografía, etc.). |
| **Relaciones** | Se inicia desde CU-38 Consultar ficha y cobertura. Las correcciones y anulaciones las hace el administrador en CU-30 y CU-31. La alerta de agotamiento se muestra al dueño en CU-43. |

## Precondiciones

1. El veterinario inició sesión y su cuenta está **Activa** (CU-02).
2. El veterinario identificó a la mascota (CU-37) y está viendo su ficha (CU-38).

## Flujo principal

1. El veterinario elige **Registrar consumo** desde la ficha de la mascota.
2. El sistema muestra las prestaciones del plan vigente de la mascota, cada una con su estado:
   - **Disponible**, con el saldo del período (mes o año), o **Ilimitada**.
   - **Agotada** en el período.
   - **No habilitada todavía**, con la cantidad de períodos pagos que faltan.

   Solo las prestaciones disponibles se pueden elegir.
3. El veterinario elige una prestación disponible.
4. El sistema pide confirmación y muestra la mascota, su número de afiliado, la prestación y el saldo actual.
5. El veterinario confirma.
6. El sistema valida las reglas **RN-01 a RN-05** en el momento de la confirmación.
7. El sistema registra el consumo con los datos de RN-06.
8. El sistema recalcula el saldo de la prestación y deja el registro de auditoría.
9. El sistema confirma el registro y muestra el saldo restante del período.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 9 | El consumo agota la prestación en el período. | El sistema confirma el registro y muestra la alerta *"Se agotó {prestación} para el período {período}"*. La alerta queda visible para el dueño (CU-43). |
| **FA-02** | 2 y 9 | La prestación no tiene límite. | Se muestra **Ilimitada** en lugar de un saldo numérico. |
| **FA-03** | 3 o 5 | El veterinario cancela. | No se registra nada y el sistema vuelve a la ficha. |

## Excepciones

En todas las excepciones **el consumo no se registra**, el sistema informa el motivo y vuelve a la ficha (RF-PRE-08). Aunque el paso 2 ya oculta las opciones inválidas, el sistema vuelve a validar al confirmar (RNF-SEG-07), porque el estado puede cambiar entre que se muestra la pantalla y la confirmación.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 6 | La cobertura está suspendida por falta de pago. | *"La cobertura de {mascota} está suspendida por falta de pago."* |
| **EX-02** | 6 | La mascota no tiene cobertura vigente (plan dado de baja, sin plan o mascota dada de baja). | *"{mascota} no tiene una cobertura vigente."* |
| **EX-03** | 6 | La prestación no está incluida en el plan vigente. | *"{prestación} no está incluida en el plan {plan}."* |
| **EX-04** | 6 | La prestación todavía no está habilitada por antigüedad. | *"{prestación} se habilita con {N} períodos pagos; {mascota} tiene {M}."* |
| **EX-05** | 6 | No queda saldo de la prestación en el período. | *"{prestación} está agotada para el período {período}."* |
| **EX-06** | 5 | La misma confirmación llega dos veces (doble clic o reintento de red). | Se registra **un solo** consumo; el segundo envío devuelve el mismo resultado que el primero. |
| **EX-07** | 6 | Dos veterinarios registran a la vez la última unidad disponible. | Solo uno se registra; el otro recibe el mensaje de EX-05. |
| **EX-08** | 6 | La cuenta del veterinario fue desactivada mientras tenía la sesión abierta. | *"Tu cuenta está inactiva. Comunicate con el administrador."* |

## Postcondiciones

- **Éxito:** el consumo queda registrado, el saldo de la prestación queda actualizado para el veterinario, el dueño (CU-41) y el administrador, y la operación queda en el historial de auditoría (CU-36).
- **Fracaso:** no se registra ningún consumo ni cambia ningún saldo. Los intentos rechazados no quedan en el historial de auditoría.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Cobertura activa.** La cobertura debe estar *Al día* en la fecha y hora del registro. Del día 1 al 13 sigue al día aunque la cuota del mes no esté paga; desde las 00:00 del día 14 sin pago del mes está suspendida. El estado se calcula con la fecha y hora del registro, sin depender de que el proceso automático CU-44 ya se haya ejecutado. | RF-PRE-04, RF-PAG-03, RF-PAG-04, D1, D17, D54 |
| **RN-02** | **Prestación incluida.** La prestación tiene que estar en la versión del plan vigente en esa fecha. Un cambio de plan o una versión nueva rige desde el día 1 del mes siguiente. | RF-PRE-05, RF-PLA-06, RF-PLA-16, D1 |
| **RN-03** | **Habilitación por antigüedad.** Los períodos pagos de la cobertura tienen que ser iguales o mayores que los requeridos por la prestación. La antigüedad se conserva al cambiar de plan. | RF-PRE-06, RF-PLA-09, RF-PLA-14, D11, D12 |
| **RN-04** | **Saldo disponible.** Saldo = límite del plan vigente − consumos válidos del período (mes calendario o año calendario, según la prestación). Los consumos del año hechos con un plan anterior también cuentan. Límite vacío = ilimitada. El saldo nunca es negativo: si un plan nuevo tiene un límite menor que lo ya consumido, el saldo es 0. | RF-PRE-02, RF-PRE-07, RNF-INT-02, D30, D32 |
| **RN-05** | **Orden de validación.** Se valida: cuenta activa → RN-01 → RN-02 → RN-03 → RN-04, y se informa el **primer** motivo que falla. | RF-PRE-08 |
| **RN-06** | **Datos del consumo.** La fecha y hora es el momento del registro y no se puede elegir. Se guarda una copia de la veterinaria del veterinario en ese momento. El consumo no lleva observaciones del veterinario, porque la historia clínica queda fuera de alcance. | RF-PRE-01, D14, D26, D52 |
| **RN-07** | **Sin duplicados.** Cada confirmación se procesa una sola vez, y dos registros simultáneos no pueden superar el límite. | RNF-INT-01, RNF-INT-02 |
| **RN-08** | **Permisos.** Solo el veterinario registra consumos, y no puede corregirlos ni anularlos. Los mensajes no muestran datos de pagos (montos, deuda, forma de pago). | RF-PRE-09, RF-ROL-10, RF-ROL-11, D34 |
| **RN-09** | **Una unidad por consumo.** Cada registro descuenta 1 unidad de la prestación. Dos vacunas en la misma visita son dos consumos. | D51 |
| **RN-10** | **Hora de referencia.** Todas las reglas de fecha (día 13, día 14, cambio de mes y de año) usan la hora de Argentina. | RF-PAG-03, RF-PAG-04, D53 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Mascota y cobertura | La mascota atendida y la cobertura vigente a la que se imputa el consumo. |
| Tipo de prestación | Del catálogo de tipos de prestación (D31). |
| Versión del plan | La versión del plan vigente al momento del registro. |
| Período | Mes (`AAAA-MM`) o año (`AAAA`) al que descuenta, según la periodicidad. |
| Fecha y hora | Momento del registro (D26). |
| Veterinario | Quien registró el consumo. |
| Veterinaria | Copia del dato del veterinario al momento del registro (D14). |
| Estado | *Válido*; puede pasar a *Anulado* solo por CU-31. |

## Escenarios de aceptación

```gherkin
@CU-39
Feature: CU-39 Registrar consumo
  Como veterinario asociado
  Quiero registrar el uso de una prestación durante la atención
  Para descontarla del saldo del plan de la mascota

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el veterinario "Ana López" de la veterinaria "Patitas" tiene la cuenta "Activa" e inició sesión
    And existe el plan "Plan Base" con las prestaciones:
      | prestación  | límite | periodicidad | habilitada desde (períodos pagos) |
      | Consulta    | 2      | mensual      | 1                                 |
      | Vacuna      |        | mensual      | 1                                 |
      | Radiografía | 1      | anual        | 3                                 |
    And la mascota "Luna" con número de afiliado "000123" tiene cobertura con el plan "Plan Base"

  @flujo-principal @RF-PRE-01 @RF-PRE-02 @RNF-USA-01 @D14 @D26
  Scenario: Registro de una prestación con saldo disponible
    Given la cobertura de "Luna" está "Al día" con 4 períodos pagos
    And "Luna" no consumió "Consulta" en el mes en curso
    When el veterinario registra una "Consulta" para "Luna"
    Then el consumo queda registrado con la fecha y hora actual, el veterinario "Ana López" y la veterinaria "Patitas"
    And el sistema confirma el registro
    And el saldo de "Consulta" de "Luna" para el mes en curso es 1

  @FA-01 @RF-PRE-03 @RF-NOT-02
  Scenario: El consumo agota la prestación
    Given la cobertura de "Luna" está "Al día" con 4 períodos pagos
    And "Luna" consumió 1 "Consulta" en el mes en curso
    When el veterinario registra una "Consulta" para "Luna"
    Then el consumo queda registrado
    And el saldo de "Consulta" de "Luna" para el mes en curso es 0
    And el sistema muestra la alerta "Se agotó Consulta para el período 2026-10"
    And el dueño de "Luna" ve la alerta de agotamiento

  @FA-02 @D32
  Scenario: Prestación sin límite
    Given la cobertura de "Luna" está "Al día" con 4 períodos pagos
    And "Luna" consumió 10 "Vacuna" en el mes en curso
    When el veterinario registra una "Vacuna" para "Luna"
    Then el consumo queda registrado
    And el saldo de "Vacuna" se muestra como "Ilimitada"

  @FA-03
  Scenario: El veterinario cancela antes de confirmar
    Given la cobertura de "Luna" está "Al día" con 4 períodos pagos
    When el veterinario elige "Consulta" para "Luna" y cancela
    Then no se registra ningún consumo
    And el saldo de "Consulta" de "Luna" no cambia

  @EX-01 @RF-PRE-04 @RF-PAG-03 @RF-PAG-04 @D17
  Scenario Outline: Cobertura activa según el día del mes y el pago de la cuota
    Given la fecha y hora actual es "<momento>"
    And la cuota de octubre 2026 de "Luna" está "<cuota>"
    And "Luna" tiene pagos los 4 períodos anteriores a octubre 2026, sin deuda
    When el veterinario registra una "Consulta" para "Luna"
    Then el resultado es "<resultado>"

    Examples:
      | momento          | cuota  | resultado                                                   |
      | 05/10/2026 10:00 | impaga | registrado                                                  |
      | 13/10/2026 23:59 | impaga | registrado                                                  |
      | 14/10/2026 00:00 | impaga | La cobertura de Luna está suspendida por falta de pago.     |
      | 14/10/2026 00:02 | pagada | registrado                                                  |

  @EX-02 @RF-PRE-04
  Scenario: Mascota sin cobertura vigente
    Given la cobertura de "Luna" está "Dada de baja"
    When el veterinario intenta registrar una "Consulta" para "Luna"
    Then no se registra ningún consumo
    And el sistema informa "Luna no tiene una cobertura vigente."

  @EX-03 @RF-PRE-05
  Scenario: Prestación no incluida en el plan
    Given la cobertura de "Luna" está "Al día" con 4 períodos pagos
    When el veterinario intenta registrar una "Ecografía" para "Luna"
    Then no se registra ningún consumo
    And el sistema informa "Ecografía no está incluida en el plan Plan Base."

  @EX-04 @RF-PRE-06 @RF-PLA-09 @RF-PLA-14
  Scenario Outline: Habilitación de una prestación por antigüedad
    Given la cobertura de "Luna" está "Al día" con <pagos> períodos pagos
    And "Luna" no consumió "Radiografía" en el año en curso
    When el veterinario registra una "Radiografía" para "Luna"
    Then el resultado es "<resultado>"

    Examples:
      | pagos | resultado                                                    |
      | 2     | Radiografía se habilita con 3 períodos pagos; Luna tiene 2.  |
      | 3     | registrado                                                   |

  @EX-05 @RF-PRE-07 @RNF-INT-02
  Scenario Outline: Prestación agotada en el período
    Given la cobertura de "Luna" está "Al día" con 4 períodos pagos
    And "Luna" consumió <consumidas> "<prestación>" en el <período> en curso
    When el veterinario intenta registrar una "<prestación>" para "Luna"
    Then no se registra ningún consumo
    And el sistema informa "<prestación> está agotada para el período <id período>."

    Examples:
      | prestación  | consumidas | período | id período |
      | Consulta    | 2          | mes     | 2026-10    |
      | Radiografía | 1          | año     | 2026       |

  @RN-04 @D1
  Scenario: El saldo mensual se renueva al empezar el mes
    Given la cobertura de "Luna" está "Al día" con 4 períodos pagos
    And "Luna" consumió 2 "Consulta" en octubre 2026
    And la fecha y hora actual es "01/11/2026 09:00"
    When el veterinario registra una "Consulta" para "Luna"
    Then el consumo queda registrado
    And el saldo de "Consulta" de "Luna" para 2026-11 es 1

  @RN-02 @RF-PLA-16 @D1
  Scenario Outline: Un cambio de plan programado rige desde el día 1
    Given la cobertura de "Luna" está "Al día" con 4 períodos pagos
    And "Luna" tiene programado el cambio al plan "Plan Plus" con 4 "Consulta" mensuales desde el 01/11/2026
    And "Luna" consumió 2 "Consulta" en el mes de "<momento>"
    And la fecha y hora actual es "<momento>"
    When el veterinario registra una "Consulta" para "Luna"
    Then el resultado es "<resultado>"

    Examples:
      | momento          | resultado                                        |
      | 31/10/2026 18:00 | Consulta está agotada para el período 2026-10.   |
      | 01/11/2026 09:00 | registrado                                       |

  @RN-04 @D30
  Scenario: Los consumos anuales se siguen contando después de un cambio de plan
    Given "Luna" consumió 1 "Radiografía" en 2026 con el plan "Plan Base"
    And desde el 01/11/2026 "Luna" tiene el plan "Plan Plus" con 2 "Radiografía" anuales
    And la cobertura de "Luna" está "Al día" con 5 períodos pagos
    And la fecha y hora actual es "10/11/2026 11:00"
    When el veterinario registra una "Radiografía" para "Luna"
    Then el consumo queda registrado
    And el saldo de "Radiografía" de "Luna" para 2026 es 0

  @EX-06 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces registra un solo consumo
    Given la cobertura de "Luna" está "Al día" con 4 períodos pagos
    And "Luna" no consumió "Consulta" en el mes en curso
    When el veterinario confirma el registro de una "Consulta" y la misma confirmación se envía dos veces
    Then se registra un solo consumo
    And el saldo de "Consulta" de "Luna" para el mes en curso es 1

  @EX-07 @RNF-INT-02
  Scenario: Dos veterinarios registran a la vez la última unidad
    Given la cobertura de "Luna" está "Al día" con 4 períodos pagos
    And "Luna" consumió 1 "Consulta" en el mes en curso
    And el veterinario "Pablo Díaz" de la veterinaria "Huellas" también inició sesión
    When "Ana López" y "Pablo Díaz" registran una "Consulta" para "Luna" al mismo tiempo
    Then se registra un solo consumo
    And el otro veterinario recibe "Consulta está agotada para el período 2026-10."
    And el saldo de "Consulta" de "Luna" para el mes en curso es 0

  @EX-08 @RF-AUT-03 @RF-ROL-06 @RNF-SEG-07
  Scenario: Cuenta desactivada con la sesión abierta
    Given el administrador desactivó la cuenta de "Ana López" mientras tenía la sesión abierta
    When "Ana López" intenta registrar una "Consulta" para "Luna"
    Then no se registra ningún consumo
    And el sistema informa "Tu cuenta está inactiva. Comunicate con el administrador."

  @RN-08 @RF-ROL-10
  Scenario: El rechazo por suspensión no muestra datos de pago
    Given la cobertura de "Luna" está "Suspendida por falta de pago" con 2 cuotas adeudadas
    When el veterinario intenta registrar una "Consulta" para "Luna"
    Then el sistema informa "La cobertura de Luna está suspendida por falta de pago."
    And el mensaje no muestra montos, cuotas adeudadas ni forma de pago
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PRE-01 | Paso 7, RN-06 |
| RF-PRE-02 | Pasos 2, 8 y 9, RN-04 |
| RF-PRE-03 | FA-01 |
| RF-PRE-04 | RN-01, EX-01, EX-02 |
| RF-PRE-05 | RN-02, EX-03 |
| RF-PRE-06, RF-PLA-09, RF-PLA-14 | RN-03, EX-04 |
| RF-PRE-07 | RN-04, EX-05 |
| RF-PRE-08 | RN-05, Excepciones |
| RF-PAG-03, RF-PAG-04 | RN-01 |
| RF-PLA-16 | RN-02 |
| RF-NOT-02 | FA-01 |
| RF-ROL-08, RF-ROL-10, RF-ROL-11 | Paso 2, RN-08 |
| RF-TRA-01 | Paso 8 |
| RNF-SEG-07 | Nota de Excepciones |
| RNF-INT-01, RNF-INT-02 | RN-07, EX-06, EX-07 |
| RNF-USA-01 | Paso 9 |
| D1, D11, D12, D14, D17, D26, D30, D32, D34, D51, D52, D53, D54 | Reglas de negocio |
