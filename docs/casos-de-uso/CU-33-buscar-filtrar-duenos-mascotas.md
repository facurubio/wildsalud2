# CU-33 — Buscar/filtrar dueños y mascotas

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Encontrar dueños y mascotas por sus datos o por su estado, para gestionarlos. |
| **Disparador** | El administrador necesita ubicar a un dueño o una mascota, o ver todas las que están en cierta situación (por ejemplo, las suspendidas). |
| **Relaciones** | Se llega desde CU-32 Ver panel global con un filtro aplicado. Desde un resultado se abren la ficha de la mascota o del dueño, y desde ahí los casos de gestión (CU-09, CU-14, CU-26, CU-34, CU-35, etc.). |

## Precondiciones

1. El administrador inició sesión (CU-02).

## Flujo principal

1. El administrador elige **Dueños y mascotas**.
2. El sistema muestra un campo de búsqueda y los filtros (**RN-02**).
3. El administrador escribe un texto, elige filtros o ambas cosas.
4. El sistema busca según **RN-01** y **RN-02**.
5. El sistema muestra los resultados agrupados por dueño: de cada dueño, nombre, apellido, DNI, estado de la cuenta; y de cada una de sus mascotas, nombre, número de afiliado, plan y estado de cobertura. Los resultados se paginan de a 20, con el total encontrado.
6. El administrador elige un dueño o una mascota y el sistema abre su ficha.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | El administrador no escribe texto y solo elige filtros. | Se listan todos los que cumplen los filtros. |
| **FA-02** | 3 | El administrador no escribe texto ni elige filtros. | Se listan todos los dueños y mascotas no dados de baja. |
| **FA-03** | 2 | Se llegó desde un indicador del panel (CU-32). | La búsqueda se abre con ese filtro aplicado. |
| **FA-04** | 3 | El administrador marca **Incluir dados de baja**. | También aparecen dueños y mascotas dados de baja, marcados como tales. |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | El texto de búsqueda por nombre, apellido o email tiene menos de 3 letras. | *"Podés buscar por nombre o número de afiliado de la mascota, o por DNI, apellido o email del dueño. Para nombres, apellidos o emails, ingresá al menos 3 letras."* |
| **EX-02** | 5 | No hay resultados. | *"No se encontraron dueños ni mascotas con esos datos."* |
| **EX-03** | 1 | Un usuario que no es administrador intenta usar esta búsqueda. | *"No tenés permiso para hacer esta operación."* |

## Postcondiciones

- **Éxito:** el administrador ve los dueños y mascotas que cumplen la búsqueda y los filtros.
- **Fracaso:** no se muestra ningún resultado.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Texto de búsqueda.** Número de afiliado y DNI: coincidencia exacta. Nombre de la mascota, apellido del dueño y email del dueño: coincidencia parcial sin distinguir mayúsculas ni acentos, con un mínimo de 3 letras. | RF-MAS-04, D69, D140 |
| **RN-02** | **Filtros.** Estado de cobertura de la mascota (*Al día*, *Suspendida por falta de pago*, *Sin cobertura vigente*, *Dada de baja*), deuda (con deuda / sin deuda), plan, y estado de la cuenta del dueño (*Invitado*, *Activo*, *Inactivo*). Los filtros se combinan entre sí. | RF-PAG-14, D16, D38, D47, D140 |
| **RN-03** | **Dados de baja.** Por defecto no aparecen; el administrador los puede incluir para consultar el historial. | RNF-BAJ-03 |
| **RN-04** | **Paginación.** De a 20 resultados, con el total encontrado. | D69 |
| **RN-05** | **Calculado en el momento.** El estado de cobertura y la deuda se calculan con la fecha y hora de la búsqueda. | D53, D54 |
| **RN-06** | **Solo el administrador.** Esta búsqueda muestra datos personales de todos los dueños. | RNF-SEG-01, RNF-SEG-07, D110 |
| **RN-07** | **Rendimiento.** Responde en menos de 2 segundos en condiciones normales. | RNF-REN-02 |

## Escenarios de aceptación

```gherkin
@CU-33
Feature: CU-33 Buscar/filtrar dueños y mascotas
  Como administrador
  Quiero encontrar dueños y mascotas por sus datos o su estado
  Para gestionarlos

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00"
    And el administrador "Marta Ruiz" inició sesión
    And existen:
      | dueño       | DNI      | cuenta   | mascota | afiliado | plan      | cobertura                    | deuda |
      | Carla Gómez | 30111222 | Activo   | Luna    | 000123   | Plan Base | Al día                       | no    |
      | Carla Gómez | 30111222 | Activo   | Toby    | 000124   | Plan Base | Suspendida por falta de pago | sí    |
      | Pedro Sosa  | 28999888 | Invitado | Rocco   | 000200   | Plan Plus | Al día                       | no    |
      | Laura Paz   | 25444555 | Inactivo | Milo    | 000150   |           | Dada de baja                 | sí    |

  @flujo-principal @RN-01 @RF-MAS-04
  Scenario Outline: Buscar por los datos del dueño o de la mascota
    When el administrador busca "<texto>"
    Then los resultados incluyen a "<esperado>"

    Examples:
      | texto          | esperado          |
      | 000124         | Toby              |
      | 28999888       | Pedro Sosa        |
      | gomez          | Carla Gómez       |
      | carla.gomez@   | Carla Gómez       |
      | roc            | Rocco             |

  @FA-01 @RN-02
  Scenario Outline: Filtrar por estado
    When el administrador filtra por <filtro>
    Then los resultados son <resultado>

    Examples:
      | filtro                                           | resultado          |
      | cobertura "Suspendida por falta de pago"         | "Toby"             |
      | "con deuda"                                      | "Toby"             |
      | plan "Plan Plus"                                 | "Rocco"            |
      | cuenta del dueño "Invitado"                      | "Pedro Sosa"       |

  @RN-02
  Scenario: Los filtros se combinan
    When el administrador filtra por plan "Plan Base" y cobertura "Al día"
    Then los resultados son "Luna"

  @RN-03 @FA-04 @RNF-BAJ-03
  Scenario: Los dados de baja aparecen solo si se piden
    When el administrador busca "Milo"
    Then el sistema informa "No se encontraron dueños ni mascotas con esos datos."

  @FA-04 @RNF-BAJ-03
  Scenario: Incluir dados de baja
    When el administrador busca "Milo" incluyendo dados de baja
    Then los resultados incluyen a "Milo" marcado como "Dada de baja"

  @FA-02 @RN-04
  Scenario: Sin texto ni filtros se listan todos, paginados
    Given existen 45 mascotas no dadas de baja
    When el administrador abre "Dueños y mascotas" sin texto ni filtros
    Then ve la página 1 de 3 con el total "45 mascotas encontradas"

  @FA-03
  Scenario: Llegar desde el panel con un filtro aplicado
    When el administrador elige el indicador "Mascotas suspendidas por falta de pago" en el panel
    Then la búsqueda se abre con el filtro de cobertura "Suspendida por falta de pago"

  @EX-01
  Scenario: Una búsqueda por texto necesita al menos 3 letras
    When el administrador busca "go"
    Then el sistema informa "Podés buscar por nombre o número de afiliado de la mascota, o por DNI, apellido o email del dueño. Para nombres, apellidos o emails, ingresá al menos 3 letras."

  @EX-02
  Scenario: Sin resultados
    When el administrador busca "Firulais"
    Then el sistema informa "No se encontraron dueños ni mascotas con esos datos."

  @EX-03 @RN-06 @D110
  Scenario: Solo el administrador usa esta búsqueda
    Given el veterinario "Ana López" inició sesión
    When "Ana López" intenta filtrar dueños por estado de cuenta sin usar la pantalla
    Then no ve ningún resultado
    And el sistema informa "No tenés permiso para hacer esta operación."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-MAS-04, D69 | RN-01, RN-04 |
| RF-PAG-14, D16, D38, D47 | RN-02 |
| RNF-BAJ-03 | RN-03, FA-04 |
| RNF-REN-02 | RN-07 |
| RNF-SEG-01, RNF-SEG-07, D110 | RN-06, EX-03 |
| D53, D54 | RN-05 |
| D140 | RN-01, RN-02 |
