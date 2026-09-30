# CU-12 — Reenviar invitación

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Enviar una invitación nueva al email registrado de un veterinario o de un dueño, para que vincule su cuenta de Google o Apple. |
| **Disparador** | La persona no recibió la invitación (por ejemplo, porque falló el envío), se le venció o la perdió (cuenta en estado *Invitado*), o perdió su cuenta de Google o Apple o quiere usar otra (cuenta en estado *Activo*). |
| **Relaciones** | La invitación original se envía en CU-04 Dar de alta veterinario y CU-08 Dar de alta dueño, y también al cambiar el email de una cuenta *Invitado* (CU-05 Editar veterinario, CU-09 Editar dueño) y al reactivar una cuenta (CU-07 Reactivar veterinario, CU-11 Reactivar dueño); si alguno de esos envíos falla, esos casos indican reenviarla desde acá. La persona la usa en CU-01 Vincular cuenta por invitación. A una cuenta en estado *Inactivo* no se le reenvía: se la reactiva en CU-07 o CU-11, que ya envían una invitación nueva. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El veterinario o el dueño está registrado.

## Flujo principal

1. El administrador abre la ficha del veterinario o del dueño.
2. El sistema muestra el estado de la cuenta y de su acceso (**RN-08**):
   - *Invitado*: estado de la última invitación (*Invitado* si está sin usar, *Vencida* si no), fecha y hora del envío, vencimiento y resultado del envío.
   - *Activo*: proveedor vinculado (Google o Apple) y fecha de vinculación.
   - *Inactivo*: sin la opción de reenviar.
3. El administrador elige **Reenviar invitación**.
4. El sistema pide confirmación y muestra: *"Se va a enviar una invitación nueva a {email}, que vence el {vencimiento}. Si hay una invitación anterior sin usar, deja de servir."* El email es el registrado y no se puede cambiar desde acá (**RN-03**).
5. El administrador confirma.
6. El sistema valida las reglas **RN-01** y **RN-02**.
7. El sistema genera una invitación nueva en estado *Invitado*, de un solo uso, que vence a las 24 horas, y pasa a *Vencida* las anteriores sin usar (**RN-04**).
8. El sistema envía el email de invitación al email registrado (**RN-05**) y registra el envío con canal y resultado (**RN-06**).
9. El sistema deja el registro de auditoría del reenvío (**RN-09**).
10. El sistema confirma: *"Invitación reenviada a {email}. Vence el {vencimiento}."* Si el envío falló, informa el error de EX-02.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 4 | La cuenta está en estado *Activo*, con una cuenta de proveedor vinculada (la persona la perdió o quiere usar otra). | La confirmación agrega: *"{usuario} ya tiene una cuenta de {proveedor} vinculada. Esa cuenta va a seguir sirviendo hasta que use el nuevo enlace; después, solo va a poder ingresar con la nueva."* El estado de la cuenta y la cuenta vinculada no cambian (**RN-07**). |
| **FA-02** | 7 | El usuario tenía una invitación en estado *Invitado* (sin usar y sin vencer). | Esa invitación pasa a *Vencida* y deja de servir (CU-01, EX-03). |
| **FA-03** | 1 | La cuenta está en estado *Activo*, la persona perdió su cuenta de Google o Apple y además cambió de email. | El administrador actualiza el email en CU-05 o CU-09 (en una cuenta *Activo* eso no envía ninguna invitación) y después reenvía desde acá: la invitación va al email nuevo. En una cuenta *Invitado* no hace falta este paso: al cambiar el email, CU-05 y CU-09 ya envían una invitación nueva. |
| **FA-04** | 3 o 5 | El administrador cancela. | No se genera ni se envía nada; la invitación anterior no cambia de estado. |

## Excepciones

En EX-01, EX-04 y EX-05 **no se genera ninguna invitación nueva**, la anterior no cambia de estado y el sistema informa el motivo. En EX-02 la invitación nueva sí se generó y las anteriores ya quedaron *Vencida*. Aunque el paso 2 ya oculta la opción para una cuenta *Inactivo*, el sistema vuelve a validar al confirmar (RNF-SEG-07), porque el estado puede cambiar en el medio.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 6 | La cuenta del usuario está en estado *Inactivo* (por ejemplo, otro administrador lo dio de baja mientras tanto). | *"La cuenta de {usuario} está inactiva. Reactivala: al hacerlo se le envía una invitación nueva."* |
| **EX-02** | 8 | El email no se pudo enviar. | *"No se pudo enviar la invitación a {email}. Reenviala de nuevo más tarde."* La invitación nueva queda generada en estado *Invitado* pero no llegó a la persona; las anteriores sin usar quedan *Vencida* igual. El envío fallido queda registrado y el administrador vuelve a reenviar con este mismo caso. |
| **EX-03** | 5 | La misma confirmación llega dos veces (doble clic o reintento de red). | Se genera **una sola** invitación y se envía **un solo** email; el segundo envío devuelve el mismo resultado. |
| **EX-04** | 6 | Quien pide el reenvío no es administrador (por ejemplo, un veterinario o un dueño que lo intenta sin usar la pantalla). | *"No tenés permiso para hacer esta operación."* |
| **EX-05** | 6 | El destinatario es un administrador (solo es posible sin usar la pantalla). | *"No tenés permiso para hacer esta operación."* |

## Postcondiciones

- **Éxito:** el usuario tiene una sola invitación en estado *Invitado*, enviada a su email registrado, que vence a las 24 horas. Las anteriores sin usar quedaron *Vencida*. El estado de la cuenta y la cuenta vinculada, si la había, no cambiaron. El envío y el reenvío quedaron registrados.
- **Fracaso:** si se rechaza (EX-01, EX-04, EX-05), no se genera ninguna invitación nueva y la anterior no cambia de estado. Si falló el envío (EX-02), la invitación nueva queda generada sin llegar a la persona, las anteriores sin usar quedan *Vencida* y el intento queda registrado con resultado *Fallo*.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo el administrador.** Solo un administrador reenvía invitaciones; puede hacerlo cualquiera de ellos. No hay reenvío ni recuperación autogestionada. El sistema lo verifica aunque la solicitud no venga de la pantalla, y si no corresponde responde *"No tenés permiso para hacer esta operación."* | RF-ROL-01, RF-ROL-02, RF-VET-04, RNF-SEG-07, D15, D37, D110 |
| **RN-02** | **Destinatarios.** Veterinarios y dueños con la cuenta en estado *Invitado* o *Activo*. A un usuario *Inactivo* no se le reenvía: se lo reactiva (CU-07, CU-11), y la reactivación ya le envía una invitación nueva. Los administradores reciben su invitación, y la resuelven si pierden su cuenta, por configuración. | RF-AUT-04, RF-ROL-06, D47, D50, D92, D97, D99, D112 |
| **RN-03** | **Solo al email registrado.** La invitación se envía únicamente al email registrado del usuario; en este caso no se puede indicar otro destino. Para cambiarlo, el administrador lo edita antes (CU-05, CU-09). | RF-AUT-05, RF-ROL-05, RF-VET-03, D37, D84 |
| **RN-04** | **Una sola invitación sin usar.** La invitación nueva nace en estado *Invitado*, es de un solo uso y pasa a *Vencida* a las **24 horas** de enviada (hora de Argentina). Al generarla, las anteriores sin usar pasan a *Vencida*, aunque falle el envío de la nueva. Cuando la persona la acepta en CU-01, pasa a *Vigente*. | D37, D53, D87, D111 |
| **RN-05** | **Contenido del email.** Nombre, rol, enlace, vencimiento y cómo usarlo (con Google o Apple). No incluye DNI, teléfono, dirección ni datos de pagos. | RNF-SEG-01, RNF-LEG-01 |
| **RN-06** | **Registro del envío.** Cada envío guarda canal (email), destinatario, fecha y hora y resultado (éxito o fallo). Si el envío falla, el administrador la vuelve a reenviar con este caso; la anterior no recupera su validez. | RF-NOT-03, RNF-ITG-01, D43, D87 |
| **RN-07** | **Reenviar no desvincula.** Si la cuenta está en estado *Activo*, su cuenta de proveedor sigue sirviendo hasta que la persona use la invitación nueva; recién entonces la reemplaza y se cierran sus sesiones abiertas (CU-01). Reenviar no cambia el estado de la cuenta. | D37, D47, D91 |
| **RN-08** | **Qué ve el administrador.** El estado de la cuenta, los datos de la última invitación y, si hay una cuenta vinculada, el proveedor y la fecha de vinculación. No ve el identificador de la cuenta del proveedor. | D45, D47 |
| **RN-09** | **Auditoría.** Se registra el reenvío con administrador, usuario, email de destino, fecha y hora. | RNF-AUD-01, D94 |
| **RN-10** | **Sin duplicados.** Cada confirmación se procesa una sola vez. | RNF-INT-01 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Invitación | Usuario, código aleatorio del enlace, email de destino, fecha y hora de envío, vencimiento, administrador que la envió y estado: *Invitado* (sin usar), *Vigente* (aceptada) o *Vencida*. El vencimiento por tiempo se calcula en el momento. |
| Invitaciones anteriores | Las que estaban en estado *Invitado* pasan a *Vencida*. |
| Envío | Canal (email), destinatario, fecha y hora, resultado (éxito o fallo). |
| Auditoría | Reenvío: administrador, usuario, email de destino, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-12
Feature: CU-12 Reenviar invitación
  Como administrador
  Quiero reenviar la invitación a un veterinario o a un dueño
  Para que pueda vincular su cuenta de Google o Apple e ingresar a WildSalud

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And la dueña "Carla Gómez" con DNI "30111222" tiene el email registrado "carla.gomez@gmail.com"

  @flujo-principal @RF-ROL-02 @RN-04 @RN-09 @D37 @D87 @D94
  Scenario: Reenviar una invitación vencida
    Given la cuenta de "Carla Gómez" está en estado "Invitado" y su invitación venció el "15/10/2026 10:00"
    When el administrador reenvía la invitación a "Carla Gómez" y confirma
    Then se envía a "carla.gomez@gmail.com" una invitación nueva que vence el "21/10/2026 10:00"
    And el envío queda registrado con canal "Email" y resultado "Éxito"
    And la auditoría registra el reenvío con usuario "Marta Ruiz", destinatario "carla.gomez@gmail.com" y fecha "20/10/2026 10:00"
    And la cuenta de "Carla Gómez" sigue en estado "Invitado"
    And el sistema informa "Invitación reenviada a carla.gomez@gmail.com. Vence el 21/10/2026 10:00."

  @flujo-principal @RN-02 @RF-ROL-01
  Scenario: También se reenvía a un veterinario
    Given el veterinario "Ana López" de la veterinaria "Patitas" tiene la cuenta en estado "Invitado" y el email registrado "ana.lopez@gmail.com"
    When el administrador reenvía la invitación a "Ana López" y confirma
    Then se envía a "ana.lopez@gmail.com" una invitación nueva que vence el "21/10/2026 10:00"

  @flujo-principal @RN-04 @RN-08 @D45 @D47 @D87 @D111
  Scenario Outline: La ficha muestra el estado del acceso
    Given <situación>
    When el administrador abre la ficha de "Carla Gómez"
    Then ve "<estado del acceso>"
    And no ve el identificador de la cuenta del proveedor

    Examples:
      | situación                                                                                               | estado del acceso                                                                          |
      | la cuenta de Carla Gómez está en estado Invitado y su invitación se envió el 19/10/2026 10:01 con éxito | Cuenta Invitado. Invitación en estado Invitado, enviada el 19/10/2026 10:01, vence el 20/10/2026 10:01. Envío: Éxito. |
      | la cuenta de Carla Gómez está en estado Invitado y su invitación se envió el 19/10/2026 10:00 con éxito | Cuenta Invitado. Invitación en estado Vencida desde el 20/10/2026 10:00. Envío: Éxito.       |
      | Carla Gómez vinculó su cuenta de Google el 16/10/2026 09:30                                             | Cuenta Activo. Cuenta de Google vinculada el 16/10/2026 09:30.                              |
      | Carla Gómez fue dada de baja                                                                            | Cuenta Inactivo, sin la opción Reenviar invitación                                          |

  @RN-03 @D37
  Scenario: La invitación solo va al email registrado
    Given la cuenta de "Carla Gómez" está en estado "Invitado"
    When el administrador elige reenviar la invitación a "Carla Gómez"
    Then la confirmación muestra el destino "carla.gomez@gmail.com" sin opción de cambiarlo

  @FA-01 @RN-07 @D37 @D91
  Scenario: Aviso al reenviar a un usuario con una cuenta vinculada
    Given la cuenta de "Carla Gómez" está en estado "Activo", vinculada a la cuenta de Google "carla.gomez@gmail.com"
    When el administrador elige reenviar la invitación a "Carla Gómez"
    Then la confirmación advierte "Carla Gómez ya tiene una cuenta de Google vinculada. Esa cuenta va a seguir sirviendo hasta que use el nuevo enlace; después, solo va a poder ingresar con la nueva."

  @FA-01 @RN-07 @D47 @D91
  Scenario: Reenviar no desvincula la cuenta actual
    Given la cuenta de "Carla Gómez" está en estado "Activo", vinculada a la cuenta de Google "carla.gomez@gmail.com"
    When el administrador reenvía la invitación a "Carla Gómez" y confirma
    Then la cuenta de "Carla Gómez" sigue en estado "Activo"
    And "Carla Gómez" puede seguir ingresando con la cuenta de Google "carla.gomez@gmail.com" hasta que use la invitación nueva

  @FA-02 @RN-04 @D37 @D87 @D111
  Scenario: La invitación anterior sin usar deja de servir
    Given la cuenta de "Carla Gómez" está en estado "Invitado" con una invitación enviada el "20/10/2026 08:00" que vence el "21/10/2026 08:00"
    When el administrador reenvía la invitación a "Carla Gómez" y confirma
    Then la invitación del "20/10/2026 08:00" queda "Vencida"
    And la única invitación de "Carla Gómez" en estado "Invitado" vence el "21/10/2026 10:00"

  @FA-03 @RN-03 @D37 @D84
  Scenario: Reenviar al email actualizado de un usuario que perdió su cuenta
    Given la cuenta de "Carla Gómez" está en estado "Activo", vinculada a la cuenta de Google "carla.gomez@gmail.com"
    And "Carla Gómez" perdió esa cuenta y el administrador actualizó su email registrado a "carla.nueva@gmail.com"
    When el administrador reenvía la invitación a "Carla Gómez" y confirma
    Then la invitación nueva se envía a "carla.nueva@gmail.com"
    And no se envía nada a "carla.gomez@gmail.com"

  @FA-04
  Scenario: El administrador cancela el reenvío
    Given la cuenta de "Carla Gómez" está en estado "Invitado" con una invitación que vence el "21/10/2026 08:00"
    When el administrador elige reenviar la invitación a "Carla Gómez" y cancela
    Then no se envía ninguna invitación
    And la invitación que vence el "21/10/2026 08:00" sigue en estado "Invitado"

  @EX-01 @RN-02 @RF-AUT-04 @D15 @D92 @D97 @D99
  Scenario: Otro administrador dio de baja al usuario mientras tanto
    Given la cuenta de "Carla Gómez" está en estado "Invitado"
    And el administrador "Marta Ruiz" abrió la ficha de "Carla Gómez"
    And el administrador "Jorge Paz" dio de baja a "Carla Gómez"
    When "Marta Ruiz" reenvía la invitación a "Carla Gómez" y confirma
    Then no se envía ninguna invitación
    And el sistema informa "La cuenta de Carla Gómez está inactiva. Reactivala: al hacerlo se le envía una invitación nueva."

  @EX-02 @RN-04 @RN-06 @RF-NOT-03 @D43 @D87 @D111
  Scenario: Falla el envío del email
    Given la cuenta de "Carla Gómez" está en estado "Invitado" con una invitación que vence el "21/10/2026 08:00"
    And el servicio de email no está disponible
    When el administrador reenvía la invitación a "Carla Gómez" y confirma
    Then la invitación que vence el "21/10/2026 08:00" queda "Vencida"
    And se genera una invitación nueva en estado "Invitado" que no llegó a "carla.gomez@gmail.com"
    And el envío queda registrado con canal "Email" y resultado "Fallo"
    And el sistema informa "No se pudo enviar la invitación a carla.gomez@gmail.com. Reenviala de nuevo más tarde."

  @EX-03 @RN-10 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces envía una sola invitación
    Given la cuenta de "Carla Gómez" está en estado "Invitado"
    When el administrador confirma el reenvío de la invitación a "Carla Gómez" y la misma confirmación se envía dos veces
    Then se genera una sola invitación nueva
    And se envía un solo email a "carla.gomez@gmail.com"

  @EX-04 @RN-01 @RNF-SEG-07 @D37 @D110
  Scenario Outline: Solo un administrador puede reenviar invitaciones
    Given "<usuario>" tiene una sesión abierta con el rol "<rol>"
    When "<usuario>" pide reenviar la invitación de "Carla Gómez" sin usar la pantalla
    Then no se envía ninguna invitación
    And el sistema informa "No tenés permiso para hacer esta operación."

    Examples:
      | usuario     | rol                  |
      | Ana López   | Veterinario asociado |
      | Carla Gómez | Dueño afiliado       |

  @EX-05 @RN-02 @D50 @D110 @D112
  Scenario: Las invitaciones de los administradores no se reenvían desde este caso
    Given "Jorge Paz" es administrador
    When el administrador "Marta Ruiz" pide reenviar la invitación de "Jorge Paz" sin usar la pantalla
    Then no se envía ninguna invitación
    And el sistema informa "No tenés permiso para hacer esta operación."

  @RN-05 @RNF-SEG-01 @RNF-LEG-01
  Scenario: El email de invitación no incluye datos sensibles
    Given la cuenta de "Carla Gómez" está en estado "Invitado"
    When el administrador reenvía la invitación a "Carla Gómez" y confirma
    Then el email incluye su nombre, el rol "Dueño afiliado", el enlace y el vencimiento "21/10/2026 10:00"
    And el email no incluye su DNI, su teléfono, su dirección ni datos de pagos

  @RN-01 @D15
  Scenario: Cualquier administrador puede reenviar
    Given el administrador "Jorge Paz" también inició sesión
    And la cuenta de "Carla Gómez" está en estado "Invitado"
    When "Jorge Paz" reenvía la invitación a "Carla Gómez" y confirma
    Then la auditoría registra el reenvío con usuario "Jorge Paz"
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-ROL-01, RF-ROL-02, RF-VET-04 | Actor principal, RN-01 |
| RF-AUT-04, RF-ROL-06 | Paso 2, RN-02, EX-01 |
| RF-AUT-05, RF-ROL-05, RF-VET-03 | Objetivo, RN-03 |
| RF-NOT-03, RNF-ITG-01 | Paso 8, RN-06, EX-02 |
| RNF-SEG-01, RNF-LEG-01 | RN-05 |
| RNF-SEG-07 | Nota de Excepciones, RN-01, EX-04 |
| RNF-INT-01 | RN-10, EX-03 |
| RNF-AUD-01 | Paso 9, RN-09 |
| D15 | RN-01 |
| D37 | Objetivo, RN-01, RN-03, RN-04, RN-07, FA-01 |
| D43 | RN-06, EX-02 |
| D45 | Paso 2, RN-08 |
| D47 | Paso 2, RN-02, RN-07 |
| D50, D112 | RN-02, EX-05 |
| D53 | RN-04 |
| D84 | RN-03, FA-03 |
| D87, D111 | Paso 7, RN-04, RN-06, FA-02, EX-02 |
| D91 | RN-07, FA-01 |
| D92, D97, D99 | RN-02, EX-01 |
| D94 | Paso 9, RN-09 |
| D110 | RN-01, EX-04, EX-05 |
