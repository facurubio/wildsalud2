# CU-14 — Editar mascota

| Campo | Valor |
|-------|-------|
| **Actor principal** | Administrador |
| **Objetivo** | Mantener actualizada la ficha de una mascota (datos identificatorios y de salud) y, si la mascota cambia de dueño, asignarla a su dueño nuevo sin perder su afiliación. |
| **Disparador** | El dueño informa un cambio (por ejemplo, la mascota fue castrada, tiene una enfermedad nueva o cambió su alimentación), la mascota pasa a otro dueño, o el administrador detecta un error de carga. |
| **Relaciones** | La ficha se crea en CU-13 Dar de alta mascota. La mascota se ubica con CU-33 Buscar/filtrar dueños y mascotas. El plan y la cobertura se gestionan en CU-22, CU-23 y CU-24, y los pagos en CU-26; la deuda que impide cambiar de dueño se paga en CU-26. El veterinario consulta la ficha en CU-38 y el dueño ve a su mascota en CU-40. Los pagos agrupados por dueño se consultan en CU-35. Los cambios quedan en CU-36 Consultar historial de auditoría. El cambio de dueño se hace en este caso y no con una baja (CU-15). La ficha de una mascota dada de baja no se edita: si vuelve, primero se la reactiva con CU-51 Reactivar mascota. |

## Precondiciones

1. El administrador inició sesión (CU-02).
2. La mascota está registrada y no está dada de baja.

## Flujo principal

1. El administrador abre la ficha de la mascota y elige **Editar**.
2. El sistema muestra la ficha con los datos **editables** (foto, nombre, especie, raza, sexo, color, castrado/a, enfermedades previas o crónicas, alimentación y edad aproximada) y, como **solo lectura**, el número de afiliado, la fecha de alta, el plan y el estado de la cobertura. Muestra también el dueño, con la opción **Cambiar dueño** (FA-03).
3. El administrador modifica uno o más datos de la ficha y elige **Guardar**.
4. El sistema valida las reglas **RN-01** a **RN-04**.
5. El sistema verifica que la ficha no haya cambiado desde que la abrió (**RN-05**) y guarda los cambios.
6. El sistema deja el registro de auditoría de cada dato modificado, con su valor anterior y su valor nuevo (**RN-06**).
7. El sistema confirma: *"Los datos de {mascota} se actualizaron."* Desde ese momento, el veterinario y el dueño ven la ficha actualizada (**RN-07**).

## Flujos alternativos

| ID | Paso | Situación | Resultado |
|----|------|-----------|-----------|
| **FA-01** | 3 | El administrador cancela. | No se guarda ningún cambio. |
| **FA-02** | 3 | El administrador reemplaza la foto o la quita. | La foto nueva se reduce automáticamente a un JPG de 1600 px en el lado mayor y se guarda solo esa versión; si se quita, la ficha queda sin foto. La foto anterior no se borra: queda en el historial y la auditoría registra el cambio (**RN-06**). |
| **FA-03** | 2 | **Cambiar dueño.** El administrador elige **Cambiar dueño**. | El sistema pide el DNI del dueño nuevo y muestra su nombre y lo que va a pasar: la mascota conserva su número de afiliado, su cobertura, su plan, su antigüedad, su cambio pendiente, sus pagos y sus consumos (**RN-10**); el dueño anterior deja de verla (**RN-13**); y los pagos siguientes proponen la forma de pago preferida del dueño nuevo (**RN-14**). El administrador confirma. El sistema valida **RN-01**, **RN-04**, **RN-11** y **RN-12**, cambia el dueño, deja la auditoría con el dueño anterior y el nuevo, y confirma: *"{mascota} ahora pertenece a {dueño nuevo}."* El cambio de dueño se confirma aparte de los demás datos de la ficha. |

## Excepciones

En todas las excepciones **no se guarda ningún cambio**, y el sistema informa el motivo. Aunque la pantalla muestra como solo lectura lo que no se puede editar, el sistema vuelve a validar al guardar (RNF-SEG-07).

| ID | Paso | Situación | Mensaje |
|----|------|-----------|---------|
| **EX-01** | 4 | Falta un dato obligatorio. | *"Completá el campo {campo}."* |
| **EX-02** | 4 | La edad aproximada no es un número entero entre 0 y 30. | *"Ingresá la edad aproximada en años: un número entero entre 0 y 30."* |
| **EX-03** | 4 | Un dato de texto supera su largo máximo. | *"El campo {campo} admite hasta {N} caracteres."* |
| **EX-04** | 4 | La foto nueva no es JPG, PNG ni HEIC. | *"La foto tiene que ser JPG, PNG o HEIC."* |
| **EX-05** | 4 | La foto nueva pesa más de 20 MB. | *"La foto no puede pesar más de 20 MB."* |
| **EX-06** | 4 | No se modificó ningún dato. | *"No hay cambios para guardar."* |
| **EX-07** | 5 | Otro administrador modificó la ficha o el dueño mientras se editaba. | *"Los datos de {mascota} cambiaron mientras los editabas. Revisalos y volvé a guardar."* |
| **EX-08** | 4 | La mascota está dada de baja, o la dieron de baja mientras se editaba. | *"La mascota {mascota} está dada de baja y su ficha no se puede modificar."* |
| **EX-09** | 4 | Se intenta modificar el número de afiliado (por ejemplo, enviando el pedido sin usar la pantalla). | *"El número de afiliado de una mascota no se puede modificar."* |
| **EX-10** | 4 | Un usuario que no es administrador (veterinario o dueño) intenta modificar la ficha o el dueño. | *"No tenés permiso para hacer esta operación."* |
| **EX-11** | 3 | El mismo envío llega dos veces (doble clic o reintento de red). | Los cambios se guardan **una sola** vez y la auditoría registra un solo cambio por dato. El segundo envío devuelve el mismo resultado que el primero y no se informa como un cambio de otro administrador (EX-07). |
| **EX-12** | FA-03 | No hay ningún dueño con el DNI ingresado. | *"No hay ningún dueño con el DNI {DNI}."* |
| **EX-13** | FA-03 | El DNI es del dueño actual. | *"{mascota} ya pertenece a {dueño}."* |
| **EX-14** | FA-03 | El dueño nuevo está dado de baja. | *"{dueño nuevo} tiene la cuenta inactiva. Para asignarle una mascota, primero reactivá su cuenta desde su ficha."* |
| **EX-15** | FA-03 | La mascota tiene deuda: períodos impagos y vencidos de su cobertura o deuda congelada de una cobertura anterior. | *"{mascota} tiene deuda pendiente. Registrá esos pagos antes de cambiar su dueño."* |
| **EX-16** | FA-03 | El dueño nuevo tiene deuda de alguna de sus mascotas. | *"{dueño nuevo} tiene deuda pendiente de {otra mascota}. No se le puede asignar una mascota hasta saldarla."* |

## Postcondiciones

- **Éxito (ficha):** la ficha de la mascota queda actualizada, cada dato modificado queda auditado con su valor anterior y nuevo, y el veterinario (CU-38) y el dueño (CU-40) ven los datos nuevos.
- **Éxito (cambio de dueño):** la mascota pertenece al dueño nuevo, con el mismo número de afiliado, la misma cobertura y todo su historial. El dueño anterior deja de verla y el nuevo la ve como propia. El cambio queda auditado.
- **Fracaso:** la ficha y el dueño no cambian, y no se registra nada en la auditoría.

## Reglas de negocio

| ID | Regla | Origen |
|----|-------|--------|
| **RN-01** | **Solo el administrador.** La ficha completa y el dueño los modifica únicamente el administrador. El veterinario solo consulta la ficha y el dueño edita solo su propio teléfono y dirección (CU-42). El sistema lo verifica en cada pedido, no solo ocultando opciones. | RF-DUE-02, RF-ROL-11, RNF-SEG-07, D33, D110 |
| **RN-02** | **Qué se edita.** Todos los datos de la ficha (RF-MAS-01) y, con FA-03, el dueño. No se editan: el número de afiliado, que es permanente; la fecha de alta; ni el plan, la cobertura o los pagos, que tienen sus propios casos. Editar la ficha no cambia la cobertura, los pagos, los consumos ni la antigüedad. Se puede editar tenga o no cobertura vigente. | RF-MAS-01, RF-MAS-04, D23, D119 |
| **RN-03** | **Mismas validaciones que el alta.** Datos obligatorios, valores permitidos, largos máximos, edad aproximada y foto, según CU-13 RN-04 y RN-05. La especie es texto libre. La edad nueva se guarda tal como se carga. La foto se acepta en JPG, PNG o HEIC de hasta 20 MB y se guarda solo reducida a un JPG de 1600 px en el lado mayor. | RF-MAS-01, D41, D103, D114 |
| **RN-04** | **Mascota no dada de baja.** La ficha de una mascota dada de baja se puede consultar en el historial, pero no modificar, y tampoco se le cambia el dueño. Si la mascota vuelve, primero se la reactiva (CU-51) y después se edita. | RNF-BAJ-03, D107 |
| **RN-05** | **Sin sobrescribir en silencio.** Si la ficha o el dueño cambiaron desde que el administrador abrió la edición, no se guarda y se le pide revisarla. | RNF-INT-01 |
| **RN-06** | **Auditoría con valor anterior y nuevo.** Por cada dato modificado, incluido el dueño, se registran el dato, el valor anterior, el valor nuevo, el usuario y la fecha y hora. Los datos que no cambiaron no se registran. No se pide motivo. Si se reemplaza o se quita la foto, la anterior se conserva y la auditoría la referencia. | RF-TRA-01, RNF-AUD-01, RNF-BAJ-01, D85 |
| **RN-07** | **Visible al instante.** El veterinario ve la ficha con las actualizaciones posteriores al alta, y el dueño ve los datos actualizados de su mascota. | RF-ROL-04, RF-ROL-07 |
| **RN-08** | **Una sola vez.** Cada envío se procesa una sola vez. | RNF-INT-01 |
| **RN-09** | **Cambio de dueño sin baja.** Cuando la mascota pasa a otro dueño, no se la da de baja ni se la da de alta de nuevo: se cambia el dueño asignado con FA-03. La mascota sigue teniendo un único dueño. | RF-MAS-02, D119 |
| **RN-10** | **Qué se conserva al cambiar de dueño.** Todo: el número de afiliado, la cobertura con su estado, su plan y su antigüedad, el cambio pendiente, los pagos, los consumos y el historial (D122). | D23, D119 |
| **RN-11** | **Mascota sin deuda.** No se cambia el dueño de una mascota con períodos impagos y vencidos o con deuda congelada: primero se salda con CU-26. La cuota del mes en curso impaga hasta el día 13 inclusive no es deuda: queda pendiente a cargo del dueño nuevo. La deuda de otras mascotas del dueño anterior no impide el cambio y sigue a su nombre (D123). | D17, D38 |
| **RN-12** | **Dueño nuevo.** Se identifica por su DNI. Tiene que ser distinto del actual, no estar dado de baja (su cuenta puede estar *Invitado* o *Activo*) y no tener deuda de ninguna de sus mascotas. Se valida en ese orden, y otra vez al confirmar (D124). | D45, D55, D104 |
| **RN-13** | **Qué ve cada dueño.** Desde el cambio, el dueño anterior deja de ver la mascota (en "Mis mascotas", sus prestaciones y sus alertas). El dueño nuevo la ve como propia, con lo mismo que ve de sus otras mascotas: solo los consumos del período en curso. El veterinario ve los datos del dueño nuevo (D125). | RF-ROL-04, RF-ROL-09, RNF-SEG-03, D79 |
| **RN-14** | **Pagos después del cambio.** Los pagos no guardan el dueño: pertenecen a la mascota. Los pagos agrupados por dueño (CU-35) se agrupan por el dueño **actual** de cada mascota, así que todos los pagos de la mascota, incluso los anteriores al cambio, pasan a verse bajo el dueño nuevo. Desde el cambio, cada pago propone la forma de pago preferida del dueño nuevo. | RF-PAG-10, D7, D121 |

## Datos que se registran

| Dato | Descripción |
|------|-------------|
| Mascota | Los datos modificados de la ficha o el dueño nuevo, la fecha y hora de la última modificación y el administrador que la hizo. |
| Foto | La versión reducida de la foto nueva (JPG de 1600 px en el lado mayor). La foto anterior se conserva en el historial; no se borra. |
| Auditoría | Por cada dato modificado, incluido el dueño: dato, valor anterior, valor nuevo, usuario, fecha y hora. |

## Escenarios de aceptación

```gherkin
@CU-14
Feature: CU-14 Editar mascota
  Como administrador
  Quiero mantener actualizada la ficha de una mascota y su dueño
  Para que el veterinario la atienda con información correcta y la mascota esté a nombre de quien corresponde

  Background:
    Given la fecha y hora actual es "20/10/2026 10:00", salvo que el escenario indique otra
    And el administrador "Marta Ruiz" inició sesión
    And la mascota "Luna", con número de afiliado "000123", pertenece a la dueña "Carla Gómez", DNI "30111222", con forma de pago preferida "Transferencia bancaria"
    And "Luna" tiene cobertura "Al día" con el plan "Plan Base", 4 períodos pagos, la cuota de octubre 2026 pagada y sin deuda
    And, salvo que el escenario indique otra cosa, el dueño "Pedro Sosa", DNI "28999888", tiene la cuenta en estado "Activo", forma de pago preferida "Efectivo" y ninguna deuda
    And la ficha de "Luna" es:
      | dato                            | valor           |
      | nombre                          | Luna            |
      | especie                         | Perro           |
      | raza                            | Mestizo         |
      | sexo                            | Hembra          |
      | color                           | Negro           |
      | castrado/a                      | No              |
      | enfermedades previas o crónicas |                 |
      | alimentación                    | Balanceado seco |
      | edad aproximada                 | 3               |
      | foto                            | luna.jpg        |

  @flujo-principal @RF-MAS-01 @D33 @D103
  Scenario: Actualizar datos de salud de la ficha
    When el administrador cambia en la ficha de "Luna" castrado/a a "Sí" y enfermedades previas o crónicas a "Dermatitis alérgica", y guarda
    Then la ficha de "Luna" tiene castrado/a "Sí" y enfermedades previas o crónicas "Dermatitis alérgica"
    And el número de afiliado "000123" y la dueña "Carla Gómez" no cambian
    And la cobertura de "Luna" sigue "Al día" con el plan "Plan Base" y 4 períodos pagos
    And el sistema informa "Los datos de Luna se actualizaron."

  @RN-06 @RF-TRA-01 @RNF-AUD-01 @D85
  Scenario: La auditoría registra cada dato modificado con su valor anterior y nuevo
    When el administrador cambia en la ficha de "Luna" la edad aproximada a 4 y el color a "Negro y blanco", y guarda
    Then la auditoría registra:
      | dato            | valor anterior | valor nuevo    | usuario    | fecha y hora     |
      | edad aproximada | 3              | 4              | Marta Ruiz | 20/10/2026 10:00 |
      | color           | Negro          | Negro y blanco | Marta Ruiz | 20/10/2026 10:00 |
    And la auditoría no registra los datos que no cambiaron

  @RN-07 @RF-ROL-07
  Scenario: El veterinario ve la ficha actualizada
    Given el administrador cambió las enfermedades previas o crónicas de "Luna" a "Dermatitis alérgica"
    When un veterinario abre la ficha de "Luna"
    Then ve las enfermedades previas o crónicas "Dermatitis alérgica"

  @RN-02 @D23 @D119
  Scenario: Lo que no se edita se muestra como solo lectura y el dueño se cambia aparte
    When el administrador abre la edición de la ficha de "Luna"
    Then el número de afiliado, la fecha de alta, el plan y el estado de la cobertura se muestran como solo lectura
    And la dueña "Carla Gómez" se muestra con la opción "Cambiar dueño"

  @FA-01
  Scenario: El administrador cancela
    When el administrador cambia en la ficha de "Luna" el color a "Marrón" y cancela
    Then el color de "Luna" sigue siendo "Negro"
    And la auditoría no registra ningún cambio

  @FA-02 @RN-06 @RNF-BAJ-01 @D85 @D114
  Scenario Outline: Reemplazar o quitar la foto
    When el administrador <acción> de "Luna" y guarda
    Then la foto de "Luna" es "<foto nueva>"
    And la foto "luna.jpg" se conserva en el historial
    And la auditoría registra el cambio de foto con usuario "Marta Ruiz"

    Examples:
      | acción                                       | foto nueva                                 |
      | reemplaza la foto por "luna-2026.png" (2 MB) | un JPG de 1600 px en el lado mayor         |
      | quita la foto                                | sin foto                                   |

  @FA-02 @RN-03 @D114
  Scenario: Una foto HEIC se guarda como JPG reducido
    When el administrador reemplaza la foto de "Luna" por "luna.heic" de 8 MB y 4032 x 3024 px, y guarda
    Then la foto guardada de "Luna" es un JPG de 1600 x 1200 px
    And no se guarda el archivo "luna.heic" original

  @EX-01 @RN-03 @RF-MAS-01 @D103
  Scenario Outline: Datos obligatorios
    When el administrador <cambio> en la ficha de "Luna" y guarda
    Then la ficha de "Luna" no cambia
    And el sistema informa "Completá el campo <campo>."

    Examples:
      | cambio                   | campo           |
      | borra el nombre          | Nombre          |
      | borra la especie         | Especie         |
      | borra el sexo            | Sexo            |
      | borra castrado/a         | Castrado/a      |
      | borra la edad aproximada | Edad aproximada |

  @EX-02 @EX-03 @RN-03 @D41 @D103
  Scenario Outline: Formato de la edad y largo de los textos
    When el administrador cambia en la ficha de "Luna" <campo> a <valor> y guarda
    Then el resultado es "<resultado>"

    Examples:
      | campo           | valor                  | resultado                                                          |
      | edad aproximada | 4                      | Los datos de Luna se actualizaron.                                 |
      | edad aproximada | 31                     | Ingresá la edad aproximada en años: un número entero entre 0 y 30. |
      | edad aproximada | 3,5                    | Ingresá la edad aproximada en años: un número entero entre 0 y 30. |
      | alimentación    | un texto de 500 letras | Los datos de Luna se actualizaron.                                 |
      | alimentación    | un texto de 501 letras | El campo Alimentación admite hasta 500 caracteres.                 |
      | especie         | "Perro mestizo"        | Los datos de Luna se actualizaron.                                 |
      | especie         | un texto de 31 letras  | El campo Especie admite hasta 30 caracteres.                       |

  @EX-04 @EX-05 @RN-03 @D114
  Scenario Outline: Formato y tamaño de la foto
    When el administrador reemplaza la foto de "Luna" por "<foto>" de <tamaño> y guarda
    Then el resultado es "<resultado>"

    Examples:
      | foto      | tamaño  | resultado                              |
      | luna.jpg  | 20 MB   | Los datos de Luna se actualizaron.     |
      | luna.heic | 20 MB   | Los datos de Luna se actualizaron.     |
      | luna.jpg  | 20,1 MB | La foto no puede pesar más de 20 MB.   |
      | luna.gif  | 1 MB    | La foto tiene que ser JPG, PNG o HEIC. |

  @EX-06
  Scenario: Guardar sin cambios
    When el administrador guarda la ficha de "Luna" sin modificarla
    Then la auditoría no registra ningún cambio
    And el sistema informa "No hay cambios para guardar."

  @EX-07 @RN-05 @RNF-INT-01
  Scenario: Otro administrador modificó la ficha mientras se editaba
    Given el administrador "Marta Ruiz" abrió la edición de la ficha de "Luna"
    And el administrador "Jorge Paz" cambió la edad aproximada de "Luna" a 4
    When "Marta Ruiz" cambia el color de "Luna" a "Negro y blanco" y guarda
    Then el color de "Luna" sigue siendo "Negro"
    And la edad aproximada de "Luna" es 4
    And el sistema informa "Los datos de Luna cambiaron mientras los editabas. Revisalos y volvé a guardar."

  @EX-08 @RN-04 @RNF-BAJ-03 @D107
  Scenario Outline: No se puede modificar la ficha de una mascota dada de baja
    Given <situación>
    When "Marta Ruiz" cambia el color de "Luna" a "Marrón" y guarda
    Then el color de "Luna" sigue siendo "Negro"
    And el sistema informa "La mascota Luna está dada de baja y su ficha no se puede modificar."

    Examples:
      | situación                                                                                              |
      | "Luna" está dada de baja                                                                               |
      | "Marta Ruiz" abrió la edición de la ficha de "Luna" y el administrador "Jorge Paz" dio de baja a "Luna" |

  @EX-09 @RN-02 @RNF-SEG-07 @D23
  Scenario: El número de afiliado no se modifica
    When el administrador envía sin usar la pantalla un cambio del número de afiliado de "Luna" a "000999"
    Then el número de afiliado de "Luna" sigue siendo "000123"
    And el sistema informa "El número de afiliado de una mascota no se puede modificar."

  @EX-10 @RN-01 @RF-ROL-11 @RF-DUE-02 @RNF-SEG-07 @D33 @D110
  Scenario Outline: Solo el administrador modifica la ficha y el dueño
    Given <usuario> inició sesión
    When ese usuario envía sin usar la pantalla <cambio> de "Luna"
    Then la ficha y la dueña de "Luna" no cambian
    And el sistema informa "No tenés permiso para hacer esta operación."

    Examples:
      | usuario                    | cambio                                 |
      | el veterinario "Ana López" | un cambio de la alimentación           |
      | la dueña "Carla Gómez"     | un cambio de la alimentación           |
      | la dueña "Carla Gómez"     | un cambio de dueño a "Pedro Sosa"      |

  @EX-11 @RN-08 @RNF-INT-01
  Scenario: Un envío que llega dos veces guarda los cambios una sola vez
    When el administrador cambia el color de "Luna" a "Marrón", guarda y el mismo envío llega dos veces
    Then el color de "Luna" es "Marrón"
    And la auditoría registra un solo cambio de color
    And el sistema informa "Los datos de Luna se actualizaron."

  @FA-03 @RN-09 @RN-06 @RF-MAS-02 @D85 @D119
  Scenario: Cambiar el dueño de una mascota
    When el administrador elige "Cambiar dueño" para "Luna", ingresa el DNI "28999888" y confirma
    Then "Luna" pertenece a "Pedro Sosa"
    And "Luna" no se dio de baja y conserva el número de afiliado "000123"
    And la auditoría registra el cambio de dueño de "Luna", con valor anterior "Carla Gómez", valor nuevo "Pedro Sosa", usuario "Marta Ruiz" y fecha "20/10/2026 10:00"
    And el sistema informa "Luna ahora pertenece a Pedro Sosa."

  @FA-03 @RN-10 @D23 @D119
  Scenario: Al cambiar de dueño se conserva la cobertura con todo su historial
    Given "Luna" tiene 4 pagos, 2 consumos en octubre 2026 y un cambio pendiente al plan "Plan Plus" con vigencia "01/11/2026"
    When el administrador cambia el dueño de "Luna" a "Pedro Sosa" y confirma
    Then la cobertura de "Luna" sigue "Al día" con el plan "Plan Base" y 4 períodos pagos
    And "Luna" conserva sus 4 pagos, sus 2 consumos y el cambio pendiente al plan "Plan Plus"

  @FA-03 @RN-13 @RF-ROL-04 @RNF-SEG-03 @D79
  Scenario: Después del cambio, cada dueño ve lo que le corresponde
    Given "Luna" tiene 2 consumos de "Consulta" en octubre 2026 y 1 en septiembre 2026
    When el administrador cambia el dueño de "Luna" a "Pedro Sosa" y confirma
    Then "Carla Gómez" ya no ve a "Luna" en "Mis mascotas"
    And "Pedro Sosa" ve a "Luna" en "Mis mascotas" con cobertura "Al día" y los 2 consumos de octubre 2026, pero no el de septiembre
    And un veterinario que busca "000123" ve como dueño a "Pedro Sosa"

  @FA-03 @RN-14 @RF-PAG-10 @D7 @D121
  Scenario: Después del cambio, los pagos de la mascota se agrupan bajo el dueño nuevo
    Given "Luna" tiene los pagos de los períodos "2026-07" a "2026-10" registrados cuando pertenecía a "Carla Gómez"
    And el "20/10/2026" el administrador cambió el dueño de "Luna" a "Pedro Sosa"
    And el "05/11/2026" se registró el pago del período "2026-11" de "Luna", con la forma de pago propuesta
    When el administrador consulta los pagos agrupados por dueño
    Then los pagos de "Luna" de "2026-07" a "2026-11" aparecen bajo "Pedro Sosa"
    And no aparece ningún pago de "Luna" bajo "Carla Gómez"
    And el pago de "2026-11" tiene la forma de pago preferida de "Pedro Sosa"

  @FA-03 @RN-11 @D17
  Scenario: La cuota del mes todavía no vencida no impide el cambio y pasa al dueño nuevo
    Given la fecha y hora actual es "10/10/2026 10:00"
    And la cuota de octubre 2026 de "Luna" está impaga
    When el administrador cambia el dueño de "Luna" a "Pedro Sosa" y confirma
    Then "Luna" pertenece a "Pedro Sosa"
    And "Pedro Sosa" ve la cuota de octubre 2026 de "Luna" como "Pendiente, vence el 13/10"

  @EX-12 @EX-13 @EX-14 @EX-16 @RN-12 @D55 @D104
  Scenario Outline: Requisitos del dueño nuevo
    Given <situación>
    When el administrador elige "Cambiar dueño" para "Luna", ingresa el DNI "<DNI>" y confirma
    Then "Luna" sigue perteneciendo a "Carla Gómez"
    And el sistema informa "<mensaje>"

    Examples:
      | situación                                                                                    | DNI      | mensaje                                                                                                  |
      | ningún dueño tiene el DNI "99999999"                                                         | 99999999 | No hay ningún dueño con el DNI 99999999.                                                                 |
      | "Luna" pertenece a "Carla Gómez"                                                             | 30111222 | Luna ya pertenece a Carla Gómez.                                                                         |
      | "Pedro Sosa" está dado de baja                                                               | 28999888 | Pedro Sosa tiene la cuenta inactiva. Para asignarle una mascota, primero reactivá su cuenta desde su ficha. |
      | la cobertura de "Rocco", de "Pedro Sosa", está "Suspendida por falta de pago" con el período "2026-10" impago | 28999888 | Pedro Sosa tiene deuda pendiente de Rocco. No se le puede asignar una mascota hasta saldarla. |

  @RN-12 @D104
  Scenario: El dueño nuevo puede estar todavía invitado
    Given la cuenta de "Pedro Sosa" está en estado "Invitado"
    When el administrador cambia el dueño de "Luna" a "Pedro Sosa" y confirma
    Then "Luna" pertenece a "Pedro Sosa"

  @EX-15 @RN-11 @D38
  Scenario Outline: No se cambia el dueño de una mascota con deuda
    Given <deuda de la mascota>
    When el administrador cambia el dueño de "Luna" a "Pedro Sosa" y confirma
    Then "Luna" sigue perteneciendo a "Carla Gómez"
    And el sistema informa "Luna tiene deuda pendiente. Registrá esos pagos antes de cambiar su dueño."

    Examples:
      | deuda de la mascota                                                                              |
      | la cobertura de "Luna" está "Suspendida por falta de pago" con el período "2026-10" impago      |
      | "Luna" no tiene cobertura vigente y su última cobertura quedó con el período "2026-06" congelado |

  @RN-11
  Scenario: La deuda de otra mascota del dueño anterior no impide el cambio
    Given "Carla Gómez" también tiene la mascota "Toby" con la cobertura "Suspendida por falta de pago" y el período "2026-10" impago
    When el administrador cambia el dueño de "Luna" a "Pedro Sosa" y confirma
    Then "Luna" pertenece a "Pedro Sosa"
    And la deuda de "Toby" sigue a nombre de "Carla Gómez"

  @EX-07 @RN-05 @RNF-INT-01
  Scenario: El dueño cambió mientras se editaba
    Given el administrador "Marta Ruiz" abrió la edición de la ficha de "Luna"
    And el administrador "Jorge Paz" cambió el dueño de "Luna" a "Pedro Sosa"
    When "Marta Ruiz" cambia el color de "Luna" a "Marrón" y guarda
    Then el color de "Luna" sigue siendo "Negro"
    And el sistema informa "Los datos de Luna cambiaron mientras los editabas. Revisalos y volvé a guardar."
```

## Trazabilidad

| Requisito / decisión | Dónde se cubre |
|----------------------|----------------|
| RF-MAS-01 | Paso 2, RN-02, RN-03, EX-01 a EX-05 |
| RF-MAS-02 | FA-03, RN-09 |
| RF-MAS-04 | Paso 2, RN-02, EX-09 |
| RF-DUE-02 | RN-01, EX-10 |
| RF-PAG-10 | RN-14 |
| RF-ROL-04, RF-ROL-07, RF-ROL-09 | Paso 7, RN-07, RN-13 |
| RF-ROL-11, RNF-SEG-07 | RN-01, EX-09, EX-10, nota de Excepciones |
| RF-TRA-01, RNF-AUD-01 | Paso 6, FA-03, RN-06 |
| RNF-BAJ-01 | FA-02, RN-06 (se conserva la foto anterior) |
| RNF-BAJ-03 | RN-04, EX-08 |
| RNF-INT-01 | Paso 5, RN-05, RN-08, EX-07, EX-11 |
| RNF-SEG-03 | RN-13 |
| RNF-USA-01 | Paso 7, FA-03 |
| D7 | RN-14 |
| D17, D38 | RN-11, EX-15 |
| D23 | Paso 2, RN-02, RN-10, EX-09 |
| D33, D110 | RN-01, EX-10 |
| D41, D103 | RN-03, EX-01 a EX-03 |
| D45, D55, D104 | RN-12, EX-12 a EX-14, EX-16 |
| D79 | RN-13 |
| D85 | Paso 6, RN-06, FA-02, FA-03 |
| D107 | Relaciones, RN-04 |
| D114 | FA-02, RN-03, EX-04, EX-05 |
| D119 | FA-03, RN-02, RN-09, RN-10 |
| D122 a D125 | RN-10 a RN-13 |
| D121 | RN-14 |
