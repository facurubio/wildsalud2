# CU-13 — Dar de alta mascota

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Registrar una mascota nueva con su ficha, asociarla a su dueño, generarle el número de afiliado y dejarla con cobertura activa desde el primer momento. |
| **Disparador** | Un dueño afiliado quiere sumar una mascota a WildSalud. |
| **Relaciones** | Incluye CU-22 Asignar plan a una mascota (`«include»`): el alta siempre crea la cobertura junto con el primer pago. Se inicia desde la ficha de un dueño, que se ubica con CU-33 Buscar/filtrar dueños y mascotas, o al terminar CU-08 Dar de alta dueño (FA-03 de ese caso); un dueño dado de baja se reactiva antes con CU-11. La deuda que impide el alta se paga en CU-26 Registrar pago. La ficha y el dueño se modifican en CU-14 y la mascota se da de baja en CU-15. Una mascota dada de baja no se vuelve a dar de alta: se reactiva con CU-51 Reactivar mascota, que conserva su número de afiliado. La mascota nueva aparece en CU-37, CU-38 y CU-40, y el alta queda en CU-36. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. El dueño está registrado (CU-08).

## Flujo principal

1. El administrador abre la ficha de un dueño y elige **Dar de alta mascota** (o lo elige al terminar el alta del dueño, CU-08).
2. El sistema verifica que el dueño no esté dado de baja (**RN-02**) y que no tenga deuda de ninguna de sus mascotas (**RN-03**).
3. El sistema muestra el formulario de la ficha, con el dueño ya asociado y los datos obligatorios marcados (**RN-04**). El número de afiliado no se muestra: lo genera el sistema al confirmar.
4. El administrador completa la ficha y elige **Continuar**.
5. El sistema valida los datos de la ficha (**RN-04** y **RN-05**) y controla si el dueño ya tiene otra mascota con el mismo nombre y la misma especie (**RN-08**).
6. **`«include»` CU-22 Asignar plan a una mascota, pasos 2 a 4:** el sistema muestra los planes activos, cada uno con su precio para el mes en curso; el administrador elige uno; el sistema propone el primer pago: período (mes en curso), importe, forma de pago preferida del dueño y fecha de hoy.
7. El sistema muestra, junto con el primer pago, un resumen de la ficha y del dueño. El administrador confirma o cambia la forma y la fecha de pago, y confirma (CU-22, paso 5). Esa **única confirmación** vale para la mascota, la cobertura y el pago.
8. El sistema vuelve a validar **RN-01** a **RN-03** y valida las reglas de CU-22 (paso 6), en el momento de la confirmación.
9. En una sola operación (**RN-07**), el sistema genera el número de afiliado (**RN-06**), registra la mascota asociada al dueño y crea la cobertura *Al día* con el pago del mes en curso (CU-22, paso 7).
10. El sistema deja el registro de auditoría del alta de la mascota, de la cobertura y del pago (**RN-10**).
11. El sistema confirma: *"Se dio de alta a {mascota} con el número de afiliado {número} y el plan {plan}."* y muestra la ficha con la cobertura *Al día* y 1 período pago.

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 a 7 | El administrador cancela, en la ficha o en la asignación del plan (CU-22 FA-02). | No se registra la mascota, ni la cobertura, ni el pago, y no se genera ningún número de afiliado (**RN-07**). |
| **FA-02** | 5 | El dueño ya tiene una mascota con el mismo nombre y la misma especie (**RN-08**). | Si esa mascota no está dada de baja, el sistema avisa *"{dueño} ya tiene una mascota llamada {nombre} ({especie}, número de afiliado {número}). ¿Querés darla de alta igual?"*. Si está dada de baja por un motivo distinto de *Fallecimiento*, avisa *"{dueño} tiene dada de baja una mascota llamada {nombre} ({especie}, número de afiliado {número}). Si es la misma, reactivala desde su ficha en lugar de darla de alta. ¿Querés darla de alta igual?"* (D120). Si está dada de baja por *Fallecimiento*, no hay aviso, porque no se puede reactivar (D116). Si el administrador acepta, el alta sigue en el paso 6; si no, vuelve a la ficha con los datos cargados. |
| **FA-03** | 7 | El administrador cambia la forma de pago propuesta (CU-22 FA-01). | Se registra la forma de pago elegida; la preferida del dueño no cambia. |

## Excepciones

En todas las excepciones **no se registra la mascota, ni la cobertura, ni el pago, y no se genera ningún número de afiliado**; el sistema informa el motivo. Salvo en EX-01, EX-02 y EX-11, los datos cargados se conservan en pantalla para corregirlos. Aunque el paso 2 ya controla al dueño y el paso 6 muestra solo planes activos, el sistema vuelve a validar al confirmar (RNF-SEG-07), porque la situación del dueño o del plan puede cambiar mientras se completa el alta.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 2 u 8 | El dueño está dado de baja, o lo dieron de baja mientras se completaba el alta. | *"{dueño} tiene la cuenta inactiva. Para darle de alta una mascota, primero reactivá su cuenta desde su ficha."* |
| **EX-02** | 2 u 8 | El dueño tiene deuda de cualquiera de sus mascotas, también de una dada de baja (**RN-03**). | *"{dueño} tiene deuda pendiente de {otra mascota}. No se puede asignar un plan hasta saldarla."* |
| **EX-03** | 5 | Falta un dato obligatorio de la ficha. | *"Completá el campo {campo}."* |
| **EX-04** | 5 | La edad aproximada no es un número entero entre 0 y 30. | *"Ingresá la edad aproximada en años: un número entero entre 0 y 30."* |
| **EX-05** | 5 | Un dato de texto supera su largo máximo. | *"El campo {campo} admite hasta {N} caracteres."* |
| **EX-06** | 5 | La foto no es JPG, PNG ni HEIC. | *"La foto tiene que ser JPG, PNG o HEIC."* |
| **EX-07** | 5 | La foto pesa más de 20 MB. | *"La foto no puede pesar más de 20 MB."* |
| **EX-08** | 8 | El plan elegido se desactivó entre que se mostró la lista y la confirmación (CU-22 EX-04). | *"El plan {plan} está inactivo y no se puede asignar."* |
| **EX-09** | 8 | La fecha de pago es posterior a hoy (CU-22 EX-05). | *"La fecha de pago no puede ser posterior a hoy."* |
| **EX-10** | 7 | La misma confirmación llega dos veces (doble clic o reintento de red). | Se registra **una sola** mascota, con **un solo** número de afiliado, una cobertura y un pago; el segundo envío devuelve el mismo resultado que el primero. |
| **EX-11** | 1 a 8 | Un usuario que no es administrador intenta dar de alta una mascota (por ejemplo, un veterinario que envía el pedido sin usar la pantalla). | *"No tenés permiso para hacer esta operación."* |

## Postcondiciones

- **Éxito:** la mascota queda registrada en estado *Activa*, asociada a su dueño y con un número de afiliado nuevo. Tiene una cobertura *Al día* con el plan elegido y 1 período pago, y el pago del mes en curso queda registrado. La mascota ya aparece para el veterinario (CU-37, CU-38) y para el dueño (CU-40), y el alta queda en el historial de auditoría (CU-36).
- **Fracaso:** no se registra la mascota, ni la cobertura, ni el pago, y no se genera ningún número de afiliado. Los intentos rechazados no quedan en el historial de auditoría.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo el administrador.** El alta de mascotas la hace únicamente el administrador. El sistema lo verifica en cada pedido, no solo ocultando la opción. | RF-DUE-03, RF-ROL-11, RNF-SEG-07, D33, D110 |
| **RN-02** | **Un único dueño, no dado de baja.** La mascota se asocia a un solo dueño, el de la ficha desde la que se inició el alta. El dueño no puede estar dado de baja; su cuenta puede estar *Invitado* (todavía no la vinculó) o *Activo*. Si después la mascota cambia de dueño, se lo cambia editándola en CU-14, sin darla de baja. | RF-MAS-02, RNF-BAJ-03, D47, D104, D119 |
| **RN-03** | **Sin deuda del dueño.** Si el dueño tiene cualquier período impago y vencido de alguna de sus mascotas (de una cobertura suspendida o deuda congelada, también de una mascota dada de baja), no se le puede dar de alta otra mascota. Es la misma regla que CU-22 RN-03, pero se valida al iniciar el alta y otra vez al confirmar. La cuota del mes en curso impaga hasta el día 13 inclusive todavía no es deuda. | RF-DUE-03, D17, D29, D38, D55, D64 |
| **RN-04** | **Datos de la ficha.** Obligatorios: nombre, especie, sexo, castrado/a y edad aproximada. Opcionales: foto, raza, color, enfermedades previas o crónicas y alimentación. Especie: texto libre (por ejemplo, *Perro*, *Gato* o *Conejo*). Sexo: *Macho* o *Hembra*. Castrado/a: *Sí*, *No* o *No se sabe*. Largo máximo: nombre, raza y color, 50 caracteres; especie, 30; alimentación, 500; enfermedades previas o crónicas, 1000. Foto: una sola, JPG, PNG o HEIC, de hasta 20 MB; el sistema la reduce automáticamente a un JPG de 1600 px en el lado mayor y guarda solo esa versión. | RF-MAS-01, D103, D114 |
| **RN-05** | **Edad aproximada.** Número entero de años entre 0 y 30 (0 = menos de un año). Se guarda tal como se cargó: el sistema no la actualiza con el paso del tiempo; si hace falta, la corrige el administrador en CU-14. | RF-MAS-01, D41, D103 |
| **RN-06** | **Número de afiliado.** Lo genera el sistema al confirmar el alta: seis dígitos correlativos con ceros a la izquierda. Es único, nunca se reutiliza (tampoco el de una mascota dada de baja), no se edita y la mascota lo conserva aunque tenga coberturas nuevas o se la reactive (CU-51). Es distinto del identificador interno de la mascota, que nunca se muestra. | RF-MAS-04, D23, D45, D102, D107 |
| **RN-07** | **Alta con plan y primer pago, todo o nada.** La mascota se registra en la misma operación que la cobertura y el pago de la cuota completa del mes en curso (CU-22). Si la cobertura o el pago no se pueden registrar, la mascota tampoco se registra. Se aplican las reglas RN-03 a RN-10 de CU-22; RN-01 y RN-02 de ese caso se cumplen siempre, porque la mascota es nueva. | RF-PLA-10, D2, D3, D10, D101 |
| **RN-08** | **Posible duplicado.** Si el dueño ya tiene una mascota con el mismo nombre y la misma especie (sin distinguir mayúsculas ni acentos), el sistema avisa y pide confirmar, pero no bloquea el alta. Si esa mascota está dada de baja, el aviso sugiere reactivarla con CU-51 (D120), salvo que la baja haya sido por *Fallecimiento*: esa mascota no se puede reactivar y no genera aviso. | D105, D107, D116, D120 |
| **RN-09** | **Sin duplicados por reintentos.** Cada confirmación se procesa una sola vez. Dos altas confirmadas al mismo tiempo reciben números de afiliado distintos. | RNF-INT-01, D23 |
| **RN-10** | **Auditoría.** Se registran el alta de la mascota (con los datos de la ficha), el alta de la cobertura y el pago, cada uno con usuario, fecha y hora. | RF-TRA-01, RNF-AUD-01 |
| **RN-11** | **Disponible al instante.** Desde la confirmación, la mascota aparece en la búsqueda del veterinario con su ficha completa y en "Mis mascotas" de su dueño. | RF-ROL-04, RF-ROL-07, D73 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Mascota | Datos de la ficha (RN-04), dueño, número de afiliado, estado *Activa*, fecha y hora de alta y administrador que la registró. |
| Foto | Si se cargó, solo la versión reducida: JPG de 1600 px en el lado mayor. El archivo original no se guarda. |
| Cobertura | Según CU-22: mascota, plan, fecha y hora de inicio, estado *Al día*. |
| Pago | Según CU-22: mascota, cobertura, período (`AAAA-MM` del mes en curso), fecha de pago, importe, forma de pago, administrador, estado *Válido*. |
| Auditoría | Alta de la mascota, alta de la cobertura y registro del pago, con usuario, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-13
Feature: CU-13 Dar de alta mascota
  Como administrador
  Quiero dar de alta una mascota con su plan y su primer pago
  Para que quede afiliada, identificada y con cobertura activa

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And existen los planes:
      | plan      | precio mensual | estado   |
      | Plan Base | 10000          | Activo   |
      | Plan Plus | 15000          | Activo   |
      | Plan Old  | 8000           | Inactivo |
    And la dueña "Carla Gómez", DNI "30111222", tiene la cuenta en estado "Activo" y forma de pago preferida "Transferencia bancaria"
    And "Carla Gómez" tiene las mascotas "Luna" (Perro, afiliado "000123") y "Toby" (Gato, afiliado "000124")
    And, salvo que el escenario indique otra cosa, "Luna" y "Toby" tienen cobertura "Al día" con el plan "Plan Base" y ninguna tiene deuda
    And el próximo número de afiliado disponible es "000125"
    And la ficha de ejemplo de la mascota nueva es:
      | dato                            | valor                 |
      | nombre                          | Mora                  |
      | especie                         | Gato                  |
      | raza                            | Siamés                |
      | sexo                            | Hembra                |
      | color                           | Crema                 |
      | castrado/a                      | Sí                    |
      | enfermedades previas o crónicas | Asma felina           |
      | alimentación                    | Balanceado para gatos |
      | edad aproximada                 | 2                     |
      | foto                            | mora.jpg (1 MB)       |

  @flujo-principal @RN-10 @RF-MAS-01 @RF-MAS-02 @RF-MAS-04 @RF-DUE-03 @RF-PLA-10 @RF-TRA-01 @RNF-AUD-01 @D2 @D3 @D23 @D101 @D102
  Scenario: Dar de alta una mascota con su plan y su primer pago
    When el administrador da de alta a "Mora" para "Carla Gómez" con la ficha de ejemplo, elige el plan "Plan Base" y confirma el primer pago con los valores propuestos
    Then "Mora" queda registrada con la ficha de ejemplo, estado "Activa", dueña "Carla Gómez" y número de afiliado "000125"
    And "Mora" tiene una cobertura "Al día" con el plan "Plan Base" y 1 período pago
    And se registra un pago de "Mora" por el período "2026-10" con importe 10000 y forma de pago "Transferencia bancaria"
    And la auditoría registra el alta de "Mora", de su cobertura y del pago, con usuario "Marta Ruiz" y fecha "20/10/2026 10:00"
    And el sistema informa "Se dio de alta a Mora con el número de afiliado 000125 y el plan Plan Base."

  @RN-11 @RF-ROL-04 @RF-ROL-07 @D73
  Scenario: La mascota nueva queda visible al instante para el veterinario y para el dueño
    When el administrador da de alta a "Mora" para "Carla Gómez" con la ficha de ejemplo y el plan "Plan Base", y confirma
    Then un veterinario que busca "000125" ve la ficha de "Mora" con los datos de la ficha de ejemplo
    And "Carla Gómez" ve a "Mora" en "Mis mascotas" con el plan "Plan Base" y cobertura "Al día"

  @RN-07 @RF-PLA-03 @D21
  Scenario: Solo se ofrecen los planes activos
    When el administrador completa para "Carla Gómez" la ficha de ejemplo y continúa
    Then el sistema ofrece los planes "Plan Base" a 10000 y "Plan Plus" a 15000
    And no ofrece el plan "Plan Old"

  @RN-07 @RF-MAS-03 @RF-PLA-02
  Scenario: Cada mascota del dueño puede tener un plan distinto
    When el administrador da de alta a "Mora" para "Carla Gómez" con la ficha de ejemplo y el plan "Plan Plus", y confirma
    Then "Mora" tiene una cobertura "Al día" con el plan "Plan Plus"
    And se registra un pago de "Mora" por el período "2026-10" con importe 15000
    And "Luna" y "Toby" siguen con el plan "Plan Base"

  @FA-01 @RN-07 @D3 @D101
  Scenario Outline: Cancelar el alta no deja nada registrado
    When el administrador empieza el alta de "Mora" para "Carla Gómez" y cancela en <momento>
    Then no existe ninguna mascota "Mora" de "Carla Gómez"
    And no se crea ninguna cobertura ni se registra ningún pago
    And el próximo número de afiliado disponible sigue siendo "000125"

    Examples:
      | momento                         |
      | la carga de la ficha            |
      | la elección del plan            |
      | la confirmación del primer pago |

  @FA-02 @RN-08 @D105
  Scenario Outline: Aviso de posible duplicado
    When el administrador completa para "Carla Gómez" la ficha de ejemplo con nombre "<nombre>" y especie "<especie>", y continúa
    Then el aviso de posible duplicado es "<aviso>"

    Examples:
      | nombre | especie | aviso                                                                                                          |
      | Luna   | Perro   | Carla Gómez ya tiene una mascota llamada Luna (Perro, número de afiliado 000123). ¿Querés darla de alta igual? |
      | LUNA   | Perro   | Carla Gómez ya tiene una mascota llamada Luna (Perro, número de afiliado 000123). ¿Querés darla de alta igual? |
      | Luna   | Gato    | ninguno                                                                                                        |
      | Mora   | Gato    | ninguno                                                                                                        |

  @FA-02 @RN-08 @D105 @D107
  Scenario: El aviso sugiere reactivar una mascota dada de baja con el mismo nombre y especie
    Given "Carla Gómez" tuvo la mascota "Milo" (Perro, afiliado "000110"), dada de baja sin deuda
    When el administrador completa para "Carla Gómez" la ficha de ejemplo con nombre "Milo" y especie "Perro", y continúa
    Then el aviso de posible duplicado es "Carla Gómez tiene dada de baja una mascota llamada Milo (Perro, número de afiliado 000110). Si es la misma, reactivala desde su ficha en lugar de darla de alta. ¿Querés darla de alta igual?"

  @FA-02 @RN-08 @D116
  Scenario: Una mascota dada de baja por fallecimiento no genera aviso de duplicado
    Given "Carla Gómez" tuvo la mascota "Milo" (Perro, afiliado "000110"), dada de baja con motivo "Fallecimiento"
    When el administrador completa para "Carla Gómez" la ficha de ejemplo con nombre "Milo" y especie "Perro", y continúa
    Then el aviso de posible duplicado es "ninguno"
    And el sistema pasa a la elección del plan

  @FA-02 @RN-08 @D105
  Scenario Outline: Respuesta al aviso de posible duplicado
    Given el administrador completó para "Carla Gómez" la ficha de ejemplo con nombre "Luna" y especie "Perro", y el sistema mostró el aviso de posible duplicado
    When el administrador <respuesta> el aviso
    Then el sistema <resultado>

    Examples:
      | respuesta | resultado                                 |
      | acepta    | pasa a la elección del plan               |
      | rechaza   | vuelve a la ficha con los datos cargados  |

  @FA-03 @D7
  Scenario: Cambiar la forma de pago propuesta no modifica la preferida del dueño
    When el administrador da de alta a "Mora" para "Carla Gómez" con la ficha de ejemplo y el plan "Plan Base", con forma de pago "Efectivo", y confirma
    Then el pago de "Mora" del período "2026-10" tiene forma de pago "Efectivo"
    And la forma de pago preferida de "Carla Gómez" sigue siendo "Transferencia bancaria"

  @EX-01 @RN-02 @RNF-BAJ-03 @D47 @D104
  Scenario Outline: Estado del dueño
    Given el dueño "Pedro Sosa" está "<estado>" y no tiene deuda
    When el administrador da de alta a "Mora" para "Pedro Sosa" con la ficha de ejemplo y el plan "Plan Base", y confirma
    Then el resultado es "<resultado>"

    Examples:
      | estado       | resultado                                                                                   |
      | Invitado     | Se dio de alta a Mora con el número de afiliado 000125 y el plan Plan Base.                 |
      | Activo       | Se dio de alta a Mora con el número de afiliado 000125 y el plan Plan Base.                 |
      | Dado de baja | Pedro Sosa tiene la cuenta inactiva. Para darle de alta una mascota, primero reactivá su cuenta desde su ficha. |

  @EX-01 @RN-02
  Scenario: El dueño se da de baja mientras se completa el alta
    Given el dueño "Pedro Sosa" tiene la cuenta en estado "Activo" y no tiene deuda
    And el administrador "Marta Ruiz" completó la ficha de ejemplo de "Mora" para "Pedro Sosa" y eligió el plan "Plan Base"
    And el administrador "Jorge Paz" dio de baja a "Pedro Sosa"
    When "Marta Ruiz" confirma el alta
    Then no existe ninguna mascota "Mora" de "Pedro Sosa"
    And el sistema informa "Pedro Sosa tiene la cuenta inactiva. Para darle de alta una mascota, primero reactivá su cuenta desde su ficha."

  @EX-02 @RN-03 @RF-DUE-03 @D29 @D38 @D55 @D64
  Scenario Outline: La deuda de cualquier mascota del dueño impide el alta
    Given <situación>
    When el administrador intenta dar de alta a "Mora" para "Carla Gómez"
    Then no existe ninguna mascota "Mora" de "Carla Gómez"
    And el sistema informa "Carla Gómez tiene deuda pendiente de <mascota con deuda>. No se puede asignar un plan hasta saldarla."

    Examples:
      | situación                                                                                            | mascota con deuda |
      | la cobertura de "Toby" está "Suspendida por falta de pago" con el período "2026-10" impago          | Toby              |
      | la cobertura de "Toby" fue dada de baja y quedó con el período "2026-06" congelado sin pagar         | Toby              |
      | "Carla Gómez" tuvo la mascota "Milo", dada de baja, que quedó con el período "2026-08" congelado     | Milo              |

  @RN-03 @D17 @D38
  Scenario Outline: La cuota del mes impaga es deuda recién cuando vence
    Given la fecha y hora actual es "<momento>"
    And la cuota de octubre 2026 de "Toby" está impaga y "Toby" no tiene otra deuda
    When el administrador da de alta a "Mora" para "Carla Gómez" con la ficha de ejemplo y el plan "Plan Base", y confirma
    Then el resultado es "<resultado>"

    Examples:
      | momento          | resultado                                                                              |
      | 13/10/2026 23:59 | Se dio de alta a Mora con el número de afiliado 000125 y el plan Plan Base.            |
      | 14/10/2026 00:00 | Carla Gómez tiene deuda pendiente de Toby. No se puede asignar un plan hasta saldarla. |

  @EX-02 @RN-03 @D36 @D54
  Scenario: La deuda del dueño se vuelve a validar al confirmar
    Given el administrador "Marta Ruiz" completó la ficha de ejemplo de "Mora" para "Carla Gómez" y eligió el plan "Plan Base"
    And el administrador "Jorge Paz" anuló el pago del período "2026-10" de "Toby" y su cobertura quedó "Suspendida por falta de pago"
    When "Marta Ruiz" confirma el alta
    Then no existe ninguna mascota "Mora" de "Carla Gómez"
    And el sistema informa "Carla Gómez tiene deuda pendiente de Toby. No se puede asignar un plan hasta saldarla."

  @EX-03 @RN-04 @RF-MAS-01 @D103
  Scenario Outline: Datos obligatorios de la ficha
    When el administrador completa para "Carla Gómez" la ficha de ejemplo con <cambio> y continúa
    Then el alta no pasa a la elección del plan
    And el sistema informa "Completá el campo <campo>."

    Examples:
      | cambio                   | campo           |
      | el nombre vacío          | Nombre          |
      | la especie vacía         | Especie         |
      | el sexo vacío            | Sexo            |
      | castrado/a vacío         | Castrado/a      |
      | la edad aproximada vacía | Edad aproximada |

  @RN-04 @RF-MAS-01 @D103
  Scenario Outline: Datos opcionales y especie
    When el administrador da de alta a "Mora" para "Carla Gómez" con la ficha de ejemplo con <cambio>, el plan "Plan Base", y confirma
    Then "Mora" queda registrada con <resultado en la ficha>

    Examples:
      | cambio                                                                   | resultado en la ficha |
      | foto, raza, color, enfermedades previas o crónicas y alimentación vacíos | esos datos vacíos     |
      | especie "Perro"                                                          | especie "Perro"       |
      | especie "Conejo"                                                         | especie "Conejo"      |

  @EX-04 @EX-05 @RN-04 @RN-05 @D41 @D103
  Scenario Outline: Formato de la edad y largo de los textos
    When el administrador completa para "Carla Gómez" la ficha de ejemplo con <campo> igual a <valor> y continúa
    Then el resultado es "<resultado>"

    Examples:
      | campo           | valor                 | resultado                                                          |
      | edad aproximada | 0                     | pasa a la elección del plan                                        |
      | edad aproximada | 30                    | pasa a la elección del plan                                        |
      | edad aproximada | 31                    | Ingresá la edad aproximada en años: un número entero entre 0 y 30. |
      | edad aproximada | -1                    | Ingresá la edad aproximada en años: un número entero entre 0 y 30. |
      | edad aproximada | 2,5                   | Ingresá la edad aproximada en años: un número entero entre 0 y 30. |
      | nombre          | un texto de 50 letras | pasa a la elección del plan                                        |
      | nombre          | un texto de 51 letras | El campo Nombre admite hasta 50 caracteres.                        |
      | especie         | un texto de 30 letras | pasa a la elección del plan                                        |
      | especie         | un texto de 31 letras | El campo Especie admite hasta 30 caracteres.                       |

  @RN-05 @D41
  Scenario: La edad aproximada se guarda tal como se cargó
    Given el "20/10/2026" se dio de alta a "Mora" con edad aproximada 2
    And la fecha y hora actual es "20/10/2027 10:00"
    When un veterinario abre la ficha de "Mora"
    Then la edad aproximada de "Mora" es 2 años

  @EX-06 @EX-07 @RN-04 @D114
  Scenario Outline: Formato y tamaño de la foto
    When el administrador completa para "Carla Gómez" la ficha de ejemplo con la foto "<foto>" de <tamaño> y continúa
    Then el resultado es "<resultado>"

    Examples:
      | foto      | tamaño  | resultado                              |
      | mora.jpg  | 1 MB    | pasa a la elección del plan            |
      | mora.png  | 20 MB   | pasa a la elección del plan            |
      | mora.heic | 20 MB   | pasa a la elección del plan            |
      | mora.jpg  | 20,1 MB | La foto no puede pesar más de 20 MB.   |
      | mora.heic | 20,1 MB | La foto no puede pesar más de 20 MB.   |
      | mora.gif  | 1 MB    | La foto tiene que ser JPG, PNG o HEIC. |

  @RN-04 @D114
  Scenario: Una foto HEIC se guarda como JPG reducido
    When el administrador da de alta a "Mora" para "Carla Gómez" con la ficha de ejemplo y la foto "mora.heic" de 8 MB y 4032 x 3024 px, el plan "Plan Base", y confirma
    Then la foto guardada de "Mora" es un JPG de 1600 x 1200 px
    And no se guarda el archivo "mora.heic" original

  @EX-08 @RN-07 @D3 @D21 @D101
  Scenario: Si el plan se desactiva antes de confirmar, la mascota no se registra
    Given el administrador "Marta Ruiz" completó la ficha de ejemplo de "Mora" para "Carla Gómez" y eligió el plan "Plan Plus"
    And el administrador "Jorge Paz" desactivó el plan "Plan Plus"
    When "Marta Ruiz" confirma el alta
    Then no existe ninguna mascota "Mora" de "Carla Gómez"
    And no se crea ninguna cobertura ni se registra ningún pago
    And el próximo número de afiliado disponible sigue siendo "000125"
    And el sistema informa "El plan Plan Plus está inactivo y no se puede asignar."

  @EX-09 @RN-07 @D57 @D101
  Scenario: Una fecha de pago futura rechaza el alta completa
    When el administrador da de alta a "Mora" para "Carla Gómez" con la ficha de ejemplo y el plan "Plan Base", con fecha de pago "21/10/2026", y confirma
    Then no existe ninguna mascota "Mora" de "Carla Gómez"
    And el sistema informa "La fecha de pago no puede ser posterior a hoy."

  @EX-10 @RN-09 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces da de alta una sola mascota
    When el administrador confirma el alta de "Mora" para "Carla Gómez" con el plan "Plan Base" y la misma confirmación se envía dos veces
    Then "Carla Gómez" tiene una sola mascota "Mora", con número de afiliado "000125"
    And "Mora" tiene una sola cobertura y un solo pago por el período "2026-10"
    And el próximo número de afiliado disponible es "000126"

  @RN-06 @RN-09 @RF-MAS-04 @D23 @D102
  Scenario: Dos altas simultáneas reciben números de afiliado distintos
    Given el dueño "Pedro Sosa" tiene la cuenta en estado "Activo" y no tiene deuda
    And el administrador "Jorge Paz" también inició sesión
    When "Marta Ruiz" confirma el alta de "Mora" para "Carla Gómez" y "Jorge Paz" confirma el alta de "Coco" para "Pedro Sosa" al mismo tiempo
    Then "Mora" y "Coco" quedan registradas con los números de afiliado "000125" y "000126", uno cada una

  @RN-06 @D23 @D102
  Scenario: El número de una mascota dada de baja no se reutiliza
    Given "Toby", con número de afiliado "000124", fue dada de baja sin deuda
    When el administrador da de alta a "Mora" para "Carla Gómez" con la ficha de ejemplo y el plan "Plan Base", y confirma
    Then "Mora" tiene el número de afiliado "000125"
    And el número "000124" sigue asignado a "Toby"

  @EX-11 @RN-01 @RF-ROL-11 @RNF-SEG-07 @D33 @D110
  Scenario: Un veterinario no puede dar de alta mascotas
    Given el veterinario "Ana López" inició sesión
    When "Ana López" envía un alta de mascota para "Carla Gómez" sin usar la pantalla
    Then no se registra ninguna mascota
    And el sistema informa "No tenés permiso para hacer esta operación."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-MAS-01 | Pasos 3 a 5, RN-04, RN-05, EX-03 a EX-07 |
| RF-MAS-02 | Paso 1, RN-02 |
| RF-MAS-03, RF-PLA-02 | Paso 6 (CU-22 RN-08), RN-07 |
| RF-MAS-04 | Paso 9, RN-06 |
| RF-DUE-03 | Actor principal, RN-01, RN-03 |
| RF-PLA-03 | Paso 6, EX-08 |
| RF-PLA-10 | Pasos 6 a 9, RN-07 |
| RF-ROL-04, RF-ROL-07 | RN-11 |
| RF-ROL-11, RNF-SEG-07 | RN-01, EX-11, nota de Excepciones |
| RF-TRA-01, RNF-AUD-01 | Paso 10, RN-10 |
| RNF-BAJ-03 | RN-02, EX-01 |
| RNF-INT-01 | RN-09, EX-10 |
| RNF-USA-01 | Paso 11 |
| RNF-USA-02 | Paso 7 (una sola confirmación para la mascota, la cobertura y el pago) |
| D2, D3, D10, D101 | RN-07, FA-01, EX-08, EX-09 |
| D7, D57, D59 | Pasos 6 y 7 (CU-22), FA-03, EX-09 |
| D17, D38 | RN-03 |
| D21, D56 | Paso 6 (CU-22), EX-08 |
| D23, D45, D102 | RN-06, RN-09 |
| D29, D55, D64 | RN-03, EX-02 |
| D33, D110 | RN-01, EX-11 |
| D36, D54 | RN-03 (revalidación al confirmar), EX-02 |
| D41, D103 | RN-04, RN-05, EX-03 a EX-05 |
| D47, D104 | RN-02, EX-01 |
| D114 | RN-04, EX-06, EX-07 |
| D116 | RN-08, FA-02 |
| D119 | RN-02 |
| D73 | RN-11 |
| D105 | RN-08, FA-02 |
| D107 | Relaciones, RN-06, RN-08, FA-02 |
| D120 | RN-08, FA-02 |
