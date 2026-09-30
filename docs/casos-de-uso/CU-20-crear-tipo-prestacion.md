# CU-20 — Crear tipo de prestación

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Agregar un tipo de prestación al catálogo para poder incluirlo en los planes. |
| **Disparador** | WildSalud quiere cubrir una prestación que no está en el catálogo (por ejemplo, *Odontología*). |
| **Relaciones** | Los tipos se incluyen en los planes con CU-16 y CU-17, y se corrigen con CU-21. Los consumos los registra CU-39. |

## Precondiciones

1. El administrador inició sesión (CU-02).

## Flujo principal

1. El administrador elige **Catálogo de prestaciones** y luego **Crear tipo**.
2. El sistema pide el nombre y una descripción opcional.
3. El administrador completa los datos y confirma.
4. El sistema valida las reglas **RN-01 y RN-02**.
5. El sistema agrega el tipo al catálogo.
6. El sistema deja el registro de auditoría.
7. El sistema confirma: *"Se agregó {prestación} al catálogo."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | El administrador cancela. | No se agrega ningún tipo. |

## Excepciones

En todas las excepciones **no se agrega el tipo**, y el sistema informa el motivo.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | Falta el nombre. | *"Completá el campo nombre."* |
| **EX-02** | 4 | Ya existe un tipo con ese nombre. | *"{prestación} ya está en el catálogo."* |
| **EX-03** | 4 | El nombre supera los 40 caracteres o la descripción, los 200. | *"El campo {campo} no puede tener más de {N} caracteres."* |
| **EX-04** | 1 | Un usuario que no es administrador intenta crear un tipo. | *"No tenés permiso para hacer esta operación."* |
| **EX-05** | 3 | La misma confirmación llega dos veces. | Se agrega **un solo** tipo. |

## Postcondiciones

- **Éxito:** el tipo está en el catálogo y se puede incluir en planes. No queda incluido en ningún plan hasta que se lo agregue con CU-16 o CU-17.
- **Fracaso:** el catálogo no cambia.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Nombre único.** El nombre es obligatorio, de hasta 40 caracteres, y único en el catálogo sin distinguir mayúsculas ni acentos. La descripción es opcional, de hasta 200 caracteres. | D31, D132 |
| **RN-02** | **Catálogo inicial.** El catálogo arranca con los 7 tipos del documento: consultas, vacunas, radiografías, ecografías, laboratorio, cirugías e internaciones. | RF-PLA-01, D31 |
| **RN-03** | **Límite y periodicidad son del plan.** El tipo solo tiene nombre y descripción. El límite, la periodicidad y la habilitación se definen en cada plan que lo incluye. | RF-PLA-01, D32 |
| **RN-04** | **Sin baja.** Los tipos no se dan de baja. Para dejar de cubrir uno, se lo quita de los planes (CU-17). | D133 |
| **RN-05** | **Permisos y auditoría.** Solo el administrador gestiona el catálogo; la creación queda auditada. | RF-TRA-01, RNF-AUD-01, RNF-SEG-07, D110 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Tipo de prestación | Nombre, descripción, fecha y hora de creación, administrador. |
| Auditoría | Creación del tipo. |

## Escenarios de aceptación

```gherkin
@CU-20
Feature: CU-20 Crear tipo de prestación
  Como administrador
  Quiero agregar un tipo de prestación al catálogo
  Para poder incluirlo en los planes

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00"
    And el administrador "Marta Ruiz" inició sesión
    And el catálogo tiene los tipos "Consulta", "Vacuna", "Radiografía", "Ecografía", "Laboratorio", "Cirugía" e "Internación"

  @flujo-principal @D31
  Scenario: Agregar un tipo de prestación
    When el administrador crea el tipo "Odontología" con descripción "Limpieza y extracciones" y confirma
    Then el catálogo tiene 8 tipos, incluido "Odontología"
    And "Odontología" no está incluida en ningún plan
    And la auditoría registra la creación de "Odontología" por "Marta Ruiz"
    And el sistema informa "Se agregó Odontología al catálogo."

  @RN-03 @D32
  Scenario: El tipo nuevo se puede incluir en un plan con sus propias condiciones
    Given el administrador creó el tipo "Odontología"
    When el administrador agrega "Odontología" al plan "Plan Plus" con límite 1, periodicidad anual y 6 períodos pagos para habilitarla
    Then la versión pendiente de "Plan Plus" incluye "Odontología" con límite 1 anual

  @EX-01
  Scenario: El nombre es obligatorio
    When el administrador intenta crear un tipo sin nombre
    Then el sistema informa "Completá el campo nombre."

  @EX-02 @RN-01
  Scenario Outline: El nombre es único en el catálogo
    When el administrador intenta crear el tipo "<nombre>"
    Then no se agrega ningún tipo
    And el sistema informa "<nombre> ya está en el catálogo."

    Examples:
      | nombre      |
      | Vacuna      |
      | radiografia |

  @EX-03 @RN-01
  Scenario Outline: Largo máximo del nombre
    When el administrador intenta crear un tipo con un nombre de <largo> caracteres
    Then el resultado es "<resultado>"

    Examples:
      | largo | resultado                                              |
      | 40    | tipo agregado                                          |
      | 41    | El campo nombre no puede tener más de 40 caracteres.   |

  @FA-01
  Scenario: El administrador cancela
    When el administrador completa el tipo "Odontología" y cancela
    Then el catálogo sigue teniendo 7 tipos

  @EX-04 @RNF-SEG-07 @D110
  Scenario: Solo el administrador gestiona el catálogo
    Given el veterinario "Ana López" inició sesión
    When "Ana López" intenta crear el tipo "Odontología" sin usar la pantalla
    Then el catálogo sigue teniendo 7 tipos
    And el sistema informa "No tenés permiso para hacer esta operación."

  @EX-05 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces agrega un solo tipo
    When el administrador confirma la creación del tipo "Odontología" y la misma confirmación se envía dos veces
    Then el catálogo tiene un solo tipo "Odontología"
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PLA-01 | RN-02, RN-03 |
| RF-TRA-01, RNF-AUD-01 | Paso 6, RN-05 |
| RNF-INT-01 | EX-05 |
| RNF-SEG-07, D110 | EX-04 |
| D31 | RN-01, RN-02 |
| D32 | RN-03 |
| D132, D133 | RN-01, RN-04 |
