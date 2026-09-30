# CU-21 — Editar tipo de prestación

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Corregir el nombre o la descripción de un tipo de prestación del catálogo. |
| **Disparador** | Un tipo está mal escrito o su descripción necesita aclararse. |
| **Relaciones** | Los tipos se crean en CU-20. El cambio se ve en los planes (CU-16, CU-17), las fichas (CU-38, CU-41) y los consumos (CU-39). |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El tipo existe en el catálogo.

## Flujo principal

1. El administrador elige **Editar** en un tipo del catálogo.
2. El sistema muestra el nombre, la descripción y en cuántos planes está incluido.
3. El administrador modifica el nombre y/o la descripción y confirma.
4. El sistema valida las reglas **RN-01 y RN-02**.
5. El sistema guarda los cambios, que se ven **en el momento** en todo el sistema.
6. El sistema deja el registro de auditoría con los valores anteriores y nuevos.
7. El sistema confirma: *"Se actualizó {prestación}."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | El administrador cancela. | El tipo no cambia. |

## Excepciones

En todas las excepciones **no se guarda ningún cambio**, y el sistema informa el motivo.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | Falta el nombre, está repetido o supera el largo máximo. | El mismo mensaje de CU-20 EX-01, EX-02 o EX-03. |
| **EX-02** | 4 | No se modificó ningún dato. | *"No hay cambios para guardar."* |
| **EX-03** | 4 | Otro administrador modificó el tipo mientras este editaba. | *"Los datos de {prestación} cambiaron mientras los editabas. Revisalos y volvé a guardar."* |
| **EX-04** | 1 | Un usuario que no es administrador intenta editar un tipo. | *"No tenés permiso para hacer esta operación."* |
| **EX-05** | 3 | La misma confirmación llega dos veces. | El cambio se guarda **una sola** vez. |

## Postcondiciones

- **Éxito:** el tipo tiene el nombre y la descripción nuevos, visibles en todos los planes, fichas y consumos que lo usan, y el cambio queda auditado.
- **Fracaso:** el tipo no cambia.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Mismas validaciones que al crear.** Nombre obligatorio, de hasta 40 caracteres y único; descripción opcional, de hasta 200. | D31, D132 |
| **RN-02** | **Solo nombre y descripción.** El tipo no tiene otras condiciones: límite, periodicidad y habilitación se cambian en el plan (CU-17). | RF-PLA-01, D32 |
| **RN-03** | **Cambio inmediato y sin versiones.** Es una corrección de texto: se ve en el momento en todo el sistema, incluidos los consumos y planes anteriores, porque el tipo sigue siendo el mismo. | D135 |
| **RN-04** | **Permisos y auditoría.** Solo el administrador edita el catálogo. Cada cambio queda auditado con valor anterior y valor nuevo. | RF-TRA-01, RNF-AUD-01, RNF-SEG-07, D85, D110 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Tipo de prestación | Nombre y descripción nuevos. |
| Auditoría | Valores anteriores y nuevos, administrador, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-21
Feature: CU-21 Editar tipo de prestación
  Como administrador
  Quiero corregir el nombre o la descripción de un tipo de prestación
  Para que el catálogo se lea bien

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00"
    And el administrador "Marta Ruiz" inició sesión
    And el catálogo tiene los tipos "Consulta", "Vacuna", "Radiografía", "Ecografía", "Laboratorio", "Cirugía", "Internación" y "Odontologia"
    And el tipo "Odontologia" está incluido en el plan "Plan Plus"

  @flujo-principal @RN-03 @D135
  Scenario: Corregir el nombre de un tipo
    Given "Luna" tiene un consumo de "Odontologia" del "05/10/2026"
    When el administrador cambia el nombre de "Odontologia" a "Odontología" y confirma
    Then el plan "Plan Plus" muestra la prestación "Odontología"
    And el consumo de "Luna" del "05/10/2026" muestra la prestación "Odontología"
    And la auditoría registra valor anterior "Odontologia", valor nuevo "Odontología", usuario "Marta Ruiz" y fecha "20/10/2026 10:00"
    And el sistema informa "Se actualizó Odontología."

  @flujo-principal
  Scenario: Cambiar la descripción
    When el administrador cambia la descripción de "Vacuna" a "Vacunas del calendario obligatorio" y confirma
    Then el tipo "Vacuna" tiene la descripción "Vacunas del calendario obligatorio"

  @EX-01 @RN-01
  Scenario Outline: Se aplican las validaciones del alta
    When el administrador intenta cambiar el nombre de "Odontologia" a "<nombre>"
    Then el tipo sigue llamándose "Odontologia"
    And el sistema informa "<mensaje>"

    Examples:
      | nombre | mensaje                            |
      |        | Completá el campo nombre.          |
      | Vacuna | Vacuna ya está en el catálogo.     |

  @EX-02
  Scenario: Guardar sin cambios
    When el administrador guarda "Vacuna" sin modificar ningún dato
    Then el sistema informa "No hay cambios para guardar."

  @EX-03
  Scenario: Otro administrador modificó el tipo mientras tanto
    Given "Marta Ruiz" abrió la edición de "Odontologia"
    And el administrador "Jorge Paz" cambió el nombre de "Odontologia" a "Odontología"
    When "Marta Ruiz" cambia el nombre a "Dental" y guarda
    Then el tipo se llama "Odontología"
    And el sistema informa "Los datos de Odontología cambiaron mientras los editabas. Revisalos y volvé a guardar."

  @FA-01
  Scenario: El administrador cancela
    When el administrador cambia el nombre de "Vacuna" a "Vacunas" y cancela
    Then el tipo sigue llamándose "Vacuna"

  @EX-04 @RNF-SEG-07 @D110
  Scenario: Solo el administrador edita el catálogo
    Given el veterinario "Ana López" inició sesión
    When "Ana López" intenta cambiar el nombre de "Vacuna" sin usar la pantalla
    Then el tipo sigue llamándose "Vacuna"
    And el sistema informa "No tenés permiso para hacer esta operación."

  @EX-05 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces guarda una sola vez
    When el administrador confirma el cambio de nombre de "Odontologia" a "Odontología" y la misma confirmación se envía dos veces
    Then la auditoría registra un solo cambio de nombre de ese tipo
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PLA-01, D32 | RN-02 |
| RF-TRA-01, RNF-AUD-01, D85 | Paso 6, RN-04 |
| RNF-INT-01 | EX-05 |
| RNF-SEG-07, D110 | EX-04 |
| D31 | RN-01 |
| D132, D135 | RN-01, RN-03 |
