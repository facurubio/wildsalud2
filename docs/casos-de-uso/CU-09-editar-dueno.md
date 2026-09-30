# CU-09 — Editar dueño

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Corregir o actualizar los datos personales, de contacto y la forma de pago preferida de un dueño. |
| **Disparador** | El dueño informa un cambio (mudanza, teléfono o email nuevo, otra forma de pago) o el administrador detecta un error de carga. |
| **Relaciones** | El dueño se ubica con CU-33 Buscar/filtrar dueños y mascotas. El propio dueño puede cambiar su teléfono y su dirección en CU-42; las dos ediciones se protegen entre sí (EX-09 de este caso y EX-04 de CU-42). Si cambia el email de un dueño con la cuenta *Invitado*, se envía una invitación nueva como en CU-12 Reenviar invitación. Los cambios se consultan en CU-36 Consultar historial de auditoría. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El dueño no está dado de baja (su cuenta está en estado *Invitado* o *Activo*).

## Flujo principal

1. El administrador elige **Editar** desde la ficha del dueño.
2. El sistema muestra como **editables** todos los datos del dueño: nombre, apellido, DNI, email, teléfono, dirección (calle, número, piso, departamento, localidad, provincia y código postal) y forma de pago preferida. El estado de la cuenta se muestra como **solo lectura**.
3. El administrador modifica uno o más datos y elige **Guardar**.
4. El sistema valida las reglas **RN-02 a RN-05** en el orden de **RN-07**.
5. El sistema verifica que el dueño siga sin estar dado de baja y que sus datos no hayan cambiado desde que se abrió la pantalla (**RN-08** y **RN-10**).
6. El sistema guarda los cambios.
7. El sistema deja un registro de auditoría por cada dato modificado, con el valor anterior y el valor nuevo (**RN-09**).
8. El sistema confirma: *"Se actualizaron los datos de {dueño}."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 6 | Se cambia el email de un dueño con la cuenta *Activo*. | La cuenta sigue vinculada a la misma cuenta de Google o Apple, porque la vinculación es por el identificador del proveedor y no por el email. El dueño sigue ingresando igual y no se envía ninguna invitación. Los avisos por email (CU-47 a CU-50) y una futura invitación (CU-12) van al email nuevo. |
| **FA-02** | 6 | Se cambia el email de un dueño con la cuenta *Invitado*. | La invitación sin usar pasa a *Vencida* (su enlace ya no permite vincular una cuenta) y el sistema envía una nueva, en estado *Invitado*, al email nuevo, que vence a las 24 horas, registrando el resultado del envío. La anterior pasa a *Vencida* aunque falle el envío de la nueva. Confirma: *"Se actualizaron los datos de {dueño}. Le enviamos una nueva invitación a {email}."* Si el envío falla, los datos quedan guardados y el sistema informa: *"Se actualizaron los datos de {dueño}, pero no se pudo enviar la invitación a {email}. Reenviala desde su ficha."* (CU-12). |
| **FA-03** | 6 | Se cambia la forma de pago preferida. | Desde ese momento se propone la nueva en cada pago (CU-22, CU-26). Los pagos ya registrados conservan la forma de pago que se usó. |
| **FA-04** | 3 | El administrador cancela. | No se guarda ningún cambio. |

## Excepciones

En todas las excepciones **no se guarda ningún cambio**, y el sistema informa el motivo. Aunque la pantalla ya marca los errores de formato, el sistema vuelve a validar todo al guardar (RNF-SEG-07).

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | Se borró un dato obligatorio que no es de la dirección. | *"Completá el campo {campo}."* |
| **EX-02** | 4 | Se borró un dato obligatorio de la dirección. | *"Completá {campo} de la dirección."* |
| **EX-03** | 4 | El DNI no tiene un formato válido. | *"Ingresá un DNI válido, de 7 u 8 dígitos."* |
| **EX-04** | 4 | El teléfono no tiene un formato válido. | *"Ingresá un teléfono válido, con código de área."* |
| **EX-05** | 4 | El email no tiene un formato válido. | *"Ingresá un email válido."* |
| **EX-06** | 4 | El DNI nuevo es de otro dueño (en cualquier estado). | *"Ya existe un dueño con el DNI {DNI}: {otro dueño}."* |
| **EX-07** | 4 | El email nuevo es de otro dueño (en cualquier estado). | *"El email {email} ya está registrado para el dueño {otro dueño}."* |
| **EX-08** | 4 | No se modificó ningún dato. | *"No hay cambios para guardar."* |
| **EX-09** | 5 | Otro administrador o el propio dueño (CU-42) modificó los datos mientras se editaban. | *"Los datos de {dueño} cambiaron mientras los editabas. Revisalos y volvé a guardar."* |
| **EX-10** | 5 | El dueño fue dado de baja mientras se editaban sus datos (CU-10). | *"La cuenta de {dueño} está inactiva. Reactivala antes de modificar sus datos."* |
| **EX-11** | 3 | La misma confirmación llega dos veces (doble clic o reintento de red). | Los cambios se guardan **una sola** vez y la auditoría registra un solo cambio por dato; el segundo envío devuelve el mismo resultado que el primero. |
| **EX-12** | 3 | Un usuario que no es administrador intenta modificar los datos del dueño (por ejemplo, un veterinario que envía el pedido sin usar la pantalla). | *"No tenés permiso para hacer esta operación."* |

## Postcondiciones

- **Éxito:** los datos modificados quedan actualizados y cada cambio queda en el historial de auditoría (CU-36) con valor anterior, valor nuevo, administrador, fecha y hora. Si cambió el email de una cuenta *Invitado*, la invitación anterior quedó *Vencida* y hay una nueva en estado *Invitado* (o con el envío fallido registrado).
- **Fracaso:** los datos del dueño, su cuenta y sus invitaciones no cambian. Los intentos rechazados no quedan en el historial de auditoría.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Qué edita el administrador.** Todos los datos del dueño: nombre, apellido, DNI, email, teléfono, dirección y forma de pago preferida. No edita el estado de la cuenta (lo cambian CU-10 y CU-11) ni la cuenta de Google o Apple vinculada (se cambia con CU-12). | RF-DUE-01, RF-DUE-02, D83 |
| **RN-02** | **Datos obligatorios y formato.** Los mismos que en el alta (CU-08): todos los datos son obligatorios salvo piso y departamento; DNI de 7 u 8 dígitos, guardado sin puntos; teléfono con código de área, entre 10 y 13 dígitos; email con formato válido, guardado en minúsculas. | RF-DUE-01, D75, D80 |
| **RN-03** | **DNI único dentro del rol.** El DNI nuevo no puede ser de otro dueño, incluidos los dados de baja. Puede coincidir con el de un veterinario. | D44, D45, D46 |
| **RN-04** | **Email único dentro del rol.** El email nuevo no puede ser de otro dueño, incluidos los dados de baja, sin distinguir mayúsculas. Puede coincidir con el de un veterinario. | D46, D81 |
| **RN-05** | **Forma de pago preferida.** Se elige de la lista fija. Cambiarla no modifica los pagos ya registrados. | D7, D59 |
| **RN-06** | **Email y vinculación.** Cambiar el email no cambia la cuenta de Google o Apple vinculada. Si la cuenta está *Invitado*, la invitación sin usar pasa a *Vencida*, aunque falle el envío de la nueva, y se envía una nueva en estado *Invitado* al email nuevo, que vence a las 24 horas, registrando el resultado del envío. Si el envío falla, el administrador la reenvía con CU-12. | D37, D43, D47, D84, D87, D111, RF-NOT-03 |
| **RN-07** | **Orden de validación.** Primero datos obligatorios y formato (RN-02), informando todos los campos con error a la vez; después DNI (RN-03) y, por último, email (RN-04). De estos últimos se informa el **primero** que falla. | RF-DUE-01 |
| **RN-08** | **Sin sobrescribir en silencio.** Si los datos cambiaron desde que se abrió la pantalla (por otro administrador o por el dueño en CU-42), no se guardan y se pide revisarlos. | RNF-INT-01 |
| **RN-09** | **Auditoría de cada dato.** Cada dato modificado queda registrado con valor anterior, valor nuevo, administrador, fecha y hora. | RF-TRA-01, RNF-AUD-01, D76, D85 |
| **RN-10** | **Solo dueños no dados de baja.** Los datos de un dueño dado de baja no se editan; si vuelve, primero se lo reactiva (CU-11). | RNF-BAJ-03, D44, D83 |
| **RN-11** | **Permisos.** Solo el administrador edita todos los datos del dueño. El dueño edita solo su teléfono y su dirección (CU-42) y el veterinario no edita ninguno. El sistema lo verifica aunque la modificación no se haga desde la pantalla, y rechaza el intento con *"No tenés permiso para hacer esta operación."* | RF-DUE-02, RF-ROL-11, RNF-SEG-02, RNF-SEG-07, D110 |
| **RN-12** | **Sin duplicados.** Cada confirmación se procesa una sola vez. | RNF-INT-01 |
| **RN-13** | **Datos personales.** DNI, dirección y teléfono son datos sensibles: los ven el propio dueño y el administrador. El veterinario ve nombre, apellido, DNI y teléfono, ya actualizados, pero no la dirección ni el email. | RNF-SEG-01, RNF-LEG-01, RF-ROL-09 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Dueño | Los datos modificados. |
| Invitación (si cambió el email de una cuenta *Invitado*) | La que estaba sin usar pasa a *Vencida*. Se crea una nueva en estado *Invitado* con el email nuevo, fecha y hora de envío y vencimiento (24 horas después). |
| Envío (si se envió una invitación nueva) | Canal (email), resultado (éxito o fallo), fecha y hora (D43). |
| Auditoría | Un registro por dato modificado: dato, valor anterior, valor nuevo, administrador, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-09
Feature: CU-09 Editar dueño
  Como administrador
  Quiero corregir o actualizar los datos de un dueño
  Para que su información esté al día y sin errores

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And la dueña "Carla Gómez" tiene DNI "30111222", email "carla.gomez@gmail.com", teléfono "11 5555-1234", dirección "Av. Corrientes 1234, CABA, Buenos Aires, 1043", forma de pago preferida "Transferencia bancaria" y la cuenta en estado "Activo"
    And el dueño "Pedro Sosa" tiene DNI "28999888" y email "pedro.sosa@gmail.com"

  @flujo-principal @RF-DUE-01 @RF-TRA-01 @RNF-AUD-01 @RNF-USA-01 @D75 @D76
  Scenario: Actualizar el teléfono y la dirección
    When el administrador cambia el teléfono de "Carla Gómez" a "11 6666-9876" y la dirección a calle "Mitre", número "550", piso "3", departamento "B", localidad "Rosario", provincia "Santa Fe", código postal "2000" y guarda
    Then el teléfono de "Carla Gómez" es "11 6666-9876"
    And su dirección es "Mitre 550 3° B, Rosario, Santa Fe, 2000"
    And la auditoría registra el cambio de teléfono con valor anterior "11 5555-1234", valor nuevo "11 6666-9876", usuario "Marta Ruiz" y fecha "20/10/2026 10:00"
    And la auditoría registra el cambio de dirección con valor anterior "Av. Corrientes 1234, CABA, Buenos Aires, 1043" y valor nuevo "Mitre 550 3° B, Rosario, Santa Fe, 2000"
    And el sistema informa "Se actualizaron los datos de Carla Gómez."

  @flujo-principal @RN-01 @RN-09 @D76 @D83 @D85
  Scenario Outline: El administrador puede editar cualquier dato y cada cambio queda auditado
    When el administrador cambia <dato> de "Carla Gómez" a "<valor nuevo>" y guarda
    Then <dato> de "Carla Gómez" es "<valor nuevo>"
    And la auditoría registra el cambio con valor anterior "<valor anterior>", valor nuevo "<valor nuevo>", usuario "Marta Ruiz" y fecha "20/10/2026 10:00"

    Examples:
      | dato                       | valor anterior         | valor nuevo             |
      | el nombre                  | Carla                  | Carla Andrea            |
      | el apellido                | Gómez                  | Gómez Álvarez           |
      | el DNI                     | 30111222               | 30111223                |
      | el email                   | carla.gomez@gmail.com  | carla.gomez@hotmail.com |
      | la forma de pago preferida | Transferencia bancaria | Efectivo                |

  @FA-01 @RN-06 @D37 @D84
  Scenario: Cambiar el email de un dueño con la cuenta activa no cambia su vinculación
    Given la cuenta de "Carla Gómez" está vinculada a su cuenta de Google
    When el administrador cambia el email de "Carla Gómez" a "carla.gomez@hotmail.com" y guarda
    Then la cuenta de "Carla Gómez" sigue en estado "Activo" y vinculada a la misma cuenta de Google
    And no se envía ninguna invitación
    And los próximos avisos por email de "Carla Gómez" se envían a "carla.gomez@hotmail.com"

  @FA-02 @RN-06 @D37 @D47 @D84 @D87 @D111
  Scenario: Cambiar el email de un dueño con la cuenta invitada reemplaza la invitación
    Given la cuenta de "Carla Gómez" está en estado "Invitado" con una invitación sin usar enviada a "carla.gomez@gmail.com"
    When el administrador cambia el email de "Carla Gómez" a "carla.gomez@hotmail.com" y guarda
    Then la invitación enviada a "carla.gomez@gmail.com" queda "Vencida" y su enlace ya no permite vincular una cuenta
    And se envió una nueva invitación de un solo uso a "carla.gomez@hotmail.com", en estado "Invitado" y que vence el "21/10/2026 10:00"
    And el sistema informa "Se actualizaron los datos de Carla Gómez. Le enviamos una nueva invitación a carla.gomez@hotmail.com."

  @FA-02 @RF-NOT-03 @D43 @D87
  Scenario: Falla el envío de la nueva invitación
    Given la cuenta de "Carla Gómez" está en estado "Invitado" con una invitación sin usar enviada a "carla.gomez@gmail.com"
    And el envío de emails no está funcionando
    When el administrador cambia el email de "Carla Gómez" a "carla.gomez@hotmail.com" y guarda
    Then el email de "Carla Gómez" es "carla.gomez@hotmail.com"
    And la invitación enviada a "carla.gomez@gmail.com" queda "Vencida", aunque falló el envío de la nueva
    And el envío de la nueva invitación quedó registrado como fallido
    And el sistema informa "Se actualizaron los datos de Carla Gómez, pero no se pudo enviar la invitación a carla.gomez@hotmail.com. Reenviala desde su ficha."

  @FA-03 @RN-05 @D7
  Scenario: Cambiar la forma de pago preferida no modifica los pagos ya registrados
    Given la mascota "Luna" de "Carla Gómez" tiene un pago del período "2026-10" con forma de pago "Transferencia bancaria"
    When el administrador cambia la forma de pago preferida de "Carla Gómez" a "Efectivo" y guarda
    Then el pago del período "2026-10" de "Luna" sigue teniendo forma de pago "Transferencia bancaria"
    And en el próximo pago de "Luna" se propone la forma de pago "Efectivo"

  @FA-04
  Scenario: El administrador cancela
    When el administrador cambia el teléfono de "Carla Gómez" a "11 6666-9876" y cancela
    Then el teléfono de "Carla Gómez" sigue siendo "11 5555-1234"
    And la auditoría no registra cambios de "Carla Gómez"

  @EX-01 @EX-02 @RN-02 @RF-DUE-01 @D80
  Scenario Outline: Datos obligatorios
    When el administrador borra <dato> de "Carla Gómez" y guarda
    Then los datos de "Carla Gómez" no cambian
    And el sistema informa "<mensaje>"

    Examples:
      | dato                         | mensaje                             |
      | el nombre                    | Completá el campo nombre.           |
      | el email                     | Completá el campo email.            |
      | el teléfono                  | Completá el campo teléfono.         |
      | la localidad de la dirección | Completá localidad de la dirección. |
      | el número de la dirección    | Completá número de la dirección.    |

  @EX-03 @EX-04 @EX-05 @RN-02 @D75 @D80
  Scenario Outline: Formato del DNI, el teléfono y el email
    When el administrador cambia <dato> de "Carla Gómez" a "<valor>" y guarda
    Then el resultado es "<resultado>"

    Examples:
      | dato        | valor            | resultado                                        |
      | el DNI      | 30.111.223       | Se actualizaron los datos de Carla Gómez.        |
      | el DNI      | 301112           | Ingresá un DNI válido, de 7 u 8 dígitos.         |
      | el teléfono | +54 11 6666-9876 | Se actualizaron los datos de Carla Gómez.        |
      | el teléfono | 6666-9876        | Ingresá un teléfono válido, con código de área.  |
      | el email    | carla.gomez@     | Ingresá un email válido.                         |

  @EX-06 @RN-03 @D44
  Scenario Outline: El DNI nuevo es de otro dueño
    Given la cuenta de "Pedro Sosa" está en estado "<estado>"
    When el administrador cambia el DNI de "Carla Gómez" a "28999888" y guarda
    Then el DNI de "Carla Gómez" sigue siendo "30111222"
    And el sistema informa "Ya existe un dueño con el DNI 28999888: Pedro Sosa."

    Examples:
      | estado   |
      | Activo   |
      | Inactivo |

  @EX-07 @RN-04 @D81
  Scenario: El email nuevo es de otro dueño
    When el administrador cambia el email de "Carla Gómez" a "Pedro.Sosa@gmail.com" y guarda
    Then el email de "Carla Gómez" sigue siendo "carla.gomez@gmail.com"
    And el sistema informa "El email pedro.sosa@gmail.com ya está registrado para el dueño Pedro Sosa."

  @RN-07 @EX-06
  Scenario: Si el DNI y el email son de otro dueño, se informa primero el DNI
    When el administrador cambia el DNI de "Carla Gómez" a "28999888" y el email a "pedro.sosa@gmail.com" y guarda
    Then los datos de "Carla Gómez" no cambian
    And el sistema informa "Ya existe un dueño con el DNI 28999888: Pedro Sosa."

  @EX-08
  Scenario: Guardar sin cambios
    When el administrador guarda los datos de "Carla Gómez" sin modificarlos
    Then la auditoría no registra cambios de "Carla Gómez"
    And el sistema informa "No hay cambios para guardar."

  @EX-09 @RN-08 @RNF-INT-01
  Scenario Outline: Los datos cambiaron mientras el administrador los editaba
    Given el administrador "Marta Ruiz" abrió la edición de "Carla Gómez"
    And <quién> cambió el teléfono de "Carla Gómez" a "11 7777-0000"
    When "Marta Ruiz" cambia el teléfono de "Carla Gómez" a "11 6666-9876" y guarda
    Then el teléfono de "Carla Gómez" sigue siendo "11 7777-0000"
    And el sistema informa "Los datos de Carla Gómez cambiaron mientras los editabas. Revisalos y volvé a guardar."

    Examples:
      | quién                                      |
      | el administrador "Jorge Paz"               |
      | la propia "Carla Gómez" desde "Mis datos"  |

  @EX-10 @RN-10 @RNF-BAJ-03 @D83
  Scenario: El dueño fue dado de baja mientras se editaban sus datos
    Given el administrador "Marta Ruiz" abrió la edición de "Carla Gómez"
    And el administrador "Jorge Paz" dio de baja a "Carla Gómez"
    When "Marta Ruiz" cambia el teléfono de "Carla Gómez" a "11 6666-9876" y guarda
    Then el teléfono de "Carla Gómez" sigue siendo "11 5555-1234"
    And el sistema informa "La cuenta de Carla Gómez está inactiva. Reactivala antes de modificar sus datos."

  @EX-11 @RN-12 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces guarda los cambios una sola vez
    When el administrador guarda el cambio de teléfono de "Carla Gómez" a "11 6666-9876" y la misma confirmación se envía dos veces
    Then el teléfono de "Carla Gómez" es "11 6666-9876"
    And la auditoría registra un solo cambio de teléfono

  @EX-12 @RN-11 @RF-ROL-11 @RNF-SEG-07 @D110
  Scenario: Un veterinario no puede editar los datos de un dueño
    Given el veterinario "Ana López" inició sesión
    When "Ana López" envía una modificación del teléfono de "Carla Gómez" sin usar la pantalla
    Then el teléfono de "Carla Gómez" sigue siendo "11 5555-1234"
    And el sistema informa "No tenés permiso para hacer esta operación."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-DUE-01 | Paso 2, RN-01, RN-02, RN-07, EX-01 a EX-05 |
| RF-DUE-02 | RN-01, RN-11 |
| RF-ROL-09 | RN-13 |
| RF-ROL-11 | RN-11, EX-12 |
| RF-NOT-03 | RN-06, FA-02 |
| RF-TRA-01, RNF-AUD-01 | Paso 7, RN-09 |
| RNF-BAJ-03 | Precondición 2, RN-10, EX-10 |
| RNF-SEG-01, RNF-LEG-01 | RN-13 |
| RNF-SEG-02, RNF-SEG-07 | RN-11, EX-12, nota de Excepciones |
| RNF-INT-01 | RN-08, RN-12, EX-09, EX-11 |
| RNF-USA-01 | Paso 8 |
| D7, D59 | RN-05, FA-03 |
| D37, D47 | RN-06, FA-01, FA-02 |
| D84, D87, D111 | RN-06, FA-01, FA-02 |
| D43 | RN-06, FA-02 |
| D44, D45 | RN-03, RN-10, EX-06 |
| D46 | RN-03, RN-04 |
| D75 | RN-02, EX-02, EX-04 |
| D76, D85 | Paso 7, RN-09 |
| D80 | RN-02, EX-01 a EX-05 |
| D81 | RN-04, EX-07 |
| D83 | RN-01, RN-10, EX-10 |
| D110 | RN-11, EX-12 |
