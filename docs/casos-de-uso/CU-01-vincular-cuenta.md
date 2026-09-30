# CU-01 — Vincular cuenta por invitación

| Campo | Valor |
|-------|-------|
| **Actor principal** | Persona invitada: veterinario asociado, dueño afiliado o administrador cargado por configuración |
| **Objetivo** | Vincular su cuenta de Google o de Apple a su usuario de WildSalud, para poder ingresar al sistema. |
| **Disparador** | La persona recibe el email de invitación y abre el enlace. La invitación se envía cuando el administrador da de alta a la persona, le cambia el email mientras está en estado *Invitado*, la reactiva o le reenvía la invitación, y, en el caso de un administrador, desde la configuración inicial. |
| **Relaciones** | La invitación se envía en CU-04 Dar de alta veterinario, CU-08 Dar de alta dueño, CU-05 Editar veterinario y CU-09 Editar dueño (cambio de email de una cuenta *Invitado*), CU-07 Reactivar veterinario y CU-11 Reactivar dueño, y se vuelve a enviar en CU-12 Reenviar invitación. Al terminar, la persona queda con la sesión iniciada; los ingresos siguientes se hacen con CU-02 Iniciar sesión con Google/Apple. Las sesiones de una cuenta reemplazada se cierran según CU-03 Cerrar sesión. |

## Precondiciones

1. El usuario existe en WildSalud: lo dio de alta o lo reactivó el administrador (CU-04, CU-08, CU-07, CU-11) o, si es administrador, lo cargó la configuración inicial (D50, D112).
2. El sistema le envió una invitación a su email registrado, que está en estado *Invitado* (sin usar).

## Flujo principal

1. La persona abre el enlace del email de invitación.
2. El sistema valida la invitación y la cuenta del usuario (**RN-07**).
3. El sistema muestra *"Hola, {nombre}. Te invitaron a WildSalud con el rol {rol}. Elegí con qué cuenta vas a ingresar."* y las opciones **Continuar con Google** y **Continuar con Apple**. No pide contraseña ni ningún otro dato.
4. La persona elige un proveedor.
5. El sistema la lleva al proveedor, donde la persona ingresa con su cuenta. La contraseña la maneja el proveedor; WildSalud nunca la ve.
6. El proveedor le confirma al sistema la identidad de la cuenta.
7. El sistema vuelve a validar la invitación y la cuenta del usuario (**RN-07**) y valida que la cuenta del proveedor no esté vinculada a otro usuario (**RN-04**).
8. El sistema vincula la cuenta del proveedor al usuario por su identificador (**RN-03**), pasa la invitación a *Vigente* y, si la cuenta estaba en estado *Invitado*, la pasa a *Activo* (**RN-05**).
9. El sistema deja el registro de auditoría de la vinculación (**RN-11**).
10. El sistema inicia la sesión con el rol del usuario y registra el inicio, como en CU-02, y muestra su pantalla de inicio con el mensaje *"Tu cuenta quedó vinculada. Desde ahora ingresá con {proveedor}."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 6 | El email de la cuenta del proveedor es distinto del email registrado (otra casilla de Gmail, o el email oculto que ofrece Apple). | Se vincula igual: la vinculación es por el identificador de la cuenta, no por el email. El email registrado no cambia. |
| **FA-02** | 8 | La cuenta ya estaba en estado *Activo*, con otra cuenta de proveedor vinculada (el administrador le reenvió la invitación porque la perdió o quiere usar otra, CU-12). | La cuenta nueva **reemplaza** a la anterior (**RN-06**): la anterior deja de permitir el ingreso y se cierran las sesiones abiertas con ella. El mensaje del paso 10 es *"Tu cuenta quedó vinculada. Desde ahora ingresá con {proveedor}; la cuenta anterior ya no permite ingresar."* |
| **FA-03** | 5 | La persona no tiene cuenta de Google ni de Apple. | La crea en el propio proveedor durante el paso 5 y sigue. WildSalud no crea cuentas de proveedor. |
| **FA-04** | 1 | En el navegador hay una sesión abierta de otro usuario (por ejemplo, la misma persona ingresó como veterinaria y abre su invitación de dueña). | El sistema avisa *"Para usar esta invitación, vamos a cerrar la sesión de {usuario}."* Si la persona continúa, cierra esa sesión (CU-03) y sigue en el paso 2; si cancela, no cambia nada. |
| **FA-05** | 4 o 5 | La persona cancela, o vuelve del proveedor sin ingresar. | No se vincula ninguna cuenta. La invitación sigue en estado *Invitado* hasta que vence. |
| **FA-06** | 8 | La cuenta volvió a estado *Invitado* por una reactivación (CU-07, CU-11), que descartó la vinculación anterior. | Vincula como en el flujo principal, con la invitación que envió la reactivación. Puede usar la misma cuenta de Google o Apple que tenía antes, que quedó libre al reactivarla, u otra. |

## Excepciones

En todas las excepciones **no se vincula ninguna cuenta**, no se inicia sesión y el sistema informa el motivo. La invitación no cambia de estado: si estaba en estado *Invitado*, se puede volver a usar. En los mensajes, {contacto} es *el administrador* para veterinarios y administradores, y *WildSalud* para dueños, igual que en el mensaje de cuenta inactiva.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 2 o 7 | La invitación ya se usó: está en estado *Vigente*. | *"Esta invitación ya se usó. Ingresá con tu cuenta de Google o Apple."* |
| **EX-02** | 2 o 7 | La invitación está en estado *Vencida* porque pasaron 24 horas desde el envío. | *"Esta invitación venció. Comunicate con {contacto} para que te la reenvíe."* |
| **EX-03** | 2 o 7 | La invitación está en estado *Vencida* porque se generó otra para el mismo usuario (CU-12, un cambio de email en CU-05 o CU-09, o una reactivación en CU-07 o CU-11), aunque el envío de la nueva haya fallado. | *"Esta invitación ya no es válida porque se generó una más nueva. Usá el enlace del último email que recibiste; si no te llegó, comunicate con {contacto}."* |
| **EX-04** | 2 | El enlace no existe o está alterado. | *"El enlace de invitación no es válido."* |
| **EX-05** | 2 o 7 | La cuenta del usuario está en estado *Inactivo* (por ejemplo, se lo dio de baja después de invitarlo; la baja deja la invitación en estado *Vencida*). | Veterinario: *"Tu cuenta está inactiva. Comunicate con el administrador."* Dueño: *"Tu cuenta está inactiva. Comunicate con WildSalud."* |
| **EX-06** | 7 | La cuenta del proveedor ya está vinculada a otro usuario de WildSalud, activo o dado de baja. | *"Esta cuenta de {proveedor} ya está vinculada a otro usuario de WildSalud. Ingresá con otra cuenta."* |
| **EX-07** | 6 | El proveedor no confirma la identidad (error del proveedor o respuesta inválida). | *"No pudimos validar tu cuenta de {proveedor}. Intentá de nuevo."* |
| **EX-08** | 6 | La misma confirmación del proveedor llega dos veces (doble clic o reintento de red). | Se vincula **una sola** vez; el segundo envío devuelve el mismo resultado que el primero. |
| **EX-09** | 7 | La misma invitación se usa a la vez con dos cuentas distintas (por ejemplo, en dos pestañas). | Solo se vincula la primera; en la otra se muestra el mensaje de EX-01. |

## Postcondiciones

- **Éxito:** la cuenta de Google o Apple queda vinculada al usuario, que queda en estado *Activo* y con la sesión iniciada. La invitación queda *Vigente*. Si había otra cuenta vinculada, dejó de permitir el ingreso y sus sesiones se cerraron. La vinculación queda en el historial de auditoría (CU-36).
- **Fracaso:** no se vincula ninguna cuenta, el estado del usuario no cambia y no se inicia sesión. La invitación no cambia de estado. Los intentos rechazados no quedan en el historial de auditoría.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo por invitación.** Una cuenta de Google o Apple solo se vincula desde un enlace de invitación. No hay registro propio: nadie crea su usuario por su cuenta. | RF-ROL-01, RF-ROL-02, D24, D37 |
| **RN-02** | **Estados y validez de la invitación.** Una invitación está en uno de tres estados: *Invitado* (enviada y sin usar), *Vigente* (el usuario la aceptó y vinculó su cuenta) o *Vencida*. Solo una invitación en estado *Invitado* sirve para vincular. Pasa a *Vencida* a las **24 horas** de enviada sin usarse, cuando se genera otra invitación para el mismo usuario (reenvío, cambio de email o reactivación, aunque falle el envío de la nueva) o cuando se da de baja a la persona. El vencimiento por tiempo se evalúa en el momento de usarla, en hora de Argentina, sin depender de ningún proceso automático. | D37, D53, D54, D84, D87, D96, D111 |
| **RN-03** | **Vinculación por identificador.** Se guardan el proveedor (Google o Apple) y el identificador de la cuenta en el proveedor, no el email. El identificador es interno: no se muestra a nadie; el administrador solo ve el proveedor y la fecha de vinculación. | RF-VET-03, D37, D45 |
| **RN-04** | **Una cuenta por usuario, un usuario por cuenta.** Cada usuario tiene una sola cuenta de proveedor vinculada, y cada cuenta de proveedor se vincula a un solo usuario, con un único rol. Una persona que es veterinaria y dueña usa una cuenta distinta para cada usuario. Mientras un usuario está en estado *Inactivo*, su cuenta sigue reservada y no se puede vincular a otro usuario; al reactivarlo (CU-07, CU-11) la vinculación se descarta y la cuenta queda libre. | RF-AUT-02, RF-ROL-03, RF-ROL-04, D46, D89, D97 |
| **RN-05** | **Estado de la cuenta.** Pueden vincular una cuenta los usuarios en estado *Invitado* (pasan a *Activo*) y *Activo* (reemplazan su cuenta, RN-06). Un usuario *Inactivo* no puede: al darlo de baja, su invitación sin usar pasa a *Vencida*. Un usuario reactivado vuelve a *Invitado* sin cuenta vinculada y vincula otra vez con la invitación que le envía la reactivación. | RF-AUT-04, RF-ROL-06, RF-VET-05, D47, D92, D96, D97, D99 |
| **RN-06** | **Reemplazo.** Si el usuario ya tenía una cuenta vinculada, la nueva la reemplaza: la anterior deja de permitir el ingreso y sus sesiones abiertas se cierran. Hasta que se usa la invitación nueva, la anterior sigue sirviendo. | D37, D91 |
| **RN-07** | **Validación y orden.** La invitación y la cuenta del usuario se validan al abrir el enlace y otra vez al volver del proveedor, porque pueden cambiar en el medio (un reenvío, una baja). Orden: enlace inexistente o alterado → cuenta *Inactivo* → invitación *Vigente* (ya usada) → invitación *Vencida* porque se generó otra → invitación *Vencida* por tiempo → (al volver del proveedor) cuenta del proveedor vinculada a otro usuario. Se informa el **primer** motivo que falla. | RNF-SEG-07, D37, D47 |
| **RN-08** | **Sin contraseñas ni datos del perfil.** WildSalud no pide, no ve ni guarda contraseñas. Del proveedor solo usa el identificador de la cuenta: el nombre, el email y la foto del perfil del proveedor no reemplazan los datos cargados por el administrador. | RF-AUT-01, RNF-SEG-06, RNF-LEG-01, D24 |
| **RN-09** | **Enlace seguro.** El enlace lleva un código aleatorio imposible de adivinar y no contiene el DNI, el email ni el identificador interno del usuario. Todo el proceso usa una conexión cifrada. | RNF-SEG-01, RNF-SEG-05, D45 |
| **RN-10** | **Sin duplicados.** Cada confirmación del proveedor se procesa una sola vez, y dos usos simultáneos de la misma invitación vinculan una sola cuenta. | RNF-INT-01 |
| **RN-11** | **Auditoría.** Se registra la vinculación: usuario, proveedor, fecha y hora y, si reemplazó a otra cuenta, el proveedor de la anterior. Los intentos rechazados no se registran. | RNF-AUD-01, D94 |
| **RN-12** | **Sesión de otro usuario.** Si al abrir la invitación hay una sesión abierta de otro usuario en el navegador, el sistema lo avisa y la cierra antes de seguir. | D46, D93 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Vinculación | Usuario, proveedor (Google o Apple), identificador de la cuenta en el proveedor, fecha y hora. Si había una vinculación anterior, queda reemplazada. |
| Invitación | Estado *Vigente*, fecha y hora en que se aceptó. |
| Usuario | Estado de la cuenta *Activo*, si estaba en estado *Invitado*. |
| Sesión | La sesión iniciada al terminar (ver CU-02). Si se reemplazó una cuenta, las sesiones abiertas con ella quedan cerradas (ver CU-03). |
| Auditoría | Vinculación de la cuenta: usuario, proveedor, fecha y hora y, si corresponde, el proveedor de la cuenta reemplazada. |

## Escenarios de aceptación

```gherkin
@CU-01
Feature: CU-01 Vincular cuenta por invitación
  Como persona invitada a WildSalud
  Quiero vincular mi cuenta de Google o Apple usando la invitación
  Para poder ingresar al sistema

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And la dueña "Carla Gómez" con DNI "30111222" tiene el email registrado "carla.gomez@gmail.com"
    And la cuenta de "Carla Gómez" está en estado "Invitado" con una invitación enviada el "19/10/2026 14:00" que vence el "20/10/2026 14:00", salvo que el escenario indique otra situación

  @flujo-principal @RN-01 @RN-11 @RF-ROL-02 @RF-AUT-01 @RNF-AUD-01 @D24 @D37 @D47 @D94
  Scenario Outline: Vincular la cuenta con Google o con Apple
    When "Carla Gómez" abre el enlace de la invitación e ingresa con la cuenta de <proveedor> "<cuenta>"
    Then la cuenta de <proveedor> "<cuenta>" queda vinculada a "Carla Gómez"
    And la cuenta de "Carla Gómez" pasa al estado "Activo"
    And la invitación queda "Vigente"
    And "Carla Gómez" queda con la sesión iniciada con el rol "Dueño afiliado"
    And la auditoría registra la vinculación de "Carla Gómez" con <proveedor> el "20/10/2026 10:00"
    And el sistema informa "Tu cuenta quedó vinculada. Desde ahora ingresá con <proveedor>."

    Examples:
      | proveedor | cuenta                 |
      | Google    | carla.gomez@gmail.com  |
      | Apple     | carla.gomez@icloud.com |

  @flujo-principal @RN-08 @D24
  Scenario: La invitación no pide contraseña ni otros datos
    When "Carla Gómez" abre el enlace de la invitación
    Then el sistema muestra "Hola, Carla. Te invitaron a WildSalud con el rol Dueño afiliado. Elegí con qué cuenta vas a ingresar."
    And ofrece solo "Continuar con Google" y "Continuar con Apple"
    And no pide contraseña ni ningún otro dato

  @flujo-principal @D15 @D50 @D112
  Scenario: Un administrador cargado por configuración vincula su cuenta igual que los demás
    Given la configuración inicial cargó al administrador "Jorge Paz" con el email "jorge.paz@gmail.com" y le envió una invitación
    When "Jorge Paz" usa el enlace de la invitación con la cuenta de Google "jorge.paz@gmail.com"
    Then la cuenta de Google "jorge.paz@gmail.com" queda vinculada a "Jorge Paz"
    And "Jorge Paz" queda con la sesión iniciada con el rol "Administrador"

  @FA-01 @RN-03 @RF-VET-03 @D37
  Scenario: La cuenta del proveedor tiene un email distinto del registrado
    When "Carla Gómez" usa el enlace de la invitación con la cuenta de Google "carlita.g@gmail.com"
    Then la cuenta de Google "carlita.g@gmail.com" queda vinculada a "Carla Gómez"
    And el email registrado de "Carla Gómez" sigue siendo "carla.gomez@gmail.com"

  @FA-02 @RN-06 @D37 @D91
  Scenario: Una cuenta nueva reemplaza a la vinculada
    Given la cuenta de "Carla Gómez" está en estado "Activo", vinculada a la cuenta de Google "carla.gomez@gmail.com"
    And "Carla Gómez" tiene una sesión abierta con esa cuenta en su celular
    And el "20/10/2026 09:00" el administrador le reenvió la invitación
    When "Carla Gómez" usa la invitación nueva con la cuenta de Apple "carla.gomez@icloud.com"
    Then la cuenta de Apple "carla.gomez@icloud.com" queda vinculada a "Carla Gómez"
    And la cuenta de Google "carla.gomez@gmail.com" ya no permite ingresar
    And la sesión abierta en su celular queda cerrada
    And la cuenta de "Carla Gómez" sigue en estado "Activo"
    And el sistema informa "Tu cuenta quedó vinculada. Desde ahora ingresá con Apple; la cuenta anterior ya no permite ingresar."

  @FA-03
  Scenario: La persona crea su cuenta de Google durante la vinculación
    Given "Carla Gómez" no tiene cuenta de Google ni de Apple
    When "Carla Gómez" usa el enlace de la invitación y crea en Google la cuenta "carla.wild@gmail.com" durante el ingreso
    Then la cuenta de Google "carla.wild@gmail.com" queda vinculada a "Carla Gómez"

  @FA-04 @RN-12 @D46 @D93
  Scenario: Aviso al abrir la invitación con la sesión de otro usuario
    Given el veterinario "Ana López" de la veterinaria "Patitas" tiene una sesión abierta en el navegador
    And "Ana López" también fue dada de alta como dueña y tiene una invitación en estado "Invitado"
    When "Ana López" abre el enlace de su invitación de dueña en ese navegador
    Then el sistema informa "Para usar esta invitación, vamos a cerrar la sesión de Ana López."
    And la sesión de veterinario de "Ana López" sigue abierta hasta que ella elija continuar

  @FA-04 @RN-12 @D46 @D93
  Scenario: La persona acepta cerrar la sesión abierta
    Given el veterinario "Ana López" tiene una sesión abierta en el navegador
    And "Ana López" abrió en ese navegador el enlace de su invitación de dueña y el sistema le avisó que va a cerrar esa sesión
    When "Ana López" elige continuar
    Then la sesión de veterinario de "Ana López" queda cerrada
    And el sistema muestra las opciones "Continuar con Google" y "Continuar con Apple"

  @FA-05
  Scenario: La persona vuelve del proveedor sin ingresar
    When "Carla Gómez" abre el enlace de la invitación, elige Google y cancela en Google
    Then no se vincula ninguna cuenta
    And la cuenta de "Carla Gómez" sigue en estado "Invitado"
    And la invitación sigue en estado "Invitado" hasta el "20/10/2026 14:00"

  @FA-06 @RN-04 @RN-05 @D97 @D99
  Scenario: Después de una reactivación vuelve a vincular la misma cuenta
    Given "Carla Gómez" fue dada de baja cuando tenía vinculada la cuenta de Google "carla.gomez@gmail.com"
    And el "20/10/2026 09:00" el administrador la reactivó, su cuenta volvió al estado "Invitado" y recibió una invitación nueva
    When "Carla Gómez" usa la invitación nueva con la cuenta de Google "carla.gomez@gmail.com"
    Then la cuenta de Google "carla.gomez@gmail.com" queda vinculada a "Carla Gómez"
    And la cuenta de "Carla Gómez" pasa al estado "Activo"

  @EX-01 @EX-03 @EX-04 @RN-02 @D37 @D87 @D111
  Scenario Outline: Invitaciones que ya no sirven
    Given <situación>
    When "Carla Gómez" usa ese enlace con la cuenta de Google "carla.gomez@gmail.com"
    Then no se vincula ninguna cuenta
    And el sistema informa "<mensaje>"

    Examples:
      | situación                                                 | mensaje                                                                                                         |
      | la invitación está en estado Vigente desde el 19/10/2026 18:30 | Esta invitación ya se usó. Ingresá con tu cuenta de Google o Apple.                                             |
      | el 20/10/2026 09:00 se generó otra invitación y esta quedó Vencida | Esta invitación ya no es válida porque se generó una más nueva. Usá el enlace del último email que recibiste; si no te llegó, comunicate con WildSalud. |
      | el 20/10/2026 09:00 se generó otra invitación cuyo envío falló, y esta quedó Vencida | Esta invitación ya no es válida porque se generó una más nueva. Usá el enlace del último email que recibiste; si no te llegó, comunicate con WildSalud. |
      | el enlace fue alterado                                    | El enlace de invitación no es válido.                                                                           |

  @EX-02 @RN-02 @D53 @D54 @D87
  Scenario Outline: La invitación vence a las 24 horas
    Given la fecha y hora actual es "<momento>"
    When "Carla Gómez" usa el enlace de la invitación con la cuenta de Google "carla.gomez@gmail.com"
    Then el resultado es "<resultado>"

    Examples:
      | momento          | resultado                                                                 |
      | 20/10/2026 13:59 | vinculada y la invitación queda Vigente                                   |
      | 20/10/2026 14:00 | Esta invitación venció. Comunicate con WildSalud para que te la reenvíe. |

  @EX-02 @EX-05 @RN-05 @RF-AUT-04 @RF-ROL-06 @RF-VET-05 @D47 @D92 @D96
  Scenario Outline: El mensaje indica a quién pedir ayuda según el rol
    Given "<usuario>", con el rol <rol>, tiene una invitación que <situación>
    When "<usuario>" usa el enlace de la invitación con la cuenta de Google "<cuenta>"
    Then no se vincula ninguna cuenta
    And el sistema informa "<mensaje>"

    Examples:
      | usuario     | rol                  | situación                                             | cuenta                | mensaje                                                                          |
      | Carla Gómez | Dueño afiliado       | venció el 15/10/2026 10:00                            | carla.gomez@gmail.com | Esta invitación venció. Comunicate con WildSalud para que te la reenvíe.        |
      | Ana López   | Veterinario asociado | venció el 15/10/2026 10:00                            | ana.lopez@gmail.com   | Esta invitación venció. Comunicate con el administrador para que te la reenvíe. |
      | Carla Gómez | Dueño afiliado       | estaba sin usar, pero su cuenta está en estado Inactivo | carla.gomez@gmail.com | Tu cuenta está inactiva. Comunicate con WildSalud.                               |
      | Ana López   | Veterinario asociado | estaba sin usar, pero su cuenta está en estado Inactivo | ana.lopez@gmail.com   | Tu cuenta está inactiva. Comunicate con el administrador.                        |

  @RN-07 @RNF-SEG-07
  Scenario Outline: Se vuelve a validar al volver del proveedor
    Given "Carla Gómez" abrió el enlace de la invitación y eligió Google
    And mientras ingresaba en Google, <cambio>
    When Google confirma la cuenta "carla.gomez@gmail.com"
    Then no se vincula ninguna cuenta
    And el sistema informa "<mensaje>"

    Examples:
      | cambio                                     | mensaje                                                                                                         |
      | el administrador le reenvió la invitación  | Esta invitación ya no es válida porque se generó una más nueva. Usá el enlace del último email que recibiste; si no te llegó, comunicate con WildSalud. |
      | el administrador dio de baja a Carla Gómez | Tu cuenta está inactiva. Comunicate con WildSalud.                                                              |

  @EX-06 @RN-04 @RF-ROL-03 @D46 @D89
  Scenario Outline: Una persona con dos roles necesita una cuenta distinta para cada uno
    Given el veterinario "Ana López" de la veterinaria "Patitas" tiene vinculada la cuenta de Google "ana.lopez@gmail.com"
    And "Ana López" también fue dada de alta como dueña y tiene una invitación en estado "Invitado"
    When "Ana López" usa la invitación de dueña con la cuenta de Google "<cuenta>"
    Then el resultado es "<resultado>"
    And la cuenta vinculada a su usuario de veterinario sigue siendo "ana.lopez@gmail.com"

    Examples:
      | cuenta                   | resultado                                                                                     |
      | ana.lopez@gmail.com      | Esta cuenta de Google ya está vinculada a otro usuario de WildSalud. Ingresá con otra cuenta. |
      | ana.lopez.casa@gmail.com | vinculada                                                                                     |

  @EX-06 @RN-04 @D89 @D97
  Scenario: La cuenta de un usuario dado de baja sigue reservada para él
    Given el dueño "Pedro Sosa" con DNI "28999888" tiene vinculada la cuenta de Google "pedro.sosa@gmail.com" y está en estado "Inactivo"
    When "Carla Gómez" usa el enlace de su invitación con la cuenta de Google "pedro.sosa@gmail.com"
    Then no se vincula ninguna cuenta
    And la cuenta de Google "pedro.sosa@gmail.com" sigue reservada para "Pedro Sosa"
    And la invitación de "Carla Gómez" sigue en estado "Invitado"
    And el sistema informa "Esta cuenta de Google ya está vinculada a otro usuario de WildSalud. Ingresá con otra cuenta."

  @EX-07
  Scenario: El proveedor no confirma la identidad
    When "Carla Gómez" usa el enlace de la invitación y Google responde con un error
    Then no se vincula ninguna cuenta
    And la invitación sigue en estado "Invitado"
    And el sistema informa "No pudimos validar tu cuenta de Google. Intentá de nuevo."

  @EX-08 @RN-10 @RNF-INT-01
  Scenario: La misma confirmación del proveedor llega dos veces
    Given "Carla Gómez" abrió el enlace de la invitación y eligió Google
    When la confirmación de Google para la cuenta "carla.gomez@gmail.com" llega dos veces
    Then la cuenta queda vinculada una sola vez
    And la auditoría registra una sola vinculación

  @EX-09 @RN-10 @RNF-INT-01
  Scenario: Dos cuentas intentan usar la misma invitación a la vez
    When "Carla Gómez" usa la invitación al mismo tiempo en dos pestañas, con la cuenta de Google "carla.gomez@gmail.com" y con la cuenta de Apple "carla.gomez@icloud.com"
    Then solo una de las dos cuentas queda vinculada a "Carla Gómez"
    And en la otra pestaña el sistema informa "Esta invitación ya se usó. Ingresá con tu cuenta de Google o Apple."

  @RN-08 @RNF-LEG-01
  Scenario: Los datos del perfil del proveedor no reemplazan los datos cargados
    Given la cuenta de Google "carlita.g@gmail.com" tiene el nombre de perfil "Carlita G."
    When "Carla Gómez" usa el enlace de la invitación con la cuenta de Google "carlita.g@gmail.com"
    Then el nombre registrado de "Carla Gómez" sigue siendo "Carla Gómez"
    And su email registrado sigue siendo "carla.gomez@gmail.com"

  @RN-09 @RNF-SEG-01 @D45
  Scenario: El enlace no contiene datos personales
    When "Carla Gómez" abre el enlace de la invitación
    Then la dirección del enlace no contiene su DNI, su email ni ningún identificador interno
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-AUT-01, RNF-SEG-06 | Paso 3, RN-08 |
| RF-AUT-02, RF-ROL-03, RF-ROL-04 | RN-04, EX-06 |
| RF-AUT-04, RF-ROL-06, RF-VET-05 | RN-05, EX-05 |
| RF-ROL-01, RF-ROL-02 | Flujo principal, RN-01 |
| RF-VET-03 | RN-03, FA-01 |
| RNF-SEG-01, RNF-SEG-05 | RN-09 |
| RNF-SEG-07 | Paso 7, RN-07 |
| RNF-INT-01 | RN-10, EX-08, EX-09 |
| RNF-AUD-01 | Paso 9, RN-11 |
| RNF-LEG-01 | RN-08 |
| D15, D50, D112 | Actor principal, Precondición 1 |
| D24 | Paso 3, RN-01, RN-08 |
| D37 | RN-01, RN-02, RN-03, RN-06, FA-01, FA-02 |
| D45 | RN-03, RN-09 |
| D46 | RN-04, RN-12, FA-04, EX-06 |
| D47 | Paso 8, RN-05, RN-07 |
| D53, D54 | RN-02 |
| D84 | RN-02, EX-03 |
| D87, D111 | RN-02, EX-01 a EX-04 |
| D89 | RN-04, EX-06 |
| D91 | RN-06, FA-02 |
| D92, D96 | RN-05, EX-05 |
| D93 | RN-12, FA-04 |
| D94 | Paso 9, RN-11 |
| D97, D99 | Precondición 1, RN-04, RN-05, FA-06 |
