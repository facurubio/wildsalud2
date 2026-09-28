# Casos de uso — WildSalud

Casos de uso detallados del sistema, derivados de los requisitos de [proyecto.md](../proyecto.md)
y de las decisiones de diseño de [decisiones.md](../decisiones.md).

## Convenciones

- **Un caso de uso por acción** (por ejemplo, dar de alta, editar y dar de baja son casos distintos).
- **Un archivo por caso de uso** en esta carpeta, con el nombre `CU-NN-nombre-del-caso.md`.
- **Mismo nivel de detalle** para todos los casos.
- **Formato combinado:**
  - una **ficha** de caso de uso (actor, precondiciones, disparador, flujo principal, flujos alternativos, postcondiciones y reglas de negocio);
  - **escenarios BDD** en Gherkin, con palabras clave en **inglés** (`Feature`, `Scenario`, `Given`, `When`, `Then`), como criterios de aceptación que luego se convierten en casos de prueba. Cada flujo alternativo y cada excepción de la ficha tiene al menos un escenario.
- **Trazabilidad:** cada caso cita los requisitos (`RF-…`, `RNF-…`) y las decisiones (`Dn`) en que se basa, y cada escenario lleva esas referencias como etiquetas (por ejemplo `@RF-PRE-04 @D17`).
- **Diagrama:** diagrama UML de casos de uso en PlantUML, con una imagen SVG exportada.
- La plantilla definitiva se valida con un caso de ejemplo (CU-39 Registrar consumo) antes de escribir el resto.

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
| CU-27 | Registrar pago de deuda congelada |
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
