# CU-43 — Ver alertas

| Campo | Valor |
|-------|-------|
| **Actor principal** | Dueño afiliado |
| **Objetivo** | Enterarse, dentro de la aplicación, de lo que requiere su atención sobre la cobertura de sus mascotas. |
| **Disparador** | El dueño ingresa a la aplicación. Las alertas se muestran en su pantalla de inicio (CU-40). |
| **Relaciones** | Se muestra dentro de CU-40 Consultar mis mascotas. Los avisos por email son casos aparte: CU-47 a CU-50. La alerta de agotamiento surge de CU-39 Registrar consumo. |

## Precondiciones

1. El dueño inició sesión y su cuenta está **Activa** (CU-02).

## Flujo principal

1. El dueño ingresa a la aplicación.
2. El sistema calcula las alertas de cada mascota no dada de baja del dueño según su situación en ese momento (**RN-01**).
3. El sistema muestra las alertas ordenadas de la más grave a la menos grave (**RN-02**), cada una con la mascota a la que se refiere.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 2 | No hay ninguna situación que alertar. | No se muestra la sección de alertas. |
| **FA-02** | 2 | La situación que originó una alerta terminó (por ejemplo, se registró el pago). | La alerta deja de mostrarse automáticamente. |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 1 | La cuenta del dueño fue desactivada mientras tenía la sesión abierta. | *"Tu cuenta está inactiva. Comunicate con WildSalud."* |

## Postcondiciones

- **Éxito:** el dueño ve todas las alertas vigentes de sus mascotas.
- **Fracaso:** no se muestra ningún dato.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Tipos de alerta y cuándo se muestran.** | RF-NOT-02, D25, D68 |
| | 1. **Baja por deuda:** la cobertura se dio de baja por deuda y la mascota tiene deuda congelada. *"La cobertura de {mascota} se dio de baja por deuda. Cuotas adeudadas: {N}."* | D8, D27, D68 |
| | 2. **Baja inminente:** la cobertura está suspendida y falta un mes o menos para el plazo de baja. *"La cobertura de {mascota} se dará de baja el {fecha} si no se regulariza el pago."* | D8, D25 |
| | 3. **Suspensión:** la cobertura está suspendida por falta de pago. *"La cobertura de {mascota} está suspendida por falta de pago. Cuotas adeudadas: {N}."* | RF-PAG-04, D25 |
| | 4. **Vencimiento próximo:** del día 11 al 13 inclusive, con la cuota del mes impaga. *"La cuota de {mes} de {mascota} vence el 13/{mes}."* | RF-NOT-01, RF-NOT-02, D78 |
| | 5. **Prestación agotada:** una prestación de la cobertura vigente está agotada en el período en curso. *"Se agotó {prestación} de {mascota} para el período {período}."* | RF-PRE-03, RF-NOT-02 |
| **RN-02** | **Orden.** Se muestran en el orden de la lista anterior. Si para una misma mascota corresponden la de baja inminente y la de suspensión, se muestra solo la de baja inminente. | — |
| **RN-03** | **Calculadas en el momento.** Las alertas se calculan con la situación de cada mascota en la fecha y hora de la consulta (hora de Argentina). No se guardan ni se marcan como leídas: desaparecen solas cuando la situación termina. | D53, D54, D77 |
| **RN-04** | **Solo lo propio.** El dueño ve solo alertas de sus mascotas. | RNF-SEG-03 |

## Escenarios de aceptación

```gherkin
@CU-43
Feature: CU-43 Ver alertas
  Como dueño afiliado
  Quiero ver alertas sobre la cobertura de mis mascotas
  Para actuar a tiempo y no quedarme sin cobertura

  Background:
    Given la dueña "Carla Gómez" tiene la cuenta "Activa" e inició sesión
    And "Carla Gómez" tiene la mascota "Luna" con cobertura con el plan "Plan Base"

  @RN-01 @RF-NOT-01 @RF-NOT-02
  Scenario Outline: Alerta de vencimiento próximo
    Given la fecha y hora actual es "<momento>"
    And la cuota de octubre 2026 de "Luna" está "<cuota>"
    When "Carla Gómez" ingresa a la aplicación
    Then <resultado>

    Examples:
      | momento          | cuota  | resultado                                                        |
      | 10/10/2026 10:00 | impaga | no ve alertas                                                    |
      | 11/10/2026 00:00 | impaga | ve la alerta "La cuota de octubre de Luna vence el 13/10."       |
      | 13/10/2026 23:59 | impaga | ve la alerta "La cuota de octubre de Luna vence el 13/10."       |
      | 12/10/2026 10:00 | pagada | no ve alertas                                                    |

  @RN-01 @D25
  Scenario: Alerta de suspensión
    Given la fecha y hora actual es "20/10/2026 10:00"
    And la cobertura de "Luna" está "Suspendida por falta de pago" desde el "14/10/2026" con 1 cuota adeudada
    When "Carla Gómez" ingresa a la aplicación
    Then ve la alerta "La cobertura de Luna está suspendida por falta de pago. Cuotas adeudadas: 1."

  @RN-01 @RN-02 @D8 @D25
  Scenario Outline: La alerta de baja inminente reemplaza a la de suspensión
    Given la cobertura de "Luna" está "Suspendida por falta de pago" desde el "14/07/2026 00:00"
    And la fecha y hora actual es "<momento>"
    When "Carla Gómez" ingresa a la aplicación
    Then ve la alerta "<alerta>"

    Examples:
      | momento          | alerta                                                                                    |
      | 13/09/2026 10:00 | La cobertura de Luna está suspendida por falta de pago. Cuotas adeudadas: 2.              |
      | 14/09/2026 00:00 | La cobertura de Luna se dará de baja el 14/10/2026 si no se regulariza el pago.           |

  @RN-01 @D68
  Scenario: Alerta de baja por deuda
    Given la fecha y hora actual es "20/10/2026 10:00"
    And la cobertura de "Luna" se dio de baja por deuda el "14/10/2026" con 3 cuotas congeladas
    When "Carla Gómez" ingresa a la aplicación
    Then ve la alerta "La cobertura de Luna se dio de baja por deuda. Cuotas adeudadas: 3."

  @RN-01 @RF-PRE-03
  Scenario: Alerta de prestación agotada
    Given la fecha y hora actual es "20/10/2026 10:00"
    And la cobertura de "Luna" está "Al día" y agotó la "Consulta" del período "2026-10"
    When "Carla Gómez" ingresa a la aplicación
    Then ve la alerta "Se agotó Consulta de Luna para el período 2026-10."

  @RN-01
  Scenario: La alerta de agotamiento desaparece con el nuevo período
    Given la cobertura de "Luna" está "Al día" y agotó la "Consulta" del período "2026-10"
    And la fecha y hora actual es "01/11/2026 09:00"
    When "Carla Gómez" ingresa a la aplicación
    Then no ve la alerta de "Consulta" agotada

  @FA-02 @RN-03 @D54
  Scenario: La alerta desaparece cuando termina la situación
    Given la fecha y hora actual es "20/10/2026 10:00"
    And la cobertura de "Luna" está "Suspendida por falta de pago"
    And el administrador registró el pago de toda la deuda de "Luna"
    When "Carla Gómez" ingresa a la aplicación
    Then no ve la alerta de suspensión de "Luna"

  @RN-02
  Scenario: Varias alertas se ordenan de la más grave a la menos grave
    Given la fecha y hora actual es "20/10/2026 10:00"
    And "Carla Gómez" también tiene la mascota "Toby"
    And la cobertura de "Toby" está "Suspendida por falta de pago" desde el "14/10/2026"
    And la cobertura de "Luna" está "Al día" y agotó la "Consulta" del período "2026-10"
    When "Carla Gómez" ingresa a la aplicación
    Then ve primero la alerta de suspensión de "Toby" y después la de "Consulta" agotada de "Luna"

  @FA-01
  Scenario: Sin alertas
    Given la fecha y hora actual es "20/10/2026 10:00"
    And la cobertura de "Luna" está "Al día" con la cuota de octubre 2026 pagada y sin prestaciones agotadas
    When "Carla Gómez" ingresa a la aplicación
    Then no ve la sección de alertas

  @EX-01
  Scenario: Cuenta desactivada con la sesión abierta
    Given el administrador dio de baja a "Carla Gómez" mientras tenía la sesión abierta
    When "Carla Gómez" ingresa a la aplicación
    Then no se muestra ningún dato
    And el sistema informa "Tu cuenta está inactiva. Comunicate con WildSalud."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-NOT-01 | RN-01 (vencimiento próximo) |
| RF-NOT-02 | RN-01 |
| RF-PAG-04 | RN-01 (suspensión) |
| RF-PRE-03 | RN-01 (prestación agotada) |
| RNF-SEG-03 | RN-04 |
| D8, D25, D27, D68 | RN-01 |
| D53, D54, D77 | RN-03, FA-02 |
| D78 | RN-01 (vencimiento próximo) |
