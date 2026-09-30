# CU-07 — Reactivar veterinario

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Volver a habilitar a un veterinario dado de baja sobre su registro existente, con su historial, y enviarle una invitación nueva para que vuelva a vincular su cuenta de Google o Apple. |
| **Disparador** | Un veterinario dado de baja vuelve a trabajar con WildSalud, o se lo dio de baja por error. |
| **Relaciones** | Revierte CU-06 Dar de baja veterinario. Se llega también desde CU-04 Dar de alta veterinario cuando el DNI es de un veterinario dado de baja. La cuenta vuelve a *Invitado* y la persona la vincula de nuevo en CU-01 Vincular cuenta por invitación; si la invitación no llega o vence, se reenvía con CU-12. Los datos desactualizados se corrigen después de reactivar, con CU-05 (si cambia el email, CU-05 reemplaza la invitación). La reactivación queda en el historial de auditoría (CU-36). |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El veterinario existe y su cuenta está *Inactivo*.

## Flujo principal

1. El administrador filtra los veterinarios dados de baja en la lista de veterinarios (D86), abre la ficha del veterinario y elige **Reactivar**.
2. El sistema muestra los datos registrados (nombre, apellido, DNI, veterinaria, teléfono y email), la fecha, el motivo y el administrador de la baja, y avisa cómo va a quedar la cuenta: *Invitado*, sin la cuenta de Google o Apple que tuviera vinculada, con una invitación nueva al email registrado que vence a las 24 horas.
3. El administrador confirma.
4. El sistema valida las reglas **RN-01** y **RN-08**.
5. El sistema reactiva el registro existente: la cuenta vuelve a **Invitado** y se descarta la vinculación anterior, si la había (**RN-03**, **RN-04**). Conserva el identificador interno, los datos y el historial, incluidos los consumos que registró.
6. El sistema genera una invitación nueva de un solo uso, que vence a las 24 horas, la envía al email registrado y registra el resultado del envío (**RN-06**).
7. El sistema deja el registro de auditoría de la reactivación.
8. El sistema confirma: *"Se reactivó la cuenta de {veterinario}. Le enviamos una nueva invitación a {email}."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 5 | El veterinario tenía una cuenta de Google o Apple vinculada antes de la baja. | Esa vinculación se descarta y la cuenta del proveedor deja de estar reservada. Hasta usar la invitación nueva, el veterinario no puede ingresar con ella (CU-02 la rechaza como cuenta no vinculada). Con la invitación nueva puede vincular esa misma cuenta u otra (CU-01). |
| **FA-02** | 6 | El envío de la invitación falla. | La cuenta queda igual reactivada como *Invitado*; la invitación nueva queda en estado *Invitado*, pero sin entregar, y el envío queda registrado como fallido. El sistema informa: *"Se reactivó la cuenta de {veterinario}, pero no se pudo enviar la invitación a {email}. Reenviala desde su ficha."* (CU-12). |
| **FA-03** | 3 | El administrador cancela. | La cuenta sigue *Inactivo*, con su vinculación reservada si la tenía, y no se envía ninguna invitación. |

## Excepciones

En todas las excepciones **la cuenta del veterinario no cambia** ni se envía ninguna invitación, y el sistema informa el motivo.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | La cuenta ya no está inactiva (por ejemplo, la reactivó otro administrador mientras tanto). | *"La cuenta de {veterinario} no está inactiva."* |
| **EX-02** | 3 | La misma confirmación llega dos veces (doble clic o reintento de red). | La cuenta se reactiva **una sola** vez y se envía **una sola** invitación; el segundo envío devuelve el mismo resultado que el primero. |
| **EX-03** | 4 | Quien pide la reactivación no es administrador (por ejemplo, un veterinario que lo intenta sin usar la pantalla). | *"No tenés permiso para hacer esta operación."* |

## Postcondiciones

- **Éxito:** el veterinario vuelve a estar en actividad sobre su mismo registro, con sus datos, su historial y sus consumos. Su cuenta está *Invitado*, sin cuenta de Google o Apple vinculada, y tiene una invitación nueva en estado *Invitado*, que vence a las 24 horas (o sin entregar, con el envío fallido registrado, FA-02). Todavía no puede ingresar: primero tiene que vincular su cuenta, la misma que tenía u otra, desde la invitación (CU-01). La reactivación queda en el historial de auditoría (CU-36), y la baja anterior, con su motivo, también sigue ahí.
- **Fracaso:** la cuenta sigue *Inactivo*, con su vinculación reservada si la tenía, y no se envía ninguna invitación.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo cuentas inactivas.** Se reactiva únicamente un veterinario con la cuenta *Inactivo*. | D47 |
| **RN-02** | **Mismo registro.** No se crea otro veterinario: se reactiva el existente, con el mismo identificador interno, el mismo DNI, sus datos y su historial, incluidos los consumos que registró. | D44, D45, RF-VET-05, RNF-BAJ-02 |
| **RN-03** | **Siempre vuelve a *Invitado*.** Tuviera o no una cuenta de Google o Apple vinculada, la cuenta vuelve a *Invitado* y se le envía una invitación nueva de un solo uso al email registrado, que vence a las 24 horas. Solo sirve esa invitación: cualquier invitación anterior sin usar pasa a *Vencida*, aunque falle el envío de la nueva. La cuenta pasa a *Activo* cuando la persona la vincula en CU-01. No hay contraseña propia. | D24, D37, D47, D87, D97, D111 |
| **RN-04** | **Vinculación liberada.** Mientras el veterinario estuvo dado de baja, su cuenta de Google o Apple quedó reservada (CU-06). Al reactivarlo, esa vinculación se descarta y la cuenta del proveedor se libera: la persona puede volver a vincular esa misma cuenta u otra. Una cuenta del proveedor vinculada a otro usuario se rechaza en CU-01. | RF-ROL-03, D46, D89, D97 |
| **RN-05** | **Datos tal como estaban.** La reactivación no modifica datos. Si cambiaron (por ejemplo, trabaja en otra veterinaria), el administrador los actualiza después con CU-05, porque a un veterinario *Inactivo* no se lo edita. Si cambia el email, CU-05 reemplaza la invitación por una nueva al email nuevo. | RF-VET-04, RNF-BAJ-03, D83, D84 |
| **RN-06** | **Registro del envío.** Se guarda el canal (email) y el resultado (éxito o fallo) del envío de la invitación. Un envío fallido no deshace la reactivación. | RF-NOT-03, D43 |
| **RN-07** | **Sin motivo; el único email es la invitación.** La reactivación no pide motivo (solo la baja lo exige). El único email que se le envía al veterinario es la invitación de RN-03. | D98, D99 |
| **RN-08** | **Solo el administrador.** Solo el administrador reactiva veterinarios. El sistema rechaza el intento de cualquier otro rol, aunque no se haga desde la pantalla, con el mensaje de EX-03. | RF-VET-04, RF-ROL-01, RNF-SEG-02, RNF-SEG-07, D110 |
| **RN-09** | **Una sola vez.** Cada confirmación se procesa una sola vez, y si dos administradores reactivan al mismo veterinario a la vez, se registra una sola reactivación y se envía una sola invitación. | RNF-INT-01, D15 |
| **RN-10** | **Auditoría.** La reactivación queda registrada con el estado anterior (*Inactivo*), el estado nuevo (*Invitado*), si se descartó una vinculación, el administrador, la fecha y la hora. La baja anterior, con su motivo, sigue en el historial. | RF-TRA-01, RNF-AUD-01, RNF-BAJ-02 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Cuenta | Estado *Invitado*, sin cuenta de Google o Apple vinculada: la anterior, si la había, se descarta y deja de estar reservada. Deja de figurar como dada de baja; la fecha, el motivo y el responsable de la baja anterior quedan en el historial de auditoría. |
| Invitación | Invitación nueva de un solo uso, en estado *Invitado*, al email registrado, con vencimiento 24 horas después del envío (pasa a *Vigente* cuando la persona la acepta en CU-01). Cualquier invitación anterior sin usar pasa a *Vencida*. |
| Envío | Canal (email), resultado (éxito o fallo), fecha y hora (D43). |
| Auditoría | Reactivación: estado anterior, estado nuevo, vinculación descartada (si la había), administrador, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-07
Feature: CU-07 Reactivar veterinario
  Como administrador
  Quiero reactivar a un veterinario dado de baja
  Para que vuelva a trabajar con WildSalud conservando su historial

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And el veterinario "Ana López" de la veterinaria "Patitas" tiene DNI "27333444" y email "ana.lopez@gmail.com"
    And el administrador "Jorge Paz" dio de baja a "Ana López" el "10/08/2026 09:00" con el motivo "Dejó la red" y su cuenta está en estado "Inactivo"

  @flujo-principal @RN-03 @RF-TRA-01 @RNF-USA-01 @D44 @D87 @D97 @D99
  Scenario: Reactivar un veterinario que tenía su cuenta vinculada
    Given "Ana López" tenía vinculada una cuenta de Google antes de la baja
    When el administrador reactiva a "Ana López" y confirma
    Then la cuenta de "Ana López" queda en estado "Invitado", sin cuenta de Google o Apple vinculada
    And se envió una invitación nueva de un solo uso a "ana.lopez@gmail.com", que vence el "21/10/2026 10:00", y el envío quedó registrado como exitoso
    And la auditoría registra la reactivación de "Ana López" con estado anterior "Inactivo", estado nuevo "Invitado", usuario "Marta Ruiz" y fecha "20/10/2026 10:00"
    And el sistema informa "Se reactivó la cuenta de Ana López. Le enviamos una nueva invitación a ana.lopez@gmail.com."

  @RN-03 @D47 @D97
  Scenario Outline: La cuenta siempre vuelve a Invitado con una invitación nueva
    Given la cuenta de "Ana López" estaba en estado "<estado antes de la baja>" cuando se la dio de baja
    When el administrador reactiva a "Ana López" y confirma
    Then la cuenta de "Ana López" queda en estado "Invitado", sin cuenta de Google o Apple vinculada
    And se envió una invitación nueva de un solo uso a "ana.lopez@gmail.com"

    Examples:
      | estado antes de la baja |
      | Activo                  |
      | Invitado                |

  @RN-02 @RF-VET-05 @D44 @D45
  Scenario: La reactivación conserva el registro, los datos y los consumos
    Given el "05/07/2026" "Ana López" registró una "Consulta" para "Luna" con la veterinaria "Patitas"
    When el administrador reactiva a "Ana López" y confirma
    Then existe un solo veterinario con el DNI "27333444"
    And "Ana López" sigue con la veterinaria "Patitas" y el email "ana.lopez@gmail.com"
    And la "Consulta" del "05/07/2026" de "Luna" sigue asociada a "Ana López"
    And la auditoría sigue mostrando la baja del "10/08/2026 09:00" registrada por "Jorge Paz" con el motivo "Dejó la red"

  @FA-01 @RN-03 @D88 @D97
  Scenario: Antes de usar la invitación nueva no puede ingresar con su cuenta anterior
    Given "Ana López" tenía vinculada la cuenta de Google "ana.lopez@gmail.com" antes de la baja
    And el administrador reactivó a "Ana López"
    When "Ana López" intenta iniciar sesión con la cuenta de Google "ana.lopez@gmail.com" sin usar la invitación
    Then "Ana López" no inicia sesión
    And el sistema informa "Esta cuenta de Google no está vinculada a WildSalud. Si recibiste una invitación, ingresá desde el enlace del email."

  @FA-01 @RN-04 @D89 @D97 @D111
  Scenario: Con la invitación nueva puede volver a vincular la misma cuenta
    Given "Ana López" tenía vinculada la cuenta de Google "ana.lopez@gmail.com" antes de la baja
    And el administrador reactivó a "Ana López"
    When "Ana López" usa la invitación nueva con la cuenta de Google "ana.lopez@gmail.com"
    Then la cuenta de "Ana López" queda en estado "Activo", vinculada a la cuenta de Google "ana.lopez@gmail.com"
    And la invitación nueva queda en estado "Vigente"

  @FA-02 @RN-06 @RF-NOT-03 @D43 @D87 @D111
  Scenario: Falla el envío de la invitación al reactivar
    Given el envío de emails no está funcionando
    When el administrador reactiva a "Ana López" y confirma
    Then la cuenta de "Ana López" queda en estado "Invitado"
    And la invitación nueva de "Ana López" queda en estado "Invitado", sin entregar
    And el envío de la invitación a "ana.lopez@gmail.com" quedó registrado como fallido
    And el sistema informa "Se reactivó la cuenta de Ana López, pero no se pudo enviar la invitación a ana.lopez@gmail.com. Reenviala desde su ficha."

  @FA-03 @D97
  Scenario: El administrador cancela la reactivación
    Given "Ana López" tenía vinculada una cuenta de Google antes de la baja
    When el administrador elige reactivar a "Ana López" y cancela
    Then la cuenta de "Ana López" sigue en estado "Inactivo"
    And su cuenta de Google sigue reservada para "Ana López"
    And no se envía ninguna invitación

  @RN-05 @D83 @D84
  Scenario: Si el email cambió, se corrige después de reactivar y la invitación se reemplaza
    Given el administrador reactivó a "Ana López" y le envió una invitación a "ana.lopez@gmail.com"
    When el administrador cambia el email de "Ana López" a "ana.lopez@huellas.com.ar" y guarda
    Then la invitación enviada a "ana.lopez@gmail.com" queda "Vencida"
    And se envió una invitación nueva de un solo uso a "ana.lopez@huellas.com.ar"

  @EX-01 @RN-01 @RN-09 @D15
  Scenario: Otro administrador ya reactivó al veterinario
    Given el administrador "Jorge Paz" reactivó a "Ana López" el "20/10/2026 09:55"
    When "Marta Ruiz" intenta reactivar a "Ana López"
    Then la auditoría registra una sola reactivación de "Ana López", hecha por "Jorge Paz"
    And se envió una sola invitación a "ana.lopez@gmail.com"
    And el sistema informa "La cuenta de Ana López no está inactiva."

  @EX-02 @RN-09 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces reactiva una sola vez
    When el administrador confirma la reactivación de "Ana López" y la misma confirmación se envía dos veces
    Then la auditoría registra una sola reactivación de "Ana López"
    And se envió una sola invitación a "ana.lopez@gmail.com"

  @EX-03 @RN-08 @RF-VET-04 @RNF-SEG-07 @D110
  Scenario: Un veterinario no puede reactivar a otro veterinario
    Given el veterinario "Pablo Díaz" de la veterinaria "Huellas" inició sesión
    When "Pablo Díaz" envía la reactivación de "Ana López" sin usar la pantalla
    Then la cuenta de "Ana López" sigue en estado "Inactivo"
    And el sistema informa "No tenés permiso para hacer esta operación."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-VET-04, RF-ROL-01 | Actor principal, RN-05, RN-08, EX-03 |
| RF-VET-05 | RN-02 |
| RF-ROL-03 | RN-04 |
| RF-NOT-03 | Paso 6, RN-06, FA-02 |
| RF-TRA-01, RNF-AUD-01 | Paso 7, RN-10 |
| RNF-BAJ-02 | RN-02, RN-10 |
| RNF-BAJ-03 | RN-05 |
| RNF-SEG-02, RNF-SEG-07 | RN-08, EX-03 |
| RNF-INT-01 | RN-09, EX-02 |
| RNF-USA-01 | Paso 8 |
| D15 | RN-09, EX-01 |
| D24, D37, D47 | Paso 5, RN-01, RN-03 |
| D43 | RN-06, FA-02 |
| D44, D45 | Paso 5, RN-02 |
| D46, D89 | RN-04, FA-01 |
| D83, D84 | RN-05 |
| D86 | Paso 1 |
| D87 | Paso 6, RN-03 |
| D88 | FA-01 |
| D97 | Pasos 2, 5 y 6, RN-03, RN-04, FA-01, FA-03 |
| D98, D99 | RN-07 |
| D110 | RN-08, EX-03 |
| D111 | RN-03, FA-02, Datos que se registran |
