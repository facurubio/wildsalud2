# CU-08 — Dar de alta dueño

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Registrar a un dueño afiliado con sus datos y enviarle la invitación para que vincule su cuenta de Google o Apple. |
| **Disparador** | Una persona quiere afiliar a sus mascotas a WildSalud y le pasa sus datos al administrador. |
| **Relaciones** | La persona vincula su cuenta en CU-01 Vincular cuenta por invitación. Si la invitación no llegó o se perdió, se reenvía con CU-12 Reenviar invitación. Las mascotas se dan de alta después, con CU-13 Dar de alta mascota. Si el DNI es de un dueño dado de baja, se usa CU-11 Reactivar dueño. Los datos se modifican en CU-09 y la baja es CU-10. El alta queda en el historial de auditoría (CU-36). |

## Precondiciones

1. El administrador inició sesión (CU-02).

## Flujo principal

1. El administrador elige **Dar de alta dueño**.
2. El sistema muestra el formulario de alta:
   - nombre, apellido y DNI;
   - email y teléfono;
   - dirección: calle, número, piso, departamento, localidad, provincia y código postal;
   - forma de pago preferida, elegida de la lista fija: Efectivo, Transferencia bancaria, Tarjeta de débito o Tarjeta de crédito.

   No pide el estado de la cuenta: lo asigna el sistema.
3. El administrador completa los datos y confirma.
4. El sistema valida las reglas **RN-01 a RN-05** en el orden de **RN-11**.
5. El sistema crea el dueño con un identificador interno y su cuenta en estado **Invitado**, sin cuenta de Google o Apple vinculada y sin mascotas.
6. El sistema genera una invitación de un solo uso en estado *Invitado*, que vence a las 24 horas, la envía al email registrado y registra el resultado del envío (**RN-08**).
7. El sistema deja el registro de auditoría del alta.
8. El sistema confirma: *"Se dio de alta a {dueño}. Le enviamos la invitación a {email}."* y ofrece **Dar de alta mascota**.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | El administrador cancela. | No se crea el dueño ni se envía ninguna invitación. |
| **FA-02** | 6 | El envío del email de invitación falla. | El dueño queda dado de alta con la cuenta *Invitado* y el envío queda registrado como fallido. El sistema informa: *"Se dio de alta a {dueño}, pero no se pudo enviar la invitación a {email}. Reenviala desde su ficha."* (CU-12). |
| **FA-03** | 8 | El administrador elige **Dar de alta mascota**. | Se inicia CU-13 con el dueño recién creado ya elegido. |
| **FA-04** | 4 | El DNI o el email coinciden con los de un veterinario (la misma persona tiene los dos roles). | El alta se registra igual: el dueño es un usuario separado del veterinario (**RN-10**). |

## Excepciones

En todas las excepciones **no se crea el dueño ni se envía ninguna invitación**, y el sistema informa el motivo. Aunque la pantalla ya marca los errores de formato, el sistema vuelve a validar todo al confirmar (RNF-SEG-07).

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | Falta un dato obligatorio que no es de la dirección. | *"Completá el campo {campo}."* |
| **EX-02** | 4 | Falta un dato obligatorio de la dirección. | *"Completá {campo} de la dirección."* |
| **EX-03** | 4 | El DNI no tiene un formato válido. | *"Ingresá un DNI válido, de 7 u 8 dígitos."* |
| **EX-04** | 4 | El teléfono no tiene un formato válido. | *"Ingresá un teléfono válido, con código de área."* |
| **EX-05** | 4 | El email no tiene un formato válido. | *"Ingresá un email válido."* |
| **EX-06** | 4 | Ya existe un dueño con ese DNI y la cuenta en estado *Invitado* o *Activo*. | *"Ya existe un dueño con el DNI {DNI}: {dueño}."* |
| **EX-07** | 4 | El DNI es de un dueño dado de baja. | *"El DNI {DNI} corresponde a {dueño}, con la cuenta inactiva. Para que vuelva, reactivá su cuenta desde su ficha."* |
| **EX-08** | 4 | El email ya está registrado para otro dueño (en cualquier estado). | *"El email {email} ya está registrado para el dueño {dueño}."* |
| **EX-09** | 3 | La misma confirmación llega dos veces (doble clic o reintento de red). | Se crea **un solo** dueño y se envía **una sola** invitación; el segundo envío devuelve el mismo resultado que el primero. |
| **EX-10** | 4 | Dos administradores dan de alta a la vez un dueño con el mismo DNI o el mismo email. | Solo uno se crea; el otro recibe el mensaje de EX-06 o de EX-08. |
| **EX-11** | 3 | Un usuario que no es administrador intenta dar de alta un dueño (por ejemplo, un veterinario que envía el pedido sin usar la pantalla). | *"No tenés permiso para hacer esta operación."* |

## Postcondiciones

- **Éxito:** el dueño queda registrado con la cuenta *Invitado*, sin mascotas y con una invitación de un solo uso, que vence a las 24 horas, enviada a su email (o con el envío fallido registrado, FA-02). Todavía no puede ingresar: primero tiene que vincular su cuenta de Google o Apple desde la invitación (CU-01). El alta queda en el historial de auditoría (CU-36).
- **Fracaso:** no se crea ningún dueño ni se envía ninguna invitación. Los intentos rechazados no quedan en el historial de auditoría.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Datos obligatorios.** Nombre, apellido, DNI, email, teléfono, dirección y forma de pago preferida. De la dirección son obligatorios calle, número, localidad, provincia y código postal; piso y departamento son opcionales. El estado de la cuenta no se carga: lo asigna el sistema. | RF-DUE-01, D75, D80 |
| **RN-02** | **Formato.** DNI: 7 u 8 dígitos; se aceptan puntos y se guardan solo los dígitos. Teléfono: con código de área, entre 10 y 13 dígitos (se admiten espacios, guiones y el prefijo +54). Email: formato válido; se guarda en minúsculas. Nombre, apellido y dirección: texto libre. Son los mismos formatos que en CU-04 y CU-42. | RF-DUE-01, D75, D80 |
| **RN-03** | **DNI único dentro del rol.** No puede haber dos dueños con el mismo DNI, incluidos los dados de baja. El dueño se identifica en el negocio por su DNI y un identificador interno que nunca se muestra; no tiene número de socio. | RF-MAS-04, D44, D45 |
| **RN-04** | **Email único dentro del rol.** No puede haber dos dueños con el mismo email, incluidos los dados de baja, sin distinguir mayúsculas. | D46, D81 |
| **RN-05** | **Quien ya fue dueño se reactiva.** Si el DNI es de un dueño dado de baja, el alta se rechaza y el mensaje indica reactivarlo: no se crea otro registro, se reactiva el existente con su historial (CU-11). | D44, D82, RNF-BAJ-03 |
| **RN-06** | **Forma de pago preferida.** Se elige de la lista fija. Es la que se propone por defecto al registrar cada pago de sus mascotas; cada pago guarda la forma realmente usada. | RF-DUE-01, D7, D59 |
| **RN-07** | **Cuenta por invitación.** El dueño se crea con la cuenta *Invitado*. El sistema le envía al email registrado un enlace de un solo uso; la invitación queda en estado *Invitado* y es la única que sirve para vincular. Si no se usa en 24 horas pasa a *Vencida*. Cuando la persona vincula su cuenta de Google o Apple desde ese enlace (CU-01), la invitación pasa a *Vigente* y la cuenta a *Activo*, por el identificador del proveedor y no por el email. Nadie se registra por su cuenta y el sistema no guarda contraseñas. | RF-ROL-02, RF-DUE-03, RF-AUT-02, D24, D37, D47, D87, D111 |
| **RN-08** | **Registro del envío.** Se guarda el canal (email) y el resultado (éxito o fallo) del envío de la invitación. Un envío fallido no deshace el alta. | RF-NOT-03, D43 |
| **RN-09** | **Una cuenta para todas sus mascotas.** El dueño tiene una única cuenta, desde la que ve todas sus mascotas. El alta del dueño no crea mascotas ni coberturas: se agregan con CU-13. | RF-MAS-02, RF-ROL-04 |
| **RN-10** | **Un rol por cuenta.** Si la persona ya es veterinario, se la da de alta igual como dueño: son dos usuarios separados, con el mismo DNI y, si quiere, el mismo email. En CU-01 tiene que vincular una cuenta de Google o Apple distinta de la que usa como veterinario. | RF-ROL-03, D46 |
| **RN-11** | **Orden de validación.** Primero datos obligatorios y formato (RN-01 y RN-02), informando todos los campos con error a la vez; después DNI (RN-03 y RN-05) y, por último, email (RN-04). De estos últimos se informa el **primero** que falla. | RF-DUE-01 |
| **RN-12** | **Solo el administrador.** Solo el administrador da de alta dueños. El sistema rechaza el intento de cualquier otro rol, aunque no se haga desde la pantalla, con *"No tenés permiso para hacer esta operación."* | RF-DUE-03, RF-ROL-02, RNF-SEG-02, RNF-SEG-07, D110 |
| **RN-13** | **Sin duplicados.** Cada confirmación se procesa una sola vez, y dos altas simultáneas no pueden crear dos dueños con el mismo DNI o el mismo email, aunque las hagan administradores distintos. | RNF-INT-01, D15 |
| **RN-14** | **Auditoría.** El alta queda registrada con el administrador, la fecha y la hora. | RF-TRA-01, RNF-AUD-01 |
| **RN-15** | **Datos personales.** DNI, dirección y teléfono son datos sensibles: los ven el propio dueño y el administrador. El veterinario ve nombre, apellido, DNI y teléfono, pero no la dirección ni el email. | RNF-SEG-01, RNF-LEG-01, RF-ROL-09 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Dueño | Identificador interno, nombre, apellido, DNI (solo dígitos), email (en minúsculas), teléfono, dirección (calle, número, piso, departamento, localidad, provincia y código postal) y forma de pago preferida. |
| Cuenta | Estado *Invitado*, sin cuenta de Google o Apple vinculada. |
| Invitación | Enlace de un solo uso, email de destino, fecha y hora de envío, vencimiento (24 horas después del envío), estado *Invitado* (pasa a *Vigente* cuando se usa, o a *Vencida* si no se usa a tiempo). |
| Envío | Canal (email), resultado (éxito o fallo), fecha y hora (D43). |
| Auditoría | Alta del dueño, con administrador, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-08
Feature: CU-08 Dar de alta dueño
  Como administrador
  Quiero dar de alta a un dueño afiliado
  Para que pueda vincular su cuenta y afiliar a sus mascotas

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And existe el dueño "Pedro Sosa" con DNI "28999888", email "pedro.sosa@gmail.com" y la cuenta en estado "Activo"
    And los datos válidos de "Carla Gómez" son DNI "30111222", email "carla.gomez@gmail.com", teléfono "11 5555-1234", dirección "Av. Corrientes 1234, CABA, Buenos Aires, 1043" y forma de pago preferida "Transferencia bancaria"

  @flujo-principal @RN-07 @RN-14 @RF-DUE-01 @RF-DUE-03 @RF-ROL-02 @RF-TRA-01 @RNF-AUD-01 @RNF-USA-01 @D37 @D47 @D87 @D111
  Scenario: Alta de un dueño con la cuenta invitada
    When el administrador da de alta a "Carla Gómez" con sus datos válidos y confirma
    Then existe la dueña "Carla Gómez" con DNI "30111222" y forma de pago preferida "Transferencia bancaria"
    And su dirección es calle "Av. Corrientes", número "1234", localidad "CABA", provincia "Buenos Aires" y código postal "1043"
    And la cuenta de "Carla Gómez" está en estado "Invitado", sin cuenta de Google o Apple vinculada
    And "Carla Gómez" no tiene mascotas
    And se envió una invitación de un solo uso a "carla.gomez@gmail.com", en estado "Invitado" y que vence el "21/10/2026 10:00", y el envío quedó registrado como exitoso
    And la auditoría registra el alta de "Carla Gómez" por "Marta Ruiz" el "20/10/2026 10:00"
    And el sistema informa "Se dio de alta a Carla Gómez. Le enviamos la invitación a carla.gomez@gmail.com."

  @FA-01
  Scenario: El administrador cancela el alta
    When el administrador completa los datos de "Carla Gómez" y cancela
    Then no existe ningún dueño con el DNI "30111222"
    And no se envía ninguna invitación

  @FA-02 @RN-08 @RF-NOT-03 @D43
  Scenario: El envío de la invitación falla
    Given el envío de emails no está funcionando
    When el administrador da de alta a "Carla Gómez" con sus datos válidos y confirma
    Then existe la dueña "Carla Gómez" con la cuenta en estado "Invitado"
    And el envío de la invitación a "carla.gomez@gmail.com" quedó registrado como fallido
    And el sistema informa "Se dio de alta a Carla Gómez, pero no se pudo enviar la invitación a carla.gomez@gmail.com. Reenviala desde su ficha."

  @FA-03 @RN-09 @RF-MAS-02
  Scenario: Seguir con el alta de una mascota
    Given el administrador dio de alta a "Carla Gómez"
    When el administrador elige "Dar de alta mascota" desde la confirmación
    Then se abre el alta de mascota con "Carla Gómez" ya elegida como dueña

  @FA-04 @RN-10 @RF-ROL-03 @D46
  Scenario: Una persona que ya es veterinario se da de alta como dueña
    Given existe el veterinario "Ana López" de la veterinaria "Patitas" con DNI "27333444", email "ana.lopez@gmail.com" y la cuenta en estado "Activo"
    When el administrador da de alta a la dueña "Ana López" con DNI "27333444", email "ana.lopez@gmail.com", teléfono "11 4444-5555", dirección "Mitre 550, Rosario, Santa Fe, 2000" y forma de pago preferida "Efectivo" y confirma
    Then existe la dueña "Ana López" con la cuenta en estado "Invitado"
    And el veterinario "Ana López" sigue siendo un usuario separado, con su cuenta en estado "Activo"

  @EX-01 @RN-01 @RF-DUE-01 @D80
  Scenario Outline: Datos obligatorios
    When el administrador da de alta a "Carla Gómez" con el campo "<campo>" vacío y el resto de sus datos válidos
    Then no se crea ningún dueño
    And el sistema informa "Completá el campo <campo>."

    Examples:
      | campo                   |
      | nombre                  |
      | apellido                |
      | DNI                     |
      | email                   |
      | teléfono                |
      | forma de pago preferida |

  @EX-02 @RN-01 @D75 @D80
  Scenario Outline: Datos obligatorios y opcionales de la dirección
    When el administrador da de alta a "Carla Gómez" dejando vacío "<dato>" en la dirección y con el resto de sus datos válidos
    Then el resultado es "<resultado>"

    Examples:
      | dato                | resultado                                                                         |
      | calle               | Completá calle de la dirección.                                                   |
      | número              | Completá número de la dirección.                                                  |
      | localidad           | Completá localidad de la dirección.                                               |
      | provincia           | Completá provincia de la dirección.                                               |
      | código postal       | Completá código postal de la dirección.                                           |
      | piso y departamento | Se dio de alta a Carla Gómez. Le enviamos la invitación a carla.gomez@gmail.com.  |

  @EX-03 @RN-02 @D80
  Scenario Outline: Validación del DNI
    When el administrador da de alta a "Carla Gómez" con DNI "<DNI>" y el resto de sus datos válidos
    Then el resultado es "<resultado>"

    Examples:
      | DNI        | resultado                                  |
      | 30111222   | alta registrada con DNI 30111222           |
      | 30.111.222 | alta registrada con DNI 30111222           |
      | 5111222    | alta registrada con DNI 5111222            |
      | 511122     | Ingresá un DNI válido, de 7 u 8 dígitos.   |
      | 301112223  | Ingresá un DNI válido, de 7 u 8 dígitos.   |
      | 30111A22   | Ingresá un DNI válido, de 7 u 8 dígitos.   |

  @EX-04 @RN-02 @D75
  Scenario Outline: Validación del teléfono
    When el administrador da de alta a "Carla Gómez" con teléfono "<teléfono>" y el resto de sus datos válidos
    Then el resultado es "<resultado>"

    Examples:
      | teléfono         | resultado                                         |
      | 11 5555-1234     | alta registrada                                   |
      | +54 11 5555-1234 | alta registrada                                   |
      | 5555-1234        | Ingresá un teléfono válido, con código de área.   |
      | abc123           | Ingresá un teléfono válido, con código de área.   |

  @EX-05 @RN-02 @D80
  Scenario Outline: Validación del email
    When el administrador da de alta a "Carla Gómez" con email "<email>" y el resto de sus datos válidos
    Then el resultado es "<resultado>"

    Examples:
      | email                 | resultado                                          |
      | carla.gomez@gmail.com | alta registrada con email carla.gomez@gmail.com    |
      | Carla.Gomez@Gmail.com | alta registrada con email carla.gomez@gmail.com    |
      | carla.gomez@          | Ingresá un email válido.                           |
      | carla gomez@gmail.com | Ingresá un email válido.                           |

  @EX-06 @RN-03 @D44 @D45
  Scenario Outline: El DNI ya es de otro dueño
    Given la cuenta de "Pedro Sosa" está en estado "<estado>"
    When el administrador da de alta a "Carla Gómez" con DNI "28999888" y el resto de sus datos válidos
    Then no se crea ningún dueño
    And el sistema informa "Ya existe un dueño con el DNI 28999888: Pedro Sosa."

    Examples:
      | estado   |
      | Invitado |
      | Activo   |

  @EX-07 @RN-05 @RN-11 @D44 @D82 @RNF-BAJ-03
  Scenario: El DNI es de un dueño dado de baja
    Given existe la dueña "Carla Gómez" con DNI "30111222", dada de baja y con la cuenta en estado "Inactivo"
    When el administrador da de alta a "Carla Gómez" con sus datos válidos y confirma
    Then no se crea ningún dueño nuevo
    And la cuenta de "Carla Gómez" sigue en estado "Inactivo"
    And el sistema informa "El DNI 30111222 corresponde a Carla Gómez, con la cuenta inactiva. Para que vuelva, reactivá su cuenta desde su ficha."

  @EX-08 @RN-04 @D81
  Scenario Outline: El email ya es de otro dueño
    Given la cuenta de "Pedro Sosa" está en estado "<estado>"
    When el administrador da de alta a "Carla Gómez" con email "<email>" y el resto de sus datos válidos
    Then no se crea ningún dueño
    And el sistema informa "El email pedro.sosa@gmail.com ya está registrado para el dueño Pedro Sosa."

    Examples:
      | estado   | email                |
      | Activo   | pedro.sosa@gmail.com |
      | Activo   | Pedro.Sosa@Gmail.com |
      | Inactivo | pedro.sosa@gmail.com |

  @RN-06 @D7 @D59
  Scenario: La forma de pago preferida se elige de la lista fija
    When el administrador elige "Dar de alta dueño"
    Then las formas de pago que puede elegir son "Efectivo", "Transferencia bancaria", "Tarjeta de débito" y "Tarjeta de crédito"

  @EX-09 @RN-13 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces crea un solo dueño
    When el administrador confirma el alta de "Carla Gómez" y la misma confirmación se envía dos veces
    Then existe un solo dueño con el DNI "30111222"
    And se envió una sola invitación a "carla.gomez@gmail.com"
    And la auditoría registra una sola alta

  @EX-10 @RN-13 @RNF-INT-01 @D15
  Scenario: Dos administradores dan de alta a la vez el mismo DNI
    Given el administrador "Jorge Paz" también inició sesión
    When "Marta Ruiz" y "Jorge Paz" dan de alta al mismo tiempo a "Carla Gómez" con sus datos válidos
    Then existe un solo dueño con el DNI "30111222"
    And el otro administrador recibe "Ya existe un dueño con el DNI 30111222: Carla Gómez."

  @EX-11 @RN-12 @RF-DUE-03 @RNF-SEG-07 @D110
  Scenario: Un veterinario no puede dar de alta a un dueño
    Given el veterinario "Ana López" inició sesión
    When "Ana López" envía un alta de dueño con los datos de "Carla Gómez" sin usar la pantalla
    Then no se crea ningún dueño
    And el sistema informa "No tenés permiso para hacer esta operación."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-DUE-01 | Paso 2, RN-01, RN-02, EX-01 a EX-05 |
| RF-DUE-03, RF-ROL-02 | Actor principal, RN-07, RN-12 |
| RF-MAS-02, RF-ROL-04 | RN-09, FA-03 |
| RF-MAS-04 | RN-03 |
| RF-ROL-03 | RN-10, FA-04 |
| RF-ROL-09 | RN-15 |
| RF-AUT-02 | RN-07 |
| RF-NOT-03 | Paso 6, RN-08, FA-02 |
| RF-TRA-01, RNF-AUD-01 | Paso 7, RN-14 |
| RNF-BAJ-03 | RN-05, EX-07 |
| RNF-SEG-01, RNF-LEG-01 | RN-15 |
| RNF-SEG-02, RNF-SEG-07 | RN-12, EX-11, nota de Excepciones |
| RNF-INT-01 | RN-13, EX-09, EX-10 |
| RNF-USA-01 | Paso 8 |
| D7, D59 | Paso 2, RN-06 |
| D15 | RN-13, EX-10 |
| D24 | RN-07 |
| D37, D47, D87, D111 | Pasos 5 y 6, RN-07 |
| D43 | RN-08, FA-02 |
| D44 | RN-03, RN-05, EX-06, EX-07 |
| D45 | Paso 5, RN-03 |
| D46 | RN-04, RN-10, FA-04 |
| D75 | RN-01, RN-02, EX-02, EX-04 |
| D80 | RN-01, RN-02, EX-01 a EX-05 |
| D81 | RN-04, EX-08 |
| D82 | RN-05, EX-07 |
| D110 | RN-12, EX-11 |
