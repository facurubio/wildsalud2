# CU-15 — Dar de baja mascota

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Dar de baja a una mascota que deja WildSalud (por fallecimiento, a pedido del dueño u otro motivo), junto con su cobertura, conservando todo su historial. |
| **Disparador** | El dueño informa que la mascota falleció o que ya no quiere tenerla afiliada. |
| **Relaciones** | La mascota se ubica con CU-33 Buscar/filtrar dueños y mascotas. Da de baja también su cobertura vigente, de inmediato, como la baja inmediata de CU-24 (FA-01) pero con motivo *por baja de la mascota*; para dar de baja solo el plan se usa CU-24. La deuda que quede congelada se paga en CU-26 Registrar pago, aunque la mascota esté dada de baja. La baja de todas las mascotas de un dueño junto con él se hace en CU-10 Dar de baja dueño (en cascada). Si la mascota vuelve, se reactiva con CU-51 Reactivar mascota, que conserva su número de afiliado y su historial, salvo que se la haya dado de baja por fallecimiento. Si la mascota cambia de dueño no se la da de baja: se cambia el dueño en CU-14 Editar mascota. La mascota deja de aparecer en CU-37 y CU-40, y la baja queda en CU-36. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. La mascota está registrada y no está dada de baja.

## Flujo principal

1. El administrador abre la ficha de la mascota y elige **Dar de baja mascota**.
2. El sistema muestra el **detalle de la baja**, calculado en ese momento (**RN-07**):
   - la mascota, su número de afiliado y su dueño;
   - la cobertura vigente, si la tiene: plan y estado, con el aviso de que se dará de baja **de inmediato** con motivo *por baja de la mascota* (**RN-04**);
   - los períodos que quedarán como **deuda congelada**, con su importe, y el aviso de que esa deuda impedirá dar de alta otras mascotas del dueño o asignarles un plan hasta que se salde (**RN-05**);
   - el cambio pendiente que se cancelará, si lo hay (**RN-06**).
3. El administrador elige el motivo de la baja (**RN-02**) y confirma. Si el motivo es *Fallecimiento*, el sistema pide una segunda confirmación (FA-05).
4. El sistema valida **RN-01** y **RN-02**, que la mascota no esté dada de baja y que la situación de la cobertura no haya cambiado desde el paso 2 (**RN-07**).
5. El sistema registra la baja lógica de la mascota: estado *Dada de baja*, motivo, fecha y hora, y administrador (**RN-03**).
6. En la misma operación, si la mascota tiene una cobertura vigente, el sistema la pasa a *Dada de baja* con motivo *por baja de la mascota* y la misma fecha y hora (**RN-04**), congela los períodos impagos vencidos antes del mes de la baja (**RN-05**) y cancela cualquier cambio pendiente (**RN-06**).
7. El sistema deja el registro de auditoría de la baja de la mascota, de la baja de la cobertura y de la cancelación del cambio pendiente (**RN-11**).
8. El sistema confirma: *"La mascota {mascota} quedó dada de baja."*

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 2 y 6 | La mascota no tiene cobertura vigente (su plan ya se había dado de baja). | Solo se da de baja la mascota. Su última cobertura no cambia: conserva su motivo y su fecha de baja. Si esa cobertura dejó deuda congelada, la deuda se mantiene y el sistema la muestra en el paso 2. |
| **FA-02** | 2 y 8 | Después de la baja, la mascota tiene deuda congelada (de la cobertura que se da de baja o de una anterior). | El sistema confirma: *"La mascota {mascota} quedó dada de baja. Cuotas adeudadas: {N}, por {importe}. Hasta que se salden, no se pueden dar de alta mascotas de {dueño} ni asignarles un plan."* |
| **FA-03** | 2 y 6 | La cobertura tiene un cambio pendiente (cambio de plan o baja programada). | El cambio pasa a *Cancelado* y queda auditado. |
| **FA-04** | 3 | El administrador cancela. | No se da de baja nada y la mascota, la cobertura y el cambio pendiente siguen como estaban. |
| **FA-05** | 3 | El motivo es *Fallecimiento*. | El sistema pide una segunda confirmación: *"La baja por fallecimiento es definitiva: {mascota} no se podrá reactivar. ¿Confirmás la baja?"* Si el administrador confirma, el caso sigue en el paso 4. Si no, no se da de baja nada y vuelve al detalle de la baja (**RN-12**). |

## Excepciones

En todas las excepciones **no se da de baja la mascota ni su cobertura**, y el sistema informa el motivo.

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | La mascota ya está dada de baja (por ejemplo, otro administrador la dio de baja o se dio de baja al dueño en cascada mientras tanto). | *"La mascota {mascota} ya está dada de baja."* |
| **EX-02** | 4 | No se eligió el motivo. | *"Elegí el motivo de la baja."* |
| **EX-03** | 4 | El motivo es *Otro* y falta el detalle. | *"Completá el campo Detalle del motivo."* |
| **EX-04** | 4 | La situación de la cobertura cambió entre que se mostró el detalle y la confirmación: cambió su estado, los períodos que se congelarían o el cambio pendiente (por ejemplo, empezó un mes nuevo o se registró un pago). | *"La situación de la cobertura de {mascota} cambió. Revisá el detalle de la baja."* El sistema muestra el detalle actualizado. |
| **EX-05** | 3 | La misma confirmación llega dos veces (doble clic o reintento de red). | Se registra **una sola** baja; el segundo envío devuelve el mismo resultado que el primero. |
| **EX-06** | 1 a 4 | Un usuario que no es administrador (veterinario o dueño) intenta dar de baja la mascota. | *"No tenés permiso para hacer esta operación."* |

## Postcondiciones

- **Éxito:** la mascota queda *Dada de baja* con motivo, fecha y hora, y administrador responsable. Si tenía una cobertura vigente, queda *Dada de baja* con motivo *por baja de la mascota*, los períodos vencidos antes del mes de la baja quedan como deuda congelada y el cambio pendiente, si había, queda *Cancelado*. La mascota deja de aparecer en las búsquedas y en "Mis mascotas", y todo su historial se conserva. La baja queda en el historial de auditoría (CU-36).
- **Fracaso:** la mascota, su cobertura y su cambio pendiente no cambian, y no se registra nada en la auditoría.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo el administrador.** La baja de una mascota la hace únicamente el administrador. El sistema lo verifica en cada pedido, no solo ocultando la opción. | RF-ROL-11, RNF-SEG-07, D33, D110 |
| **RN-02** | **Motivo obligatorio.** El motivo de la baja de la mascota se elige de la lista fija *Fallecimiento*, *Pedido del dueño* u *Otro*; con *Otro*, se completa un detalle de hasta 200 caracteres. Es distinto del motivo de la baja de la cobertura, que siempre es *por baja de la mascota*. La baja en cascada de CU-10 registra el motivo *por baja del dueño*, que no se puede elegir en este caso. El cambio de dueño no es un motivo de baja: se hace editando la mascota (CU-14). | D16, D100, D106, D119 |
| **RN-03** | **Baja lógica.** La mascota no se elimina: conserva su ficha, su número de afiliado, sus coberturas, pagos y consumos, y su auditoría. La baja registra fecha y hora, y administrador responsable. | RNF-BAJ-01, RNF-BAJ-02, RNF-BAJ-04 |
| **RN-04** | **La cobertura se da de baja con la mascota, de inmediato.** La cobertura vigente pasa a *Dada de baja* con motivo *por baja de la mascota* en el mismo momento que la mascota, aunque esté *Al día* y con el mes pago: no se programa para el día 1 del mes siguiente como la baja voluntaria del plan, y el mes pagado no se devuelve. | RF-PAG-14, D10, D16, D113 |
| **RN-05** | **Deuda congelada.** Se congelan los períodos impagos **vencidos antes del mes de la baja**; el mes de la baja no se congela aunque esté impago: si la baja ocurre entre el día 1 y el 13 con el mes impago, ese mes no genera deuda, aunque haya habido consumos. Esa deuda sigue siendo del dueño: mientras no se salde, no se pueden dar de alta mascotas suyas ni asignarles un plan. Se puede pagar en CU-26 aunque la mascota esté dada de baja. | D27, D28, D29, D38, D55, D64, D113 |
| **RN-06** | **Cambios pendientes.** Se cancela cualquier cambio pendiente de la cobertura, sea un cambio de plan o una baja programada. | D20 |
| **RN-07** | **Situación evaluada al confirmar.** El estado de la cobertura, los períodos a congelar y el cambio pendiente se calculan con la fecha y hora de la confirmación (hora de Argentina), sin depender de que los procesos automáticos ya se hayan ejecutado. Si difieren de lo mostrado en el paso 2, la baja no se hace y se muestra el detalle actualizado. | D53, D54 |
| **RN-08** | **Deja de estar disponible.** La mascota dada de baja no aparece en la búsqueda del veterinario ni en "Mis mascotas" de su dueño, y no admite consumos, asignación de plan, pagos de cuotas nuevas ni edición de la ficha hasta que se la reactive (CU-51). Solo se consulta en el historial (pagos, auditoría) y para pagar su deuda congelada. | RF-ROL-04, RNF-BAJ-03, D64, D73 |
| **RN-09** | **No afecta a otras mascotas ni al dueño.** Las demás mascotas del dueño conservan su cobertura, y el dueño y su cuenta siguen como estaban, aunque se dé de baja su última mascota. La cascada va del dueño a sus mascotas (CU-10), nunca al revés. | RF-PAG-02, D22 |
| **RN-10** | **Vuelta con CU-51.** Si la mascota vuelve, se la reactiva con CU-51 Reactivar mascota: conserva su número de afiliado, su ficha y su historial, y recibe una cobertura nueva con primer pago y antigüedad desde cero. No se la vuelve a dar de alta como mascota nueva, y su número nunca se asigna a otra. La excepción es la baja por *Fallecimiento*, que es definitiva (RN-12). | D9, D23, D107, D116 |
| **RN-11** | **Auditoría y una sola vez.** Se registran la baja de la mascota, la de la cobertura y la cancelación del cambio pendiente, con usuario, fecha y hora. Cada confirmación se procesa una sola vez. | RF-TRA-01, RNF-AUD-01, RNF-INT-01 |
| **RN-12** | **Baja por fallecimiento, definitiva.** Una mascota dada de baja por *Fallecimiento* no se puede reactivar. Por eso, con ese motivo, el sistema pide una segunda confirmación que avisa que la baja es definitiva. | D116 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Mascota | Estado *Dada de baja*, motivo (y detalle, si es *Otro*), fecha y hora de baja, administrador. |
| Cobertura (si estaba vigente) | Estado *Dada de baja*, motivo *por baja de la mascota*, fecha y hora de baja (las mismas que las de la mascota), administrador. |
| Deuda congelada | Los períodos impagos vencidos antes del mes de la baja, marcados como congelados. |
| Cambio pendiente | Estado *Cancelado*, si había alguno. |
| Auditoría | Baja de la mascota, baja de la cobertura y cancelación del cambio pendiente, con usuario, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-15
Feature: CU-15 Dar de baja mascota
  Como administrador
  Quiero dar de baja una mascota que deja WildSalud
  Para que deje de estar afiliada sin perder su historial

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And existen los planes:
      | plan      | precio mensual | estado |
      | Plan Base | 10000          | Activo |
      | Plan Plus | 15000          | Activo |
    And la dueña "Carla Gómez", DNI "30111222", tiene la cuenta en estado "Activo" y las mascotas "Luna" (afiliado "000123") y "Toby" (afiliado "000124")
    And, salvo que el escenario indique otra cosa, "Luna" y "Toby" tienen cobertura "Al día" con el plan "Plan Base", la cuota de octubre 2026 pagada y ninguna deuda ni cambio pendiente

  @flujo-principal @D10 @D16 @D106 @D113 @RNF-BAJ-04 @RF-TRA-01 @RNF-AUD-01
  Scenario: Dar de baja una mascota con la cobertura al día
    When el administrador da de baja a "Luna" con motivo "Pedido del dueño" y confirma
    Then "Luna" queda "Dada de baja" con motivo "Pedido del dueño", fecha y hora "20/10/2026 10:00" y administrador "Marta Ruiz"
    And la cobertura de "Luna" queda "Dada de baja" con motivo "por baja de la mascota" y fecha y hora "20/10/2026 10:00", sin esperar al 01/11/2026
    And el pago del período "2026-10" de "Luna" sigue "Válido" y no se registra ningún reintegro
    And "Luna" no tiene deuda congelada
    And la auditoría registra la baja de "Luna" y de su cobertura, con usuario "Marta Ruiz"
    And el sistema informa "La mascota Luna quedó dada de baja."

  @flujo-principal @RN-04 @RN-05 @RN-06
  Scenario: El detalle muestra lo que va a pasar antes de confirmar
    Given la cobertura de "Luna" está "Suspendida por falta de pago" con los períodos "2026-09" y "2026-10" impagos
    And "Luna" tiene una baja programada con vigencia "01/11/2026"
    When el administrador elige dar de baja a "Luna"
    Then el sistema muestra que la cobertura con el plan "Plan Base" se dará de baja de inmediato con motivo "por baja de la mascota"
    And muestra que el período "2026-09" quedará como deuda congelada por 10000
    And muestra que esa deuda impedirá dar de alta mascotas de "Carla Gómez" o asignarles un plan hasta que se salde
    And muestra que se cancelará la baja programada
    And "Luna" sigue "Activa" hasta que el administrador confirme

  @FA-01 @D10
  Scenario Outline: Mascota sin cobertura vigente
    Given la última cobertura de "Luna" fue dada de baja con motivo "voluntaria" <deuda anterior>
    When el administrador da de baja a "Luna" con motivo "Pedido del dueño" y confirma
    Then "Luna" queda "Dada de baja" con motivo "Pedido del dueño"
    And la última cobertura de "Luna" sigue "Dada de baja" con motivo "voluntaria"
    And el sistema informa "<mensaje>"

    Examples:
      | deuda anterior                             | mensaje                                                                                                                                                          |
      | sin deuda                                  | La mascota Luna quedó dada de baja.                                                                                                                              |
      | y quedó con el período "2026-07" congelado | La mascota Luna quedó dada de baja. Cuotas adeudadas: 1, por 10000. Hasta que se salden, no se pueden dar de alta mascotas de Carla Gómez ni asignarles un plan. |

  @FA-02 @RN-05 @D27 @D16
  Scenario: Con cuotas vencidas impagas, la baja congela la deuda y la informa
    Given la cobertura de "Luna" está "Suspendida por falta de pago" desde el "14/09/2026 00:00" con los períodos "2026-09" y "2026-10" impagos
    When el administrador da de baja a "Luna" con motivo "Pedido del dueño" y confirma
    Then la cobertura de "Luna" queda "Dada de baja" con motivo "por baja de la mascota"
    And el período "2026-09" queda como deuda congelada
    And el período "2026-10" no queda como deuda congelada
    And el sistema informa "La mascota Luna quedó dada de baja. Cuotas adeudadas: 1, por 10000. Hasta que se salden, no se pueden dar de alta mascotas de Carla Gómez ni asignarles un plan."

  @FA-02 @RN-05 @D17 @D27
  Scenario Outline: La deuda congelada depende del mes de la baja
    Given la fecha y hora actual es "<momento>"
    And la cobertura de "Luna" tiene impagas las cuotas <cuotas impagas>
    When el administrador da de baja a "Luna" con motivo "Pedido del dueño" y confirma
    Then la deuda congelada de "Luna" es "<deuda congelada>"

    Examples:
      | momento          | cuotas impagas        | deuda congelada |
      | 10/10/2026 10:00 | "2026-10"             | ninguna         |
      | 20/10/2026 10:00 | "2026-10"             | ninguna         |
      | 20/10/2026 10:00 | "2026-09" y "2026-10" | 2026-09         |
      | 05/11/2026 10:00 | "2026-10" y "2026-11" | 2026-10         |

  @FA-02 @RN-05 @D29 @D55 @D64
  Scenario: La deuda de una mascota dada de baja sigue bloqueando al dueño
    Given "Luna" fue dada de baja y quedó con el período "2026-09" congelado sin pagar
    When el administrador intenta dar de alta la mascota "Mora" para "Carla Gómez"
    Then no se registra ninguna mascota
    And el sistema informa "Carla Gómez tiene deuda pendiente de Luna. No se puede asignar un plan hasta saldarla."

  @FA-03 @RN-06 @D20
  Scenario Outline: La baja cancela el cambio pendiente
    Given "Luna" tiene <cambio pendiente> con vigencia "01/11/2026"
    When el administrador da de baja a "Luna" con motivo "Pedido del dueño" y confirma
    Then el cambio pendiente de "Luna" queda "Cancelado"
    And la cobertura de "Luna" queda "Dada de baja" con motivo "por baja de la mascota" y fecha y hora "20/10/2026 10:00"
    And la auditoría registra la cancelación del cambio pendiente de "Luna"

    Examples:
      | cambio pendiente              |
      | un cambio al plan "Plan Plus" |
      | una baja programada           |

  @FA-04
  Scenario: El administrador cancela
    When el administrador elige dar de baja a "Luna", elige el motivo "Pedido del dueño" y cancela
    Then "Luna" sigue "Activa" con cobertura "Al día"
    And la auditoría no registra ninguna baja

  @RN-02 @EX-02 @EX-03 @D106
  Scenario Outline: Motivo de la baja
    When el administrador da de baja a "Luna" con motivo "<motivo>" y detalle "<detalle>", y confirma
    Then el resultado es "<resultado>"

    Examples:
      | motivo           | detalle             | resultado                              |
      | Pedido del dueño |                     | La mascota Luna quedó dada de baja.    |
      | Otro             | Se mudó al exterior | La mascota Luna quedó dada de baja.    |
      |                  |                     | Elegí el motivo de la baja.            |
      | Otro             |                     | Completá el campo Detalle del motivo.  |

  @RN-02 @D106 @D119
  Scenario: El cambio de dueño no es un motivo de baja
    When el administrador elige dar de baja a "Luna"
    Then los motivos que ofrece el sistema son "Fallecimiento", "Pedido del dueño" y "Otro"
    And no ofrece "Cambio de dueño"

  @FA-05 @RN-12 @D116
  Scenario: La baja por fallecimiento pide una segunda confirmación
    When el administrador elige dar de baja a "Luna" con motivo "Fallecimiento" y confirma
    Then el sistema pide confirmar "La baja por fallecimiento es definitiva: Luna no se podrá reactivar. ¿Confirmás la baja?"
    And "Luna" sigue "Activa" hasta la segunda confirmación

  @FA-05 @RN-12 @D116
  Scenario Outline: Respuesta a la segunda confirmación por fallecimiento
    Given el administrador eligió dar de baja a "Luna" con motivo "Fallecimiento" y el sistema pidió la segunda confirmación
    When el administrador <respuesta> la segunda confirmación
    Then <resultado>

    Examples:
      | respuesta | resultado                                                                                   |
      | acepta    | "Luna" queda "Dada de baja" con motivo "Fallecimiento" y no se puede reactivar              |
      | rechaza   | "Luna" sigue "Activa" con cobertura "Al día" y el sistema vuelve al detalle de la baja      |

  @RN-05 @D113 @D27
  Scenario: Entre el día 1 y el 13, el mes impago no genera deuda aunque haya consumos
    Given la fecha y hora actual es "10/10/2026 10:00"
    And la cuota de octubre 2026 de "Luna" está impaga
    And "Luna" consumió 2 "Consulta" en octubre 2026
    When el administrador da de baja a "Luna" con motivo "Pedido del dueño" y confirma
    Then "Luna" no tiene deuda congelada
    And el período "2026-10" no figura como deuda de "Carla Gómez"

  @RN-08 @RF-ROL-04 @RNF-BAJ-03 @D73
  Scenario: La mascota dada de baja deja de estar disponible
    When el administrador da de baja a "Luna" con motivo "Pedido del dueño" y confirma
    Then un veterinario que busca "000123" recibe "No se encontraron mascotas con esos datos."
    And "Carla Gómez" ve solo a "Toby" en "Mis mascotas"
    And no se pueden registrar consumos, asignar un plan ni editar la ficha de "Luna"

  @RN-03 @RNF-BAJ-01 @RNF-BAJ-02
  Scenario: Se conserva todo el historial de la mascota
    Given "Luna" tiene 4 pagos y 3 consumos registrados
    When el administrador da de baja a "Luna" con motivo "Pedido del dueño" y confirma
    Then la ficha, el número de afiliado "000123", la cobertura, los 4 pagos y los 3 consumos de "Luna" se conservan
    And el administrador puede consultarlos en el historial de pagos y en el historial de auditoría

  @RN-09 @RF-PAG-02 @D22
  Scenario: La baja no afecta a las otras mascotas ni al dueño
    When el administrador da de baja a "Luna" con motivo "Pedido del dueño" y confirma
    Then "Toby" sigue "Activa" con cobertura "Al día" con el plan "Plan Base"
    And "Carla Gómez" sigue registrada con la cuenta en estado "Activo"

  @RN-10 @D9 @D23 @D107
  Scenario: Una mascota dada de baja vuelve con su mismo número al reactivarla
    Given "Luna", con número de afiliado "000123", fue dada de baja con motivo "Pedido del dueño" y sin deuda
    And el próximo número de afiliado disponible es "000125"
    When el administrador reactiva a "Luna" con el plan "Plan Base" y confirma
    Then "Luna" queda "Activa" con el número de afiliado "000123" y una cobertura nueva con 1 período pago
    And su baja y su cobertura anterior siguen en el historial
    And el próximo número de afiliado disponible sigue siendo "000125"

  @EX-01 @D100
  Scenario Outline: La mascota ya está dada de baja
    Given el administrador "Marta Ruiz" abrió la baja de "Luna"
    And <situación>
    When "Marta Ruiz" confirma la baja de "Luna" con motivo "Pedido del dueño"
    Then el sistema informa "La mascota Luna ya está dada de baja."
    And la baja de "Luna" conserva el motivo "<motivo registrado>"

    Examples:
      | situación                                                                        | motivo registrado  |
      | el administrador "Jorge Paz" dio de baja a "Luna" con motivo "Pedido del dueño"  | Pedido del dueño   |
      | el administrador "Jorge Paz" dio de baja en cascada a "Carla Gómez"              | por baja del dueño |

  @EX-04 @RN-07 @D53 @D54
  Scenario Outline: La situación de la cobertura cambia antes de confirmar
    Given la cobertura de "Luna" está "Suspendida por falta de pago" con impagas las cuotas <cuotas impagas>
    And el administrador "Marta Ruiz" abrió la baja de "Luna" el "<apertura>"
    And <cambio>
    When "Marta Ruiz" confirma la baja de "Luna" con motivo "Pedido del dueño" el "<confirmación>"
    Then "Luna" sigue "Activa"
    And el sistema muestra el detalle de la baja actualizado
    And el sistema informa "La situación de la cobertura de Luna cambió. Revisá el detalle de la baja."

    Examples:
      | cuotas impagas        | apertura         | cambio                                                                              | confirmación     |
      | "2026-10"             | 31/10/2026 23:58 | empezó noviembre y "2026-10" pasó a ser un período vencido antes del mes de la baja | 01/11/2026 00:01 |
      | "2026-09" y "2026-10" | 20/10/2026 10:00 | el administrador "Jorge Paz" registró el pago del período "2026-09" de "Luna"       | 20/10/2026 10:05 |

  @EX-05 @RN-11 @RNF-INT-01
  Scenario: Una confirmación enviada dos veces registra una sola baja
    When el administrador confirma la baja de "Luna" con motivo "Pedido del dueño" y la misma confirmación se envía dos veces
    Then "Luna" tiene una sola baja registrada
    And la auditoría registra una sola baja de "Luna" y una sola de su cobertura

  @EX-06 @RN-01 @RF-ROL-11 @RNF-SEG-07 @D33 @D110
  Scenario Outline: Solo el administrador da de baja una mascota
    Given <usuario> inició sesión
    When ese usuario envía sin usar la pantalla la baja de "Luna"
    Then "Luna" sigue "Activa" con cobertura "Al día"
    And el sistema informa "No tenés permiso para hacer esta operación."

    Examples:
      | usuario                    |
      | el veterinario "Ana López" |
      | la dueña "Carla Gómez"     |
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-PAG-14 | Paso 6, RN-04 |
| RF-PAG-02 | RN-09 |
| RF-ROL-04, RNF-BAJ-03 | RN-08 |
| RF-ROL-11, RNF-SEG-07 | RN-01, EX-06 |
| RF-TRA-01, RNF-AUD-01 | Paso 7, RN-11 |
| RNF-BAJ-01, RNF-BAJ-02 | RN-03 |
| RNF-BAJ-04 | Paso 5, RN-03 |
| RNF-INT-01 | RN-11, EX-05 |
| RNF-USA-01 | Paso 8, FA-02 |
| D9, D23, D107 | Relaciones, RN-10 |
| D116 | FA-05, RN-10, RN-12 |
| D119 | Relaciones, RN-02 |
| D10, D16 | Paso 6, RN-02, RN-04, FA-01 |
| D17, D27, D28 | Paso 6, RN-05, FA-02 |
| D20 | Paso 6, RN-06, FA-03 |
| D22 | RN-09 |
| D29, D38, D55, D64 | Paso 2, RN-05, RN-08, FA-02 |
| D33, D110 | RN-01, EX-06 |
| D53, D54 | Paso 2, RN-07, EX-04 |
| D73 | RN-08 |
| D100, D106 | RN-02, EX-01, EX-02, EX-03 |
| D113 | RN-04, RN-05, FA-02 |
