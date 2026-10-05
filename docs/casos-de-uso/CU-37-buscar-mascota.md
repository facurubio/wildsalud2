# CU-37 — Buscar mascota

| Campo | Valor |
|-------|-------|
| **Actor principal** | Veterinario asociado (también el administrador que es veterinario, D145) |
| **Objetivo** | Identificar rápidamente a la mascota que está atendiendo, para abrir su ficha. |
| **Disparador** | Llega a la consulta una mascota que dice estar afiliada a WildSalud. |
| **Relaciones** | Es la pantalla de inicio del veterinario después de iniciar sesión (CU-02). Desde un resultado se abre CU-38 Consultar ficha y cobertura. |

## Precondiciones

1. El veterinario inició sesión y su cuenta está en estado **Activo** (CU-02).

## Flujo principal

1. El veterinario elige **Buscar mascota**, o llega a esta pantalla al iniciar sesión.
2. El sistema muestra un único campo de búsqueda.
3. El veterinario escribe el número de afiliado de la mascota, el DNI del dueño, el nombre de la mascota o el apellido del dueño.
4. El sistema valida la búsqueda (**RN-02**) y busca entre las mascotas **no dadas de baja** (**RN-01**).
5. El sistema muestra los resultados (**RN-03**), ordenados por nombre de la mascota y **paginados** de a 20 (**RN-04**).
6. El veterinario elige una mascota y el sistema abre su ficha (CU-38).

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 4 | El texto coincide exactamente con un número de afiliado. | El sistema abre directamente la ficha de esa mascota (CU-38). |
| **FA-02** | 4 | El texto coincide con un DNI de dueño. | El sistema muestra todas las mascotas no dadas de baja de ese dueño. |
| **FA-03** | 5 | Hay más de 20 resultados. | El sistema muestra la primera página con 20 resultados, el total encontrado y controles para ir a la página siguiente, a la anterior o a una página determinada. |

## Excepciones

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | La búsqueda por nombre o apellido tiene menos de 3 letras. | *"Podés buscar por nombre de la mascota, número de afiliado de la mascota, DNI del dueño o apellido del dueño. Para el nombre o el apellido, ingresá al menos 3 letras."* |
| **EX-02** | 5 | No hay resultados. | *"No se encontraron mascotas con esos datos."* |
| **EX-03** | 4 | La cuenta del veterinario fue desactivada mientras tenía la sesión abierta. | *"Tu cuenta está inactiva. Comunicate con el administrador."* |

## Postcondiciones

- **Éxito:** el veterinario ve la lista de mascotas que coinciden, o la ficha de la mascota si buscó por número de afiliado.
- **Fracaso:** no se muestra ningún dato de mascotas ni de dueños.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Qué mascotas se buscan.** Todas las mascotas de la red que no estén dadas de baja, tengan o no cobertura vigente. Las dadas de baja no aparecen. | RNF-BAJ-03, D73 |
| **RN-02** | **Criterios de búsqueda.** Nombre de la mascota, número de afiliado de la mascota, DNI del dueño y apellido del dueño. Número de afiliado y DNI: coincidencia exacta. Nombre y apellido: coincidencia parcial, sin distinguir mayúsculas ni acentos, con un mínimo de 3 letras. | RF-MAS-04, D69 |
| **RN-03** | **Qué muestra cada resultado.** Foto, nombre, especie y raza de la mascota, número de afiliado, nombre y apellido del dueño y estado de cobertura (*Al día*, *Suspendida por falta de pago* o *Sin cobertura vigente*). El DNI y el teléfono del dueño se ven solo en la ficha. | RF-ROL-08, RF-ROL-09, RNF-SEG-01, D70 |
| **RN-04** | **Paginación y mínimo de letras.** Los resultados se muestran en páginas de 20, con el total encontrado. Las búsquedas por nombre o apellido requieren al menos 3 letras. | RNF-REN-01, RNF-SEG-04, D69 |
| **RN-05** | **Estado calculado en el momento.** El estado de cobertura de cada resultado se calcula con la fecha y hora de la búsqueda. | D54 |
| **RN-06** | **Rendimiento.** La búsqueda responde en menos de 2 segundos en condiciones normales de uso. | RNF-REN-01, RNF-REN-02 |
| **RN-07** | **Permisos en el sistema.** El sistema verifica que la cuenta sea de un veterinario activo en cada búsqueda, no solo al iniciar sesión. | RF-AUT-03, RNF-SEG-07 |

## Escenarios de aceptación

```gherkin
@CU-37
Feature: CU-37 Buscar mascota
  Como veterinario asociado
  Quiero encontrar rápidamente a la mascota que estoy atendiendo
  Para abrir su ficha y ver su cobertura

  Background:
    Given el veterinario "Ana López" de la veterinaria "Patitas" tiene la cuenta en estado "Activo" e inició sesión
    And existen las mascotas:
      | mascota | afiliado | especie | dueño         | DNI dueño | estado de la mascota | cobertura                    |
      | Luna    | 000123   | Perro   | Carla Gómez   | 30111222  | Activa               | Al día                       |
      | Toby    | 000124   | Gato    | Carla Gómez   | 30111222  | Activa               | Suspendida por falta de pago |
      | Luna    | 000200   | Gato    | Pedro Sosa    | 28999888  | Activa               | Sin cobertura vigente        |
      | Milo    | 000150   | Perro   | Pedro Sosa    | 28999888  | Dada de baja         | Dada de baja                 |

  @FA-01 @RF-MAS-04
  Scenario: Buscar por número de afiliado abre la ficha directamente
    When el veterinario busca "000123"
    Then el sistema abre la ficha de "Luna" con número de afiliado "000123"

  @FA-02 @RF-MAS-04
  Scenario: Buscar por DNI muestra las mascotas del dueño
    When el veterinario busca "30111222"
    Then los resultados son "Luna" (000123) y "Toby" (000124)

  @flujo-principal @RN-02 @RN-03
  Scenario: Buscar por nombre de la mascota
    When el veterinario busca "luna"
    Then los resultados son:
      | mascota | afiliado | especie | dueño       | cobertura             |
      | Luna    | 000123   | Perro   | Carla Gómez | Al día                |
      | Luna    | 000200   | Gato    | Pedro Sosa  | Sin cobertura vigente |
    And ningún resultado muestra el DNI ni el teléfono del dueño

  @RN-02
  Scenario Outline: Búsqueda parcial sin distinguir mayúsculas ni acentos
    When el veterinario busca "<texto>"
    Then los resultados incluyen a "<mascota>"

    Examples:
      | texto | mascota |
      | GOME  | Toby    |
      | gómez | Luna    |
      | tob   | Toby    |

  @RN-01 @RNF-BAJ-03
  Scenario: Las mascotas dadas de baja no aparecen
    When el veterinario busca "28999888"
    Then los resultados son solo "Luna" (000200)
    And "Milo" no aparece en los resultados

  @EX-01 @RN-02 @RN-04
  Scenario: Una búsqueda parcial necesita al menos 3 letras
    When el veterinario busca "lu"
    Then no se muestra ningún resultado
    And el sistema informa "Podés buscar por nombre de la mascota, número de afiliado de la mascota, DNI del dueño o apellido del dueño. Para el nombre o el apellido, ingresá al menos 3 letras."

  @EX-02
  Scenario: Sin resultados
    When el veterinario busca "Firulais"
    Then el sistema informa "No se encontraron mascotas con esos datos."

  @FA-03 @RN-04 @D69
  Scenario: Los resultados se paginan de a 20
    Given existen 45 mascotas no dadas de baja cuyo nombre contiene "max"
    When el veterinario busca "max"
    Then el sistema muestra la página 1 de 3 con 20 resultados y el total "45 mascotas encontradas"
    And puede ir a la página siguiente

  @FA-03 @RN-04
  Scenario: Navegar a la última página
    Given existen 45 mascotas no dadas de baja cuyo nombre contiene "max"
    And el veterinario buscó "max"
    When el veterinario va a la página 3
    Then el sistema muestra 5 resultados
    And no puede ir a una página siguiente

  @RN-05 @D54
  Scenario: El estado de cobertura se calcula en el momento de la búsqueda
    Given la cuota de octubre 2026 de "Luna" (000123) está impaga
    And la fecha y hora actual es "14/10/2026 00:05"
    And el proceso de suspensión todavía no se ejecutó
    When el veterinario busca "000123"
    Then la ficha de "Luna" muestra la cobertura "Suspendida por falta de pago"

  @EX-03 @RN-07 @RNF-SEG-07
  Scenario: Cuenta desactivada con la sesión abierta
    Given el administrador desactivó la cuenta de "Ana López" mientras tenía la sesión abierta
    When "Ana López" busca "000123"
    Then no se muestra ningún resultado
    And el sistema informa "Tu cuenta está inactiva. Comunicate con el administrador."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-MAS-04 | RN-02, FA-01, FA-02 |
| RF-ROL-08, RF-ROL-09 | RN-03 |
| RF-AUT-03, RNF-SEG-07 | RN-07, EX-03 |
| RNF-BAJ-03, D73 | RN-01 |
| RNF-REN-01, RNF-REN-02 | RN-04, RN-06 |
| RNF-SEG-01 | RN-03 |
| RNF-SEG-04 | RN-04 |
| D69 | RN-02, RN-04, FA-03, EX-01 |
| D70 | RN-03 |
| D54 | RN-05 |
| D109 | Relaciones, paso 1 (pantalla de inicio del veterinario) |
