# Compathium

Compathium reúne las conversaciones de un negocio en un Inbox y permite que un agente de IA responda con su conocimiento publicado. Cuando el cliente pide una persona o falta evidencia, la conversación pasa a atención humana con contexto.

El MVP contempla webchat primero y WhatsApp después, un agente de IA por workspace, FAQs, PDFs y un simulador que nunca envía mensajes a clientes. El piloto previsto incluye de uno a tres negocios con configuración manual.

## Estado

Al 29 de octubre de 2026, el repositorio contiene la documentación y, desde DAV-253, un paquete mínimo con tooling (Node 24, pnpm, Vite+, oxlint, oxfmt, Vitest, TypeScript estricto) y los contratos internos zod de `src/contracts`. No hay aplicación, migraciones ni servicios. Los recorridos descritos son criterios de aceptación pendientes, no funciones disponibles.

El stack objetivo es TanStack Start, React 19 y TypeScript, con Better Auth, PostgreSQL con pgvector y Drizzle. Railway alojará dos procesos, `web` y `worker`; Redis con BullMQ ejecutará trabajos y R2 almacenará archivos. OpenAI es el proveedor de IA propuesto y Kapso sigue pendiente de confirmación.

## Documentación

- [Producto](docs/PRODUCT.md): alcance, usuarios y comportamiento del MVP.
- [Plan del MVP](docs/MVP_PLAN.md): fases, dependencias y criterios de aceptación.
- [Diseño técnico](docs/TECHNICAL_DESIGN.md): procesos, contratos y límites de las integraciones.
- [Modelo de datos](docs/DATA_MODEL.md): entidades y relaciones del dominio.
- [Diseño de base de datos](docs/DATABASE_DESIGN.md): tablas propuestas, restricciones, transacciones, KPIs y orden de migraciones.
- [Glosario](GLOSSARY.md): vocabulario del producto.
- [ADRs](docs/adr/): decisiones con su estado de aceptación.
- [Preguntas abiertas](docs/OPEN_QUESTIONS.md): información ausente y defaults sugeridos.
- [Guía para agentes](AGENTS.md): estructura, convenciones y comandos disponibles.

El plan cita un documento maestro que no está disponible en el repositorio. Las decisiones cerradas del plan son la base de esta consolidación; las propuestas del diseño no se convierten en acuerdos por documentarlas.

## Comprobar cambios documentales

Ejecuta `git diff --check` antes de crear un commit. Con código: `pnpm install`, `pnpm lint`, `pnpm format:check`, `pnpm typecheck` y `pnpm test`. `dev:web`, `dev:worker`, `build`, `start:web` y `start:worker` siguen siendo objetivos del futuro scaffold.
