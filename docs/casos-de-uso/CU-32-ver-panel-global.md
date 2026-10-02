# CU-32 — Ver panel global

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Ver de un vistazo las coberturas que requieren atención por pagos: cuotas del mes por vencer, coberturas suspendidas y bajas por deuda próximas. |
| **Disparador** | El administrador inicia sesión. Es su pantalla de inicio (D109). |
| **Relaciones** | Desde cada elemento se abre la ficha de la mascota y desde ahí CU-26 Registrar pago. Para otras búsquedas se usa CU-33. |

## Precondiciones

1. El administrador inició sesión (CU-02).

## Flujo principal

1. El administrador ingresa al **Panel**, o llega a él al iniciar sesión.
2. El sistema calcula las listas con la situación de ese momento (**RN-01**).
3. El sistema muestra tres listas (**RN-02**):
   - **Cuotas del mes por vencer:** mascotas con la cuota del mes impaga, del día 1 al 13. De cada una: mascota, número de afiliado, dueño, teléfono, importe y fecha de vencimiento.
   - **Coberturas suspendidas:** mascotas con la cobertura suspendida por falta de pago. De cada una: mascota, número de afiliado, dueño, teléfono, cuotas adeudadas e importe para reactivarla.
   - **Bajas por deuda en los próximos 30 días:** coberturas suspendidas cuyo plazo de baja vence dentro de 30 días. De cada una: mascota, número de afiliado, dueño, teléfono, fecha de baja e importe adeudado.
4. Cada lista muestra la cantidad de elementos y los ordena por urgencia: la fecha más próxima primero.
5. El administrador elige un elemento y el sistema abre la ficha de la mascota, desde donde puede registrar el pago (CU-26).

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | Una lista está vacía. | Se muestra *"No hay casos para atender."* en esa lista. |
| **FA-02** | 3 | Es día 14 o posterior. | La lista de cuotas del mes por vencer queda vacía, porque las impagas ya están en la lista de suspendidas. |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 1 | Un usuario que no es administrador intenta ver el panel. | *"No tenés permiso para hacer esta operación."* |

## Postcondiciones

- **Éxito:** el administrador ve las tres listas actualizadas al momento de la consulta.
- **Fracaso:** no se muestra ningún dato.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Calculado en el momento.** Las listas se calculan con la fecha y hora de la consulta (hora de Argentina), aunque los procesos automáticos no se hayan ejecutado. | D53, D54 |
| **RN-02** | **Contenido del panel.** Solo tres listas: cuotas del mes por vencer (del 1 al 13, impagas), coberturas suspendidas por falta de pago y bajas por deuda en los próximos 30 días. Una misma mascota puede aparecer en las dos últimas. | D142 |
| **RN-03** | **Importes.** El importe para reactivar es la suma de los períodos adeudados más el mes en curso, cada uno al precio de su mes. | D4, D6 |
| **RN-04** | **Plazo de baja.** La fecha de baja es la de D8: tres meses completos desde la suspensión. | D8 |
| **RN-05** | **Solo el administrador.** El panel muestra datos de dueños y pagos de toda la red. | RNF-SEG-02, RNF-SEG-07, D110 |
| **RN-06** | **Rendimiento.** El panel se muestra en menos de 2 segundos en condiciones normales, con el volumen esperado (500 a 600 dueños). | RNF-REN-02, RNF-ESC-01 |

## Escenarios de aceptación

```gherkin
@CU-32
Feature: CU-32 Ver panel global
  Como administrador
  Quiero ver las coberturas que requieren atención por pagos
  Para cobrar a tiempo y evitar suspensiones y bajas

  Background:
    Given la fecha y hora actual es "10/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And existe el plan "Plan Base" con precio mensual 10000
    And existen las mascotas:
      | mascota | dueño       | cobertura                    | suspendida desde | cuota de octubre 2026 | períodos adeudados |
      | Luna    | Carla Gómez | Al día                       |                  | Pagada                |                    |
      | Toby    | Carla Gómez | Al día                       |                  | Impaga                |                    |
      | Rocco   | Pedro Sosa  | Suspendida por falta de pago | 14/07/2026       | Impaga                | 2026-07 a 2026-09  |
      | Milo    | Laura Paz   | Suspendida por falta de pago | 14/09/2026       | Impaga                | 2026-09            |

  @flujo-principal @RN-02 @D109 @D142
  Scenario: Ver las tres listas al iniciar sesión
    When el administrador inicia sesión
    Then la lista "Cuotas del mes por vencer" muestra a "Toby" con importe 10000 y vencimiento "13/10/2026"
    And la lista "Coberturas suspendidas" muestra a "Rocco" y a "Milo"
    And la lista "Bajas por deuda en los próximos 30 días" muestra a "Rocco" con fecha de baja "14/10/2026"
    And "Luna" no aparece en ninguna lista

  @RN-03 @D4 @D6
  Scenario: Las suspendidas muestran lo que hay que pagar para reactivarlas
    When el administrador ve el panel
    Then "Rocco" figura en "Coberturas suspendidas" con 3 cuotas adeudadas e importe para reactivar 40000
    And "Milo" figura con 1 cuota adeudada e importe para reactivar 20000

  @RN-04 @D8
  Scenario Outline: Bajas por deuda dentro de los próximos 30 días
    Given la fecha y hora actual es "<momento>"
    When el administrador ve el panel
    Then la lista "Bajas por deuda en los próximos 30 días" <resultado>

    Examples:
      | momento          | resultado                                         |
      | 10/10/2026 10:00 | muestra a "Rocco" y no a "Milo"                   |
      | 15/11/2026 10:00 | muestra a "Milo" con fecha de baja "14/12/2026"   |

  @FA-02 @D17
  Scenario Outline: Las cuotas por vencer se muestran del 1 al 13
    Given la fecha y hora actual es "<momento>"
    When el administrador ve el panel
    Then la lista "Cuotas del mes por vencer" <resultado>

    Examples:
      | momento          | resultado                                          |
      | 13/10/2026 23:59 | muestra a "Toby"                                   |
      | 14/10/2026 00:00 | está vacía y muestra "No hay casos para atender."  |

  @RN-01 @D54
  Scenario: Las listas no dependen de los procesos automáticos
    Given la fecha y hora actual es "14/10/2026 00:30"
    And el proceso de suspensión todavía no se ejecutó
    When el administrador ve el panel
    Then "Toby" figura en la lista "Coberturas suspendidas"

  @flujo-principal
  Scenario: Desde la lista se llega a registrar el pago
    When el administrador elige a "Toby" en la lista "Cuotas del mes por vencer"
    Then se abre la ficha de "Toby" con la opción "Registrar pago"

  @FA-01
  Scenario: Lista vacía
    Given ninguna cobertura está suspendida
    When el administrador ve el panel
    Then la lista "Coberturas suspendidas" muestra "No hay casos para atender."

  @EX-01 @RN-05 @D110
  Scenario: Solo el administrador ve el panel
    Given el veterinario "Ana López" inició sesión
    When "Ana López" intenta abrir el panel global
    Then no ve ningún dato
    And el sistema informa "No tenés permiso para hacer esta operación."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RNF-REN-02, RNF-ESC-01 | RN-06 |
| RNF-SEG-02, RNF-SEG-07, D110 | RN-05, EX-01 |
| D4, D6 | RN-03 |
| D8 | RN-04 |
| D17 | FA-02 |
| D53, D54 | RN-01 |
| D109 | Disparador |
| D142 | Paso 3, RN-02 |
