# CU-03 — Cerrar sesión

| Campo | Valor |
|-------|-------|
| **Actor principal** | Usuario con sesión iniciada: administrador, veterinario asociado o dueño afiliado |
| **Objetivo** | Terminar su sesión en el dispositivo, para que nadie más pueda usarla. |
| **Disparador** | La persona termina de usar WildSalud, sobre todo en un dispositivo compartido (por ejemplo, la computadora del consultorio). |
| **Relaciones** | La sesión se inicia en CU-02 Iniciar sesión con Google/Apple o al terminar CU-01 Vincular cuenta por invitación. El sistema también cierra la sesión solo: por inactividad, cuando la cuenta pasa a estado *Inactivo* (CU-06 Dar de baja veterinario, CU-10 Dar de baja dueño) o cuando se vincula otra cuenta al usuario (CU-01). |

## Precondiciones

1. El usuario tiene una sesión abierta (CU-02).

## Flujo principal

1. El usuario elige **Cerrar sesión**.
2. El sistema cierra la sesión en el sistema, sin pedir confirmación (**RN-01**).
3. El sistema registra el cierre con motivo *manual* (**RN-05**).
4. El sistema deja de mostrar los datos de la pantalla anterior y muestra la pantalla de ingreso con *"Cerraste sesión."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | — | La sesión pasó 4 horas sin actividad. | El sistema la cierra solo (**RN-03**). En la siguiente acción del usuario muestra la pantalla de ingreso con *"Tu sesión venció por inactividad. Ingresá de nuevo."* La operación que se estaba confirmando no se procesa. |
| **FA-02** | 2 | El usuario tiene sesiones abiertas en otros dispositivos. | Solo se cierra la sesión de ese dispositivo; las demás siguen abiertas hasta que se cierren o venzan (**RN-02**). |
| **FA-03** | 1 | La sesión ya estaba cerrada o vencida (por ejemplo, se cerró en otra pestaña). | El sistema muestra la pantalla de ingreso igual, sin error, y no registra un segundo cierre. |
| **FA-04** | — | La cuenta del usuario pasó a estado *Inactivo* con la sesión abierta. | El sistema cierra la sesión (**RN-04**). En la siguiente acción muestra el mensaje de cuenta inactiva: veterinario *"Tu cuenta está inactiva. Comunicate con el administrador."*; dueño *"Tu cuenta está inactiva. Comunicate con WildSalud."* |
| **FA-05** | — | Se vinculó otra cuenta de Google o Apple al usuario (CU-01, FA-02). | Las sesiones abiertas con la cuenta anterior se cierran (**RN-04**). En la siguiente acción, el sistema muestra *"Tu sesión se cerró porque se vinculó otra cuenta a tu usuario."* |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 1 | La misma solicitud de cierre llega dos veces (doble clic o reintento de red). | La sesión se cierra **una sola** vez y se registra un solo cierre; el segundo envío devuelve el mismo resultado. |

## Postcondiciones

- **Éxito:** la sesión quedó cerrada en el sistema: con ella no se puede ver ni hacer nada. El cierre quedó en el historial de auditoría (CU-36) con su motivo.
- **Fracaso:** no hay; si la sesión ya estaba cerrada, el resultado es el mismo (FA-03).

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Cierre en el sistema.** Cerrar sesión invalida la sesión en el sistema, no solo en el dispositivo: después no se muestra ninguna página privada ni se acepta ninguna operación con esa sesión, aunque se use el botón "Atrás" del navegador o se repita una solicitud anterior. | RF-AUT-01, RNF-SEG-01, RNF-SEG-07 |
| **RN-02** | **Solo WildSalud y solo ese dispositivo.** No cierra la sesión de Google o Apple ni las sesiones de WildSalud en otros dispositivos. No hay opción de cerrar todas las sesiones. | D95 |
| **RN-03** | **Vencimiento por inactividad.** La sesión se cierra sola a las **4 horas sin actividad**, igual para todos los roles. Lo que no se llegó a confirmar no se guarda. | RNF-SEG-01, RNF-LEG-01, D90 |
| **RN-04** | **Cierre por cambios en la cuenta.** Las sesiones abiertas se cierran si la cuenta pasa a estado *Inactivo* o si se vincula otra cuenta al usuario; el usuario lo ve en su siguiente acción. | RF-AUT-04, RF-ROL-06, D37, D47, D91, D92 |
| **RN-05** | **Registro del cierre.** Cada cierre queda en el historial de auditoría con usuario, fecha y hora y motivo: *manual*, *inactividad*, *cuenta inactiva* o *cuenta reemplazada*. | RNF-AUD-01, D94 |
| **RN-06** | **Sin duplicados.** Una solicitud de cierre repetida no genera un segundo cierre ni un error. | RNF-INT-01 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Sesión | Estado *Cerrada*, fecha y hora de cierre y motivo. |
| Auditoría | Cierre de sesión: usuario, fecha y hora y motivo (D94). |

## Escenarios de aceptación

```gherkin
@CU-03
Feature: CU-03 Cerrar sesión
  Como usuario de WildSalud
  Quiero cerrar mi sesión
  Para que nadie más pueda usarla en ese dispositivo

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra

  @flujo-principal @RF-AUT-01 @RN-05 @D94
  Scenario Outline: Cerrar sesión con cualquier rol
    Given "<usuario>" inició sesión con el rol "<rol>" en una computadora
    When "<usuario>" elige "Cerrar sesión"
    Then la sesión de "<usuario>" en esa computadora queda cerrada
    And la auditoría registra el cierre de sesión de "<usuario>" con motivo "manual" el "20/10/2026 10:00"
    And el sistema muestra la pantalla de ingreso con "Cerraste sesión."

    Examples:
      | usuario     | rol                  |
      | Marta Ruiz  | Administrador        |
      | Ana López   | Veterinario asociado |
      | Carla Gómez | Dueño afiliado       |

  @RN-01 @RNF-SEG-01 @RNF-SEG-07
  Scenario: Después de cerrar sesión, "Atrás" no muestra datos
    Given el veterinario "Ana López" abrió la ficha de "Luna" en la computadora del consultorio y después cerró sesión
    When alguien usa el botón "Atrás" del navegador en esa computadora
    Then ve la pantalla de ingreso
    And no ve ningún dato de "Luna" ni de su dueña

  @RN-01 @RNF-SEG-07
  Scenario: Una sesión cerrada no sirve para operar
    Given el veterinario "Ana López" cerró sesión
    When se envía un registro de consumo para "Luna" con los datos de esa sesión
    Then no se registra ningún consumo
    And el sistema muestra la pantalla de ingreso con "Ingresá para continuar."

  @FA-01 @RN-03 @D90
  Scenario Outline: La sesión vence a las 4 horas sin actividad
    Given el veterinario "Ana López" tiene una sesión abierta y su última actividad fue el "20/10/2026 10:00"
    And la fecha y hora actual es "<momento>"
    When "Ana López" abre la ficha de "Luna"
    Then el resultado es "<resultado>"

    Examples:
      | momento          | resultado                                           |
      | 20/10/2026 13:59 | ve la ficha                                         |
      | 20/10/2026 14:00 | Tu sesión venció por inactividad. Ingresá de nuevo. |

  @FA-01 @RN-03 @D90
  Scenario: Lo que no se confirmó antes del vencimiento no se guarda
    Given el veterinario "Ana López" eligió registrar una "Consulta" para "Luna" el "20/10/2026 10:00" y no confirmó
    And la fecha y hora actual es "20/10/2026 14:05"
    When "Ana López" confirma el registro
    Then no se registra ningún consumo
    And el sistema informa "Tu sesión venció por inactividad. Ingresá de nuevo."
    And la auditoría registra el cierre de sesión de "Ana López" con motivo "inactividad"

  @FA-02 @RN-02 @D95
  Scenario: Cerrar sesión en un dispositivo no cierra las demás ni la de Google
    Given "Carla Gómez" tiene sesiones de WildSalud abiertas en su celular y en su computadora
    And en su computadora también tiene abierta su sesión de Google
    When "Carla Gómez" cierra sesión en su computadora
    Then su sesión de WildSalud en el celular sigue abierta
    And su sesión de Google en la computadora sigue abierta

  @FA-03
  Scenario: La sesión ya estaba cerrada en otra pestaña
    Given "Carla Gómez" cerró sesión en otra pestaña del mismo navegador
    When "Carla Gómez" elige "Cerrar sesión" en la pestaña que quedó abierta
    Then el sistema muestra la pantalla de ingreso sin ningún error
    And la auditoría registra un solo cierre de sesión

  @FA-04 @RN-04 @RF-AUT-04 @RF-ROL-06 @D47 @D92
  Scenario Outline: Cuenta dada de baja con la sesión abierta
    Given "<usuario>" tiene una sesión abierta
    And el administrador dio de baja a "<usuario>"
    When "<usuario>" hace cualquier acción en WildSalud
    Then su sesión queda cerrada
    And el sistema informa "<mensaje>"
    And la auditoría registra el cierre de sesión de "<usuario>" con motivo "cuenta inactiva"

    Examples:
      | usuario     | mensaje                                                   |
      | Ana López   | Tu cuenta está inactiva. Comunicate con el administrador. |
      | Carla Gómez | Tu cuenta está inactiva. Comunicate con WildSalud.        |

  @FA-05 @RN-04 @D37 @D91
  Scenario: Se vinculó otra cuenta al usuario
    Given "Carla Gómez" tiene una sesión abierta en su celular con la cuenta de Google "carla.gomez@gmail.com"
    And "Carla Gómez" vinculó la cuenta de Apple "carla.gomez@icloud.com" con una invitación reenviada
    When "Carla Gómez" hace cualquier acción en el celular
    Then su sesión queda cerrada
    And el sistema informa "Tu sesión se cerró porque se vinculó otra cuenta a tu usuario."
    And la auditoría registra el cierre de sesión de "Carla Gómez" con motivo "cuenta reemplazada"

  @EX-01 @RN-06 @RNF-INT-01
  Scenario: La solicitud de cierre llega dos veces
    Given "Carla Gómez" tiene una sesión abierta
    When "Carla Gómez" elige "Cerrar sesión" y la misma solicitud se envía dos veces
    Then la sesión queda cerrada
    And la auditoría registra un solo cierre de sesión
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-AUT-01 | Paso 2, RN-01 |
| RF-AUT-04, RF-ROL-06 | RN-04, FA-04 |
| RNF-SEG-01 | Paso 4, RN-01, RN-03 |
| RNF-SEG-07 | RN-01 |
| RNF-LEG-01 | RN-03 |
| RNF-INT-01 | RN-06, EX-01 |
| RNF-AUD-01 | Paso 3, RN-05 |
| D37, D91 | RN-04, FA-05 |
| D47, D92 | RN-04, FA-04 |
| D90 | RN-03, FA-01 |
| D94 | Paso 3, RN-05 |
| D95 | RN-02, FA-02 |
