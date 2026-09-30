# CU-06 — Dar de baja veterinario

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Inhabilitar el acceso de un veterinario asociado conservando sus datos, su historial y los consumos que registró. |
| **Disparador** | El veterinario deja de trabajar con WildSalud (dejó la veterinaria adherida o la veterinaria dejó la red), o se lo dio de alta por error. |
| **Relaciones** | Se revierte con CU-07 Reactivar veterinario. Después de la baja, el veterinario no puede iniciar sesión (CU-02) ni vincular una cuenta (CU-01), y no se le puede reenviar la invitación (CU-12); si tenía la sesión abierta, su próxima acción en CU-37, CU-38 o CU-39 se rechaza. Los consumos que registró los sigue corrigiendo o anulando el administrador (CU-30, CU-31). La baja queda en el historial de auditoría (CU-36). |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El veterinario existe y su cuenta está *Invitado* o *Activo*.

## Flujo principal

1. El administrador abre la ficha del veterinario desde la lista de veterinarios (**RN-06**) y elige **Dar de baja**.
2. El sistema muestra el nombre, el DNI, la veterinaria y el estado de la cuenta del veterinario, y avisa qué implica la baja: no va a poder ingresar ni registrar consumos, y se conservan sus datos y los consumos que registró.
3. El administrador escribe el **motivo** de la baja y confirma.
4. El sistema valida las reglas **RN-01**, **RN-08** y **RN-09**.
5. El sistema pasa la cuenta a **Inactivo** (baja lógica) y registra el motivo, la fecha y hora de la baja y el administrador responsable. No elimina ni modifica los datos del veterinario, su cuenta de Google o Apple vinculada ni sus consumos.
6. Desde ese momento el sistema rechaza cualquier acción del veterinario, también si tenía la sesión abierta (**RN-04**).
7. El sistema deja el registro de auditoría de la baja. No le envía ningún email al veterinario (**RN-08**).
8. El sistema confirma: *"Se dio de baja a {veterinario}. Su cuenta quedó inactiva."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 5 | La cuenta del veterinario está *Invitado* (nunca vinculó una cuenta de Google o Apple). | La cuenta pasa a *Inactivo* y la invitación sin usar pasa a *Vencida*: si la persona usa el enlace, CU-01 no vincula ninguna cuenta y muestra el mensaje de cuenta inactiva. |
| **FA-02** | 3 | El administrador cancela. | La cuenta del veterinario no cambia. |

## Excepciones

En todas las excepciones **la cuenta del veterinario no cambia**, y el sistema informa el motivo.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | La cuenta ya está inactiva (por ejemplo, la dio de baja otro administrador mientras tanto). | *"La cuenta de {veterinario} ya está inactiva."* |
| **EX-02** | 3 | La misma confirmación llega dos veces (doble clic o reintento de red). | La baja se registra **una sola** vez; el segundo envío devuelve el mismo resultado que el primero. |
| **EX-03** | 4 | No se escribió el motivo. | *"Indicá el motivo de la baja."* |
| **EX-04** | 4 | Quien pide la baja no es administrador (por ejemplo, un veterinario que lo intenta sin usar la pantalla). | *"No tenés permiso para hacer esta operación."* |

## Postcondiciones

- **Éxito:** la cuenta del veterinario queda *Inactivo*, con el motivo, la fecha y hora de la baja y el administrador responsable. No puede iniciar sesión ni hacer ninguna acción, aunque tuviera la sesión abierta. Su cuenta de Google o Apple, si la tenía, queda reservada y no se puede vincular a otro usuario. Sus datos, su historial y los consumos que registró se conservan sin cambios. La baja queda en el historial de auditoría (CU-36).
- **Fracaso:** la cuenta del veterinario no cambia.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Qué se puede dar de baja.** Un veterinario con la cuenta *Invitado* o *Activo*. Un veterinario *Invitado* pasa directamente a *Inactivo* y su invitación sin usar pasa a *Vencida*. | D47, D96 |
| **RN-02** | **Borrado lógico.** No se elimina nada: la baja cambia el estado de la cuenta y registra el motivo, la fecha y hora de la baja y el administrador responsable. | RNF-BAJ-01, RNF-BAJ-02, RNF-BAJ-04 |
| **RN-03** | **Sin nuevos accesos.** El veterinario dado de baja no puede iniciar sesión (CU-02), no puede usar una invitación que no haya usado (CU-01) y no se le puede reenviar una (CU-12): primero hay que reactivarlo. Su cuenta de Google o Apple vinculada queda reservada: mientras esté dado de baja no se puede vincular a otro usuario. Al reactivarlo, esa vinculación se descarta y se le envía una invitación nueva (CU-07). | RF-AUT-04, RF-VET-05, RF-ROL-06, D37, D47, D89, D92, D97, D111 |
| **RN-04** | **Sesión abierta.** El estado de la cuenta se valida en el sistema en cada acción. Si el veterinario tenía la sesión abierta, su próxima acción se rechaza con *"Tu cuenta está inactiva. Comunicate con el administrador."* Un consumo que se confirmó antes de la baja sigue válido; uno que se confirma después se rechaza (CU-39 EX-08). | RF-AUT-03, RF-ROL-06, RNF-SEG-07 |
| **RN-05** | **Historial y consumos.** Los consumos que registró el veterinario siguen siendo válidos, siguen contando para los saldos y conservan su nombre y la copia de su veterinaria. El administrador los puede seguir corrigiendo o anulando (CU-30, CU-31). | RF-VET-05, RNF-BAJ-02, D14, D34 |
| **RN-06** | **Fuera de las operaciones.** La baja se inicia desde la lista de veterinarios, que es navegación dentro del caso. Un veterinario dado de baja no aparece entre los veterinarios en actividad; el administrador lo ve solo al filtrar los dados de baja, con la fecha de la baja. Sus datos no se modifican (CU-05) hasta que se lo reactive. | RNF-BAJ-03, D83, D86 |
| **RN-07** | **Reingreso.** Si el veterinario vuelve, se reactiva este mismo registro con su historial (CU-07); no se crea otro. | D44 |
| **RN-08** | **Motivo obligatorio y sin aviso.** La baja exige un motivo en texto libre, que se registra con la fecha y hora y el administrador. No se le envía ningún email al veterinario. | RNF-BAJ-04, D98, D99 |
| **RN-09** | **Solo el administrador.** Solo el administrador da de baja veterinarios. El sistema rechaza el intento de cualquier otro rol, aunque no se haga desde la pantalla, con el mensaje de EX-04. | RF-VET-04, RF-ROL-01, RNF-SEG-02, RNF-SEG-07, D110 |
| **RN-10** | **Una sola vez.** Cada confirmación se procesa una sola vez, y si dos administradores dan de baja al mismo veterinario a la vez, se registra una sola baja. | RNF-INT-01, D15 |
| **RN-11** | **Auditoría.** La baja queda registrada con el estado anterior (*Invitado* o *Activo*), el estado nuevo (*Inactivo*), el motivo, el administrador, la fecha y la hora. | RF-TRA-01, RNF-AUD-01 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Cuenta | Estado *Inactivo*, motivo de la baja (texto libre), fecha y hora de la baja, administrador responsable. |
| Invitación | Solo si la cuenta estaba *Invitado*: la invitación sin usar pasa a *Vencida* (D111); al reactivarla se genera una nueva (D97). |
| Veterinario, vinculación y consumos | Sin cambios: no se eliminan ni se modifican. La cuenta de Google o Apple vinculada queda reservada. |
| Auditoría | Baja del veterinario: estado anterior, estado nuevo, motivo, administrador, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-06
Feature: CU-06 Dar de baja veterinario
  Como administrador
  Quiero dar de baja a un veterinario que dejó de trabajar con WildSalud
  Para que no pueda ingresar, sin perder su historial ni sus consumos

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And el veterinario "Ana López" de la veterinaria "Patitas" tiene DNI "27333444" y email "ana.lopez@gmail.com"
    And la cuenta de "Ana López" está en estado "Activo" y vinculada a una cuenta de Google, salvo que el escenario indique otra

  @flujo-principal @RF-VET-05 @RF-ROL-06 @RNF-BAJ-04 @RF-TRA-01 @RNF-USA-01 @D98 @D99
  Scenario: Baja de un veterinario activo
    When el administrador da de baja a "Ana López" con el motivo "Dejó de trabajar en Patitas" y confirma
    Then la cuenta de "Ana López" queda en estado "Inactivo" con motivo "Dejó de trabajar en Patitas", fecha de baja "20/10/2026 10:00" y registrada por "Marta Ruiz"
    And "Ana López" sigue registrada con DNI "27333444", veterinaria "Patitas" y email "ana.lopez@gmail.com"
    And la auditoría registra la baja de "Ana López" con estado anterior "Activo", estado nuevo "Inactivo", motivo "Dejó de trabajar en Patitas", usuario "Marta Ruiz" y fecha "20/10/2026 10:00"
    And no se envía ningún email a "Ana López"
    And el sistema informa "Se dio de baja a Ana López. Su cuenta quedó inactiva."

  @EX-03 @RN-08 @RNF-BAJ-04 @D98
  Scenario Outline: El motivo es obligatorio
    When el administrador intenta dar de baja a "Ana López" con el motivo <motivo>
    Then la cuenta de "Ana López" sigue en estado "Activo"
    And el sistema informa "Indicá el motivo de la baja."

    Examples:
      | motivo                    |
      | vacío                     |
      | formado solo por espacios |

  @RN-03 @RF-AUT-04 @RF-ROL-06 @D92
  Scenario: Un veterinario dado de baja no puede iniciar sesión
    Given el administrador dio de baja a "Ana López"
    When "Ana López" intenta iniciar sesión con su cuenta de Google
    Then "Ana López" no inicia sesión
    And el sistema informa "Tu cuenta está inactiva. Comunicate con el administrador."

  @RN-03 @RF-ROL-03 @D89 @D97
  Scenario: La cuenta de Google de un veterinario dado de baja queda reservada
    Given "Ana López" tiene vinculada la cuenta de Google "ana.lopez@gmail.com"
    And el administrador dio de baja a "Ana López"
    And la dueña "Carla Gómez" tiene una invitación en estado "Invitado"
    When "Carla Gómez" usa su invitación con la cuenta de Google "ana.lopez@gmail.com"
    Then no se vincula ninguna cuenta a "Carla Gómez"
    And la invitación de "Carla Gómez" sigue en estado "Invitado"
    And el sistema informa "Esta cuenta de Google ya está vinculada a otro usuario de WildSalud. Ingresá con otra cuenta."

  @RN-04 @RF-AUT-03 @RNF-SEG-07
  Scenario Outline: Con la sesión abierta, la próxima acción se rechaza
    Given "Ana López" tiene la sesión abierta
    And la cobertura de "Luna" está "Al día" y tiene saldo de "Consulta"
    And el administrador dio de baja a "Ana López"
    When "Ana López" intenta <acción>
    Then la acción no se realiza
    And el sistema informa "Tu cuenta está inactiva. Comunicate con el administrador."

    Examples:
      | acción                                 |
      | buscar la mascota "Luna"               |
      | abrir la ficha de "Luna"               |
      | registrar una "Consulta" para "Luna"   |

  @RN-05 @RF-VET-05 @D14 @D34
  Scenario: Los consumos que registró se conservan
    Given el "05/10/2026" "Ana López" registró una "Consulta" para "Luna" con la veterinaria "Patitas"
    When el administrador da de baja a "Ana López" con el motivo "Dejó de trabajar en Patitas" y confirma
    Then la "Consulta" del "05/10/2026" de "Luna" sigue "Válida", con el veterinario "Ana López" y la veterinaria "Patitas"
    And el saldo de "Consulta" de "Luna" para el mes en curso no cambia

  @FA-01 @RN-01 @D47 @D96 @D111
  Scenario: Baja de un veterinario invitado
    Given la cuenta de "Ana López" está en estado "Invitado" con una invitación en estado "Invitado" enviada a "ana.lopez@gmail.com"
    When el administrador da de baja a "Ana López" con el motivo "Alta cargada por error" y confirma
    Then la cuenta de "Ana López" queda en estado "Inactivo" con motivo "Alta cargada por error"
    And la invitación enviada a "ana.lopez@gmail.com" queda "Vencida"

  @FA-01 @RN-03 @D92 @D96
  Scenario: La invitación de un veterinario dado de baja ya no sirve
    Given la cuenta de "Ana López" estaba en estado "Invitado" con una invitación en estado "Invitado" enviada a "ana.lopez@gmail.com"
    And el administrador dio de baja a "Ana López"
    When la persona usa el enlace de esa invitación para vincular su cuenta de Google
    Then no se vincula ninguna cuenta de Google o Apple a "Ana López"
    And la cuenta de "Ana López" sigue en estado "Inactivo"
    And el sistema informa "Tu cuenta está inactiva. Comunicate con el administrador."

  @FA-02
  Scenario: El administrador cancela la baja
    When el administrador elige dar de baja a "Ana López", escribe el motivo y cancela
    Then la cuenta de "Ana López" sigue en estado "Activo"

  @EX-01 @RN-10 @D15
  Scenario: Otro administrador ya dio de baja al veterinario
    Given el administrador "Jorge Paz" dio de baja a "Ana López" el "20/10/2026 09:50" con el motivo "Dejó la red"
    When "Marta Ruiz" intenta dar de baja a "Ana López" con el motivo "Dejó de trabajar en Patitas"
    Then la baja de "Ana López" sigue registrada por "Jorge Paz" el "20/10/2026 09:50" con el motivo "Dejó la red"
    And el sistema informa "La cuenta de Ana López ya está inactiva."

  @EX-02 @RN-10 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces registra una sola baja
    When el administrador confirma la baja de "Ana López" con el motivo "Dejó de trabajar en Patitas" y la misma confirmación se envía dos veces
    Then la cuenta de "Ana López" queda en estado "Inactivo"
    And la auditoría registra una sola baja de "Ana López"

  @RN-06 @RNF-BAJ-03 @D86
  Scenario: El veterinario dado de baja solo aparece al filtrar los dados de baja
    Given el administrador dio de baja a "Ana López" el "20/10/2026 09:00"
    And el veterinario "Pablo Díaz" de la veterinaria "Huellas" tiene la cuenta en estado "Activo"
    When el administrador consulta la lista de veterinarios
    Then la lista muestra a "Pablo Díaz" y no muestra a "Ana López"
    And al filtrar los dados de baja, la lista muestra a "Ana López" con fecha de baja "20/10/2026 09:00"

  @EX-04 @RN-09 @RF-VET-04 @RNF-SEG-07 @D110
  Scenario: Un veterinario no puede dar de baja a otro veterinario
    Given el veterinario "Pablo Díaz" de la veterinaria "Huellas" inició sesión
    When "Pablo Díaz" envía la baja de "Ana López" sin usar la pantalla
    Then la cuenta de "Ana López" sigue en estado "Activo"
    And el sistema informa "No tenés permiso para hacer esta operación."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-VET-04, RF-ROL-01 | Actor principal, RN-09, EX-04 |
| RF-VET-05 | Paso 5, RN-03, RN-05 |
| RF-ROL-03 | RN-03 |
| RF-ROL-06 | Paso 5, RN-03, RN-04 |
| RF-AUT-03 | RN-04 |
| RF-AUT-04 | RN-03 |
| RF-TRA-01, RNF-AUD-01 | Paso 7, RN-11 |
| RNF-BAJ-01, RNF-BAJ-02 | Paso 5, RN-02, RN-05 |
| RNF-BAJ-03 | RN-06 |
| RNF-BAJ-04 | Pasos 3 y 5, RN-02, RN-08, EX-03 |
| RNF-SEG-02, RNF-SEG-07 | RN-04, RN-09, EX-04 |
| RNF-INT-01 | RN-10, EX-02 |
| RNF-USA-01 | Paso 8 |
| D14, D34 | RN-05 |
| D15 | RN-10, EX-01 |
| D37, D47 | RN-01, RN-03, FA-01 |
| D44 | RN-07 |
| D83, D86 | Paso 1, RN-06 |
| D89, D92, D97 | RN-03 |
| D111 | RN-01, RN-03, FA-01 |
| D96 | RN-01, FA-01 |
| D98 | Paso 3, RN-08, EX-03 |
| D99 | Paso 7, RN-08 |
| D110 | RN-09, EX-04 |
