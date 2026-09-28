# CU-23 — Cambiar plan de una mascota

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Programar el cambio del plan de una mascota para que rija desde el primer día del mes siguiente. |
| **Disparador** | El dueño pide pasar su mascota a otro plan. |
| **Relaciones** | El cambio queda pendiente y lo aplica CU-46 Aplicar cambios programados. Se puede cancelar con CU-25. Reemplaza a una baja programada pendiente (CU-24). Se cancela automáticamente si la cobertura se suspende (CU-44, CU-28) o si se desactiva el plan destino (CU-18). |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. La mascota tiene una cobertura vigente.

## Flujo principal

1. El administrador elige **Cambiar plan** desde la ficha de la mascota.
2. El sistema muestra el plan actual, la fecha en que regiría el cambio (día 1 del mes siguiente) y los planes **activos** distintos del actual, cada uno con su precio para el mes siguiente.
3. El administrador elige el plan nuevo.
4. El sistema muestra un resumen: plan actual, plan nuevo, fecha de vigencia, y que hasta esa fecha se mantienen las condiciones del plan actual.
5. El administrador confirma.
6. El sistema valida las reglas **RN-01 a RN-04**.
7. El sistema registra el cambio como **pendiente**, con el plan nuevo y la fecha de vigencia.
8. El sistema deja el registro de auditoría.
9. El sistema confirma: *"El cambio a {plan nuevo} rige desde el {fecha}."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 4 | Ya existe un cambio pendiente (cambio de plan o baja programada). | El sistema muestra el cambio pendiente y avisa que será **reemplazado**. Si el administrador confirma, el anterior pasa a *Reemplazado* y queda el nuevo como pendiente. |
| **FA-02** | 3 o 5 | El administrador cancela. | No se registra ningún cambio; si había uno pendiente, sigue igual. |

## Excepciones

En todas las excepciones **no se registra el cambio**, y el sistema informa el motivo.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 6 | La cobertura está suspendida por falta de pago. | *"Solo se puede cambiar el plan de una cobertura al día. La cobertura de {mascota} está suspendida por falta de pago."* |
| **EX-02** | 6 | La mascota no tiene cobertura vigente. | *"{mascota} no tiene una cobertura vigente. Usá Asignar plan."* |
| **EX-03** | 6 | El plan elegido se desactivó entre que se mostró la lista y la confirmación. | *"El plan {plan} está inactivo y no se puede asignar."* |
| **EX-04** | 6 | El plan elegido es el mismo que el actual. | *"{mascota} ya tiene el plan {plan}."* |
| **EX-05** | 5 | La misma confirmación llega dos veces. | Se registra **un solo** cambio pendiente. |

## Postcondiciones

- **Éxito:** la mascota tiene un cambio de plan pendiente con fecha de vigencia el día 1 del mes siguiente. Hasta esa fecha conserva el plan, las prestaciones, los límites y el precio actuales. Si había otro cambio pendiente, quedó *Reemplazado*. El cambio se cancela solo si la cobertura se suspende o el plan destino se desactiva antes de la vigencia.
- **Fracaso:** no se registra ningún cambio y el pendiente anterior, si existía, no se modifica.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo con cobertura al día.** El cambio solo se puede pedir si la cobertura está *Al día* en ese momento. Del día 1 al 13 con el mes en curso impago la cobertura sigue al día, así que el cambio se permite. | D17, D19, D54 |
| **RN-02** | **Solo planes activos y distintos.** El plan nuevo tiene que estar activo y ser distinto del actual. | RF-PLA-03, D21 |
| **RN-03** | **Vigencia el mes siguiente.** El cambio rige desde las 00:00 del día 1 del mes siguiente (hora de Argentina). Hasta entonces la mascota conserva las condiciones y el precio del plan actual. | RF-PLA-15, RF-PLA-16, D1, D53 |
| **RN-04** | **Un solo cambio pendiente.** Una mascota puede tener un único cambio pendiente (cambio de plan o baja programada). Uno nuevo reemplaza al anterior con confirmación. | D20 |
| **RN-05** | **Lo que se conserva.** Al entrar en vigencia, la cobertura es la misma: conserva su antigüedad (períodos pagos) y los consumos del año se siguen contando contra los límites anuales del plan nuevo. | D11, D30 |
| **RN-06** | **Historial intacto.** El cambio no modifica los pagos, consumos ni condiciones anteriores a su vigencia. | RF-PLA-08 |
| **RN-07** | **La suspensión cancela el cambio.** Si la cobertura se suspende antes de la vigencia (el día 14 o por la anulación de un pago), el cambio pendiente se cancela automáticamente. Si después el dueño salda la deuda, el administrador lo vuelve a programar. | D60 |
| **RN-08** | **Desactivar el plan destino cancela el cambio.** Si el plan nuevo se desactiva antes de la vigencia, el cambio pendiente se cancela (CU-18). | D61 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Cambio pendiente | Cobertura, tipo *Cambio de plan*, plan nuevo, fecha de vigencia, estado *Pendiente*, administrador y fecha y hora de registro. |
| Cambio reemplazado | Si existía, el cambio anterior pasa a estado *Reemplazado*, con referencia al nuevo. |
| Auditoría | Registro del cambio y, si corresponde, del reemplazo. |

## Escenarios de aceptación

```gherkin
@CU-23
Feature: CU-23 Cambiar plan de una mascota
  Como administrador
  Quiero programar el cambio de plan de una mascota
  Para que rija desde el mes siguiente sin afectar el mes en curso

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And existen los planes:
      | plan      | precio mensual | estado   |
      | Plan Base | 10000          | Activo   |
      | Plan Plus | 15000          | Activo   |
      | Plan Old  | 8000           | Inactivo |
    And la mascota "Luna" tiene una cobertura con el plan "Plan Base" y 6 períodos pagos

  @flujo-principal @RF-PLA-15 @RF-PLA-16 @D1
  Scenario: Programar un cambio de plan para el mes siguiente
    Given la cobertura de "Luna" está "Al día"
    When el administrador cambia el plan de "Luna" a "Plan Plus" y confirma
    Then "Luna" tiene un cambio pendiente al plan "Plan Plus" con vigencia "01/11/2026 00:00"
    And el sistema informa "El cambio a Plan Plus rige desde el 01/11/2026."
    And hasta el "31/10/2026 23:59" el plan vigente de "Luna" es "Plan Base"

  @RN-01 @D17 @D19
  Scenario Outline: El cambio solo se permite con la cobertura al día
    Given la fecha y hora actual es "<momento>"
    And la cuota de octubre 2026 de "Luna" está "<cuota>"
    When el administrador cambia el plan de "Luna" a "Plan Plus"
    Then el resultado es "<resultado>"

    Examples:
      | momento          | cuota  | resultado                                                                                                   |
      | 10/10/2026 10:00 | impaga | cambio pendiente registrado                                                                                 |
      | 20/10/2026 10:00 | pagada | cambio pendiente registrado                                                                                 |
      | 20/10/2026 10:00 | impaga | Solo se puede cambiar el plan de una cobertura al día. La cobertura de Luna está suspendida por falta de pago. |

  @FA-01 @D20
  Scenario Outline: Un cambio nuevo reemplaza al pendiente
    Given la cobertura de "Luna" está "Al día"
    And "Luna" tiene pendiente <pendiente> con vigencia "01/11/2026"
    When el administrador cambia el plan de "Luna" a "Plan Plus" y confirma el reemplazo
    Then el cambio anterior queda "Reemplazado"
    And "Luna" tiene un único cambio pendiente: al plan "Plan Plus" con vigencia "01/11/2026 00:00"

    Examples:
      | pendiente                     |
      | un cambio al plan "Plan Old"  |
      | una baja programada           |

  @FA-02
  Scenario: El administrador cancela y el pendiente anterior no cambia
    Given la cobertura de "Luna" está "Al día"
    And "Luna" tiene pendiente una baja programada con vigencia "01/11/2026"
    When el administrador elige cambiar el plan de "Luna" a "Plan Plus" y cancela
    Then "Luna" sigue teniendo pendiente la baja programada con vigencia "01/11/2026"

  @EX-02 @D10
  Scenario: Mascota sin cobertura vigente
    Given la cobertura de "Luna" está "Dada de baja"
    When el administrador intenta cambiar el plan de "Luna" a "Plan Plus"
    Then no se registra ningún cambio
    And el sistema informa "Luna no tiene una cobertura vigente. Usá Asignar plan."

  @EX-03 @EX-04 @RF-PLA-03 @D21
  Scenario Outline: Plan destino no válido
    Given la cobertura de "Luna" está "Al día"
    When el administrador intenta cambiar el plan de "Luna" a "<plan>"
    Then no se registra ningún cambio
    And el sistema informa "<mensaje>"

    Examples:
      | plan      | mensaje                                             |
      | Plan Old  | El plan Plan Old está inactivo y no se puede asignar. |
      | Plan Base | Luna ya tiene el plan Plan Base.                    |

  @RN-05 @D11
  Scenario: Al entrar en vigencia se conserva la antigüedad
    Given la cobertura de "Luna" está "Al día"
    And "Luna" tiene un cambio pendiente al plan "Plan Plus" con vigencia "01/11/2026"
    When llega el "01/11/2026 00:00"
    Then el plan vigente de "Luna" es "Plan Plus"
    And la cobertura de "Luna" sigue teniendo 6 períodos pagos

  @RN-07 @D60
  Scenario: La suspensión cancela el cambio pendiente
    Given la fecha y hora actual es "05/10/2026 10:00"
    And la cobertura de "Luna" está "Al día" con la cuota de octubre 2026 impaga
    And el administrador cambió el plan de "Luna" a "Plan Plus" con vigencia "01/11/2026"
    When la cobertura de "Luna" se suspende el "14/10/2026 00:00"
    Then el cambio al plan "Plan Plus" queda "Cancelado"
    And el "01/11/2026" el plan vigente de "Luna" sigue siendo "Plan Base"

  @RN-08 @D61
  Scenario: Desactivar el plan destino cancela el cambio pendiente
    Given la cobertura de "Luna" está "Al día"
    And el administrador cambió el plan de "Luna" a "Plan Plus" con vigencia "01/11/2026"
    When el administrador desactiva el "Plan Plus" el "25/10/2026"
    Then el cambio al plan "Plan Plus" de "Luna" queda "Cancelado"

  @EX-05 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces registra un solo cambio
    Given la cobertura de "Luna" está "Al día"
    When el administrador confirma el cambio de "Luna" a "Plan Plus" y la misma confirmación se envía dos veces
    Then "Luna" tiene un único cambio pendiente
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PLA-03 | RN-02, EX-03 |
| RF-PLA-08 | RN-06 |
| RF-PLA-15, RF-PLA-16 | Pasos 2 y 4, RN-03 |
| RF-TRA-01 | Paso 8 |
| RNF-INT-01 | EX-05 |
| D1, D53 | RN-03 |
| D10 | EX-02 |
| D11, D30 | RN-05 |
| D17, D19, D54 | RN-01, EX-01 |
| D20 | RN-04, FA-01 |
| D21 | RN-02, EX-03 |
| D60 | RN-07 |
| D61 | RN-08 |
