# CU-16 — Crear plan

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Definir un plan de cobertura nuevo con su precio y sus prestaciones, para poder asignarlo a mascotas. |
| **Disparador** | WildSalud quiere ofrecer un plan nuevo. |
| **Relaciones** | Las prestaciones se eligen del catálogo de tipos de prestación (CU-20, CU-21). El plan se asigna en CU-22 y se modifica en CU-17. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. Existe al menos un tipo de prestación en el catálogo.

## Flujo principal

1. El administrador elige **Crear plan**.
2. El sistema pide nombre y precio mensual.
3. El administrador completa nombre y precio.
4. El administrador agrega las prestaciones del plan. Por cada una elige el tipo de prestación del catálogo e indica límite (o lo deja vacío para *ilimitada*), periodicidad (*mensual* o *anual*) y cantidad de períodos pagos necesarios para habilitarla.
5. El sistema muestra un resumen del plan.
6. El administrador confirma.
7. El sistema valida las reglas **RN-01 a RN-06**.
8. El sistema crea el plan en estado **Activo**, con su primera versión vigente desde ese momento.
9. El sistema deja el registro de auditoría.
10. El sistema confirma: *"Se creó el plan {plan}."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 4 | El administrador quita una prestación que había agregado. | La prestación deja de figurar en el resumen. |
| **FA-02** | 3 a 6 | El administrador cancela. | No se crea el plan. |

## Excepciones

En todas las excepciones **no se crea el plan**, y el sistema informa el motivo.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 7 | Falta el nombre o el precio. | *"Completá el campo {campo}."* |
| **EX-02** | 7 | Ya existe un plan no eliminado con ese nombre (activo o inactivo). | *"Ya existe un plan llamado {plan}."* |
| **EX-03** | 7 | El precio no es un importe mayor que cero. | *"El precio tiene que ser mayor que cero."* |
| **EX-04** | 7 | El plan no tiene ninguna prestación. | *"Agregá al menos una prestación al plan."* |
| **EX-05** | 7 | El mismo tipo de prestación figura dos veces. | *"{prestación} ya está en el plan."* |
| **EX-06** | 7 | Un límite no es un entero mayor que cero, o la cantidad de períodos pagos para habilitarla no es un entero de 1 o más. | *"Revisá los valores de {prestación}: el límite tiene que ser mayor que cero y los períodos pagos, 1 o más."* |
| **EX-07** | 1 | Un usuario que no es administrador intenta crear un plan. | *"No tenés permiso para hacer esta operación."* |
| **EX-08** | 6 | La misma confirmación llega dos veces. | Se crea **un solo** plan. |

## Postcondiciones

- **Éxito:** el plan existe en estado *Activo*, con su primera versión vigente desde su creación, y se puede asignar de inmediato (CU-22).
- **Fracaso:** no se crea ningún plan.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Datos del plan.** Nombre, precio mensual y estado (*Activo* al crearlo). El nombre es único entre los planes no eliminados (activos o inactivos), sin distinguir mayúsculas ni acentos; el nombre de un plan eliminado (CU-52) se puede volver a usar. El precio es un importe mayor que cero. | RF-PLA-03, D126 |
| **RN-02** | **Prestaciones.** Cada prestación del plan es un tipo del catálogo, con límite (vacío = ilimitada), periodicidad mensual o anual y la cantidad de períodos pagos necesarios para habilitarla. Un tipo aparece una sola vez por plan. El plan tiene al menos una prestación. | RF-PLA-01, RF-PLA-09, D31, D32, D126 |
| **RN-03** | **No acumulables.** El saldo no usado de un período no pasa al siguiente: cada mes o año empieza con el límite completo. | RF-PLA-01, D30 |
| **RN-04** | **Habilitación.** La cantidad de períodos pagos es un entero de 1 o más. Con 1, la prestación se puede usar desde el primer pago. | RF-PLA-09, D2, D126 |
| **RN-05** | **Vigencia inmediata.** A diferencia de las modificaciones (CU-17), un plan nuevo rige desde su creación y se puede asignar enseguida, con el precio con el que se creó. | D56 |
| **RN-06** | **Permisos y auditoría.** Solo el administrador crea planes; la creación queda auditada. | RF-TRA-01, RNF-AUD-01, RNF-SEG-07, D110 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Plan | Nombre, estado *Activo*, fecha y hora de creación, administrador. |
| Versión del plan | Precio mensual y prestaciones (tipo, límite, periodicidad, períodos pagos para habilitarla), vigente desde la creación. |
| Auditoría | Creación del plan con todos sus datos. |

## Escenarios de aceptación

```gherkin
@CU-16
Feature: CU-16 Crear plan
  Como administrador
  Quiero crear un plan con su precio y sus prestaciones
  Para poder ofrecerlo y asignarlo a mascotas

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And el catálogo de tipos de prestación tiene "Consulta", "Vacuna", "Radiografía", "Ecografía", "Laboratorio", "Cirugía" e "Internación"
    And existe el plan "Plan Base"

  @flujo-principal @RF-PLA-01 @RF-PLA-03 @RF-PLA-09 @D56
  Scenario: Crear un plan con sus prestaciones
    When el administrador crea el plan "Plan Plus" con precio mensual 15000 y las prestaciones:
      | prestación  | límite | periodicidad | períodos pagos para habilitarla |
      | Consulta    | 4      | mensual      | 1                               |
      | Vacuna      |        | mensual      | 1                               |
      | Cirugía     | 1      | anual        | 6                               |
    Then existe el plan "Plan Plus" en estado "Activo" con precio mensual 15000
    And su primera versión rige desde el "20/10/2026 10:00"
    And la prestación "Vacuna" es ilimitada
    And la auditoría registra la creación de "Plan Plus" por "Marta Ruiz"
    And el sistema informa "Se creó el plan Plan Plus."

  @RN-05 @D56
  Scenario: Un plan recién creado se puede asignar enseguida con su precio de creación
    Given el administrador creó el plan "Plan Plus" con precio mensual 15000
    When el administrador asigna el plan "Plan Plus" a "Luna" y confirma el pago
    Then se registra un pago de "Luna" por el período "2026-10" con importe 15000

  @EX-01
  Scenario: Faltan datos obligatorios
    When el administrador intenta crear un plan sin nombre, con precio 15000 y la prestación "Consulta"
    Then no se crea el plan
    And el sistema informa "Completá el campo nombre."

  @EX-02 @RN-01
  Scenario Outline: El nombre del plan es único
    When el administrador intenta crear el plan "<nombre>" con precio 12000 y la prestación "Consulta"
    Then no se crea el plan
    And el sistema informa "Ya existe un plan llamado <nombre>."

    Examples:
      | nombre    |
      | Plan Base |
      | plan base |

  @EX-03 @RN-01
  Scenario Outline: El precio tiene que ser mayor que cero
    When el administrador intenta crear el plan "Plan Mini" con precio <precio> y la prestación "Consulta"
    Then no se crea el plan
    And el sistema informa "El precio tiene que ser mayor que cero."

    Examples:
      | precio |
      | 0      |
      | -500   |

  @EX-04 @RN-02
  Scenario: El plan necesita al menos una prestación
    When el administrador intenta crear el plan "Plan Vacío" con precio 5000 y sin prestaciones
    Then no se crea el plan
    And el sistema informa "Agregá al menos una prestación al plan."

  @EX-05 @RN-02
  Scenario: Un tipo de prestación no se repite en el plan
    When el administrador intenta crear el plan "Plan Mini" con precio 5000 y dos veces la prestación "Consulta"
    Then no se crea el plan
    And el sistema informa "Consulta ya está en el plan."

  @EX-06 @RN-02 @RN-04
  Scenario Outline: Valores de una prestación
    When el administrador intenta crear el plan "Plan Mini" con precio 5000 y la prestación "Consulta" con límite "<límite>" y "<períodos>" períodos pagos para habilitarla
    Then el resultado es "<resultado>"

    Examples:
      | límite | períodos | resultado                                                                                              |
      | 2      | 1        | plan creado                                                                                            |
      |        | 1        | plan creado                                                                                            |
      | 0      | 1        | Revisá los valores de Consulta: el límite tiene que ser mayor que cero y los períodos pagos, 1 o más.  |
      | 2      | 0        | Revisá los valores de Consulta: el límite tiene que ser mayor que cero y los períodos pagos, 1 o más.  |

  @FA-01
  Scenario: Quitar una prestación antes de confirmar
    Given el administrador está creando el plan "Plan Mini" con las prestaciones "Consulta" y "Vacuna"
    When el administrador quita "Vacuna" y confirma
    Then el plan "Plan Mini" tiene solo la prestación "Consulta"

  @FA-02
  Scenario: El administrador cancela
    When el administrador completa el plan "Plan Mini" y cancela
    Then no existe el plan "Plan Mini"

  @EX-07 @RNF-SEG-07 @D110
  Scenario: Solo el administrador crea planes
    Given el veterinario "Ana López" inició sesión
    When "Ana López" intenta crear un plan sin usar la pantalla
    Then no se crea ningún plan
    And el sistema informa "No tenés permiso para hacer esta operación."

  @EX-08 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces crea un solo plan
    When el administrador confirma la creación del plan "Plan Plus" y la misma confirmación se envía dos veces
    Then existe un solo plan "Plan Plus"
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PLA-01 | Paso 4, RN-02, RN-03 |
| RF-PLA-03 | RN-01, EX-01, EX-02, EX-03 |
| RF-PLA-09 | Paso 4, RN-04, EX-06 |
| RF-TRA-01, RNF-AUD-01 | Paso 9, RN-06 |
| RNF-INT-01 | EX-08 |
| RNF-SEG-07, D110 | EX-07 |
| D2 | RN-04 |
| D30 | RN-03 |
| D31, D32 | RN-02 |
| D56 | RN-05 |
| D126 | RN-01, RN-02, RN-04 |
