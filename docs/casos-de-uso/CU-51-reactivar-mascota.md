# CU-51 — Reactivar mascota

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Volver a afiliar una mascota dada de baja sobre su registro existente, con su número de afiliado y su historial, y con cobertura activa desde el primer momento. |
| **Disparador** | Una mascota dada de baja vuelve a WildSalud (el dueño la quiere afiliar otra vez) o se la dio de baja por error. |
| **Relaciones** | Incluye CU-22 Asignar plan a una mascota (`«include»`): la reactivación siempre crea una cobertura nueva junto con el primer pago. Revierte CU-15 Dar de baja mascota, salvo las bajas por fallecimiento, que son definitivas. Para las mascotas dadas de baja en cascada (CU-10), se usa después de CU-11 Reactivar dueño, que no reactiva las mascotas. La mascota se ubica con CU-33 Buscar/filtrar dueños y mascotas, o desde el aviso de posible duplicado de CU-13. La deuda que impide reactivarla se paga antes con CU-26 Registrar pago. La ficha, y el dueño si hace falta, se actualizan después con CU-14. La mascota vuelve a aparecer en CU-37, CU-38 y CU-40, y la reactivación queda en CU-36. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. La mascota está registrada y está dada de baja.

## Flujo principal

1. El administrador abre la ficha de la mascota dada de baja y elige **Reactivar**. La opción no se ofrece si la baja fue por *Fallecimiento* (**RN-02**).
2. El sistema verifica que el dueño no esté dado de baja (**RN-03**), que no haya deuda de la mascota ni de otras mascotas del dueño (**RN-04**) y que la mascota no tenga pagado el mes en curso (**RN-13**).
3. El sistema muestra el detalle de la reactivación:
   - la ficha de la mascota tal como quedó al darla de baja, como solo lectura, y su número de afiliado, que conserva;
   - el dueño;
   - la fecha, el motivo y el administrador de la baja;
   - el aviso de que se creará una cobertura nueva, con primer pago y antigüedad desde cero.
4. El administrador elige **Continuar**.
5. **`«include»` CU-22 Asignar plan a una mascota, pasos 2 a 4:** el sistema muestra los planes activos, cada uno con su precio para el mes en curso; el administrador elige uno; el sistema propone el primer pago: período (mes en curso), importe, forma de pago preferida del dueño y fecha de hoy.
6. El sistema muestra, junto con el primer pago, un resumen de la mascota y del dueño. El administrador confirma o cambia la forma y la fecha de pago, y confirma (CU-22, paso 5). Esa **única confirmación** vale para la reactivación, la cobertura y el pago.
7. El sistema vuelve a validar **RN-01** a **RN-04** y **RN-13**, y valida las reglas de CU-22 (paso 6), en el momento de la confirmación.
8. En una sola operación (**RN-05**), el sistema vuelve a poner la mascota en estado *Activa*, sobre el mismo registro y con el mismo número de afiliado (**RN-06**), y crea la cobertura *Al día* con el pago del mes en curso (CU-22, paso 7).
9. El sistema deja el registro de auditoría de la reactivación, de la cobertura y del pago (**RN-12**).
10. El sistema confirma: *"Se reactivó a {mascota} con el número de afiliado {número} y el plan {plan}."*, muestra la ficha con la cobertura *Al día* y 1 período pago, y ofrece **Editar ficha** (CU-14) (**RN-08**).

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 a 6 | El administrador cancela, en el detalle o en la asignación del plan (CU-22 FA-02). | La mascota sigue dada de baja y no se crea la cobertura ni el pago (**RN-05**). |
| **FA-02** | 6 | El administrador cambia la forma de pago propuesta (CU-22 FA-01). | Se registra la forma de pago elegida; la preferida del dueño no cambia. |

## Excepciones

En todas las excepciones **la mascota sigue dada de baja y no se crea ninguna cobertura ni pago**; el sistema informa el motivo. Aunque el paso 2 ya controla al dueño y la deuda, y el paso 5 muestra solo planes activos, el sistema vuelve a validar al confirmar (RNF-SEG-07), porque la situación puede cambiar mientras se completa la reactivación.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 2 o 7 | El dueño está dado de baja. | *"{dueño} tiene la cuenta inactiva. Para reactivar a {mascota}, primero reactivá su cuenta desde su ficha."* |
| **EX-02** | 2 o 7 | La mascota tiene deuda congelada de una cobertura anterior (CU-22 EX-02). | *"{mascota} tiene deuda pendiente de una cobertura anterior. Registrá esos pagos antes de asignar un plan."* |
| **EX-03** | 2 o 7 | El dueño tiene deuda de otra de sus mascotas (CU-22 EX-03). | *"{dueño} tiene deuda pendiente de {otra mascota}. No se puede asignar un plan hasta saldarla."* |
| **EX-04** | 7 | El plan elegido se desactivó entre que se mostró la lista y la confirmación (CU-22 EX-04). | *"El plan {plan} está inactivo y no se puede asignar."* |
| **EX-05** | 7 | La fecha de pago es posterior a hoy (CU-22 EX-05). | *"La fecha de pago no puede ser posterior a hoy."* |
| **EX-06** | 7 | La mascota ya no está dada de baja (por ejemplo, otro administrador la reactivó mientras tanto). | *"La mascota {mascota} no está dada de baja."* |
| **EX-07** | 6 | La misma confirmación llega dos veces (doble clic o reintento de red). | La mascota se reactiva **una sola** vez, con **una sola** cobertura y **un solo** pago; el segundo envío devuelve el mismo resultado que el primero. |
| **EX-08** | 1 a 7 | Un usuario que no es administrador (veterinario o dueño) intenta reactivar la mascota. | *"No tenés permiso para hacer esta operación."* |
| **EX-09** | 1 | La mascota se dio de baja por *Fallecimiento* (por ejemplo, si el pedido se envía sin usar la pantalla, que no ofrece la opción). | *"La mascota {mascota} se dio de baja por fallecimiento y no se puede reactivar."* |
| **EX-10** | 2 o 7 | La mascota ya tiene un pago válido del mes en curso, de la cobertura que se dio de baja ese mes (CU-22 EX-08). | *"{mascota} ya tiene pagado {mes} por su cobertura anterior. Se le puede asignar un plan desde el {día 1 del mes siguiente}."* |

## Postcondiciones

- **Éxito:** la mascota vuelve a estar *Activa* sobre su mismo registro, con su número de afiliado, su dueño y su ficha. Tiene una cobertura nueva *Al día* con el plan elegido y 1 período pago, y el pago del mes en curso queda registrado. Sus coberturas anteriores, pagos y consumos siguen en el historial sin cambios, y la baja anterior también. La mascota vuelve a aparecer para el veterinario (CU-37, CU-38) y para el dueño (CU-40), y la reactivación queda en el historial de auditoría (CU-36).
- **Fracaso:** la mascota sigue dada de baja y no se crea ninguna cobertura ni pago. Los intentos rechazados no quedan en el historial de auditoría.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo el administrador.** La reactivación de mascotas la hace únicamente el administrador. El sistema lo verifica en cada pedido, no solo ocultando la opción. | RF-ROL-11, RNF-SEG-07, D33, D110 |
| **RN-02** | **Qué mascotas se reactivan.** Solo una mascota dada de baja, por *Pedido del dueño*, por *Otro* o *por baja del dueño*, sin importar el tiempo que haya pasado. Una mascota dada de baja por *Fallecimiento* no se puede reactivar: la baja es definitiva y la opción no se ofrece. | D106, D107, D116 |
| **RN-03** | **Dueño actual, no dado de baja.** La mascota vuelve con el dueño que tiene asignado; si hay que cambiarlo, se hace después con CU-14. El dueño no puede estar dado de baja; si lo está, primero se lo reactiva con CU-11. Su cuenta puede estar *Invitado* (por ejemplo, recién reactivado) o *Activo*. | RF-MAS-02, RNF-BAJ-03, D97, D104, D119 |
| **RN-04** | **Sin deuda.** Si la mascota tiene deuda congelada de una cobertura anterior, o el dueño tiene deuda de cualquier otra de sus mascotas, no se puede reactivar. Son las reglas RN-02 y RN-03 de CU-22, validadas al iniciar y otra vez al confirmar. La deuda congelada se puede pagar con la mascota dada de baja (CU-26), así que se salda antes de reactivarla. | D28, D29, D38, D55, D64 |
| **RN-05** | **Reactivación con plan y primer pago, todo o nada.** La mascota vuelve a *Activa* en la misma operación en que se crean la cobertura y el pago de la cuota completa del mes en curso (CU-22). Si la cobertura o el pago no se pueden registrar, la mascota sigue dada de baja. Se aplican las reglas RN-03 a RN-11 de CU-22; RN-01 de ese caso se cumple siempre, porque una mascota dada de baja no tiene cobertura vigente. | RF-PLA-10, D2, D3, D101, D107 |
| **RN-06** | **Mismo registro, mismo número.** No se crea otra mascota: se reactiva la existente, con el mismo identificador interno y el mismo número de afiliado. Sus coberturas anteriores (con su estado y su motivo de baja), pagos, consumos y auditoría no cambian, y la baja anterior queda en el historial. | RF-MAS-04, RNF-BAJ-02, D23, D45, D107 |
| **RN-07** | **Cobertura nueva, antigüedad desde cero.** La cobertura nueva empieza con 1 período pago. La antigüedad de las coberturas anteriores no se suma. | RF-PLA-10, D2, D9 |
| **RN-08** | **Ficha sin cambios.** La reactivación no modifica la ficha: la muestra como quedó al darla de baja y, al confirmar, ofrece actualizarla con CU-14, donde cada cambio queda auditado. La edad aproximada sigue como se cargó. | D41, D85, D118 |
| **RN-09** | **Sin motivo.** La reactivación no pide motivo: la auditoría registra quién y cuándo, y la baja anterior, con su motivo, sigue en el historial. | RNF-AUD-01, D117 |
| **RN-10** | **Una por una.** Reactivar al dueño (CU-11) no reactiva sus mascotas. Cada mascota se reactiva por separado con este caso, también las dadas de baja *por baja del dueño*. | D100, D107 |
| **RN-11** | **Disponible al instante.** Desde la confirmación, la mascota vuelve a aparecer en la búsqueda del veterinario con su ficha completa y en "Mis mascotas" de su dueño. | RF-ROL-04, RF-ROL-07, D73 |
| **RN-12** | **Auditoría y una sola vez.** Se registran la reactivación (estado anterior *Dada de baja*, estado nuevo *Activa*), el alta de la cobertura y el pago, con usuario, fecha y hora. Cada confirmación se procesa una sola vez, y si dos administradores reactivan la misma mascota a la vez, se registra una sola reactivación. | RF-TRA-01, RNF-AUD-01, RNF-INT-01 |
| **RN-13** | **Un solo pago por mes.** Si la mascota ya tiene pagado el mes en curso por la cobertura que se dio de baja ese mes, no se puede reactivar hasta el día 1 del mes siguiente. Es la regla RN-11 de CU-22, validada al iniciar y otra vez al confirmar. | RF-PAG-13, D144 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Mascota | Estado *Activa*, fecha y hora de la reactivación y administrador. Conserva el número de afiliado, la ficha y el dueño. |
| Cobertura | Según CU-22: mascota, plan, fecha y hora de inicio, estado *Al día*. |
| Pago | Según CU-22: mascota, cobertura, período (`AAAA-MM` del mes en curso), fecha de pago, importe, forma de pago, administrador, estado *Válido*. |
| Auditoría | Reactivación (estado anterior y nuevo), alta de la cobertura y pago, con usuario, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-51
Feature: CU-51 Reactivar mascota
  Como administrador
  Quiero reactivar una mascota dada de baja con su plan y su primer pago
  Para que vuelva a estar afiliada con su mismo número y su historial

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And existen los planes:
      | plan      | precio mensual | estado   |
      | Plan Base | 10000          | Activo   |
      | Plan Plus | 15000          | Activo   |
      | Plan Old  | 8000           | Inactivo |
    And la dueña "Carla Gómez", DNI "30111222", tiene la cuenta en estado "Activo" y forma de pago preferida "Transferencia bancaria"
    And "Carla Gómez" tiene la mascota "Luna" (Perro, edad aproximada 3), con número de afiliado "000123", y la mascota "Toby", con número de afiliado "000124"
    And, salvo que el escenario indique otra cosa, "Luna" fue dada de baja el "10/08/2026 09:00" con motivo "Pedido del dueño" por "Jorge Paz", y su última cobertura quedó "Dada de baja" con 6 períodos pagos y sin deuda
    And, salvo que el escenario indique otra cosa, "Toby" tiene cobertura "Al día" con el plan "Plan Base" y sin deuda
    And el próximo número de afiliado disponible es "000125"

  @flujo-principal @RN-06 @RN-12 @RF-MAS-04 @RF-PLA-10 @RF-TRA-01 @RNF-AUD-01 @D2 @D3 @D23 @D101 @D107
  Scenario: Reactivar una mascota dada de baja con su mismo número de afiliado
    When el administrador reactiva a "Luna", elige el plan "Plan Base" y confirma el primer pago con los valores propuestos
    Then "Luna" queda "Activa" con el número de afiliado "000123" y la dueña "Carla Gómez"
    And "Luna" tiene una cobertura nueva "Al día" con el plan "Plan Base" y 1 período pago
    And se registra un pago de "Luna" por el período "2026-10" con importe 10000 y forma de pago "Transferencia bancaria"
    And el próximo número de afiliado disponible sigue siendo "000125"
    And la auditoría registra la reactivación de "Luna" de "Dada de baja" a "Activa", el alta de la cobertura y el pago, con usuario "Marta Ruiz" y fecha "20/10/2026 10:00"
    And el sistema informa "Se reactivó a Luna con el número de afiliado 000123 y el plan Plan Base."

  @flujo-principal @RN-02 @RN-09 @D107 @D117 @D118
  Scenario: El detalle de la reactivación muestra la baja y avisa que la antigüedad empieza de cero
    When el administrador elige reactivar a "Luna"
    Then el sistema muestra la ficha de "Luna" como solo lectura, el número de afiliado "000123" y la dueña "Carla Gómez"
    And muestra la baja del "10/08/2026 09:00" con motivo "Pedido del dueño" registrada por "Jorge Paz"
    And avisa que se creará una cobertura nueva con primer pago y antigüedad desde cero
    And no pide un motivo para la reactivación
    And "Luna" sigue "Dada de baja" hasta que el administrador confirme

  @RN-06 @RN-07 @RNF-BAJ-02 @D9 @D107
  Scenario: Se conserva el historial y la antigüedad empieza de cero
    Given la última cobertura de "Luna" tiene 6 pagos y 4 consumos registrados
    When el administrador reactiva a "Luna" con el plan "Plan Plus" y confirma
    Then la cobertura anterior de "Luna" sigue "Dada de baja" con sus 6 pagos y sus 4 consumos
    And la baja del "10/08/2026" con motivo "Pedido del dueño" sigue en el historial de "Luna"
    And la cobertura nueva de "Luna" tiene el plan "Plan Plus" y 1 período pago

  @RN-11 @RF-ROL-04 @RF-ROL-07 @D73
  Scenario: La mascota reactivada vuelve a aparecer para el veterinario y para el dueño
    When el administrador reactiva a "Luna" con el plan "Plan Base" y confirma
    Then un veterinario que busca "000123" ve la ficha de "Luna" con cobertura "Al día"
    And "Carla Gómez" ve a "Luna" y a "Toby" en "Mis mascotas"

  @RN-08 @D41 @D85 @D118
  Scenario: La reactivación no modifica la ficha y ofrece editarla
    When el administrador reactiva a "Luna" con el plan "Plan Base" y confirma
    Then la ficha de "Luna" es la que tenía al darse de baja, con especie "Perro" y edad aproximada 3
    And el sistema ofrece "Editar ficha"

  @FA-01 @RN-05 @D101
  Scenario Outline: Cancelar la reactivación no cambia nada
    When el administrador empieza la reactivación de "Luna" y cancela en <momento>
    Then "Luna" sigue "Dada de baja"
    And no se crea ninguna cobertura ni se registra ningún pago

    Examples:
      | momento                         |
      | el detalle de la reactivación   |
      | la elección del plan            |
      | la confirmación del primer pago |

  @EX-09 @RN-02 @D116
  Scenario: Una mascota dada de baja por fallecimiento no se puede reactivar
    Given "Luna" fue dada de baja con motivo "Fallecimiento"
    When el administrador envía sin usar la pantalla la reactivación de "Luna"
    Then "Luna" sigue "Dada de baja"
    And no se crea ninguna cobertura ni se registra ningún pago
    And el sistema informa "La mascota Luna se dio de baja por fallecimiento y no se puede reactivar."

  @RN-02 @D116
  Scenario: La opción de reactivar no se ofrece para una baja por fallecimiento
    Given "Luna" fue dada de baja con motivo "Fallecimiento"
    When el administrador abre la ficha de "Luna"
    Then el sistema no ofrece la opción "Reactivar"

  @RN-02 @RN-03 @D106 @D119
  Scenario Outline: Se reactiva cualquiera sea el motivo reactivable y el tiempo desde la baja, con el dueño actual
    Given "Luna" fue dada de baja el "<fecha de la baja>" con motivo "<motivo>"
    When el administrador reactiva a "Luna" con el plan "Plan Base" y confirma
    Then "Luna" queda "Activa" con el número de afiliado "000123" y la dueña "Carla Gómez"

    Examples:
      | fecha de la baja | motivo           |
      | 10/08/2026 09:00 | Pedido del dueño |
      | 15/03/2024 11:00 | Otro             |
      | 01/01/2020 08:00 | Pedido del dueño |

  @RN-10 @D97 @D100
  Scenario: Reactivar al dueño no reactiva sus mascotas: se reactivan una por una
    Given "Carla Gómez" fue dada de baja en cascada el "01/09/2026 10:00" junto con "Luna" y "Toby", sin deuda
    And después se reactivó a "Carla Gómez" y su cuenta está en estado "Invitado"
    And "Luna" y "Toby" siguen dadas de baja con motivo "por baja del dueño"
    When el administrador reactiva a "Luna" con el plan "Plan Base" y confirma
    Then "Luna" queda "Activa" con el número de afiliado "000123"
    And "Toby" sigue "Dada de baja" con motivo "por baja del dueño"

  @FA-02 @D7
  Scenario: Cambiar la forma de pago propuesta no modifica la preferida del dueño
    When el administrador reactiva a "Luna" con el plan "Plan Base", con forma de pago "Efectivo", y confirma
    Then el pago de "Luna" del período "2026-10" tiene forma de pago "Efectivo"
    And la forma de pago preferida de "Carla Gómez" sigue siendo "Transferencia bancaria"

  @EX-01 @RN-03 @RNF-BAJ-03 @D97 @D104
  Scenario Outline: Estado del dueño
    Given la cuenta de "Carla Gómez" está en estado "<estado>" y no tiene deuda
    When el administrador reactiva a "Luna" con el plan "Plan Base" y confirma
    Then el resultado es "<resultado>"

    Examples:
      | estado       | resultado                                                                                   |
      | Invitado     | Se reactivó a Luna con el número de afiliado 000123 y el plan Plan Base.                    |
      | Activo       | Se reactivó a Luna con el número de afiliado 000123 y el plan Plan Base.                    |
      | Inactivo     | Carla Gómez tiene la cuenta inactiva. Para reactivar a Luna, primero reactivá su cuenta desde su ficha. |

  @EX-02 @RN-04 @D28
  Scenario: Deuda congelada de la propia mascota
    Given la última cobertura de "Luna" quedó con los períodos "2026-06" y "2026-07" congelados sin pagar
    When el administrador intenta reactivar a "Luna"
    Then "Luna" sigue "Dada de baja"
    And el sistema informa "Luna tiene deuda pendiente de una cobertura anterior. Registrá esos pagos antes de asignar un plan."

  @EX-03 @RN-04 @D29 @D38 @D55
  Scenario Outline: Deuda de otra mascota del dueño
    Given <situación>
    When el administrador intenta reactivar a "Luna"
    Then "Luna" sigue "Dada de baja"
    And el sistema informa "Carla Gómez tiene deuda pendiente de Toby. No se puede asignar un plan hasta saldarla."

    Examples:
      | situación                                                                                    |
      | la cobertura de "Toby" está "Suspendida por falta de pago" con el período "2026-10" impago  |
      | la cobertura de "Toby" fue dada de baja y quedó con el período "2026-06" congelado sin pagar |

  @RN-04 @D28 @D64
  Scenario: Con la deuda congelada saldada se puede reactivar
    Given la última cobertura de "Luna" quedó con el período "2026-07" congelado
    And con "Luna" dada de baja, el administrador registró el pago del período "2026-07"
    When el administrador reactiva a "Luna" con el plan "Plan Base" y confirma
    Then "Luna" queda "Activa" con una cobertura nueva "Al día" y 1 período pago

  @EX-10 @RN-13 @RF-PAG-13 @D144
  Scenario Outline: Una mascota dada de baja con el mes pago se reactiva recién el mes siguiente
    Given "Luna" fue dada de baja el "15/10/2026 09:00" con motivo "Pedido del dueño" y su última cobertura tenía pagado el período "2026-10", sin deuda
    And la fecha y hora actual es "<fecha>"
    When el administrador intenta reactivar a "Luna" con el plan "Plan Base"
    Then el resultado es "<resultado>"

    Examples:
      | fecha            | resultado                                                                                                  |
      | 25/10/2026 10:00 | Luna ya tiene pagado octubre de 2026 por su cobertura anterior. Se le puede asignar un plan desde el 01/11/2026. |
      | 01/11/2026 10:00 | Luna reactivada con el pago del período 2026-11                                                            |

  @EX-03 @RN-04 @D36 @D54
  Scenario: La deuda del dueño se vuelve a validar al confirmar
    Given el administrador "Marta Ruiz" empezó la reactivación de "Luna" y eligió el plan "Plan Base"
    And el administrador "Jorge Paz" anuló el pago del período "2026-10" de "Toby" y su cobertura quedó "Suspendida por falta de pago"
    When "Marta Ruiz" confirma la reactivación
    Then "Luna" sigue "Dada de baja"
    And el sistema informa "Carla Gómez tiene deuda pendiente de Toby. No se puede asignar un plan hasta saldarla."

  @EX-04 @RN-05 @D21 @D101
  Scenario: Si el plan se desactiva antes de confirmar, la mascota sigue dada de baja
    Given el administrador "Marta Ruiz" empezó la reactivación de "Luna" y eligió el plan "Plan Plus"
    And el administrador "Jorge Paz" desactivó el plan "Plan Plus"
    When "Marta Ruiz" confirma la reactivación
    Then "Luna" sigue "Dada de baja"
    And no se crea ninguna cobertura ni se registra ningún pago
    And el sistema informa "El plan Plan Plus está inactivo y no se puede asignar."

  @EX-05 @RN-05 @D57 @D101
  Scenario: Una fecha de pago futura rechaza la reactivación completa
    When el administrador reactiva a "Luna" con el plan "Plan Base", con fecha de pago "21/10/2026", y confirma
    Then "Luna" sigue "Dada de baja"
    And el sistema informa "La fecha de pago no puede ser posterior a hoy."

  @EX-06 @RN-12 @RNF-INT-01
  Scenario: Dos administradores reactivan la misma mascota a la vez
    Given el administrador "Jorge Paz" también inició sesión
    When "Marta Ruiz" y "Jorge Paz" confirman la reactivación de "Luna" al mismo tiempo
    Then "Luna" queda "Activa" con una sola cobertura nueva y un solo pago por el período "2026-10"
    And el otro administrador recibe "La mascota Luna no está dada de baja."

  @EX-07 @RN-12 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces reactiva una sola vez
    When el administrador confirma la reactivación de "Luna" con el plan "Plan Base" y la misma confirmación se envía dos veces
    Then la auditoría registra una sola reactivación de "Luna"
    And "Luna" tiene una sola cobertura nueva y un solo pago por el período "2026-10"

  @EX-08 @RN-01 @RF-ROL-11 @RNF-SEG-07 @D33 @D110
  Scenario Outline: Solo el administrador reactiva una mascota
    Given <usuario> inició sesión
    When ese usuario envía sin usar la pantalla la reactivación de "Luna"
    Then "Luna" sigue "Dada de baja"
    And el sistema informa "No tenés permiso para hacer esta operación."

    Examples:
      | usuario                    |
      | el veterinario "Ana López" |
      | la dueña "Carla Gómez"     |
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-MAS-02 | RN-03 |
| RF-MAS-04 | Paso 8, RN-06 |
| RF-PLA-10 | Pasos 5 a 8, RN-05, RN-07 |
| RF-ROL-04, RF-ROL-07 | RN-11 |
| RF-ROL-11, RNF-SEG-07 | RN-01, EX-08, nota de Excepciones |
| RF-TRA-01, RNF-AUD-01 | Paso 9, RN-09, RN-12 |
| RNF-BAJ-02 | RN-06 |
| RNF-BAJ-03 | RN-03, EX-01 |
| RF-PAG-13 | Paso 2, RN-13, EX-10 |
| RNF-INT-01 | RN-12, EX-06, EX-07 |
| RNF-USA-01 | Paso 10 |
| RNF-USA-02 | Paso 6 (una sola confirmación para la reactivación, la cobertura y el pago) |
| D2, D3, D101 | RN-05, FA-01, EX-04, EX-05 |
| D7, D57, D59 | Pasos 5 y 6 (CU-22), FA-02, EX-05 |
| D9 | RN-07 |
| D21, D56 | Paso 5 (CU-22), EX-04 |
| D23, D45 | RN-06 |
| D28, D29, D38, D55, D64 | RN-04, EX-02, EX-03 |
| D33, D110 | RN-01, EX-08 |
| D36, D54 | RN-04 (revalidación al confirmar), EX-03 |
| D41, D85, D118 | RN-08 |
| D117 | RN-09 |
| D144 | Paso 2, RN-13, EX-10 |
| D97, D104, D119 | RN-03, EX-01 |
| D73 | RN-11 |
| D100 | RN-10 |
| D106, D107, D116 | Paso 1, RN-02, RN-06, RN-10, EX-09 |
| D120 (pendiente, CU-13) | Relaciones |
