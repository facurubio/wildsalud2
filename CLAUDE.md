@AGENTS.md

# WildSalud

Aplicación tipo "obra social" para mascotas, con roles administrador, veterinario asociado y dueño afiliado. Todo el proyecto (documentos, código, mensajes y commits) está en **español**.

## Documentos de referencia

Leelos antes de implementar un caso de uso. Si el código y los documentos no coinciden, rigen los documentos: no inventes reglas.

- `docs/alcance-v1.md`: qué entra en la versión actual y las reglas propias de la v1. **Empezá por acá.**
- `docs/casos-de-uso/CU-NN-*.md`: cada caso con su flujo, excepciones con el **mensaje exacto**, reglas (RN) y escenarios Gherkin. Las pruebas salen de esos escenarios.
- `docs/decisiones.md` (Dn) y `docs/proyecto.md` (RF-/RNF-): decisiones de negocio y requisitos.
- `docs/modelo-datos.md`: tablas, columnas y reglas de la base.

## Stack

- Next.js 16 (App Router, TypeScript) con Tailwind y shadcn/ui. Diseño **responsive**: todo se usa desde computadora y desde celular.
- Supabase: base PostgreSQL y Supabase Auth (solo Google en la v1).
- Publicación en Vercel (plan Hobby), proyecto `wildsalud`, región `gru1` (São Paulo). Cada push a `main` publica en producción (base `wildsalud-prod`); las versiones de prueba usan `wildsalud-dev`. No uses funciones exclusivas de Vercel (cron, KV, Blob, Edge Config): la app tiene que poder mudarse.

## Cómo está armado

- **Acceso a datos solo desde el servidor**, con la conexión directa de `src/lib/db.ts` (postgres.js). Las claves públicas de Supabase no tienen permisos sobre ninguna tabla. No uses el cliente de Supabase para leer o escribir datos: solo para el inicio de sesión (`src/lib/supabase/server.ts`).
- **Permisos en el servidor**: cada operación verifica la sesión, que la cuenta esté activa y el rol (CU-02 RN-05), sin depender de ocultar botones.
- **Usuario actual**: `obtenerSesion()` en `src/lib/auth/usuario-actual.ts`. Identifica por la cuenta vinculada, nunca por el email.
- **Fechas**: usá `ahora()` y los períodos de `src/lib/tiempo.ts` (hora de Argentina, reloj fijable en pruebas). Nunca `new Date()` directo en reglas de negocio.
- **Operaciones "todo o nada"** (alta con primer pago, registrar consumo, etc.): en una transacción (`db().begin(...)`), con la auditoría dentro de la misma transacción.
- **Auditoría**: toda acción que modifica datos inserta en `auditoria` (la tabla no admite cambios ni borrados).
- **Nada se borra físicamente**: las bajas y anulaciones cambian un estado.
- **Reglas de negocio** en funciones puras de TypeScript, con pruebas en `*.test.ts` al lado.

## Base de datos: dev y producción

- Proyectos de Supabase: `wildsalud-dev` (ref `lgzkfyqcjnhwagletxds`) y `wildsalud-prod` (ref `bfbeblaiuwubznntxumy`).
- **Los agentes trabajan solo en `wildsalud-dev`.** En `wildsalud-prod` hay datos reales: nunca leas ni modifiques sus datos, y aplicá ahí migraciones solo cuando el usuario lo confirme, después de probarlas en dev.
- Cada cambio de esquema es una migración nueva en `supabase/migrations/` (nunca edites una ya aplicada). El nombre del archivo lleva la versión con que quedó registrada en Supabase.

## Comandos

- `npm run dev`: app local en http://localhost:3000 (necesita `.env.local`, ver `.env.example`).
- `npm test`: pruebas (Vitest).
- `npm run typecheck` y `npm run lint`.
- `npm run build`: compilación de producción. Corré pruebas, tipos y lint antes de dar algo por terminado.

## Seguridad

- El repositorio es **público**: nunca subas claves, contraseñas, `.env.local` ni datos personales (tampoco en pruebas o ejemplos: usá datos inventados).
- No uses herramientas de compra de ningún servicio (planes pagos, créditos, dominios). Todo funciona en planes gratuitos.
