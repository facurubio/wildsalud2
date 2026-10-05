# CU-02 — Iniciar sesión con Google/Apple

| Campo | Valor |
|-------|-------|
| **Actor principal** | Usuario con cuenta vinculada: administrador, veterinario asociado o dueño afiliado |
| **Objetivo** | Ingresar a WildSalud con su cuenta de Google o Apple y acceder a las funciones de su rol. |
| **Disparador** | La persona quiere usar WildSalud y no tiene una sesión abierta, o su sesión venció. |
| **Relaciones** | La cuenta se vincula antes en CU-01 Vincular cuenta por invitación, que termina con la sesión ya iniciada. La sesión termina en CU-03 Cerrar sesión. Es precondición de todos los demás casos de uso de los usuarios. Después de ingresar, cada rol llega a su pantalla de inicio: CU-40 Consultar mis mascotas, CU-37 Buscar mascota o CU-32 Ver panel global. Si la persona perdió su cuenta de Google o Apple, el administrador le reenvía la invitación (CU-12). |

## Precondiciones

Ninguna. Cualquier persona puede intentar ingresar; solo entran los usuarios con una cuenta vinculada y en estado *Activo*.

## Flujo principal

1. La persona abre WildSalud.
2. El sistema muestra la pantalla de ingreso con **Continuar con Google** y **Continuar con Apple**. No hay campos de usuario ni contraseña, ni opciones para registrarse o recuperar la contraseña (**RN-01**).
3. La persona elige un proveedor.
4. El sistema la lleva al proveedor, donde ingresa con su cuenta. La contraseña la maneja el proveedor; WildSalud nunca la ve.
5. El proveedor le confirma al sistema la identidad de la cuenta.
6. El sistema busca el usuario vinculado a esa cuenta por el identificador del proveedor (**RN-02**) y valida que esté en estado *Activo* (**RN-03**).
7. El sistema inicia la sesión con el rol del usuario (**RN-04**) y registra el inicio (**RN-08**).
8. El sistema muestra la pantalla de inicio del rol, solo con las funciones de ese rol (**RN-10**): dueño, CU-40 Consultar mis mascotas; veterinario, CU-37 Buscar mascota; administrador, CU-32 Ver panel global.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 1 | La persona ya tiene una sesión vigente en ese dispositivo (tuvo actividad en las últimas 4 horas). | El sistema muestra directamente la pantalla de inicio de su rol, sin pasar por el proveedor. |
| **FA-02** | 1 | La persona abrió una página privada sin sesión (por ejemplo, un enlace directo a la ficha de una mascota). | El sistema muestra la pantalla de ingreso con *"Ingresá para continuar."* Después del paso 7 la lleva a esa página si su rol tiene permiso; si no, a su pantalla de inicio con *"No tenés permiso para hacer esta operación."* |
| **FA-03** | 3 o 4 | La persona cancela, o vuelve del proveedor sin ingresar. | No se inicia sesión; el sistema vuelve a la pantalla de ingreso. |
| **FA-04** | 5 | El email de la cuenta del proveedor cambió desde que se vinculó. | Ingresa igual: el usuario se identifica por el identificador de la cuenta, no por el email. |

## Excepciones

En todas las excepciones **no se inicia sesión**, no se crea ningún usuario ni se vincula ninguna cuenta, y el sistema vuelve a la pantalla de ingreso con el mensaje.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 6 | La cuenta del proveedor no está vinculada a ningún usuario, aunque su email coincida con el de uno: una persona sin invitación, un usuario en estado *Invitado* que todavía no usó su invitación (incluido uno reactivado, cuya vinculación anterior se descartó), o una cuenta que fue reemplazada por otra (CU-01). | *"Esta cuenta de {proveedor} no está vinculada a WildSalud. Si recibiste una invitación, ingresá desde el enlace del email."* |
| **EX-02** | 6 | El usuario vinculado está en estado *Inactivo*. | Veterinario: *"Tu cuenta está inactiva. Comunicate con el administrador."* Dueño: *"Tu cuenta está inactiva. Comunicate con WildSalud."* |
| **EX-03** | 5 | El proveedor no confirma la identidad (error del proveedor, o respuesta inválida o vencida). | *"No pudimos validar tu cuenta de {proveedor}. Intentá de nuevo."* |
| **EX-04** | 5 | La misma confirmación del proveedor llega dos veces (doble clic o reintento de red). | Se inicia **una sola** sesión; el segundo envío devuelve el mismo resultado que el primero. |

## Postcondiciones

- **Éxito:** el usuario tiene una sesión abierta con su rol, está en la pantalla de inicio de ese rol y ve solo sus funciones. El inicio de sesión queda en el historial de auditoría (CU-36).
- **Fracaso:** no se inicia sesión, no se crea ningún usuario ni se vincula ninguna cuenta. Los intentos rechazados no quedan registrados.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo Google o Apple.** Todos los roles ingresan solo con Google o Apple. WildSalud no tiene contraseñas propias, ni registro, ni "Olvidé mi contraseña": la contraseña se recupera con el propio proveedor, y una cuenta perdida se reemplaza con una invitación nueva (CU-12). | RF-AUT-01, RF-AUT-05, RF-ROL-05, RNF-SEG-06, D24, D37 |
| **RN-02** | **Identificación por la cuenta vinculada.** El usuario se busca por el proveedor y el identificador de la cuenta, nunca por el email. Una cuenta no vinculada no entra aunque su email coincida con el de un usuario, y en este caso no se vincula: solo se vincula desde una invitación (CU-01). El mensaje no revela si existe un usuario con ese email. | RF-ROL-02, RF-VET-03, D24, D37, D88 |
| **RN-03** | **Solo cuentas activas.** Solo inicia sesión un usuario en estado *Activo*. Un usuario *Invitado* todavía no tiene cuenta vinculada, también cuando fue reactivado: la reactivación descarta la vinculación anterior. Uno *Inactivo* (dado de baja) se rechaza. | RF-AUT-04, RF-ROL-06, RF-VET-05, D47, D92, D97 |
| **RN-04** | **Un rol por cuenta.** La sesión tiene el único rol del usuario y muestra solo sus funciones; no hay selector de rol. Una persona que es veterinaria y dueña ingresa con una cuenta distinta para cada rol. **Excepción:** un administrador que también es veterinario entra con una sola cuenta y ve las funciones de los dos roles; su pantalla de inicio es la del administrador. | RF-AUT-02, RF-AUT-03, RF-ROL-03, D46, D145 |
| **RN-05** | **Permisos en el sistema.** En cada operación y consulta el sistema verifica que la sesión esté vigente, que la cuenta siga en estado *Activo* y que el rol tenga permiso, sin depender de ocultar opciones en la pantalla. Si no tiene permiso, el mensaje es siempre *"No tenés permiso para hacer esta operación."* | RF-AUT-01, RF-AUT-03, RNF-SEG-02, RNF-SEG-07, D110 |
| **RN-06** | **Varios administradores.** Cada administrador ingresa con su propia cuenta; puede haber varios con sesión abierta a la vez. | RF-AUT-02, D15 |
| **RN-07** | **Duración de la sesión.** La sesión vence a las **4 horas sin actividad**, igual para todos los roles (ver CU-03, FA-01). | RNF-SEG-01, D90 |
| **RN-08** | **Registro del ingreso.** Se registra cada inicio de sesión con usuario, rol, proveedor, fecha y hora. Los intentos rechazados no se registran. | RNF-AUD-01, D94 |
| **RN-09** | **Conexión segura y datos mínimos.** El ingreso se hace siempre por una conexión cifrada. Del proveedor solo se usa el identificador de la cuenta. | RNF-SEG-05, RNF-LEG-01 |
| **RN-10** | **Pantalla de inicio por rol.** Dueño: CU-40 Consultar mis mascotas. Veterinario: CU-37 Buscar mascota. Administrador: CU-32 Ver panel global. | D109 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Sesión | Usuario, rol, proveedor, fecha y hora de inicio y de la última actividad. |
| Auditoría | Inicio de sesión: usuario, rol, proveedor, fecha y hora (D94). |

## Escenarios de aceptación

```gherkin
@CU-02
Feature: CU-02 Iniciar sesión con Google/Apple
  Como usuario de WildSalud
  Quiero ingresar con mi cuenta de Google o Apple
  Para usar las funciones de mi rol

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And existen los usuarios:
      | usuario     | rol                  | estado | proveedor | cuenta vinculada      |
      | Marta Ruiz  | Administrador        | Activo | Google    | marta.ruiz@gmail.com  |
      | Ana López   | Veterinario asociado | Activo | Apple     | ana.lopez@icloud.com  |
      | Carla Gómez | Dueño afiliado       | Activo | Google    | carla.gomez@gmail.com |
    And ninguno tiene una sesión abierta, salvo que el escenario indique otra cosa

  @flujo-principal @RN-08 @RN-10 @RF-AUT-01 @RF-AUT-03 @D24 @D94 @D109
  Scenario Outline: Cada usuario ingresa con su cuenta vinculada y llega a la pantalla de inicio de su rol
    When "<usuario>" ingresa con la cuenta de <proveedor> "<cuenta>"
    Then "<usuario>" queda con la sesión iniciada con el rol "<rol>"
    And ve la pantalla "<pantalla de inicio>" solo con las funciones de ese rol
    And la auditoría registra el inicio de sesión de "<usuario>" con <proveedor> el "20/10/2026 10:00"

    Examples:
      | usuario     | proveedor | cuenta                | rol                  | pantalla de inicio    |
      | Marta Ruiz  | Google    | marta.ruiz@gmail.com  | Administrador        | Ver panel global      |
      | Ana López   | Apple     | ana.lopez@icloud.com  | Veterinario asociado | Buscar mascota        |
      | Carla Gómez | Google    | carla.gomez@gmail.com | Dueño afiliado       | Consultar mis mascotas |

  @RN-01 @RF-AUT-05 @RNF-SEG-06 @D24
  Scenario: La pantalla de ingreso solo ofrece Google y Apple
    When una persona abre WildSalud sin sesión
    Then ve solo las opciones "Continuar con Google" y "Continuar con Apple"
    And no hay campos de usuario ni contraseña, ni opciones para registrarse o recuperar la contraseña

  @FA-01 @RN-07 @D90
  Scenario Outline: Con una sesión vigente entra directo
    Given la última actividad de "Carla Gómez" en su celular fue el "<última actividad>"
    When "Carla Gómez" abre WildSalud en su celular
    Then el resultado es "<resultado>"

    Examples:
      | última actividad | resultado                                              |
      | 20/10/2026 06:01 | ve su pantalla de inicio sin pasar por Google          |
      | 20/10/2026 06:00 | ve la pantalla de ingreso con "Continuar con Google"   |

  @FA-02 @RF-AUT-01
  Scenario: Después de ingresar vuelve a la página que había pedido
    Given "Ana López" abrió sin sesión un enlace a la ficha de "Luna" y el sistema le pidió "Ingresá para continuar."
    When "Ana López" ingresa con la cuenta de Apple "ana.lopez@icloud.com"
    Then ve la ficha de "Luna"

  @FA-02 @RN-05 @RF-AUT-03 @RNF-SEG-02 @D110
  Scenario: Si la página pedida no es de su rol, va a su pantalla de inicio
    Given "Carla Gómez" abrió sin sesión un enlace al panel global del administrador
    When "Carla Gómez" ingresa con la cuenta de Google "carla.gomez@gmail.com"
    Then ve la pantalla "Consultar mis mascotas"
    And el sistema informa "No tenés permiso para hacer esta operación."

  @FA-03
  Scenario: La persona vuelve de Google sin ingresar
    When "Carla Gómez" elige "Continuar con Google" y cancela en Google
    Then no se inicia ninguna sesión
    And ve la pantalla de ingreso

  @FA-04 @RN-02 @D37
  Scenario: Cambiar el email de la cuenta de Apple no impide ingresar
    Given "Ana López" cambió el email de su cuenta de Apple vinculada a "ana.vet@icloud.com"
    When "Ana López" ingresa con esa cuenta de Apple
    Then "Ana López" queda con la sesión iniciada con el rol "Veterinario asociado"

  @EX-01 @RN-02 @RN-03 @RF-ROL-02 @D24 @D37 @D88 @D97
  Scenario Outline: Una cuenta no vinculada no entra, aunque su email coincida
    Given <situación>
    When la persona ingresa con la cuenta de <proveedor> "<cuenta>"
    Then no se inicia ninguna sesión
    And no se crea ningún usuario ni se vincula ninguna cuenta
    And el sistema informa "Esta cuenta de <proveedor> no está vinculada a WildSalud. Si recibiste una invitación, ingresá desde el enlace del email."

    Examples:
      | situación                                                                                                                             | proveedor | cuenta                 |
      | la cuenta desconocido@gmail.com no corresponde a ningún usuario                                                                        | Google    | desconocido@gmail.com  |
      | el dueño Pedro Sosa, con DNI 28999888 y email registrado pedro.sosa@gmail.com, está en estado Invitado y todavía no usó su invitación | Google    | pedro.sosa@gmail.com   |
      | Carla Gómez tiene vinculada solo su cuenta de Google                                                                                   | Apple     | carla.gomez@icloud.com |
      | Carla Gómez reemplazó su cuenta de Google carla.gomez@gmail.com por la de Apple carla.gomez@icloud.com                                 | Google    | carla.gomez@gmail.com  |
      | Carla Gómez fue dada de baja, el administrador la reactivó y todavía no usó la invitación nueva                                        | Google    | carla.gomez@gmail.com  |

  @EX-02 @RN-03 @RF-AUT-04 @RF-ROL-06 @RF-VET-05 @D47 @D92
  Scenario Outline: Un usuario dado de baja no puede iniciar sesión
    Given el administrador dio de baja a "<usuario>"
    When "<usuario>" ingresa con la cuenta de <proveedor> "<cuenta>"
    Then no se inicia ninguna sesión
    And el sistema informa "<mensaje>"

    Examples:
      | usuario     | proveedor | cuenta                | mensaje                                                   |
      | Ana López   | Apple     | ana.lopez@icloud.com  | Tu cuenta está inactiva. Comunicate con el administrador. |
      | Carla Gómez | Google    | carla.gomez@gmail.com | Tu cuenta está inactiva. Comunicate con WildSalud.        |

  @EX-03
  Scenario: El proveedor no confirma la identidad
    When "Carla Gómez" elige "Continuar con Google" y Google responde con un error
    Then no se inicia ninguna sesión
    And el sistema informa "No pudimos validar tu cuenta de Google. Intentá de nuevo."

  @EX-04 @RNF-INT-01
  Scenario: La misma confirmación del proveedor llega dos veces
    Given "Carla Gómez" eligió "Continuar con Google" e ingresó en Google
    When la confirmación de Google llega dos veces
    Then "Carla Gómez" tiene una sola sesión abierta
    And la auditoría registra un solo inicio de sesión

  @RN-04 @RF-ROL-03 @D46
  Scenario Outline: Una persona con dos roles entra con una cuenta distinta para cada uno
    Given "Ana López" también es dueña afiliada, con la cuenta de Google "ana.lopez@gmail.com" vinculada a su usuario de dueña
    When "Ana López" ingresa con la cuenta de <proveedor> "<cuenta>"
    Then queda con la sesión iniciada con el rol "<rol>"
    And no ve las funciones del otro rol

    Examples:
      | proveedor | cuenta               | rol                  |
      | Apple     | ana.lopez@icloud.com | Veterinario asociado |
      | Google    | ana.lopez@gmail.com  | Dueño afiliado       |

  @RN-04 @RF-ROL-03 @D145
  Scenario: Un administrador que también es veterinario entra con una sola cuenta
    Given el administrador "Marta Ruiz" también es veterinaria de la veterinaria "Patitas Centro"
    When "Marta Ruiz" ingresa con su cuenta de Google vinculada
    Then queda con la sesión iniciada con el rol "Administrador"
    And ve el panel global como pantalla de inicio
    And también puede buscar mascotas y registrar consumos como veterinaria

  @RN-05 @RF-AUT-03 @RNF-SEG-07 @D110
  Scenario: El sistema rechaza una operación de otro rol aunque no se haga desde la pantalla
    Given "Carla Gómez" tiene una sesión abierta
    When "Carla Gómez" envía un registro de pago sin usar la pantalla
    Then no se registra ningún pago
    And el sistema informa "No tenés permiso para hacer esta operación."

  @RN-06 @D15
  Scenario: Dos administradores con sesiones propias
    Given el administrador "Jorge Paz" tiene vinculada la cuenta de Google "jorge.paz@gmail.com"
    And "Marta Ruiz" tiene una sesión abierta
    When "Jorge Paz" ingresa con la cuenta de Google "jorge.paz@gmail.com"
    Then "Jorge Paz" y "Marta Ruiz" tienen cada uno su propia sesión con el rol "Administrador"

  @RN-09 @RNF-SEG-05
  Scenario: El ingreso usa siempre una conexión cifrada
    When una persona abre la pantalla de ingreso con una dirección sin cifrar
    Then el sistema la lleva a la misma pantalla con una conexión cifrada
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-AUT-01 | Paso 2, RN-01, RN-05, FA-02 |
| RF-AUT-02 | RN-04, RN-06 |
| RF-AUT-03, RNF-SEG-02 | Paso 8, RN-05, FA-02 |
| RF-AUT-04, RF-ROL-06, RF-VET-05 | RN-03, EX-02 |
| RF-AUT-05, RF-ROL-05 | RN-01 |
| RF-ROL-02, RF-VET-03 | RN-02, EX-01 |
| RF-ROL-03 | RN-04 |
| RNF-SEG-01 | RN-07 |
| RNF-SEG-05, RNF-LEG-01 | RN-09 |
| RNF-SEG-06 | Paso 2, RN-01 |
| RNF-SEG-07 | RN-05 |
| RNF-INT-01 | EX-04 |
| RNF-AUD-01 | Paso 7, RN-08 |
| D15 | RN-06 |
| D24 | Paso 2, RN-01, RN-02, EX-01 |
| D37 | RN-01, RN-02, FA-04, EX-01 |
| D46, D145 | RN-04 |
| D47, D92 | RN-03, EX-02 |
| D88 | RN-02, EX-01 |
| D90 | RN-07, FA-01 |
| D94 | Paso 7, RN-08 |
| D97 | RN-03, EX-01 |
| D109 | Paso 8, RN-10 |
| D110 | RN-05, FA-02 |
