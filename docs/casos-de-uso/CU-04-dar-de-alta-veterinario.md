# CU-04 — Dar de alta veterinario

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Registrar a un veterinario asociado y enviarle la invitación para que vincule su cuenta de Google o Apple. |
| **Disparador** | Un profesional de una veterinaria adherida empieza a trabajar con WildSalud. |
| **Relaciones** | La persona vincula su cuenta en CU-01 Vincular cuenta por invitación. Si la invitación no llegó o se perdió, se reenvía con CU-12 Reenviar invitación. Si el DNI es de un veterinario dado de baja, se usa CU-07 Reactivar veterinario. Los datos se modifican en CU-05 y la baja es CU-06. El alta queda en el historial de auditoría (CU-36). |

## Precondiciones

1. El administrador inició sesión (CU-02).

## Flujo principal

1. El administrador elige **Veterinarios** y, desde la lista de veterinarios (**RN-14**), **Dar de alta veterinario**.
2. El sistema muestra el formulario de alta con nombre, apellido, DNI, veterinaria, teléfono y email, todos obligatorios. No pide el estado de la cuenta: lo asigna el sistema.
3. El administrador completa los datos y confirma.
4. El sistema valida las reglas **RN-01 a RN-05** en el orden de **RN-10**.
5. El sistema crea el veterinario con un identificador interno y su cuenta en estado **Invitado**, sin cuenta de Google o Apple vinculada.
6. El sistema genera una invitación de un solo uso, que vence a las 24 horas, la envía al email registrado y registra el resultado del envío (**RN-06**, **RN-07**).
7. El sistema deja el registro de auditoría del alta.
8. El sistema confirma: *"Se dio de alta a {veterinario}. Le enviamos la invitación a {email}."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | El administrador cancela. | No se crea el veterinario ni se envía ninguna invitación. |
| **FA-02** | 6 | El envío del email de invitación falla. | El veterinario queda dado de alta con la cuenta *Invitado* y la invitación generada en estado *Invitado*, pero sin entregar; el envío queda registrado como fallido. El sistema informa: *"Se dio de alta a {veterinario}, pero no se pudo enviar la invitación a {email}. Reenviala desde su ficha."* (CU-12). |

## Excepciones

En todas las excepciones **no se crea el veterinario ni se envía ninguna invitación**, y el sistema informa el motivo. Aunque la pantalla ya marca los errores de formato, el sistema vuelve a validar todo al confirmar (RNF-SEG-07).

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | Falta un dato obligatorio. | *"Completá el campo {campo}."* |
| **EX-02** | 4 | El DNI no tiene un formato válido. | *"Ingresá un DNI válido, de 7 u 8 dígitos."* |
| **EX-03** | 4 | El teléfono no tiene un formato válido. | *"Ingresá un teléfono válido, con código de área."* |
| **EX-04** | 4 | El email no tiene un formato válido. | *"Ingresá un email válido."* |
| **EX-05** | 4 | Ya existe un veterinario *Invitado* o *Activo* con ese DNI. | *"Ya existe un veterinario con el DNI {DNI}: {veterinario}."* |
| **EX-06** | 4 | El DNI es de un veterinario dado de baja. | *"El DNI {DNI} corresponde a {veterinario}, con la cuenta inactiva. Para que vuelva, reactivá su cuenta desde su ficha."* |
| **EX-07** | 4 | El email ya está registrado para otro veterinario (en cualquier estado). | *"El email {email} ya está registrado para el veterinario {veterinario}."* |
| **EX-08** | 3 | La misma confirmación llega dos veces (doble clic o reintento de red). | Se crea **un solo** veterinario y se envía **una sola** invitación; el segundo envío devuelve el mismo resultado que el primero. |
| **EX-09** | 4 | Dos administradores dan de alta a la vez un veterinario con el mismo DNI o el mismo email. | Solo uno se crea; el otro recibe el mensaje de EX-05 o de EX-07. |
| **EX-10** | 4 | Quien pide el alta no es administrador (por ejemplo, un veterinario que lo intenta sin usar la pantalla). | *"No tenés permiso para hacer esta operación."* |

## Postcondiciones

- **Éxito:** el veterinario queda registrado con la cuenta *Invitado* y una invitación de un solo uso en estado *Invitado*, que vence a las 24 horas, enviada a su email (o sin entregar, con el envío fallido registrado, FA-02). Todavía no puede ingresar ni registrar consumos: primero tiene que vincular su cuenta de Google o Apple desde la invitación (CU-01). El alta queda en el historial de auditoría (CU-36).
- **Fracaso:** no se crea ningún veterinario ni se envía ninguna invitación. Los intentos rechazados no quedan en el historial de auditoría.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Datos obligatorios.** Nombre, apellido, DNI, veterinaria, teléfono y email. El estado de la cuenta no se carga: lo asigna el sistema. | RF-VET-01, D80 |
| **RN-02** | **Formato.** DNI: 7 u 8 dígitos; se aceptan puntos y se guardan solo los dígitos. Teléfono: con código de área, entre 10 y 13 dígitos (se admiten espacios, guiones y el prefijo +54). Email: formato válido; se guarda en minúsculas. Nombre, apellido y veterinaria: texto libre. La veterinaria es un dato de texto del veterinario, no una entidad. | RF-VET-01, D13, D75, D80 |
| **RN-03** | **DNI único dentro del rol.** No puede haber dos veterinarios con el mismo DNI, incluidos los dados de baja. El DNI sí puede coincidir con el de un dueño (RN-09). | D44, D46 |
| **RN-04** | **Email único dentro del rol.** No puede haber dos veterinarios con el mismo email, incluidos los dados de baja, sin distinguir mayúsculas. Puede coincidir con el email de un dueño. | RF-VET-01, D46, D81 |
| **RN-05** | **Quien ya fue veterinario se reactiva.** Si el DNI es de un veterinario dado de baja, el alta se rechaza y el mensaje indica reactivarlo: no se crea otro registro, se reactiva el existente con su historial (CU-07). | D44, D82, RNF-BAJ-03 |
| **RN-06** | **Cuenta por invitación.** El veterinario se crea con la cuenta *Invitado*. El sistema le envía al email registrado un enlace de un solo uso que vence a las 24 horas; solo vale el último enviado. La cuenta pasa a *Activo* cuando la persona vincula su cuenta de Google o Apple desde ese enlace (CU-01), por el identificador del proveedor y no por el email. Nadie se registra por su cuenta y el sistema no guarda contraseñas. | RF-ROL-01, RF-VET-02, RF-VET-03, RF-AUT-02, RNF-SEG-06, D24, D37, D47, D87, D111 |
| **RN-07** | **Registro del envío.** Se guarda el canal (email) y el resultado (éxito o fallo) del envío de la invitación. Un envío fallido no deshace el alta. | RF-NOT-03, D43 |
| **RN-08** | **Identificador interno.** El sistema le asigna al veterinario un identificador interno que nunca se muestra. En el negocio se lo identifica por su DNI. | D45 |
| **RN-09** | **Un rol por cuenta.** Si la persona ya es dueña, se la da de alta igual como veterinario: son dos usuarios separados, y en CU-01 tiene que vincular una cuenta de Google o Apple distinta de la que usa como dueña. | RF-ROL-03, D46 |
| **RN-10** | **Orden de validación.** Primero datos obligatorios y formato (RN-01 y RN-02), informando todos los campos con error a la vez; después DNI (RN-03 y RN-05) y, por último, email (RN-04). De estos últimos se informa el **primero** que falla. | RF-VET-01 |
| **RN-11** | **Solo el administrador.** Solo el administrador da de alta veterinarios. El sistema rechaza el intento de cualquier otro rol, aunque no se haga desde la pantalla, con el mensaje de EX-10. | RF-VET-04, RF-ROL-01, RNF-SEG-02, RNF-SEG-07, D110 |
| **RN-12** | **Sin duplicados.** Cada confirmación se procesa una sola vez, y dos altas simultáneas no pueden crear dos veterinarios con el mismo DNI o el mismo email, aunque las hagan administradores distintos. | RNF-INT-01, D15 |
| **RN-13** | **Auditoría.** El alta queda registrada con el administrador, la fecha y la hora. | RF-TRA-01, RNF-AUD-01 |
| **RN-14** | **Lista de veterinarios.** El alta se inicia desde la lista de veterinarios, que muestra el estado de cada uno, con búsqueda por nombre, apellido o DNI y filtro por estado. Es navegación dentro de los casos de uso, no un caso aparte. | D86 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Veterinario | Identificador interno, nombre, apellido, DNI (solo dígitos), veterinaria, teléfono y email (en minúsculas). |
| Cuenta | Estado *Invitado*, sin cuenta de Google o Apple vinculada. |
| Invitación | Enlace de un solo uso, email de destino, fecha y hora de envío, vencimiento (24 horas después) y estado *Invitado* (pasa a *Vigente* cuando la persona la acepta en CU-01, o a *Vencida* si pasan 24 horas sin usarla). |
| Envío | Canal (email), resultado (éxito o fallo), fecha y hora (D43). |
| Auditoría | Alta del veterinario, con administrador, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-04
Feature: CU-04 Dar de alta veterinario
  Como administrador
  Quiero dar de alta a un veterinario asociado
  Para que pueda vincular su cuenta y atender a las mascotas afiliadas

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And existe el veterinario "Pablo Díaz" de la veterinaria "Huellas" con DNI "25111222", email "pablo.diaz@gmail.com" y la cuenta en estado "Activo"
    And los datos válidos de "Ana López" son DNI "27333444", veterinaria "Patitas", teléfono "11 4444-5555" y email "ana.lopez@gmail.com"

  @flujo-principal @RF-VET-01 @RF-ROL-01 @RF-TRA-01 @RNF-USA-01 @D37 @D47 @D80 @D87
  Scenario: Alta de un veterinario con la cuenta invitada
    When el administrador da de alta a "Ana López" con sus datos válidos y confirma
    Then existe el veterinario "Ana López" de la veterinaria "Patitas" con DNI "27333444"
    And la cuenta de "Ana López" está en estado "Invitado", sin cuenta de Google o Apple vinculada
    And se envió una invitación de un solo uso a "ana.lopez@gmail.com", que vence el "21/10/2026 10:00", y el envío quedó registrado como exitoso
    And la auditoría registra el alta de "Ana López" por "Marta Ruiz" el "20/10/2026 10:00"
    And el sistema informa "Se dio de alta a Ana López. Le enviamos la invitación a ana.lopez@gmail.com."

  @FA-01
  Scenario: El administrador cancela el alta
    When el administrador completa los datos de "Ana López" y cancela
    Then no existe ningún veterinario con el DNI "27333444"
    And no se envía ninguna invitación

  @FA-02 @RF-NOT-03 @D43 @D111
  Scenario: El envío de la invitación falla
    Given el envío de emails no está funcionando
    When el administrador da de alta a "Ana López" con sus datos válidos y confirma
    Then existe el veterinario "Ana López" con la cuenta en estado "Invitado"
    And la invitación de "Ana López" está en estado "Invitado", sin entregar
    And el envío de la invitación a "ana.lopez@gmail.com" quedó registrado como fallido
    And el sistema informa "Se dio de alta a Ana López, pero no se pudo enviar la invitación a ana.lopez@gmail.com. Reenviala desde su ficha."

  @EX-01 @RN-01 @RF-VET-01 @D80
  Scenario Outline: Todos los datos son obligatorios
    When el administrador da de alta a "Ana López" con el campo "<campo>" vacío y el resto de sus datos válidos
    Then no se crea ningún veterinario
    And el sistema informa "Completá el campo <campo>."

    Examples:
      | campo       |
      | nombre      |
      | apellido    |
      | DNI         |
      | veterinaria |
      | teléfono    |
      | email       |

  @EX-02 @RN-02 @D80
  Scenario Outline: Validación del DNI
    When el administrador da de alta a "Ana López" con DNI "<DNI>" y el resto de sus datos válidos
    Then el resultado es "<resultado>"

    Examples:
      | DNI        | resultado                                  |
      | 27333444   | alta registrada con DNI 27333444           |
      | 27.333.444 | alta registrada con DNI 27333444           |
      | 7333444    | alta registrada con DNI 7333444            |
      | 733344     | Ingresá un DNI válido, de 7 u 8 dígitos.   |
      | 273334445  | Ingresá un DNI válido, de 7 u 8 dígitos.   |
      | 27333444A  | Ingresá un DNI válido, de 7 u 8 dígitos.   |

  @EX-03 @RN-02 @D75 @D80
  Scenario Outline: Validación del teléfono
    When el administrador da de alta a "Ana López" con teléfono "<teléfono>" y el resto de sus datos válidos
    Then el resultado es "<resultado>"

    Examples:
      | teléfono            | resultado                                         |
      | 11 4444-5555        | alta registrada                                   |
      | +54 11 4444-5555    | alta registrada                                   |
      | +54 9 11 4444-5555  | alta registrada                                   |
      | 4444-5555           | Ingresá un teléfono válido, con código de área.   |
      | +54 9 11 4444-55556 | Ingresá un teléfono válido, con código de área.   |
      | abc123              | Ingresá un teléfono válido, con código de área.   |

  @EX-04 @RN-02 @D80
  Scenario Outline: Validación del email
    When el administrador da de alta a "Ana López" con email "<email>" y el resto de sus datos válidos
    Then el resultado es "<resultado>"

    Examples:
      | email               | resultado                                        |
      | ana.lopez@gmail.com | alta registrada con email ana.lopez@gmail.com    |
      | ANA.LOPEZ@GMAIL.COM | alta registrada con email ana.lopez@gmail.com    |
      | ana.lopez@          | Ingresá un email válido.                         |
      | ana.lopez.gmail.com | Ingresá un email válido.                         |
      | ana lopez@gmail.com | Ingresá un email válido.                         |

  @EX-05 @RN-03 @D44
  Scenario Outline: El DNI ya es de otro veterinario
    Given la cuenta de "Pablo Díaz" está en estado "<estado>"
    When el administrador da de alta a "Ana López" con DNI "25111222" y el resto de sus datos válidos
    Then no se crea ningún veterinario
    And el sistema informa "Ya existe un veterinario con el DNI 25111222: Pablo Díaz."

    Examples:
      | estado   |
      | Invitado |
      | Activo   |

  @EX-06 @RN-05 @RN-10 @D44 @D82 @RNF-BAJ-03
  Scenario: El DNI es de un veterinario dado de baja
    Given existe el veterinario "Ana López" con DNI "27333444", email "ana.lopez@gmail.com" y la cuenta en estado "Inactivo"
    When el administrador da de alta a "Ana López" con sus datos válidos y confirma
    Then no se crea ningún veterinario nuevo
    And la cuenta de "Ana López" sigue en estado "Inactivo"
    And el sistema informa "El DNI 27333444 corresponde a Ana López, con la cuenta inactiva. Para que vuelva, reactivá su cuenta desde su ficha."

  @EX-07 @RN-04 @D81
  Scenario Outline: El email ya es de otro veterinario
    When el administrador da de alta a "Ana López" con email "<email>" y el resto de sus datos válidos
    Then no se crea ningún veterinario
    And el sistema informa "El email pablo.diaz@gmail.com ya está registrado para el veterinario Pablo Díaz."

    Examples:
      | email                |
      | pablo.diaz@gmail.com |
      | Pablo.Diaz@Gmail.com |

  @RN-09 @RF-ROL-03 @D46
  Scenario: Una persona que ya es dueña se da de alta como veterinario
    Given la dueña "Carla Gómez" tiene DNI "30111222", email "carla.gomez@gmail.com" y la cuenta en estado "Activo"
    When el administrador da de alta a "Carla Gómez" como veterinario de la veterinaria "Patitas" con DNI "30111222", teléfono "11 5555-1234" y email "carla.gomez@gmail.com" y confirma
    Then existe el veterinario "Carla Gómez" con la cuenta en estado "Invitado"
    And la dueña "Carla Gómez" sigue siendo un usuario separado, con su cuenta en estado "Activo"

  @EX-08 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces crea un solo veterinario
    When el administrador confirma el alta de "Ana López" y la misma confirmación se envía dos veces
    Then existe un solo veterinario con el DNI "27333444"
    And se envió una sola invitación a "ana.lopez@gmail.com"
    And la auditoría registra una sola alta

  @EX-09 @RN-12 @RNF-INT-01 @D15
  Scenario: Dos administradores dan de alta a la vez el mismo DNI
    Given el administrador "Jorge Paz" también inició sesión
    When "Marta Ruiz" y "Jorge Paz" dan de alta al mismo tiempo a "Ana López" con sus datos válidos
    Then existe un solo veterinario con el DNI "27333444"
    And el otro administrador recibe "Ya existe un veterinario con el DNI 27333444: Ana López."

  @EX-10 @RN-11 @RF-VET-04 @RNF-SEG-07 @D110
  Scenario: Un veterinario no puede dar de alta a otro veterinario
    Given el veterinario "Pablo Díaz" inició sesión
    When "Pablo Díaz" envía un alta de veterinario con los datos de "Ana López" sin usar la pantalla
    Then no se crea ningún veterinario
    And el sistema informa "No tenés permiso para hacer esta operación."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-VET-01 | Paso 2, RN-01, RN-02, EX-01 a EX-04 |
| RF-VET-02, RF-AUT-02 | RN-06 |
| RF-VET-03 | RN-06 (reemplazado por D37: el email no es el identificador de acceso) |
| RF-VET-04, RF-ROL-01 | Actor principal, RN-11, EX-10 |
| RF-ROL-03 | RN-09 |
| RF-NOT-03 | Paso 6, RN-07, FA-02 |
| RF-TRA-01, RNF-AUD-01 | Paso 7, RN-13 |
| RNF-BAJ-03 | RN-05, EX-06 |
| RNF-SEG-02, RNF-SEG-07 | RN-11, EX-10, nota de Excepciones |
| RNF-SEG-06 | RN-06 |
| RNF-INT-01 | RN-12, EX-08, EX-09 |
| RNF-USA-01 | Paso 8 |
| D13 | RN-02 |
| D15 | RN-12, EX-09 |
| D24 | RN-06 |
| D37, D47 | Pasos 5 y 6, RN-06 |
| D43 | RN-07, FA-02 |
| D44 | RN-03, RN-05, EX-05, EX-06 |
| D45 | Paso 5, RN-08 |
| D46 | RN-03, RN-04, RN-09 |
| D75 | RN-02, EX-03 |
| D80 | RN-01, RN-02, EX-01 a EX-04 |
| D81 | RN-04, EX-07 |
| D82 | RN-05, EX-06 |
| D86 | Paso 1, RN-14 |
| D87 | Paso 6, RN-06 |
| D111 | RN-06, FA-02, Datos que se registran |
| D110 | RN-11, EX-10 |
