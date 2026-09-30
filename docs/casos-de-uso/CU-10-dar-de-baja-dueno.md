# CU-10 — Dar de baja dueño (en cascada)

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Dar de baja a un dueño junto con su cuenta, sus mascotas y sus coberturas, conservando todo su historial. |
| **Disparador** | El dueño pide dejar WildSalud, o el administrador decide desafiliarlo. |
| **Relaciones** | El dueño se ubica con CU-33 Buscar/filtrar dueños y mascotas. Para dar de baja una sola mascota se usa CU-15 Dar de baja mascota, y para dar de baja solo el plan de una mascota, CU-24. La deuda que quede congelada se paga en CU-26 Registrar pago, aunque el dueño esté dado de baja. Si el dueño vuelve, se usa CU-11 Reactivar dueño. La baja queda en el historial de auditoría (CU-36). |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El dueño no está dado de baja (su cuenta está en estado *Invitado* o *Activo*).

## Flujo principal

1. El administrador elige **Dar de baja** desde la ficha del dueño.
2. El sistema muestra el **resumen de todo lo que se va a dar de baja** (**RN-02**):
   - el dueño y su cuenta, que pasará a *Inactivo*;
   - cada mascota no dada de baja, con su número de afiliado;
   - la cobertura de cada mascota, con su plan y su estado, y el cambio pendiente que se cancelará, si lo hay;
   - la deuda pendiente de cada mascota (la que ya estaba congelada y la que se congelará con la baja), con sus períodos e importe, y el aviso de que mientras quede deuda no se le podrán asignar planes.
3. El administrador escribe el motivo de la baja y confirma.
4. El sistema valida las reglas **RN-03** y **RN-08** y que el dueño siga sin estar dado de baja.
5. El sistema hace la baja en cascada en **una sola operación** (**RN-01**), con la fecha y hora de la confirmación y el administrador:
   1. Cada cobertura vigente (*Al día* o *Suspendida*) pasa a **Dada de baja** con motivo *por baja de la mascota*; se congelan sus períodos impagos vencidos antes del mes de la baja y se cancela su cambio pendiente, si lo tiene.
   2. Cada mascota no dada de baja queda **dada de baja** con motivo *por baja del dueño*.
   3. El dueño queda **dado de baja** con el motivo escrito, y su cuenta pasa a **Inactivo**. Si tenía una invitación sin usar, pasa a *Vencida*. Su cuenta de Google o Apple vinculada queda reservada (**RN-07**).
6. El sistema deja el registro de auditoría de cada baja y de cada cambio cancelado.
7. El sistema confirma: *"Se dio de baja a {dueño}, junto con sus mascotas y coberturas."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 2 a 7 | El dueño no tiene mascotas no dadas de baja. | El resumen muestra solo al dueño y su cuenta. Se da de baja al dueño y su cuenta pasa a *Inactivo*. El sistema confirma: *"Se dio de baja a {dueño}."* |
| **FA-02** | 5 | Una mascota no tiene cobertura vigente: nunca tuvo plan, su plan ya se había dado de baja o ya se cumplió el plazo de baja por deuda aunque CU-45 no se haya ejecutado (D54). | La mascota se da de baja. Su última cobertura, si la tiene, conserva el motivo y la fecha de baja que ya tenía, y su deuda congelada sigue igual. |
| **FA-03** | 5 y 7 | Queda deuda pendiente: ya había deuda congelada o una cobertura suspendida tiene períodos impagos vencidos antes del mes de la baja. | Se congelan esos períodos (**RN-05**). La confirmación agrega: *"Quedó deuda pendiente por {importe} ({N} períodos)."* La deuda se puede pagar con CU-26 aunque el dueño esté dado de baja. |
| **FA-04** | 5 | Una cobertura tiene un cambio de plan o una baja programada pendiente. | El cambio queda *Cancelado* y la cobertura se da de baja en el momento, con motivo *por baja de la mascota* (**RN-06**). |
| **FA-05** | 5 | La cuenta del dueño está en estado *Invitado* y tiene una invitación sin usar. | Se lo da de baja igual. La invitación pasa a *Vencida*: si la persona usa el enlace, CU-01 no vincula ninguna cuenta. |
| **FA-06** | 3 | El administrador cancela. | No se da de baja nada. |

## Excepciones

En todas las excepciones **no se da de baja nada**: ni el dueño, ni su cuenta, ni sus mascotas, ni sus coberturas. El sistema informa el motivo.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | No se escribió el motivo. | *"Indicá el motivo de la baja."* |
| **EX-02** | 4 | El dueño ya fue dado de baja (por ejemplo, por otro administrador). | *"La cuenta de {dueño} ya está inactiva."* |
| **EX-03** | 4 | Lo que se va a dar de baja cambió entre el resumen y la confirmación: se dio de alta una mascota, se registró o anuló un pago, se programó o canceló un cambio, o cambió el estado de una cobertura o la deuda que se congela (por ejemplo, porque empezó un mes nuevo). | *"La situación de {dueño} cambió. Revisá de nuevo lo que se va a dar de baja."* |
| **EX-04** | 3 | La misma confirmación llega dos veces (doble clic o reintento de red). | La baja se hace **una sola** vez; el segundo envío devuelve el mismo resultado que el primero. |
| **EX-05** | 3 | Un usuario que no es administrador intenta dar de baja al dueño (por ejemplo, un veterinario que envía el pedido sin usar la pantalla). | *"No tenés permiso para hacer esta operación."* |

## Postcondiciones

- **Éxito:** el dueño está dado de baja, con motivo, fecha y hora de baja y administrador. Su cuenta está en estado *Inactivo*: no puede iniciar sesiones nuevas y, si tenía una abierta, su próxima acción se rechaza. Su invitación sin usar, si la tenía, quedó *Vencida*, y su cuenta de Google o Apple vinculada queda reservada. No se le envía ningún email. Todas sus mascotas están dadas de baja y cada cobertura que estaba vigente está *Dada de baja* con motivo *por baja de la mascota*, con su deuda congelada y sus cambios pendientes cancelados. Todo queda en el historial de auditoría (CU-36) y el historial de pagos y consumos se conserva.
- **Fracaso:** no cambia nada. Los intentos rechazados no quedan en el historial de auditoría.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **En cascada, todo o nada.** La baja del dueño da de baja, en una sola operación, su cuenta, todas sus mascotas no dadas de baja y sus coberturas vigentes. No se puede dar de baja al dueño dejando mascotas activas. Si algo falla, no se da de baja nada. Las mascotas que ya estaban dadas de baja no se modifican. | D22, RF-MAS-02, RF-ROL-06 |
| **RN-02** | **Confirmación con todo lo afectado.** Antes de confirmar, el administrador ve el dueño, su cuenta, cada mascota con su cobertura, los cambios pendientes que se cancelarán y la deuda que quedará pendiente. | D22 |
| **RN-03** | **Se da de baja lo que se confirmó.** La situación se evalúa de nuevo al confirmar, con la fecha y hora de la confirmación. Si cambió algo de lo que mostraba el resumen, no se da de baja nada y se pide revisarlo (EX-03). | D54, RNF-SEG-07 |
| **RN-04** | **Baja inmediata de las coberturas.** Toda cobertura vigente, *Al día* o *Suspendida*, queda *Dada de baja* en el momento de la confirmación, aunque el mes en curso esté pago: no se programa para el día 1 del mes siguiente como en CU-24 y no hay reintegro. El motivo de la baja de la cobertura es *por baja de la mascota*. | RF-PAG-14, D10, D16, D100, D113 |
| **RN-05** | **Deuda congelada.** De cada cobertura que se da de baja se congelan los períodos impagos vencidos **antes del mes de la baja**; el mes de la baja no se congela: si la baja ocurre entre el día 1 y el 13 con el mes impago, ese mes no genera deuda, aunque haya habido consumos. La baja se permite aunque haya deuda. La deuda congelada se puede pagar aunque el dueño esté dado de baja (CU-26) y, si vuelve (CU-11), mientras quede deuda no se le puede asignar un plan a ninguna de sus mascotas. | D27, D28, D29, D38, D55, D64, D113 |
| **RN-06** | **Cambios pendientes.** Se cancelan los cambios de plan y las bajas programadas pendientes de todas sus coberturas. Una baja voluntaria programada no se aplica después: la cobertura ya quedó dada de baja por la baja de la mascota. | D20, D100 |
| **RN-07** | **Cuenta inactiva.** La cuenta pasa a *Inactivo* y ya no puede iniciar sesiones nuevas (CU-02) ni vincular una cuenta desde una invitación sin usar, que pasa a *Vencida* (CU-01). Si el dueño tiene una sesión abierta, el sistema verifica el estado de la cuenta en cada acción y la rechaza con *"Tu cuenta está inactiva. Comunicate con WildSalud."* Su cuenta de Google o Apple vinculada queda **reservada**: mientras el dueño esté dado de baja, no se puede vincular a otro usuario. Si se lo reactiva, esa vinculación se descarta y se le envía una invitación nueva (CU-11). Se puede dar de baja también a un dueño *Invitado*. | RF-AUT-04, RF-ROL-06, RNF-SEG-07, D37, D47, D89, D92, D96, D97 |
| **RN-08** | **Motivo obligatorio.** La baja del dueño registra el motivo (texto libre), la fecha y hora y el administrador. Cada mascota y cada cobertura dadas de baja registran también fecha y hora y administrador. | RNF-BAJ-04, D98 |
| **RN-09** | **Borrado lógico.** No se elimina nada: el dueño, sus mascotas, sus coberturas, pagos y consumos se conservan con su historial y se ven en las consultas históricas (CU-34, CU-35, CU-36). Las mascotas conservan su número de afiliado, que no se vuelve a asignar. | RNF-BAJ-01, RNF-BAJ-02, D23 |
| **RN-10** | **Fuera de la operación diaria.** Las mascotas dadas de baja no aparecen en la búsqueda del veterinario (CU-37) ni en "Mis mascotas" (CU-40), y no se les registran consumos. Solo se puede operar sobre su deuda congelada (CU-26). | RNF-BAJ-03, D64, D73 |
| **RN-11** | **Sin duplicados.** Cada confirmación se procesa una sola vez: no se duplican bajas, cancelaciones ni registros de auditoría. | RNF-INT-01 |
| **RN-12** | **Solo el administrador.** Solo el administrador da de baja a un dueño. El sistema rechaza el intento de cualquier otro rol, aunque no se haga desde la pantalla, con *"No tenés permiso para hacer esta operación."* | RF-ROL-06, RNF-SEG-02, RNF-SEG-07, D110 |
| **RN-13** | **Sin aviso.** La baja no le envía ningún email al dueño. | D99 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Dueño | Baja lógica: motivo, fecha y hora de baja, administrador. |
| Cuenta | Estado *Inactivo*. La cuenta de Google o Apple vinculada queda reservada (D97). |
| Invitación | Estado *Vencida*, si estaba sin usar (en estado *Invitado*). |
| Mascota (cada una no dada de baja) | Baja lógica: motivo *por baja del dueño*, fecha y hora de baja, administrador. |
| Cobertura (cada una vigente) | Estado *Dada de baja*, motivo *por baja de la mascota*, fecha y hora de baja, administrador. |
| Deuda congelada | Los períodos impagos vencidos antes del mes de la baja, marcados como congelados. |
| Cambios pendientes | Estado *Cancelado*, con fecha y hora y administrador. |
| Auditoría | Baja del dueño, de su cuenta, de cada mascota y de cada cobertura, y cada cambio cancelado, con administrador, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-10
Feature: CU-10 Dar de baja dueño (en cascada)
  Como administrador
  Quiero dar de baja a un dueño con todas sus mascotas y coberturas
  Para que deje de estar afiliado sin perder su historial

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And existe el plan "Plan Base" con precio mensual 10000
    And la dueña "Carla Gómez" con DNI "30111222" tiene la cuenta en estado "Activo"
    And "Carla Gómez" tiene las mascotas "Luna", con número de afiliado "000123", y "Toby", con número de afiliado "000124"

  @flujo-principal @RN-01 @RN-04 @RN-08 @RN-13 @D22 @D16 @D113 @D98 @D99 @D100 @RF-ROL-06 @RNF-BAJ-04 @RF-TRA-01 @RNF-AUD-01 @RNF-USA-01
  Scenario: Baja en cascada de un dueño con las coberturas al día
    Given las coberturas de "Luna" y "Toby" con el plan "Plan Base" están "Al día" con la cuota de octubre 2026 pagada
    When el administrador da de baja a "Carla Gómez" con el motivo "Pidió la desafiliación" y confirma
    Then "Carla Gómez" queda dada de baja con motivo "Pidió la desafiliación", administrador "Marta Ruiz" y fecha "20/10/2026 10:00"
    And la cuenta de "Carla Gómez" queda en estado "Inactivo"
    And "Luna" y "Toby" quedan dadas de baja con motivo "por baja del dueño"
    And las coberturas de "Luna" y "Toby" quedan "Dada de baja" con motivo "por baja de la mascota" y fecha de baja "20/10/2026 10:00"
    And "Carla Gómez" no tiene deuda pendiente
    And la auditoría registra, con usuario "Marta Ruiz", la baja de "Carla Gómez", de su cuenta, de "Luna", de "Toby" y de sus coberturas
    And no se envía ningún email a "Carla Gómez"
    And el sistema informa "Se dio de baja a Carla Gómez, junto con sus mascotas y coberturas."

  @flujo-principal @RN-02 @D22
  Scenario: El resumen muestra todo lo que se va a dar de baja
    Given la cobertura de "Luna" con el plan "Plan Base" está "Al día" y tiene un cambio pendiente al plan "Plan Plus" con vigencia "01/11/2026"
    And la cobertura de "Toby" con el plan "Plan Base" está "Suspendida por falta de pago" con los períodos "2026-09" y "2026-10" impagos
    When el administrador elige dar de baja a "Carla Gómez"
    Then el sistema muestra que la cuenta de "Carla Gómez" pasará a "Inactivo"
    And muestra a "Luna" ("000123") con el plan "Plan Base", cobertura "Al día" y el cambio al plan "Plan Plus" que se cancelará
    And muestra a "Toby" ("000124") con el plan "Plan Base", cobertura "Suspendida por falta de pago" y el período "2026-09" que quedará como deuda congelada por 10000
    And todavía no se dio de baja nada

  @FA-01
  Scenario: Dueño sin mascotas
    Given el dueño "Pedro Sosa" con DNI "28999888" tiene la cuenta en estado "Activo" y no tiene mascotas
    When el administrador da de baja a "Pedro Sosa" con el motivo "Pidió la desafiliación" y confirma
    Then "Pedro Sosa" queda dado de baja y su cuenta en estado "Inactivo"
    And el sistema informa "Se dio de baja a Pedro Sosa."

  @FA-02 @D10 @D54
  Scenario Outline: Mascota sin cobertura vigente
    Given la cobertura de "Luna" con el plan "Plan Base" está "Al día" con la cuota de octubre 2026 pagada
    And <situación de Toby>
    When el administrador da de baja a "Carla Gómez" con el motivo "Pidió la desafiliación" y confirma
    Then "Toby" queda dada de baja con motivo "por baja del dueño"
    And la última cobertura de "Toby" <cobertura de Toby>

    Examples:
      | situación de Toby                                                                                                                  | cobertura de Toby                                                                                         |
      | "Toby" nunca tuvo un plan                                                                                                          | no existe                                                                                                 |
      | la cobertura de "Toby" se dio de baja con motivo "voluntaria" el "01/09/2026 00:00", sin deuda                                     | sigue con motivo "voluntaria" y fecha de baja "01/09/2026 00:00"                                          |
      | la cobertura de "Toby" está suspendida desde el "14/07/2026 00:00" y el proceso de baja por deuda del "14/10/2026" no se ejecutó | queda con motivo "por deuda", fecha de baja "14/10/2026 00:00" y los períodos "2026-07" a "2026-09" congelados |

  @FA-03 @RN-05 @D27 @D38 @D113
  Scenario Outline: Qué períodos se congelan según el estado de cada cobertura
    Given la fecha y hora actual es "<momento>"
    And la cobertura de "Luna" con el plan "Plan Base" está "Al día" con la cuota de octubre 2026 pagada
    And la cobertura de "Toby" con el plan "Plan Base" está <situación de Toby>
    When el administrador da de baja a "Carla Gómez" con el motivo "Pidió la desafiliación" y confirma
    Then la cobertura de "Toby" queda "Dada de baja" con motivo "por baja de la mascota"
    And la deuda congelada de "Toby" es "<deuda congelada>"

    Examples:
      | momento          | situación de Toby                                                                                  | deuda congelada               |
      | 10/10/2026 10:00 | "Al día" con el período "2026-10" impago                                                           | ninguna                       |
      | 20/10/2026 10:00 | "Suspendida por falta de pago" desde el "14/10/2026" con el período "2026-10" impago               | ninguna                       |
      | 20/10/2026 10:00 | "Suspendida por falta de pago" desde el "14/09/2026" con los períodos "2026-09" y "2026-10" impagos | 2026-09                       |
      | 20/10/2026 10:00 | "Suspendida por falta de pago" desde el "14/08/2026" con los períodos "2026-08" a "2026-10" impagos | 2026-08 y 2026-09             |

  @RN-05 @D27 @D113
  Scenario: La baja el día 10 con el mes impago no deja deuda aunque haya consumos
    Given la fecha y hora actual es "10/10/2026 10:00"
    And la cobertura de "Luna" con el plan "Plan Base" está "Al día" con el período "2026-10" impago
    And "Luna" consumió 2 "Consulta" en octubre 2026
    When el administrador da de baja a "Carla Gómez" con el motivo "Pidió la desafiliación" y confirma
    Then la cobertura de "Luna" queda "Dada de baja" con motivo "por baja de la mascota" y fecha de baja "10/10/2026 10:00"
    And el período "2026-10" de "Luna" no queda como deuda congelada
    And los 2 consumos de "Luna" de octubre 2026 siguen siendo válidos
    And "Carla Gómez" no tiene deuda pendiente

  @FA-03 @RN-05 @D27 @D29 @D55
  Scenario: La confirmación informa la deuda que queda pendiente
    Given la cobertura de "Luna" con el plan "Plan Base" está "Al día" con la cuota de octubre 2026 pagada
    And la cobertura de "Toby" con el plan "Plan Base" está "Suspendida por falta de pago" desde el "14/08/2026" con los períodos "2026-08", "2026-09" y "2026-10" impagos
    When el administrador da de baja a "Carla Gómez" con el motivo "Deuda sin regularizar" y confirma
    Then los períodos "2026-08" y "2026-09" de "Toby" quedan como deuda congelada
    And el período "2026-10" de "Toby" no queda como deuda congelada
    And el sistema informa "Se dio de baja a Carla Gómez, junto con sus mascotas y coberturas. Quedó deuda pendiente por 20000 (2 períodos)."

  @RN-05 @D64
  Scenario: La deuda congelada se puede pagar aunque el dueño esté dado de baja
    Given "Carla Gómez" está dada de baja y "Toby" quedó con los períodos "2026-08" y "2026-09" congelados
    When el administrador registra el pago de todos los períodos de "Toby" y confirma
    Then se registran 2 pagos de "Toby": "2026-08" y "2026-09"
    And "Carla Gómez" no tiene deuda pendiente
    And "Carla Gómez" sigue dada de baja

  @FA-04 @RN-06 @D20 @D100
  Scenario Outline: Los cambios pendientes se cancelan y la baja de la cobertura es inmediata
    Given la cobertura de "Luna" con el plan "Plan Base" está "Al día" con la cuota de octubre 2026 pagada
    And "Luna" tiene pendiente <pendiente> con vigencia "01/11/2026"
    When el administrador da de baja a "Carla Gómez" con el motivo "Pidió la desafiliación" y confirma
    Then el cambio pendiente de "Luna" queda "Cancelado"
    And la cobertura de "Luna" queda "Dada de baja" con motivo "por baja de la mascota" y fecha de baja "20/10/2026 10:00"

    Examples:
      | pendiente                     |
      | un cambio al plan "Plan Plus" |
      | una baja programada           |

  @FA-05 @RN-07 @D47 @D96 @D111
  Scenario: Dueño con una invitación sin usar
    Given el dueño "Pedro Sosa" tiene la cuenta en estado "Invitado", una invitación sin usar y ninguna mascota
    When el administrador da de baja a "Pedro Sosa" con el motivo "Error de carga" y confirma
    Then la cuenta de "Pedro Sosa" queda en estado "Inactivo"
    And la invitación de "Pedro Sosa" queda "Vencida" y su enlace ya no permite vincular una cuenta

  @FA-06
  Scenario: El administrador cancela
    Given las coberturas de "Luna" y "Toby" están "Al día"
    When el administrador elige dar de baja a "Carla Gómez", escribe el motivo y cancela
    Then la cuenta de "Carla Gómez" sigue en estado "Activo"
    And "Luna" y "Toby" siguen con sus coberturas "Al día"

  @RN-07 @RF-AUT-04 @RF-ROL-06 @RNF-SEG-07
  Scenario: La sesión abierta del dueño se corta en su próxima acción
    Given "Carla Gómez" tiene la sesión abierta
    And el administrador dio de baja a "Carla Gómez"
    When "Carla Gómez" abre "Mis mascotas"
    Then no se muestra ningún dato
    And el sistema informa "Tu cuenta está inactiva. Comunicate con WildSalud."

  @RN-07 @RF-AUT-04
  Scenario: El dueño dado de baja no puede iniciar una sesión nueva
    Given el administrador dio de baja a "Carla Gómez"
    When "Carla Gómez" intenta iniciar sesión con la cuenta de Google vinculada
    Then no se inicia ninguna sesión
    And el sistema informa "Tu cuenta está inactiva. Comunicate con WildSalud."

  @RN-10 @RNF-BAJ-03 @D73
  Scenario: Las mascotas dadas de baja dejan de aparecer para el veterinario
    Given el administrador dio de baja a "Carla Gómez"
    And el veterinario "Ana López" inició sesión
    When "Ana López" busca "30111222"
    Then no aparece ninguna mascota
    And el sistema informa "No se encontraron mascotas con esos datos."

  @RN-09 @RNF-BAJ-01 @RNF-BAJ-02 @D23
  Scenario: Se conserva el historial
    Given "Luna" tiene 5 pagos y 3 consumos registrados
    When el administrador da de baja a "Carla Gómez" con el motivo "Pidió la desafiliación" y confirma
    Then los pagos y consumos de "Luna" siguen en su historial
    And "Luna" conserva el número de afiliado "000123", que no se asigna a ninguna otra mascota

  @EX-01 @RN-08 @D98
  Scenario: El motivo es obligatorio
    When el administrador intenta dar de baja a "Carla Gómez" sin escribir un motivo
    Then no se da de baja nada
    And el sistema informa "Indicá el motivo de la baja."

  @EX-02
  Scenario: Otro administrador ya dio de baja al dueño
    Given el administrador "Marta Ruiz" abrió la baja de "Carla Gómez"
    And el administrador "Jorge Paz" dio de baja a "Carla Gómez"
    When "Marta Ruiz" confirma la baja de "Carla Gómez" con el motivo "Pidió la desafiliación"
    Then la baja de "Carla Gómez" queda registrada una sola vez, por "Jorge Paz"
    And el sistema informa "La cuenta de Carla Gómez ya está inactiva."

  @EX-03 @RN-03
  Scenario Outline: Algo cambió entre el resumen y la confirmación
    Given la cobertura de "Luna" con el plan "Plan Base" está "Al día" con la cuota de octubre 2026 pagada
    And la cobertura de "Toby" con el plan "Plan Base" está "Suspendida por falta de pago" desde el "14/10/2026" con el período "2026-10" impago
    And el administrador "Marta Ruiz" abrió la baja de "Carla Gómez" y vio el resumen
    And <cambio>
    When "Marta Ruiz" confirma la baja de "Carla Gómez" con el motivo "Pidió la desafiliación"
    Then no se da de baja nada
    And el sistema informa "La situación de Carla Gómez cambió. Revisá de nuevo lo que se va a dar de baja."

    Examples:
      | cambio                                                                             |
      | el administrador "Jorge Paz" programó el cambio de "Luna" al plan "Plan Plus"      |
      | el administrador "Jorge Paz" registró el pago del período "2026-10" de "Toby"      |

  @EX-03 @RN-03 @D27 @D54
  Scenario: Empieza un mes nuevo entre el resumen y la confirmación
    Given la cobertura de "Toby" con el plan "Plan Base" está "Suspendida por falta de pago" desde el "14/10/2026" con el período "2026-10" impago
    And el "31/10/2026 23:58" el administrador abrió la baja de "Carla Gómez" y el resumen no mostraba deuda
    When el administrador confirma la baja el "01/11/2026 00:01"
    Then no se da de baja nada
    And el sistema informa "La situación de Carla Gómez cambió. Revisá de nuevo lo que se va a dar de baja."

  @EX-04 @RN-11 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces da de baja una sola vez
    Given las coberturas de "Luna" y "Toby" están "Al día"
    When el administrador confirma la baja de "Carla Gómez" y la misma confirmación se envía dos veces
    Then la auditoría registra una sola baja de "Carla Gómez", de su cuenta, de "Luna", de "Toby" y de cada cobertura

  @EX-05 @RN-12 @RF-ROL-06 @RNF-SEG-07 @D110
  Scenario: Un veterinario no puede dar de baja a un dueño
    Given el veterinario "Ana López" inició sesión
    When "Ana López" envía la baja de "Carla Gómez" sin usar la pantalla
    Then la cuenta de "Carla Gómez" sigue en estado "Activo"
    And "Luna" y "Toby" no se dan de baja
    And el sistema informa "No tenés permiso para hacer esta operación."

  @RN-07 @D89 @D97
  Scenario: Mientras el dueño está dado de baja, su cuenta de Google queda reservada
    Given "Carla Gómez" tenía vinculada la cuenta de Google "carla.gomez@gmail.com"
    And el administrador dio de baja a "Carla Gómez"
    And el dueño "Pedro Sosa" tiene la cuenta en estado "Invitado" con una invitación sin usar
    When se usa la invitación de "Pedro Sosa" con la cuenta de Google "carla.gomez@gmail.com"
    Then no se vincula ninguna cuenta a "Pedro Sosa"
    And el sistema informa "Esta cuenta de Google ya está vinculada a otro usuario de WildSalud. Ingresá con otra cuenta."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-ROL-06 | Paso 5, RN-01, RN-07, RN-12 |
| RF-AUT-04 | RN-07 |
| RF-MAS-02 | RN-01 |
| RF-PAG-14 | Paso 5, RN-04 |
| RF-TRA-01, RNF-AUD-01 | Paso 6 |
| RNF-BAJ-01, RNF-BAJ-02 | RN-09 |
| RNF-BAJ-03 | RN-10 |
| RNF-BAJ-04 | Paso 5, RN-08 |
| RNF-SEG-02 | RN-12, EX-05 |
| RNF-SEG-07 | RN-03, RN-07, RN-12 |
| RNF-INT-01 | RN-11, EX-04 |
| RNF-USA-01 | Paso 7 |
| D10, D16 | Paso 5, RN-04 |
| D113 | RN-04, RN-05 |
| D20, D100 | RN-06, FA-04 |
| D22 | Flujo principal, RN-01, RN-02 |
| D23 | RN-09 |
| D27, D38 | Paso 5, RN-05, FA-03 |
| D28, D29, D55, D64 | RN-05 |
| D37, D47, D96, D111 | Paso 5, RN-07, FA-05 |
| D89, D92, D97 | RN-07 |
| D54 | RN-03, FA-02, EX-03 |
| D73 | RN-10 |
| D98 | RN-08, EX-01 |
| D99 | RN-13 |
| D100 | Paso 5, RN-04, RN-06 |
| D110 | RN-12, EX-05 |
