# CU-42 — Modificar teléfono y dirección

| Campo | Valor |
|-------|-------|
| **Actor principal** | Dueño afiliado |
| **Objetivo** | Mantener actualizados su teléfono y su dirección. |
| **Disparador** | El dueño cambió de teléfono o se mudó. |
| **Relaciones** | El resto de los datos del dueño los modifica el administrador en CU-09 Editar dueño. |

## Precondiciones

1. El dueño inició sesión y su cuenta está en estado **Activo** (CU-02).

## Flujo principal

1. El dueño elige **Mis datos**.
2. El sistema muestra sus datos: nombre, apellido, DNI, email y forma de pago preferida como **solo lectura**, y teléfono y dirección como **editables**.
3. El dueño modifica el teléfono, la dirección o ambos y elige **Guardar**.
4. El sistema valida los datos (**RN-02**).
5. El sistema guarda los cambios.
6. El sistema deja el registro de auditoría con los valores anteriores y nuevos.
7. El sistema confirma: *"Tus datos se actualizaron."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | El dueño cancela. | No se guarda ningún cambio. |

## Excepciones

En todas las excepciones **no se guarda ningún cambio**, y el sistema informa el motivo.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | El teléfono no tiene un formato válido. | *"Ingresá un teléfono válido, con código de área."* |
| **EX-02** | 4 | Falta un dato obligatorio de la dirección. | *"Completá {campo} de la dirección."* |
| **EX-03** | 4 | No se modificó ningún dato. | *"No hay cambios para guardar."* |
| **EX-04** | 5 | El administrador modificó los datos del dueño mientras este editaba. | *"Tus datos cambiaron mientras los editabas. Revisalos y volvé a guardar."* |
| **EX-05** | 5 | La cuenta del dueño fue desactivada mientras tenía la sesión abierta. | *"Tu cuenta está inactiva. Comunicate con WildSalud."* |

## Postcondiciones

- **Éxito:** el teléfono y la dirección quedan actualizados, y el cambio queda auditado.
- **Fracaso:** los datos del dueño no cambian.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo teléfono y dirección.** El dueño puede editar únicamente su teléfono y su dirección. El sistema rechaza cualquier intento de modificar otro dato, aunque no se haga desde la pantalla. | RF-DUE-02, RNF-SEG-07 |
| **RN-02** | **Formato.** Teléfono: obligatorio, con código de área, entre 10 y 13 dígitos (se admiten espacios, guiones y el prefijo +54). Dirección: calle, número, localidad, provincia y código postal obligatorios; piso y departamento opcionales. | RF-DUE-01, D75 |
| **RN-03** | **Auditoría.** Se registran el valor anterior, el valor nuevo, el usuario y la fecha y hora. | RF-TRA-01, RNF-AUD-01, D76 |
| **RN-04** | **Sin sobrescribir en silencio.** Si los datos cambiaron desde que el dueño abrió la pantalla, no se guardan y se le pide revisarlos. | RNF-INT-01 |
| **RN-05** | **Datos personales.** El teléfono y la dirección son datos sensibles: solo los ven el propio dueño y el administrador. El veterinario ve el teléfono, pero no la dirección. | RNF-SEG-01, RF-ROL-09, RNF-LEG-01 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Dueño | Teléfono y dirección actualizados. |
| Auditoría | Valor anterior, valor nuevo, usuario, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-42
Feature: CU-42 Modificar teléfono y dirección
  Como dueño afiliado
  Quiero actualizar mi teléfono y mi dirección
  Para que WildSalud pueda contactarme

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00"
    And la dueña "Carla Gómez" tiene la cuenta en estado "Activo" e inició sesión
    And sus datos son teléfono "11 5555-1234" y dirección "Av. Corrientes 1234, CABA, Buenos Aires, 1043"

  @flujo-principal @RF-DUE-02 @RN-03
  Scenario: Actualizar el teléfono
    When "Carla Gómez" cambia su teléfono a "11 6666-9876" y guarda
    Then su teléfono es "11 6666-9876"
    And la auditoría registra valor anterior "11 5555-1234", valor nuevo "11 6666-9876", usuario "Carla Gómez" y fecha "20/10/2026 10:00"
    And el sistema informa "Tus datos se actualizaron."

  @flujo-principal @RF-DUE-02
  Scenario: Actualizar la dirección
    When "Carla Gómez" cambia su dirección a calle "Mitre", número "550", piso "3", departamento "B", localidad "Rosario", provincia "Santa Fe", código postal "2000" y guarda
    Then su dirección es "Mitre 550 3° B, Rosario, Santa Fe, 2000"

  @RN-01 @RF-DUE-02
  Scenario: Los demás datos se muestran como solo lectura
    When "Carla Gómez" abre "Mis datos"
    Then el nombre, el apellido, el DNI, el email y la forma de pago preferida se muestran como solo lectura

  @RN-01 @RNF-SEG-07
  Scenario: El sistema rechaza cambios de otros datos aunque no se hagan desde la pantalla
    When "Carla Gómez" envía una modificación de su email sin usar la pantalla
    Then su email no cambia

  @EX-01 @RN-02
  Scenario Outline: Validación del teléfono
    When "Carla Gómez" cambia su teléfono a "<teléfono>" y guarda
    Then el resultado es "<resultado>"

    Examples:
      | teléfono         | resultado                                        |
      | 11 6666-9876     | Tus datos se actualizaron.                       |
      | +54 11 6666-9876 | Tus datos se actualizaron.                       |
      | 6666-9876        | Ingresá un teléfono válido, con código de área.  |
      | abc123           | Ingresá un teléfono válido, con código de área.  |

  @EX-02 @RN-02
  Scenario: Falta un dato obligatorio de la dirección
    When "Carla Gómez" borra la localidad de su dirección y guarda
    Then su dirección no cambia
    And el sistema informa "Completá localidad de la dirección."

  @EX-03
  Scenario: Guardar sin cambios
    When "Carla Gómez" guarda sus datos sin modificarlos
    Then el sistema informa "No hay cambios para guardar."

  @EX-04 @RN-04
  Scenario: El administrador modificó los datos mientras el dueño editaba
    Given "Carla Gómez" abrió "Mis datos"
    And el administrador cambió el teléfono de "Carla Gómez" a "11 7777-0000"
    When "Carla Gómez" cambia su teléfono a "11 6666-9876" y guarda
    Then su teléfono sigue siendo "11 7777-0000"
    And el sistema informa "Tus datos cambiaron mientras los editabas. Revisalos y volvé a guardar."

  @FA-01
  Scenario: El dueño cancela
    When "Carla Gómez" cambia su teléfono a "11 6666-9876" y cancela
    Then su teléfono sigue siendo "11 5555-1234"

  @EX-05
  Scenario: Cuenta desactivada con la sesión abierta
    Given el administrador dio de baja a "Carla Gómez" mientras tenía la sesión abierta
    When "Carla Gómez" cambia su teléfono a "11 6666-9876" y guarda
    Then su teléfono sigue siendo "11 5555-1234"
    And el sistema informa "Tu cuenta está inactiva. Comunicate con WildSalud."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-DUE-01, D75 | RN-02 |
| RF-DUE-02 | Paso 2, RN-01 |
| RF-ROL-09 | RN-05 |
| RF-TRA-01, RNF-AUD-01, D76 | Paso 6, RN-03 |
| RNF-INT-01 | RN-04, EX-04 |
| RNF-SEG-01, RNF-LEG-01 | RN-05 |
| RNF-SEG-07 | RN-01 |
