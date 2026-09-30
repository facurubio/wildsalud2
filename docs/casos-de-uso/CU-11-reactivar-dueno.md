# CU-11 — Reactivar dueño

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Volver a habilitar a un dueño dado de baja sobre su registro existente, con su historial, y enviarle una invitación nueva para que vincule otra vez su cuenta de Google o Apple. |
| **Disparador** | Un dueño dado de baja vuelve a WildSalud, o se lo dio de baja por error. |
| **Relaciones** | Revierte CU-10 Dar de baja dueño, pero solo para el dueño y su cuenta: las mascotas siguen dadas de baja y se reactivan una por una con CU-51 Reactivar mascota. Se llega desde la ficha del dueño (CU-33 Buscar/filtrar dueños y mascotas) o desde CU-08 Dar de alta dueño, cuando el DNI es de un dueño dado de baja. La persona vuelve a vincular su cuenta con la invitación nueva en CU-01 Vincular cuenta por invitación; si no le llegó o venció, se reenvía con CU-12. Los datos desactualizados se corrigen después de reactivar, con CU-09. La deuda congelada se paga con CU-26. La reactivación queda en el historial de auditoría (CU-36). |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El dueño existe y está dado de baja (su cuenta está *Inactivo*).

## Flujo principal

1. El administrador abre la ficha del dueño dado de baja y elige **Reactivar**.
2. El sistema muestra:
   - los datos registrados del dueño: nombre, apellido, DNI, email, teléfono, dirección y forma de pago preferida;
   - la fecha, el motivo y el administrador de la baja;
   - cómo va a quedar la cuenta: *Invitado*, sin cuenta de Google o Apple vinculada, y el aviso de que se enviará una invitación nueva al email registrado;
   - sus mascotas, con el aviso de que **siguen dadas de baja** y se pueden reactivar después, una por una (CU-51);
   - la deuda pendiente de sus mascotas, si la hay, con el aviso de que mientras quede no se le podrán asignar planes.
3. El administrador confirma.
4. El sistema valida las reglas **RN-01** y **RN-09**.
5. El sistema reactiva el registro existente: el dueño deja de estar dado de baja y su cuenta vuelve a **Invitado**. La vinculación anterior con Google o Apple se descarta y esa cuenta, que estaba reservada, queda libre (**RN-04**). Conserva el identificador interno, los datos y el historial. Las mascotas siguen dadas de baja y la deuda congelada sigue pendiente.
6. El sistema genera una invitación nueva de un solo uso en estado *Invitado*, que vence a las 24 horas, la envía al email registrado y registra el resultado del envío (**RN-08**). Si quedaba alguna invitación anterior sin usar, pasa a *Vencida*.
7. El sistema deja el registro de auditoría de la reactivación.
8. El sistema confirma: *"Se reactivó la cuenta de {dueño}. Le enviamos una nueva invitación a {email}."* y muestra sus mascotas dadas de baja con la opción **Reactivar mascota**.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 6 | El envío de la invitación falla. | La cuenta queda igual reactivada como *Invitado*, la invitación nueva queda generada y el envío queda registrado como fallido. El administrador la reenvía con CU-12. El sistema informa: *"Se reactivó la cuenta de {dueño}, pero no se pudo enviar la invitación a {email}. Reenviala desde su ficha."* (CU-12). |
| **FA-02** | 2 y 8 | El dueño tiene deuda congelada de alguna de sus mascotas. | Se reactiva igual. La deuda sigue pendiente (**RN-06**) y la confirmación agrega: *"Tiene deuda pendiente de {mascotas}: no se le pueden asignar planes hasta saldarla."* |
| **FA-03** | 8 | El administrador elige **Reactivar mascota** en una de las mascotas del dueño. | Se inicia CU-51 Reactivar mascota con esa mascota. |
| **FA-04** | 3 | El administrador cancela. | La cuenta sigue *Inactivo*, con su cuenta de Google o Apple reservada, y no se envía ninguna invitación. |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | La cuenta ya no está inactiva (por ejemplo, la reactivó otro administrador mientras tanto). | *"La cuenta de {dueño} no está inactiva."* |
| **EX-02** | 3 | La misma confirmación llega dos veces (doble clic o reintento de red). | La cuenta se reactiva **una sola** vez y se envía **una sola** invitación; el segundo envío devuelve el mismo resultado que el primero. |
| **EX-03** | 3 | Un usuario que no es administrador intenta reactivar al dueño (por ejemplo, un veterinario que envía el pedido sin usar la pantalla). | *"No tenés permiso para hacer esta operación."* |

## Postcondiciones

- **Éxito:** el dueño vuelve a estar en actividad sobre su mismo registro, con sus datos y su historial, pero **sin mascotas activas**. Su cuenta queda *Invitado*, sin cuenta de Google o Apple vinculada, con una invitación nueva en estado *Invitado* que vence a las 24 horas (o con el envío fallido registrado, FA-01). La cuenta de Google o Apple que tenía quedó libre: puede volver a vincularla, u otra, desde la invitación (CU-01). La deuda congelada de sus mascotas sigue pendiente. La reactivación queda en el historial de auditoría (CU-36), y la baja anterior también sigue ahí.
- **Fracaso:** el dueño sigue dado de baja, su cuenta sigue *Inactivo* y no se envía ninguna invitación.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo dueños dados de baja.** Se reactiva únicamente un dueño dado de baja, con la cuenta *Inactivo*. | D44, D47 |
| **RN-02** | **Mismo registro.** No se crea otro dueño: se reactiva el existente, con el mismo identificador interno, el mismo DNI, sus datos y su historial (mascotas dadas de baja, coberturas, pagos y consumos). | D44, D45, RNF-BAJ-02 |
| **RN-03** | **Siempre vuelve a *Invitado*.** Al reactivar, la cuenta vuelve a *Invitado* y se le envía al email registrado una invitación nueva de un solo uso, tuviera o no una cuenta de Google o Apple vinculada antes de la baja. La invitación queda en estado *Invitado*, vence a las 24 horas y es la única que sirve: las anteriores sin usar pasan a *Vencida*, aunque falle el envío de la nueva, y la que venció con la baja no se reactiva. Hasta que use la invitación, el dueño no puede ingresar. | RF-ROL-02, D24, D37, D47, D87, D97, D111 |
| **RN-04** | **Se descarta la vinculación anterior.** Mientras el dueño estaba dado de baja, su cuenta de Google o Apple estaba reservada y no se podía vincular a otro usuario. Al reactivarlo, esa vinculación se descarta y la cuenta queda libre: ya no permite ingresar por sí sola, y con la invitación nueva el dueño puede vincular la misma cuenta u otra (CU-01). | RF-ROL-03, D46, D89, D97 |
| **RN-05** | **Las mascotas siguen dadas de baja.** La reactivación no reactiva mascotas. Cada una se reactiva con CU-51 Reactivar mascota: conserva su número de afiliado y su historial, y recibe una cobertura nueva con su primer pago (CU-22), con antigüedad desde cero. | D9, D23, D107, RNF-BAJ-03 |
| **RN-06** | **La deuda sigue.** La deuda congelada de sus mascotas sigue pendiente y se puede pagar con CU-26. Mientras quede deuda, no se le puede asignar un plan a ninguna mascota del dueño: ni al reactivar una mascota (CU-51) ni al dar de alta una nueva (CU-13). | D28, D29, D38, D55, D64 |
| **RN-07** | **Datos tal como estaban.** La reactivación no modifica datos. Si cambiaron (por ejemplo, se mudó o cambió de email), el administrador los actualiza después con CU-09. Como la cuenta queda *Invitado*, si cambia el email, la invitación enviada pasa a *Vencida* y se envía una nueva al email nuevo. | RF-DUE-01, RNF-BAJ-03, D83, D84 |
| **RN-08** | **Registro del envío.** Se guarda el canal (email) y el resultado (éxito o fallo) del envío de la invitación. Un envío fallido no deshace la reactivación. | RF-NOT-03, D43 |
| **RN-09** | **Solo el administrador.** Solo el administrador reactiva dueños. El sistema rechaza el intento de cualquier otro rol, aunque no se haga desde la pantalla, con *"No tenés permiso para hacer esta operación."* | RF-ROL-02, RF-DUE-03, RNF-SEG-02, RNF-SEG-07, D110 |
| **RN-10** | **Una sola vez.** Cada confirmación se procesa una sola vez, y si dos administradores reactivan al mismo dueño a la vez, se registra una sola reactivación y se envía una sola invitación. | RNF-INT-01, D15 |
| **RN-11** | **Auditoría.** La reactivación queda registrada con el estado anterior (*Inactivo*), el estado nuevo (*Invitado*), la vinculación descartada, el administrador, la fecha y la hora. La baja anterior, con su motivo, sigue en el historial. | RF-TRA-01, RNF-AUD-01, RNF-BAJ-02 |
| **RN-12** | **Sin motivo; el único email es la invitación.** La reactivación no pide motivo (el motivo obligatorio es solo para la baja). El único email que se le envía al dueño es la invitación nueva. | D98, D99 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Dueño | Deja de figurar como dado de baja. La fecha, el motivo y el administrador de la baja anterior quedan en el historial de auditoría. |
| Cuenta | Estado *Invitado*. La vinculación anterior con Google o Apple se descarta y esa cuenta queda libre. |
| Invitación | Invitación nueva de un solo uso, en estado *Invitado*, al email registrado, con fecha y hora de envío y vencimiento (24 horas después). Las anteriores sin usar, si las había, pasan a *Vencida*. |
| Envío | Canal (email), resultado (éxito o fallo), fecha y hora (D43). |
| Auditoría | Reactivación: estado anterior, estado nuevo, vinculación descartada, administrador, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-11
Feature: CU-11 Reactivar dueño
  Como administrador
  Quiero reactivar a un dueño dado de baja
  Para que vuelva a WildSalud conservando su historial

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And existe el plan "Plan Base" con precio mensual 10000
    And la dueña "Carla Gómez" tiene DNI "30111222" y email "carla.gomez@gmail.com"
    And el administrador "Jorge Paz" dio de baja a "Carla Gómez" el "10/06/2026 09:00" con el motivo "Pidió la desafiliación" y su cuenta está en estado "Inactivo"
    And sus mascotas "Luna", con número de afiliado "000123", y "Toby", con número de afiliado "000124", quedaron dadas de baja con ella

  @flujo-principal @RN-03 @RN-11 @RN-12 @RF-TRA-01 @RNF-AUD-01 @RNF-USA-01 @D44 @D47 @D87 @D97 @D99 @D111
  Scenario Outline: La cuenta siempre vuelve a Invitado con una invitación nueva
    Given la cuenta de "Carla Gómez" estaba <situación> cuando se la dio de baja
    When el administrador reactiva a "Carla Gómez" y confirma
    Then la cuenta de "Carla Gómez" queda en estado "Invitado", sin cuenta de Google o Apple vinculada
    And se envió una invitación nueva de un solo uso a "carla.gomez@gmail.com", en estado "Invitado" y que vence el "21/10/2026 10:00", y el envío quedó registrado como exitoso
    And no se envía ningún otro email a "Carla Gómez"
    And la auditoría registra la reactivación de "Carla Gómez" con estado anterior "Inactivo", estado nuevo "Invitado", usuario "Marta Ruiz" y fecha "20/10/2026 10:00"
    And el sistema informa "Se reactivó la cuenta de Carla Gómez. Le enviamos una nueva invitación a carla.gomez@gmail.com."

    Examples:
      | situación                                              |
      | en estado "Activo", vinculada a una cuenta de Google   |
      | en estado "Invitado", sin cuenta vinculada             |

  @flujo-principal @RN-02 @RN-11 @RNF-BAJ-02 @D44 @D45
  Scenario: La reactivación conserva el registro y el historial
    Given "Luna" tuvo 8 pagos y 5 consumos antes de la baja
    When el administrador reactiva a "Carla Gómez" y confirma
    Then existe un solo dueño con el DNI "30111222"
    And "Carla Gómez" sigue con el email "carla.gomez@gmail.com"
    And los 8 pagos y los 5 consumos de "Luna" siguen en su historial
    And la auditoría sigue mostrando la baja del "10/06/2026 09:00" registrada por "Jorge Paz" con el motivo "Pidió la desafiliación"

  @RN-04 @D88 @D97
  Scenario: La cuenta de Google anterior ya no permite ingresar por sí sola
    Given la cuenta de "Carla Gómez" estaba vinculada a la cuenta de Google "carla.gomez@gmail.com" cuando se la dio de baja
    And el administrador reactivó a "Carla Gómez"
    When "Carla Gómez" intenta iniciar sesión con la cuenta de Google "carla.gomez@gmail.com" sin usar la invitación
    Then no se inicia ninguna sesión
    And el sistema informa "Esta cuenta de Google no está vinculada a WildSalud. Si recibiste una invitación, ingresá desde el enlace del email."

  @RN-04 @RN-05 @RF-ROL-04 @D97 @D109 @D111
  Scenario: Con la invitación nueva vuelve a vincular la misma cuenta y todavía no tiene mascotas
    Given la cuenta de "Carla Gómez" estaba vinculada a la cuenta de Google "carla.gomez@gmail.com" cuando se la dio de baja
    And el administrador reactivó a "Carla Gómez"
    When "Carla Gómez" usa la invitación nueva y vincula la cuenta de Google "carla.gomez@gmail.com"
    Then la cuenta de "Carla Gómez" queda en estado "Activo", vinculada a esa cuenta de Google
    And la invitación nueva queda en estado "Vigente"
    And ve el mensaje "No tenés mascotas afiliadas."

  @RN-05 @D107 @RNF-BAJ-03
  Scenario: Las mascotas siguen dadas de baja
    When el administrador reactiva a "Carla Gómez" y confirma
    Then "Luna" y "Toby" siguen dadas de baja, con los números de afiliado "000123" y "000124"
    And "Carla Gómez" no tiene mascotas activas
    And el sistema muestra a "Luna" y a "Toby" con la opción "Reactivar mascota"

  @FA-03 @RN-05 @D9 @D23 @D107
  Scenario: Una mascota del dueño reactivado se reactiva conservando su número de afiliado
    Given "Luna" tuvo 8 pagos y 5 consumos antes de la baja
    And el administrador reactivó a "Carla Gómez"
    And "Carla Gómez" no tiene deuda pendiente
    When el administrador elige "Reactivar mascota" para "Luna", le asigna el plan "Plan Base" y confirma el pago
    Then "Luna" vuelve a estar activa con el número de afiliado "000123" y su historial de 8 pagos y 5 consumos
    And "Luna" tiene una cobertura nueva "Al día" con el plan "Plan Base" y 1 período pago
    And "Toby" sigue dada de baja

  @FA-01 @RN-08 @RF-NOT-03 @D43 @D87
  Scenario: Falla el envío de la invitación al reactivar
    Given el envío de emails no está funcionando
    When el administrador reactiva a "Carla Gómez" y confirma
    Then la cuenta de "Carla Gómez" queda en estado "Invitado"
    And la invitación nueva queda en estado "Invitado", pero el envío a "carla.gomez@gmail.com" quedó registrado como fallido
    And el sistema informa "Se reactivó la cuenta de Carla Gómez, pero no se pudo enviar la invitación a carla.gomez@gmail.com. Reenviala desde su ficha."

  @FA-02 @RN-06 @D38 @D64
  Scenario: La deuda congelada sigue pendiente después de reactivar
    Given "Toby" quedó con los períodos "2026-04" y "2026-05" congelados sin pagar
    When el administrador reactiva a "Carla Gómez" y confirma
    Then la cuenta de "Carla Gómez" queda en estado "Invitado"
    And "Toby" sigue debiendo los períodos "2026-04" y "2026-05"
    And el sistema informa "Se reactivó la cuenta de Carla Gómez. Le enviamos una nueva invitación a carla.gomez@gmail.com. Tiene deuda pendiente de Toby: no se le pueden asignar planes hasta saldarla."

  @RN-06 @D29 @D55
  Scenario Outline: La deuda congelada impide asignar planes a las mascotas del dueño
    Given "Toby" quedó con los períodos "2026-04" y "2026-05" congelados sin pagar
    And el administrador reactivó a "Carla Gómez"
    When el administrador intenta <operación>
    Then no se crea ninguna cobertura
    And el sistema informa "Carla Gómez tiene deuda pendiente de Toby. No se puede asignar un plan hasta saldarla."

    Examples:
      | operación                                                              |
      | dar de alta la mascota "Nala" de "Carla Gómez" con el plan "Plan Base" |
      | reactivar la mascota "Luna" con el plan "Plan Base"                    |

  @RN-06 @D28 @D64
  Scenario: Pagada la deuda congelada, el dueño deja de estar bloqueado
    Given "Toby" quedó con los períodos "2026-04" y "2026-05" congelados sin pagar
    And el administrador reactivó a "Carla Gómez"
    When el administrador registra el pago de todos los períodos de "Toby" y confirma
    Then se registran 2 pagos de "Toby": "2026-04" y "2026-05"
    And "Carla Gómez" no tiene deuda pendiente
    And "Toby" sigue dada de baja

  @RN-07 @D84 @D87 @D111
  Scenario: Si el email cambió, se corrige después y la invitación se reemplaza
    Given el administrador reactivó a "Carla Gómez" y le envió la invitación a "carla.gomez@gmail.com"
    When el administrador cambia el email de "Carla Gómez" a "carla.gomez@hotmail.com" y guarda
    Then la invitación enviada a "carla.gomez@gmail.com" queda "Vencida"
    And se envió una invitación nueva de un solo uso a "carla.gomez@hotmail.com"

  @FA-04
  Scenario: El administrador cancela la reactivación
    When el administrador elige reactivar a "Carla Gómez" y cancela
    Then la cuenta de "Carla Gómez" sigue en estado "Inactivo"
    And no se envía ninguna invitación

  @EX-01 @RN-01 @RN-10 @D15
  Scenario: Otro administrador ya reactivó al dueño
    Given el administrador "Jorge Paz" reactivó a "Carla Gómez" el "20/10/2026 09:55"
    When "Marta Ruiz" intenta reactivar a "Carla Gómez"
    Then la auditoría registra una sola reactivación de "Carla Gómez", hecha por "Jorge Paz"
    And se envió una sola invitación a "carla.gomez@gmail.com"
    And el sistema informa "La cuenta de Carla Gómez no está inactiva."

  @EX-02 @RN-10 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces reactiva una sola vez
    When el administrador confirma la reactivación de "Carla Gómez" y la misma confirmación se envía dos veces
    Then la auditoría registra una sola reactivación de "Carla Gómez"
    And se envió una sola invitación a "carla.gomez@gmail.com"

  @EX-03 @RN-09 @RF-ROL-02 @RNF-SEG-07 @D110
  Scenario: Un veterinario no puede reactivar a un dueño
    Given el veterinario "Ana López" inició sesión
    When "Ana López" envía la reactivación de "Carla Gómez" sin usar la pantalla
    Then la cuenta de "Carla Gómez" sigue en estado "Inactivo"
    And el sistema informa "No tenés permiso para hacer esta operación."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-ROL-02, RF-DUE-03 | Actor principal, RN-03, RN-09 |
| RF-ROL-03 | RN-04 |
| RF-ROL-04 | RN-05 |
| RF-DUE-01 | RN-07 |
| RF-NOT-03 | Paso 6, RN-08, FA-01 |
| RF-TRA-01, RNF-AUD-01 | Paso 7, RN-11 |
| RNF-BAJ-02 | RN-02, RN-11 |
| RNF-BAJ-03 | RN-05, RN-07 |
| RNF-SEG-02, RNF-SEG-07 | RN-09, EX-03 |
| RNF-INT-01 | RN-10, EX-02 |
| RNF-USA-01 | Paso 8 |
| D9, D23, D107 | RN-05, FA-03 |
| D15 | RN-10, EX-01 |
| D24, D37, D47, D87, D111 | Pasos 5 y 6, RN-01, RN-03, FA-01 |
| D28, D29, D38, D55, D64 | RN-06, FA-02 |
| D43 | RN-08, FA-01 |
| D44, D45 | Paso 5, RN-01, RN-02 |
| D46, D89 | RN-04 |
| D83, D84 | RN-07 |
| D88, D109 | RN-04 (escenarios de ingreso) |
| D97 | Paso 5, RN-03, RN-04 |
| D98, D99 | RN-12 |
| D110 | RN-09, EX-03 |
