# CU-40 — Consultar mis mascotas y su cobertura

| Campo | Valor |
|-------|-------|
| **Actor principal** | Dueño afiliado |
| **Objetivo** | Ver todas sus mascotas afiliadas, el plan de cada una y el estado de su cobertura, y las mascotas dadas de baja con su deuda pendiente. |
| **Disparador** | El dueño ingresa a la aplicación. Es su pantalla de inicio (D109). |
| **Relaciones** | Desde cada mascota se abre CU-41 Consultar prestaciones disponibles/consumidas. Las alertas se muestran según CU-43 Ver alertas. |

## Precondiciones

1. El dueño inició sesión y su cuenta está en estado **Activo** (CU-02).

## Flujo principal

1. El dueño abre **Mis mascotas**.
2. El sistema muestra las alertas activas del dueño (CU-43).
3. El sistema muestra cada mascota **no dada de baja** del dueño con:
   - foto, nombre y número de afiliado;
   - plan vigente y estado de cobertura (*Al día*, *Suspendida por falta de pago* o *Sin cobertura vigente*);
   - **cuota del mes**: *Pagada* o *Pendiente, vence el 13/{mes}*;
   - **cambio pendiente**, si lo hay: *"Desde el {fecha} pasa al plan {plan}"* o *"La cobertura se da de baja el {fecha}"*.
4. El sistema muestra una sección **Mascotas dadas de baja** con cada mascota del dueño dada de baja: foto, nombre, número de afiliado, fecha de baja y, si tiene deuda congelada, *"Deuda pendiente: {N} cuotas, {importe}."* (**RN-08**).
5. El dueño puede elegir una mascota no dada de baja para ver sus prestaciones (CU-41).

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | La cobertura de una mascota está suspendida. | Se muestra el estado *Suspendida por falta de pago* con la cantidad de cuotas adeudadas y el importe total a pagar para reactivarla (todas las adeudadas más el mes en curso). |
| **FA-02** | 3 | Una mascota no tiene cobertura vigente pero tiene deuda congelada. | Se muestra *Sin cobertura vigente* y *"Deuda de la cobertura anterior: {N} cuotas, {importe}."* |
| **FA-03** | 3 | El dueño no tiene mascotas no dadas de baja. | Se muestra *"No tenés mascotas afiliadas."* Si tiene mascotas dadas de baja, igual se muestra esa sección. |
| **FA-04** | 4 | El dueño no tiene mascotas dadas de baja. | No se muestra la sección *Mascotas dadas de baja*. |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 1 | El dueño intenta ver una mascota que no es suya (por ejemplo, cambiando la dirección de la página). | *"No tenés permiso para hacer esta operación."* No se muestra ningún dato. |
| **EX-02** | 1 | La cuenta del dueño fue desactivada mientras tenía la sesión abierta. | *"Tu cuenta está inactiva. Comunicate con WildSalud."* |

## Postcondiciones

- **Éxito:** el dueño ve todas sus mascotas no dadas de baja con su plan, su estado de cobertura y su situación de pago, y sus mascotas dadas de baja con la deuda que tengan pendiente.
- **Fracaso:** no se muestra ningún dato.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo lo propio.** El dueño ve únicamente sus mascotas y nunca datos de otros dueños. El sistema lo verifica en cada consulta. | RF-ROL-04, RNF-SEG-01, RNF-SEG-03, RNF-SEG-07 |
| **RN-02** | **Mascotas visibles.** Todas las mascotas del dueño que no estén dadas de baja, tengan o no cobertura vigente. Las dadas de baja se muestran aparte (RN-08). | RF-ROL-04, RNF-BAJ-03 |
| **RN-03** | **Estado por mascota.** Cada mascota muestra su propio estado de cobertura, independiente del de las otras. | RF-PAG-02 |
| **RN-04** | **Importe para reactivar.** Es la suma de los períodos adeudados más el mes en curso, cada uno al precio de su mes. | D4, D6 |
| **RN-05** | **Datos calculados en el momento.** Estado, plan vigente y cuotas se calculan con la fecha y hora de la consulta (hora de Argentina). | D53, D54 |
| **RN-06** | **Uso desde el celular.** La pantalla se adapta a celulares. | RNF-CMP-01 |
| **RN-07** | **Qué ve de cada mascota.** Plan, estado de cobertura, cuota del mes, lo que debe y los cambios pendientes. No ve el historial de pagos. | D74 |
| **RN-08** | **Mascotas dadas de baja.** Se listan en una sección aparte, solo para consulta (no se abren sus prestaciones), con la fecha de baja y la deuda congelada pendiente, si la hay. Esa deuda impide asignar planes a cualquiera de las mascotas del dueño hasta que se pague. | D115, D55, D27, RNF-BAJ-03 |

## Escenarios de aceptación

```gherkin
@CU-40
Feature: CU-40 Consultar mis mascotas y su cobertura
  Como dueño afiliado
  Quiero ver mis mascotas y el estado de su cobertura
  Para saber si están cubiertas y si tengo algo pendiente

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And la dueña "Carla Gómez" tiene la cuenta en estado "Activo" e inició sesión
    And existe el plan "Plan Base" con precio mensual 10000

  @flujo-principal @RF-ROL-04 @RF-PAG-02
  Scenario: Ver todas mis mascotas con su cobertura
    Given "Carla Gómez" tiene las mascotas:
      | mascota | afiliado | plan      | cobertura                    | cuota de octubre 2026 |
      | Luna    | 000123   | Plan Base | Al día                       | Pagada                |
      | Toby    | 000124   | Plan Base | Suspendida por falta de pago | Impaga                |
    When "Carla Gómez" abre "Mis mascotas"
    Then ve a "Luna" con el plan "Plan Base", cobertura "Al día" y cuota del mes "Pagada"
    And ve a "Toby" con el plan "Plan Base" y cobertura "Suspendida por falta de pago"

  @flujo-principal @D17
  Scenario: Cuota del mes pendiente dentro del plazo
    Given la fecha y hora actual es "05/10/2026 10:00"
    And "Luna" tiene cobertura "Al día" con la cuota de octubre 2026 impaga
    When "Carla Gómez" abre "Mis mascotas"
    Then ve a "Luna" con cobertura "Al día" y cuota del mes "Pendiente, vence el 13/10"

  @FA-01 @RN-04 @D4 @D6
  Scenario: Mascota suspendida muestra lo que hay que pagar para reactivarla
    Given la fecha y hora actual es "05/11/2026 10:00"
    And "Toby" tiene cobertura "Suspendida por falta de pago" con los períodos "2026-09" y "2026-10" impagos
    And el precio de "Plan Base" es 12000 desde el 01/11/2026
    When "Carla Gómez" abre "Mis mascotas"
    Then ve a "Toby" con 2 cuotas adeudadas y un importe para reactivar de 32000

  @FA-02 @D27
  Scenario: Mascota sin cobertura con deuda congelada
    Given "Toby" no tiene cobertura vigente y quedó con los períodos "2026-07" y "2026-08" congelados
    When "Carla Gómez" abre "Mis mascotas"
    Then ve a "Toby" con "Sin cobertura vigente" y "Deuda de la cobertura anterior: 2 cuotas, 20000."

  @flujo-principal @D20
  Scenario Outline: Cambios pendientes
    Given "Luna" tiene cobertura "Al día" y tiene pendiente <pendiente> con vigencia "01/11/2026"
    When "Carla Gómez" abre "Mis mascotas"
    Then ve en "Luna" el aviso "<aviso>"

    Examples:
      | pendiente                     | aviso                                   |
      | un cambio al plan "Plan Plus" | Desde el 01/11/2026 pasa al plan Plan Plus |
      | una baja programada           | La cobertura se da de baja el 01/11/2026   |

  @RN-02 @RN-08 @D115
  Scenario: Las mascotas dadas de baja se muestran en una sección aparte
    Given "Carla Gómez" tiene a "Luna" activa y a "Milo" dada de baja el "10/09/2026" sin deuda
    When "Carla Gómez" abre "Mis mascotas"
    Then ve a "Luna" entre sus mascotas
    And ve a "Milo" en la sección "Mascotas dadas de baja" con fecha de baja "10/09/2026" y sin deuda

  @RN-08 @D115 @D27
  Scenario: Una mascota dada de baja con deuda muestra lo que se debe
    Given "Milo" de "Carla Gómez" se dio de baja el "20/08/2026" con los períodos "2026-06" y "2026-07" congelados
    When "Carla Gómez" abre "Mis mascotas"
    Then ve a "Milo" en la sección "Mascotas dadas de baja" con "Deuda pendiente: 2 cuotas, 20000."

  @FA-04
  Scenario: Sin mascotas dadas de baja no se muestra la sección
    Given "Carla Gómez" no tiene mascotas dadas de baja
    When "Carla Gómez" abre "Mis mascotas"
    Then no ve la sección "Mascotas dadas de baja"

  @FA-03
  Scenario: Dueño sin mascotas afiliadas
    Given "Carla Gómez" no tiene mascotas no dadas de baja
    When "Carla Gómez" abre "Mis mascotas"
    Then ve el mensaje "No tenés mascotas afiliadas."

  @EX-01 @RN-01 @RNF-SEG-03 @RNF-SEG-07
  Scenario: No se pueden ver mascotas de otro dueño
    Given "Pedro Sosa" tiene la mascota "Rocco" con número de afiliado "000300"
    When "Carla Gómez" intenta abrir directamente la mascota "000300"
    Then no ve ningún dato de "Rocco" ni de "Pedro Sosa"
    And el sistema informa "No tenés permiso para hacer esta operación."

  @EX-02
  Scenario: Cuenta desactivada con la sesión abierta
    Given el administrador dio de baja a "Carla Gómez" mientras tenía la sesión abierta
    When "Carla Gómez" abre "Mis mascotas"
    Then no se muestra ningún dato
    And el sistema informa "Tu cuenta está inactiva. Comunicate con WildSalud."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-ROL-04 | RN-01, RN-02 |
| RF-PAG-02 | RN-03 |
| RNF-BAJ-03 | RN-02 |
| RNF-CMP-01 | RN-06 |
| RNF-SEG-01, RNF-SEG-03, RNF-SEG-07 | RN-01, EX-01 |
| D4, D6 | RN-04, FA-01 |
| D17 | Paso 3 |
| D20 | Paso 3 (cambio pendiente) |
| D27 | FA-02 |
| D53, D54 | RN-05 |
| D74 | Paso 3, RN-07, FA-01, FA-02 |
| D110 | EX-01 (mensaje de permiso) |
| D109 | Disparador (pantalla de inicio del dueño) |
| D115, D55 | Paso 4, RN-08, FA-04 |
