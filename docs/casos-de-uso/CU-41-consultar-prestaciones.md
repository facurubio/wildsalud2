# CU-41 — Consultar prestaciones disponibles/consumidas

| Campo | Valor |
|-------|-------|
| **Actor principal** | Dueño afiliado |
| **Objetivo** | Ver qué prestaciones del plan de una de sus mascotas le quedan disponibles en el período en curso, cuáles usó y cuándo. |
| **Disparador** | El dueño elige una de sus mascotas en CU-40 Consultar mis mascotas. |
| **Relaciones** | Se llega desde CU-40. Los consumos los registra el veterinario en CU-39 y los corrige o anula el administrador en CU-30 y CU-31. |

## Precondiciones

1. El dueño inició sesión y su cuenta está **Activa** (CU-02).
2. La mascota es del dueño y no está dada de baja.

## Flujo principal

1. El dueño elige una mascota.
2. El sistema muestra el plan vigente y el estado de la cobertura.
3. El sistema muestra cada prestación del plan con periodicidad (mensual o anual), límite, consumidas en el período, saldo (o *Ilimitada*) y estado: *Disponible*, *Agotada* o *Se habilita con {N} períodos pagos (faltan {M})*.
4. El sistema muestra los **consumos del período en curso**: fecha, prestación y veterinaria. No se pueden consultar consumos de períodos anteriores.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 2 | La cobertura está suspendida por falta de pago. | Se muestran las prestaciones con el aviso *"Mientras la cobertura esté suspendida no se pueden usar las prestaciones."* |
| **FA-02** | 2 | La mascota no tiene cobertura vigente. | Se muestra *"{mascota} no tiene una cobertura vigente."* y no se muestran prestaciones. |
| **FA-03** | 4 | No hay consumos en el período. | Se muestra *"No hay consumos en este período."* |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 1 | La mascota no es del dueño. | *"No tenés acceso a esta información."* No se muestra ningún dato. |
| **EX-02** | 1 | La cuenta del dueño fue desactivada mientras tenía la sesión abierta. | *"Tu cuenta está inactiva. Comunicate con WildSalud."* |

## Postcondiciones

- **Éxito:** el dueño ve el saldo de cada prestación y los consumos del período en curso.
- **Fracaso:** no se muestra ningún dato.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Saldo.** Límite del plan vigente menos los consumos válidos del período (mes o año calendario según la prestación). Los consumos del año hechos con un plan anterior también cuentan. Límite vacío = ilimitada. | RF-PRE-02, D30, D32 |
| **RN-02** | **Solo consumos válidos.** Los consumos anulados no se muestran; los corregidos se muestran con sus datos corregidos. | D35, D40 |
| **RN-03** | **Habilitación.** Una prestación que requiere más períodos pagos de los que tiene la cobertura se muestra con los períodos que faltan. | RF-PLA-09, D11, D12 |
| **RN-04** | **Solo lo propio.** El dueño solo puede consultar prestaciones de sus mascotas. El sistema lo verifica en cada consulta. | RNF-SEG-03, RNF-SEG-07 |
| **RN-05** | **Solo el período en curso.** El dueño ve únicamente los consumos del período en curso (mes o año según la prestación). No ve consumos de períodos anteriores ni de coberturas anteriores. | D79 |
| **RN-06** | **Datos calculados en el momento.** Saldos y estados se calculan con la fecha y hora de la consulta (hora de Argentina). | D53, D54 |

## Escenarios de aceptación

```gherkin
@CU-41
Feature: CU-41 Consultar prestaciones disponibles/consumidas
  Como dueño afiliado
  Quiero ver las prestaciones disponibles y consumidas de mi mascota
  Para saber qué puedo usar y qué ya usé

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And la dueña "Carla Gómez" tiene la cuenta "Activa" e inició sesión
    And existe el plan "Plan Base" con las prestaciones:
      | prestación  | límite | periodicidad | habilitada desde (períodos pagos) |
      | Consulta    | 2      | mensual      | 1                                 |
      | Vacuna      |        | mensual      | 1                                 |
      | Radiografía | 1      | anual        | 6                                 |
    And la mascota "Luna" de "Carla Gómez" tiene cobertura con el plan "Plan Base" y 4 períodos pagos

  @flujo-principal @RF-PRE-02 @RN-01 @RN-03
  Scenario: Ver saldos y consumos del período en curso
    Given la cobertura de "Luna" está "Al día"
    And el "05/10/2026" la veterinaria "Patitas" registró una "Consulta" para "Luna"
    When "Carla Gómez" consulta las prestaciones de "Luna"
    Then ve:
      | prestación  | periodicidad | límite | consumidas | saldo     | estado                                         |
      | Consulta    | mensual      | 2      | 1          | 1         | Disponible                                     |
      | Vacuna      | mensual      |        | 0          | Ilimitada | Disponible                                     |
      | Radiografía | anual        | 1      | 0          | 1         | Se habilita con 6 períodos pagos (faltan 2)    |
    And ve el consumo del "05/10/2026": "Consulta" en "Patitas"

  @RN-02 @D35
  Scenario: Los consumos anulados no se muestran
    Given la cobertura de "Luna" está "Al día"
    And el "05/10/2026" se registró una "Consulta" para "Luna" que después el administrador anuló
    When "Carla Gómez" consulta las prestaciones de "Luna"
    Then el saldo de "Consulta" es 2
    And no ve el consumo del "05/10/2026"

  @FA-01
  Scenario: Cobertura suspendida
    Given la cobertura de "Luna" está "Suspendida por falta de pago"
    When "Carla Gómez" consulta las prestaciones de "Luna"
    Then ve las prestaciones del plan "Plan Base"
    And ve el aviso "Mientras la cobertura esté suspendida no se pueden usar las prestaciones."

  @FA-02
  Scenario: Mascota sin cobertura vigente
    Given "Luna" no tiene cobertura vigente
    When "Carla Gómez" consulta las prestaciones de "Luna"
    Then ve el mensaje "Luna no tiene una cobertura vigente."

  @RN-05 @D79
  Scenario: Solo se ven los consumos del período en curso
    Given la cobertura de "Luna" está "Al día"
    And en septiembre de 2026 "Luna" consumió 2 "Consulta"
    And el "05/10/2026" "Luna" consumió 1 "Consulta"
    When "Carla Gómez" consulta las prestaciones de "Luna"
    Then ve solo el consumo del "05/10/2026"
    And no tiene opción para consultar períodos anteriores

  @FA-03
  Scenario: Período sin consumos
    Given la cobertura de "Luna" está "Al día" y no tiene consumos en octubre de 2026
    When "Carla Gómez" consulta las prestaciones de "Luna"
    Then ve el mensaje "No hay consumos en este período."

  @EX-01 @RN-04 @RNF-SEG-03
  Scenario: No se pueden ver prestaciones de mascotas de otro dueño
    Given "Pedro Sosa" tiene la mascota "Rocco"
    When "Carla Gómez" intenta consultar las prestaciones de "Rocco"
    Then no ve ningún dato
    And el sistema informa "No tenés acceso a esta información."

  @EX-02
  Scenario: Cuenta desactivada con la sesión abierta
    Given el administrador dio de baja a "Carla Gómez" mientras tenía la sesión abierta
    When "Carla Gómez" consulta las prestaciones de "Luna"
    Then no se muestra ningún dato
    And el sistema informa "Tu cuenta está inactiva. Comunicate con WildSalud."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PRE-02 | Paso 3, RN-01 |
| RF-PLA-09 | RN-03 |
| RNF-SEG-03, RNF-SEG-07 | RN-04, EX-01 |
| D11, D12 | RN-03 |
| D30, D32 | RN-01 |
| D35, D40 | RN-02 |
| D53, D54 | RN-06 |
| D79 | Paso 4, RN-05 |
