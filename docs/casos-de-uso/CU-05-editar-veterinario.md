# CU-05 — Editar veterinario

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Mantener actualizados los datos de un veterinario asociado o corregir errores de carga. |
| **Disparador** | El veterinario cambió de veterinaria, de teléfono o de email, o el administrador detecta un dato mal cargado. |
| **Relaciones** | Se inicia desde la ficha del veterinario, en la lista de veterinarios. El estado de la cuenta se cambia en CU-06 Dar de baja veterinario y CU-07 Reactivar veterinario. Si el veterinario perdió su cuenta de Google o Apple, se usa CU-12 Reenviar invitación. Los consumos ya registrados (CU-39) conservan la veterinaria que tenían. Los cambios quedan en el historial de auditoría (CU-36). |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El veterinario existe y su cuenta está *Invitado* o *Activo* (no está dado de baja).

## Flujo principal

1. El administrador abre la ficha del veterinario desde la lista de veterinarios (D86) y elige **Editar**.
2. El sistema muestra como **editables** nombre, apellido, DNI, veterinaria, teléfono y email, y como **solo lectura** el estado de la cuenta y si tiene una cuenta de Google o Apple vinculada.
3. El administrador modifica uno o más datos y elige **Guardar**.
4. El sistema valida las reglas **RN-02 a RN-05** y que haya al menos un dato modificado.
5. El sistema guarda los cambios. El identificador interno, el estado de la cuenta y la cuenta de Google o Apple vinculada no cambian (**RN-01**, **RN-07**).
6. El sistema deja el registro de auditoría con el valor anterior y el valor nuevo de cada dato modificado.
7. El sistema confirma: *"Se actualizaron los datos de {veterinario}."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 5 | Cambia la veterinaria. | Los consumos que el veterinario registre desde ahora guardan la veterinaria nueva; los ya registrados conservan la copia de la veterinaria que tenían (**RN-06**). |
| **FA-02** | 5 | Cambia el email de un veterinario con la cuenta *Activo*. | La vinculación no cambia: el veterinario sigue ingresando con la misma cuenta de Google o Apple. El email nuevo se usa para las próximas invitaciones (CU-12). No se envía ninguna invitación. |
| **FA-03** | 5 | Cambia el email de un veterinario con la cuenta *Invitado*. | La invitación sin usar enviada al email anterior pasa a *Vencida*. El sistema genera una invitación nueva de un solo uso, que vence a las 24 horas, la envía al email nuevo, registra el resultado del envío y confirma: *"Se actualizaron los datos de {veterinario}. Le enviamos una nueva invitación a {email}."* |
| **FA-04** | 5 | En FA-03, el envío de la invitación nueva falla. | Los datos quedan guardados y el envío queda registrado como fallido. La invitación anterior queda igual *Vencida* y la nueva queda en estado *Invitado*, pero sin entregar. El sistema informa: *"Se actualizaron los datos de {veterinario}, pero no se pudo enviar la invitación a {email}. Reenviala desde su ficha."* (CU-12). |
| **FA-05** | 3 | El administrador cancela. | No se guarda ningún cambio. |

## Excepciones

En todas las excepciones **no se guarda ningún cambio** ni se envía ninguna invitación, y el sistema informa el motivo. Aunque la pantalla ya marca los errores de formato, el sistema vuelve a validar todo al guardar (RNF-SEG-07).

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | Falta un dato obligatorio. | *"Completá el campo {campo}."* |
| **EX-02** | 4 | El DNI no tiene un formato válido. | *"Ingresá un DNI válido, de 7 u 8 dígitos."* |
| **EX-03** | 4 | El teléfono no tiene un formato válido. | *"Ingresá un teléfono válido, con código de área."* |
| **EX-04** | 4 | El email no tiene un formato válido. | *"Ingresá un email válido."* |
| **EX-05** | 4 | El DNI nuevo ya es de otro veterinario (en cualquier estado). | *"Ya existe un veterinario con el DNI {DNI}: {otro veterinario}."* |
| **EX-06** | 4 | El email nuevo ya está registrado para otro veterinario (en cualquier estado). | *"El email {email} ya está registrado para el veterinario {otro veterinario}."* |
| **EX-07** | 4 | No se modificó ningún dato. | *"No hay cambios para guardar."* |
| **EX-08** | 5 | Otro administrador modificó los datos del veterinario mientras este administrador editaba. | *"Los datos de {veterinario} cambiaron mientras los editabas. Revisalos y volvé a guardar."* |
| **EX-09** | 4 | El veterinario fue dado de baja (por ejemplo, por otro administrador mientras se editaba). | *"La cuenta de {veterinario} está inactiva. Reactivala antes de modificar sus datos."* |
| **EX-10** | 3 | La misma confirmación llega dos veces (doble clic o reintento de red). | Los cambios se guardan **una sola** vez, con **un solo** registro de auditoría y, si corresponde, **una sola** invitación nueva. |
| **EX-11** | 4 | Quien pide el cambio no es administrador (por ejemplo, el propio veterinario que lo intenta sin usar la pantalla). | *"No tenés permiso para hacer esta operación."* |

## Postcondiciones

- **Éxito:** los datos del veterinario quedan actualizados y cada cambio queda auditado con su valor anterior y nuevo (CU-36). El estado de la cuenta y la vinculación con Google o Apple no cambian. Si estaba *Invitado* y cambió el email, tiene una invitación nueva en estado *Invitado*, que vence a las 24 horas, para el email nuevo, y la anterior quedó *Vencida*.
- **Fracaso:** los datos del veterinario, su cuenta y sus invitaciones no cambian.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Datos editables.** El administrador edita nombre, apellido, DNI, veterinaria, teléfono y email. No se editan acá el identificador interno (nunca se muestra), el estado de la cuenta (CU-06 y CU-07) ni la cuenta de Google o Apple vinculada (CU-12). Cambiar el DNI no cambia la identidad del veterinario: conserva su cuenta, su historial y sus consumos. | RF-VET-01, RF-VET-04, D45, D83 |
| **RN-02** | **Formato.** Los mismos datos obligatorios y formatos que en el alta: DNI de 7 u 8 dígitos (se aceptan puntos y se guardan solo los dígitos); teléfono con código de área, entre 10 y 13 dígitos (se admiten espacios, guiones y el prefijo +54); email con formato válido, guardado en minúsculas; nombre, apellido y veterinaria como texto libre. | RF-VET-01, D13, D75, D80 |
| **RN-03** | **DNI único dentro del rol.** El DNI no puede ser el de otro veterinario, incluidos los dados de baja. Puede coincidir con el de un dueño. | D44, D46 |
| **RN-04** | **Email único dentro del rol.** El email no puede ser el de otro veterinario, incluidos los dados de baja, sin distinguir mayúsculas. Puede coincidir con el de un dueño. | RF-VET-01, D46, D81 |
| **RN-05** | **Solo veterinarios no dados de baja.** Los datos de un veterinario con la cuenta *Inactivo* no se modifican: primero se lo reactiva (CU-07). | RNF-BAJ-03, D83 |
| **RN-06** | **La veterinaria de los consumos no cambia.** Cada consumo guarda una copia de la veterinaria del momento en que se registró. Cambiar la veterinaria del veterinario solo afecta a los consumos que registre desde ese momento. | RF-VET-05, D13, D14 |
| **RN-07** | **Email y vinculación.** La cuenta se vincula por el identificador del proveedor, no por el email: cambiar el email no cambia la cuenta de Google o Apple vinculada ni le quita el acceso. Si la cuenta está *Invitado*, la invitación sin usar pasa a *Vencida* y se genera una nueva, en estado *Invitado*, que vence a las 24 horas, y se envía al email nuevo registrando el resultado. La anterior queda *Vencida* aunque falle el envío de la nueva; en ese caso, el administrador la reenvía con CU-12. El estado de la cuenta se evalúa al guardar. | RF-VET-03, RF-NOT-03, D37, D43, D47, D84, D87, D111 |
| **RN-08** | **Auditoría con valor anterior y nuevo.** Por cada dato modificado se registran el valor anterior, el valor nuevo, el administrador y la fecha y hora. | RF-TRA-01, RNF-AUD-01, D76, D85 |
| **RN-09** | **Sin sobrescribir en silencio.** Si los datos del veterinario cambiaron desde que el administrador abrió la edición, no se guardan y se le pide revisarlos. | RNF-INT-01, D15 |
| **RN-10** | **Sin duplicados.** Cada confirmación se procesa una sola vez. | RNF-INT-01 |
| **RN-11** | **Solo el administrador.** Solo el administrador modifica los datos de un veterinario; el propio veterinario tampoco puede hacerlo. El sistema rechaza cualquier otro intento, aunque no se haga desde la pantalla, con el mensaje de EX-11. | RF-VET-04, RF-ROL-01, RNF-SEG-02, RNF-SEG-07, D110 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Veterinario | Los datos modificados. El identificador interno, el estado de la cuenta y la vinculación no cambian. |
| Invitación | Solo si la cuenta estaba *Invitado* y cambió el email: la invitación anterior sin usar pasa a *Vencida* y se crea una nueva en estado *Invitado* para el email nuevo, con vencimiento 24 horas después, aunque falle su envío. |
| Envío | Canal y resultado del envío de la invitación nueva, si la hubo (D43). |
| Auditoría | Por cada dato modificado: valor anterior, valor nuevo, administrador, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-05
Feature: CU-05 Editar veterinario
  Como administrador
  Quiero modificar los datos de un veterinario asociado
  Para que estén actualizados y sin errores

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And el veterinario "Ana López" tiene DNI "27333444", veterinaria "Patitas", teléfono "11 4444-5555" y email "ana.lopez@gmail.com"
    And la cuenta de "Ana López" está en estado "Activo" y vinculada a una cuenta de Google, salvo que el escenario indique otra
    And el veterinario "Pablo Díaz" de la veterinaria "Huellas" tiene DNI "25111222" y email "pablo.diaz@gmail.com"

  @flujo-principal @RF-VET-04 @RN-08 @RF-TRA-01 @D76 @D85
  Scenario: Actualizar el teléfono
    When el administrador cambia el teléfono de "Ana López" a "11 6666-9876" y guarda
    Then el teléfono de "Ana López" es "11 6666-9876"
    And la cuenta de "Ana López" sigue en estado "Activo"
    And la auditoría registra dato "teléfono", valor anterior "11 4444-5555", valor nuevo "11 6666-9876", usuario "Marta Ruiz" y fecha "20/10/2026 10:00"
    And el sistema informa "Se actualizaron los datos de Ana López."

  @RN-08 @RNF-AUD-01 @D85
  Scenario: Cada dato modificado queda auditado por separado
    When el administrador cambia la veterinaria de "Ana López" a "Huellas" y el teléfono a "11 6666-9876" y guarda
    Then la auditoría registra:
      | dato        | valor anterior | valor nuevo  | usuario    | fecha            |
      | veterinaria | Patitas        | Huellas      | Marta Ruiz | 20/10/2026 10:00 |
      | teléfono    | 11 4444-5555   | 11 6666-9876 | Marta Ruiz | 20/10/2026 10:00 |

  @RN-01 @D45 @D83
  Scenario: El estado y la vinculación de la cuenta no se editan acá
    When el administrador abre la edición de "Ana López"
    Then el nombre, el apellido, el DNI, la veterinaria, el teléfono y el email se muestran como editables
    And el estado de la cuenta y la cuenta de Google vinculada se muestran como solo lectura

  @FA-01 @RN-06 @D14
  Scenario: Cambiar la veterinaria no cambia los consumos ya registrados
    Given el "05/10/2026" "Ana López" registró una "Consulta" para "Luna" con la veterinaria "Patitas"
    When el administrador cambia la veterinaria de "Ana López" a "Huellas" y guarda
    Then la veterinaria de "Ana López" es "Huellas"
    And la "Consulta" del "05/10/2026" de "Luna" sigue con la veterinaria "Patitas"

  @FA-01 @RN-06 @D13 @D14
  Scenario: Los consumos nuevos guardan la veterinaria actualizada
    Given el administrador cambió la veterinaria de "Ana López" a "Huellas"
    And la cobertura de "Luna" está "Al día" y tiene saldo de "Consulta"
    When "Ana López" registra una "Consulta" para "Luna"
    Then el consumo queda registrado con el veterinario "Ana López" y la veterinaria "Huellas"

  @FA-02 @RN-07 @RF-VET-03 @D37 @D84
  Scenario: Cambiar el email de un veterinario activo no cambia su acceso
    When el administrador cambia el email de "Ana López" a "ana.lopez@patitas.com.ar" y guarda
    Then el email de "Ana López" es "ana.lopez@patitas.com.ar"
    And "Ana López" sigue vinculada a la misma cuenta de Google
    And la cuenta de "Ana López" sigue en estado "Activo"
    And no se envía ninguna invitación

  @FA-03 @RN-07 @D37 @D47 @D84 @D87 @D111
  Scenario: Cambiar el email de un veterinario invitado reemplaza la invitación
    Given la cuenta de "Ana López" está en estado "Invitado" con una invitación en estado "Invitado" enviada a "ana.lopez@gmail.com"
    When el administrador cambia el email de "Ana López" a "ana.lopez@patitas.com.ar" y guarda
    Then la invitación enviada a "ana.lopez@gmail.com" queda "Vencida"
    And se envió una invitación nueva de un solo uso a "ana.lopez@patitas.com.ar", que vence el "21/10/2026 10:00"
    And la cuenta de "Ana López" sigue en estado "Invitado"
    And el sistema informa "Se actualizaron los datos de Ana López. Le enviamos una nueva invitación a ana.lopez@patitas.com.ar."

  @FA-04 @RF-NOT-03 @D43 @D84 @D87 @D111
  Scenario: Falla el envío de la invitación nueva
    Given la cuenta de "Ana López" está en estado "Invitado" con una invitación en estado "Invitado" enviada a "ana.lopez@gmail.com"
    And el envío de emails no está funcionando
    When el administrador cambia el email de "Ana López" a "ana.lopez@patitas.com.ar" y guarda
    Then el email de "Ana López" es "ana.lopez@patitas.com.ar"
    And la invitación enviada a "ana.lopez@gmail.com" queda "Vencida"
    And la invitación nueva a "ana.lopez@patitas.com.ar" queda en estado "Invitado", sin entregar
    And el envío de la invitación a "ana.lopez@patitas.com.ar" quedó registrado como fallido
    And el sistema informa "Se actualizaron los datos de Ana López, pero no se pudo enviar la invitación a ana.lopez@patitas.com.ar. Reenviala desde su ficha."

  @FA-05
  Scenario: El administrador cancela
    When el administrador cambia el teléfono de "Ana López" a "11 6666-9876" y cancela
    Then el teléfono de "Ana López" sigue siendo "11 4444-5555"
    And la auditoría no registra ningún cambio

  @EX-01 @EX-02 @EX-03 @EX-04 @RN-02 @D75 @D80
  Scenario Outline: Validación de los datos
    When el administrador cambia el <campo> de "Ana López" a "<valor>" y guarda
    Then el resultado es "<resultado>"

    Examples:
      | campo    | valor              | resultado                                         |
      | nombre   |                    | Completá el campo nombre.                         |
      | DNI      | 27.333.445         | Se actualizaron los datos de Ana López.           |
      | DNI      | 273334             | Ingresá un DNI válido, de 7 u 8 dígitos.          |
      | teléfono | +54 351 444-5555   | Se actualizaron los datos de Ana López.           |
      | teléfono | 444-5555           | Ingresá un teléfono válido, con código de área.   |
      | email    | ana.lopez@         | Ingresá un email válido.                          |

  @RN-01 @RN-03 @D44 @D45 @D83
  Scenario: Corregir el DNI no cambia la identidad del veterinario
    Given "Ana López" registró 3 consumos
    When el administrador cambia el DNI de "Ana López" a "27333445" y guarda
    Then el DNI de "Ana López" es "27333445"
    And "Ana López" conserva sus 3 consumos y la misma cuenta de Google vinculada

  @EX-05 @RN-03 @D44
  Scenario Outline: El DNI nuevo ya es de otro veterinario
    Given la cuenta de "Pablo Díaz" está en estado "<estado>"
    When el administrador cambia el DNI de "Ana López" a "25111222" y guarda
    Then el DNI de "Ana López" sigue siendo "27333444"
    And el sistema informa "Ya existe un veterinario con el DNI 25111222: Pablo Díaz."

    Examples:
      | estado   |
      | Activo   |
      | Inactivo |

  @EX-06 @RN-04 @D81
  Scenario Outline: El email nuevo ya es de otro veterinario
    When el administrador cambia el email de "Ana López" a "<email>" y guarda
    Then el email de "Ana López" sigue siendo "ana.lopez@gmail.com"
    And el sistema informa "El email pablo.diaz@gmail.com ya está registrado para el veterinario Pablo Díaz."

    Examples:
      | email                |
      | pablo.diaz@gmail.com |
      | PABLO.DIAZ@gmail.com |

  @EX-07
  Scenario: Guardar sin cambios
    When el administrador guarda los datos de "Ana López" sin modificarlos
    Then la auditoría no registra ningún cambio
    And el sistema informa "No hay cambios para guardar."

  @EX-08 @RN-09 @RNF-INT-01 @D15
  Scenario: Otro administrador modificó los datos mientras se editaban
    Given "Marta Ruiz" abrió la edición de "Ana López"
    And el administrador "Jorge Paz" cambió el teléfono de "Ana López" a "11 7777-0000"
    When "Marta Ruiz" cambia la veterinaria de "Ana López" a "Huellas" y guarda
    Then la veterinaria de "Ana López" sigue siendo "Patitas"
    And el teléfono de "Ana López" sigue siendo "11 7777-0000"
    And el sistema informa "Los datos de Ana López cambiaron mientras los editabas. Revisalos y volvé a guardar."

  @EX-09 @RN-05 @RNF-BAJ-03 @D83
  Scenario: No se modifican los datos de un veterinario dado de baja
    Given "Marta Ruiz" abrió la edición de "Ana López"
    And el administrador "Jorge Paz" dio de baja a "Ana López"
    When "Marta Ruiz" cambia el teléfono de "Ana López" a "11 6666-9876" y guarda
    Then el teléfono de "Ana López" sigue siendo "11 4444-5555"
    And el sistema informa "La cuenta de Ana López está inactiva. Reactivala antes de modificar sus datos."

  @EX-10 @RN-10 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces guarda una sola vez
    Given la cuenta de "Ana López" está en estado "Invitado" con una invitación en estado "Invitado" enviada a "ana.lopez@gmail.com"
    When el administrador confirma el cambio del email de "Ana López" a "ana.lopez@patitas.com.ar" y la misma confirmación se envía dos veces
    Then la auditoría registra un solo cambio de email
    And se envió una sola invitación nueva a "ana.lopez@patitas.com.ar"

  @EX-11 @RN-11 @RF-VET-04 @RNF-SEG-07 @D110
  Scenario: El veterinario no puede modificar sus propios datos
    Given "Ana López" inició sesión
    When "Ana López" envía una modificación de su teléfono sin usar la pantalla
    Then el teléfono de "Ana López" sigue siendo "11 4444-5555"
    And el sistema informa "No tenés permiso para hacer esta operación."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-VET-01 | Paso 2, RN-01, RN-02, EX-01 a EX-04 |
| RF-VET-03 | RN-07, FA-02 (reemplazado por D37: el email no es el identificador de acceso) |
| RF-VET-04, RF-ROL-01 | Actor principal, RN-11, EX-11 |
| RF-VET-05 | RN-06, FA-01 |
| RF-NOT-03 | RN-07, FA-03, FA-04 |
| RF-TRA-01, RNF-AUD-01 | Paso 6, RN-08 |
| RNF-BAJ-03 | RN-05, EX-09 |
| RNF-SEG-02, RNF-SEG-07 | RN-11, EX-11, nota de Excepciones |
| RNF-INT-01 | RN-09, RN-10, EX-08, EX-10 |
| RNF-USA-01 | Paso 7 |
| D13, D14 | RN-06, FA-01 |
| D15 | RN-09, EX-08 |
| D37, D47 | RN-07, FA-02, FA-03 |
| D43 | RN-07, FA-04 |
| D44 | RN-03, EX-05 |
| D45 | Paso 5, RN-01 |
| D46 | RN-03, RN-04 |
| D75 | RN-02, EX-03 |
| D76 | RN-08 |
| D80 | RN-02, EX-01 a EX-04 |
| D81 | RN-04, EX-06 |
| D83 | RN-01, RN-05, EX-09 |
| D84 | RN-07, FA-02, FA-03, FA-04 |
| D85 | Paso 6, RN-08 |
| D86 | Paso 1 |
| D87 | RN-07, FA-03, FA-04 |
| D111 | RN-07, FA-03, FA-04, Datos que se registran |
| D110 | RN-11, EX-11 |
