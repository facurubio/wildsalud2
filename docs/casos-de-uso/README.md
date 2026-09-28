# Casos de uso — WildSalud

Casos de uso detallados del sistema, derivados de los requisitos de [proyecto.md](../proyecto.md)
y de las decisiones de diseño de [decisiones.md](../decisiones.md).

## Convenciones

- **Un caso de uso por acción** (por ejemplo, dar de alta, editar y dar de baja son casos distintos).
- **Un archivo por caso de uso** en esta carpeta, con el nombre `CU-NN-nombre-del-caso.md`.
- **Formato combinado:** una **ficha** de caso de uso y **escenarios BDD** en Gherkin que luego se convierten en casos de prueba.
- **Estructura de cada archivo**, en este orden:
  1. Encabezado (actor principal, objetivo, disparador, relaciones con otros casos)
  2. Precondiciones
  3. Flujo principal (pasos numerados)
  4. Flujos alternativos (`FA-NN`): situaciones que terminan bien
  5. Excepciones (`EX-NN`): situaciones rechazadas, cada una con el **mensaje exacto** que muestra el sistema
  6. Postcondiciones (éxito y fracaso)
  7. Reglas de negocio (`RN-NN`), cada una con su origen (requisitos y decisiones)
  8. Datos que se registran (cuando el caso crea o modifica información)
  9. Escenarios de aceptación en Gherkin
  10. Trazabilidad (requisito o decisión → paso, regla o escenario que lo cubre)
- **Gherkin:** palabras clave en **inglés** (`Feature`, `Background`, `Scenario`, `Scenario Outline`, `Given`, `When`, `Then`, `Examples`) y texto de los pasos en **español**. Cada flujo alternativo, excepción y regla relevante tiene al menos un escenario; los casos límite se escriben como `Scenario Outline` con `Examples`.
- **Etiquetas:** el `Feature` lleva el ID del caso (`@CU-39`) y cada escenario lleva el flujo que prueba (`@FA-01`, `@EX-04`, `@RN-02`) más los requisitos y decisiones que cubre (`@RF-PRE-04 @D17`).
- **Mismo nivel de detalle** para todos los casos. El caso de referencia es [CU-39 Registrar consumo](CU-39-registrar-consumo.md).
- **Diagrama:** diagrama UML de casos de uso en PlantUML, con una imagen SVG exportada.

## Lista de casos de uso

### Todos los roles

| ID | Caso de uso |
|----|-------------|
| CU-01 | Vincular cuenta por invitación |
| CU-02 | Iniciar sesión con Google/Apple |
| CU-03 | Cerrar sesión |

### Administrador

| ID | Caso de uso |
|----|-------------|
| CU-04 | Dar de alta veterinario |
| CU-05 | Editar veterinario |
| CU-06 | Dar de baja veterinario |
| CU-07 | Reactivar veterinario |
| CU-08 | Dar de alta dueño |
| CU-09 | Editar dueño |
| CU-10 | Dar de baja dueño (en cascada) |
| CU-11 | Reactivar dueño |
| CU-12 | Reenviar invitación |
| CU-13 | Dar de alta mascota (`«include»` CU-22) |
| CU-14 | Editar mascota |
| CU-15 | Dar de baja mascota |
| CU-16 | Crear plan |
| CU-17 | Editar plan |
| CU-18 | Desactivar plan |
| CU-19 | Reactivar plan |
| CU-20 | Crear tipo de prestación |
| CU-21 | Editar tipo de prestación |
| CU-22 | Asignar plan a una mascota |
| CU-23 | Cambiar plan de una mascota |
| CU-24 | Dar de baja el plan de una mascota |
| CU-25 | Cancelar cambio pendiente |
| CU-26 | Registrar pago |
| ~~CU-27~~ | ~~Registrar pago de deuda congelada~~ — unido a CU-26 Registrar pago |
| CU-28 | Anular pago |
| CU-29 | Corregir pago |
| CU-30 | Corregir consumo |
| CU-31 | Anular consumo |
| CU-32 | Ver panel global |
| CU-33 | Buscar/filtrar dueños y mascotas |
| CU-34 | Consultar historial de pagos por mascota |
| CU-35 | Consultar pagos agrupados por dueño |
| CU-36 | Consultar historial de auditoría |

### Veterinario asociado

| ID | Caso de uso |
|----|-------------|
| CU-37 | Buscar mascota |
| CU-38 | Consultar ficha y cobertura |
| CU-39 | Registrar consumo |

### Dueño afiliado

| ID | Caso de uso |
|----|-------------|
| CU-40 | Consultar mis mascotas y su cobertura |
| CU-41 | Consultar prestaciones disponibles/consumidas |
| CU-42 | Modificar teléfono y dirección |
| CU-43 | Ver alertas |

### Sistema (procesos automáticos)

| ID | Caso de uso |
|----|-------------|
| CU-44 | Suspender cobertura por falta de pago |
| CU-45 | Dar de baja cobertura por deuda |
| CU-46 | Aplicar cambios programados |
| CU-47 | Enviar aviso de vencimiento |
| CU-48 | Enviar aviso de suspensión |
| CU-49 | Enviar aviso de baja inminente |
| CU-50 | Enviar aviso de baja por deuda |
