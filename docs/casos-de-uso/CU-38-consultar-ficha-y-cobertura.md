# CU-38 — Consultar ficha y cobertura

| Campo | Valor |
|-------|-------|
| **Actor principal** | Veterinario asociado |
| **Objetivo** | Ver la ficha de la mascota, los datos de contacto de su dueño y el estado de su cobertura con las prestaciones disponibles, para decidir cómo atenderla. |
| **Disparador** | El veterinario eligió una mascota en CU-37 Buscar mascota. |
| **Relaciones** | Se llega desde CU-37. Desde la ficha se inicia CU-39 Registrar consumo. |

## Precondiciones

1. El veterinario inició sesión y su cuenta está en estado **Activo** (CU-02).
2. El veterinario eligió una mascota no dada de baja (CU-37).

## Flujo principal

1. El sistema muestra la **ficha de la mascota**: foto, nombre, especie, raza, sexo, color, castrado/a, enfermedades previas o crónicas, alimentación, edad aproximada y número de afiliado.
2. El sistema muestra los **datos del dueño**: nombre, apellido, DNI y teléfono.
3. El sistema muestra la **cobertura**: plan vigente y estado (*Al día*, *Suspendida por falta de pago* o *Sin cobertura vigente*).
4. El sistema muestra las **prestaciones del plan**, cada una con periodicidad, límite, consumidas en el período, saldo (o *Ilimitada*) y estado: *Disponible*, *Agotada* o *No habilitada todavía* (con los períodos pagos que faltan).
5. El sistema muestra los **consumos del período en curso**: fecha, prestación y veterinaria. No muestra consumos de períodos anteriores.
6. El sistema muestra las **alertas** que correspondan (**RN-04**).
7. Si la cobertura está *Al día*, el sistema ofrece **Registrar consumo** (CU-39).

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3, 6 y 7 | La cobertura está suspendida por falta de pago. | Se muestra la alerta *"Cobertura suspendida por falta de pago. No se pueden registrar consumos."* y no se ofrece Registrar consumo. Las prestaciones se muestran igual. |
| **FA-02** | 3 a 7 | La mascota no tiene cobertura vigente. | Se muestra la alerta *"{mascota} no tiene una cobertura vigente."*, no se muestran prestaciones ni consumos y no se ofrece Registrar consumo. |
| **FA-03** | 4 y 6 | Una o más prestaciones están agotadas en el período. | La prestación figura como *Agotada* y se muestra la alerta *"{prestación} está agotada para el período {período}."* |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 1 | La mascota se dio de baja entre la búsqueda y la apertura de la ficha. | *"La mascota ya no está disponible."* |
| **EX-02** | 1 | La cuenta del veterinario fue desactivada mientras tenía la sesión abierta. | *"Tu cuenta está inactiva. Comunicate con el administrador."* |

## Postcondiciones

- **Éxito:** el veterinario ve la ficha, el dueño y la cobertura de la mascota.
- **Fracaso:** no se muestra ningún dato.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Qué ve el veterinario.** Toda la ficha de la mascota; número de afiliado, plan, estado de cobertura y prestaciones disponibles y consumidas; y del dueño solo nombre, apellido, DNI y teléfono. | RF-ROL-07, RF-ROL-08, RF-ROL-09 |
| **RN-02** | **Qué no ve.** Pagos, importes, cuotas adeudadas, forma de pago, historial de pagos, dirección ni email del dueño, cambios de plan pendientes ni consumos de períodos anteriores. | RF-ROL-10, RNF-SEG-01, D72 |
| **RN-03** | **Solo consulta.** El veterinario no puede modificar ningún dato de la ficha, del dueño, del plan ni de la cobertura. | RF-ROL-11, D33 |
| **RN-04** | **Alertas.** Cobertura suspendida, mascota sin cobertura vigente y prestaciones agotadas en el período. | RF-NOT-02, RF-PRE-03 |
| **RN-05** | **Datos calculados en el momento.** Estado de cobertura, plan vigente y saldos se calculan con la fecha y hora de la consulta (hora de Argentina). | D53, D54, D30 |
| **RN-06** | **Sin registro de accesos.** Abrir una ficha es una consulta y no queda registrada en la auditoría. | D71 |
| **RN-07** | **Rendimiento.** La ficha se muestra en menos de 2 segundos en condiciones normales de uso. | RNF-REN-01, RNF-REN-02 |
| **RN-08** | **Permisos en el sistema.** El sistema verifica los permisos en cada consulta, no solo ocultando opciones. | RF-AUT-03, RNF-SEG-07 |

## Escenarios de aceptación

```gherkin
@CU-38
Feature: CU-38 Consultar ficha y cobertura
  Como veterinario asociado
  Quiero ver la ficha y la cobertura de la mascota que atiendo
  Para decidir qué prestaciones puedo registrar

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el veterinario "Ana López" de la veterinaria "Patitas" tiene la cuenta en estado "Activo" e inició sesión
    And existe el plan "Plan Base" con las prestaciones:
      | prestación  | límite | periodicidad | habilitada desde (períodos pagos) |
      | Consulta    | 2      | mensual      | 1                                 |
      | Vacuna      |        | mensual      | 1                                 |
      | Radiografía | 1      | anual        | 6                                 |
    And la mascota "Luna" con número de afiliado "000123" pertenece a "Carla Gómez", DNI "30111222", teléfono "11 5555-1234"

  @flujo-principal @RF-ROL-07 @RF-ROL-08 @RF-ROL-09
  Scenario: Ver la ficha de una mascota con cobertura al día
    Given "Luna" tiene cobertura "Al día" con el plan "Plan Base" y 4 períodos pagos
    And el "05/10/2026" la veterinaria "Huellas" registró una "Consulta" para "Luna"
    When el veterinario abre la ficha de "Luna"
    Then ve los datos de la mascota, el número de afiliado "000123" y el plan "Plan Base"
    And ve del dueño: nombre "Carla", apellido "Gómez", DNI "30111222" y teléfono "11 5555-1234"
    And ve las prestaciones:
      | prestación  | consumidas | saldo     | estado                                 |
      | Consulta    | 1          | 1         | Disponible                             |
      | Vacuna      | 0          | Ilimitada | Disponible                             |
      | Radiografía | 0          | 1         | No habilitada todavía: faltan 2 períodos pagos |
    And ve el consumo del "05/10/2026": "Consulta" en "Huellas"
    And se ofrece la opción "Registrar consumo"

  @RN-02 @RF-ROL-10 @RNF-SEG-01
  Scenario: El veterinario no ve datos de pagos ni datos de contacto no autorizados
    Given "Luna" tiene cobertura "Suspendida por falta de pago" con 2 cuotas adeudadas
    And "Luna" tiene un cambio de plan pendiente
    When el veterinario abre la ficha de "Luna"
    Then no ve importes, cuotas adeudadas, forma de pago ni historial de pagos
    And no ve la dirección ni el email de "Carla Gómez"
    And no ve el cambio de plan pendiente

  @FA-01 @RF-NOT-02
  Scenario: Cobertura suspendida
    Given "Luna" tiene cobertura "Suspendida por falta de pago"
    When el veterinario abre la ficha de "Luna"
    Then ve la alerta "Cobertura suspendida por falta de pago. No se pueden registrar consumos."
    And no se ofrece la opción "Registrar consumo"

  @FA-02
  Scenario: Mascota sin cobertura vigente
    Given "Luna" no tiene cobertura vigente
    When el veterinario abre la ficha de "Luna"
    Then ve la alerta "Luna no tiene una cobertura vigente."
    And no ve prestaciones ni consumos
    And no se ofrece la opción "Registrar consumo"

  @FA-03 @RF-PRE-03
  Scenario: Prestación agotada en el período
    Given "Luna" tiene cobertura "Al día" y consumió 2 "Consulta" en octubre 2026
    When el veterinario abre la ficha de "Luna"
    Then la prestación "Consulta" figura como "Agotada"
    And ve la alerta "Consulta está agotada para el período 2026-10."

  @RN-03 @RF-ROL-11 @D33
  Scenario: La ficha es de solo consulta
    Given "Luna" tiene cobertura "Al día"
    When el veterinario abre la ficha de "Luna"
    Then ningún dato de la mascota, del dueño, del plan ni de la cobertura se puede editar

  @EX-01
  Scenario: La mascota se dio de baja antes de abrir la ficha
    Given el veterinario encontró a "Luna" en la búsqueda
    And el administrador dio de baja a "Luna"
    When el veterinario abre la ficha de "Luna"
    Then el sistema informa "La mascota ya no está disponible."

  @EX-02 @RNF-SEG-07
  Scenario: Cuenta desactivada con la sesión abierta
    Given el administrador desactivó la cuenta de "Ana López" mientras tenía la sesión abierta
    When "Ana López" abre la ficha de "Luna"
    Then no se muestra ningún dato
    And el sistema informa "Tu cuenta está inactiva. Comunicate con el administrador."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-ROL-07, RF-ROL-08, RF-ROL-09 | Pasos 1 a 5, RN-01 |
| RF-ROL-10 | RN-02 |
| RF-ROL-11 | RN-03 |
| RF-NOT-02, RF-PRE-03 | Paso 6, RN-04, FA-01, FA-03 |
| RF-AUT-03, RNF-SEG-07 | RN-08, EX-02 |
| RNF-REN-01, RNF-REN-02 | RN-07 |
| RNF-SEG-01 | RN-02 |
| D30, D53, D54 | RN-05 |
| D33 | RN-03 |
| D71 | RN-06 |
| D72 | Paso 5, RN-02 |
