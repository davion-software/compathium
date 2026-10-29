# Guía para trabajar en Compathium

## Propósito y estado

Compathium es un Inbox para negocios con respuestas de IA basadas en conocimiento publicado y derivación a atención humana. El repositorio contiene la documentación y un paquete mínimo (tooling y contratos zod en `src/contracts`, DAV-253). No presupongas que existen servicios desplegados, aplicación, migraciones o integraciones verificadas.

## Stack objetivo

- TanStack Start, React 19 y TypeScript para la aplicación.
- Tailwind v4 y Base UI para la interfaz.
- Better Auth con plugin `organization` para identidad, membresías e invitaciones.
- PostgreSQL con extensión pgvector y Drizzle para esquema y migraciones.
- Railway con procesos separados `web` y `worker`; Redis y BullMQ para trabajo asíncrono; SSE para actualizaciones.
- Cloudflare R2 privado para PDFs y adjuntos.
- Gateway propio con `ChatProvider` y `EmbeddingProvider` separados. OpenAI y embeddings de 1024 dimensiones son propuestas del ADR 0002.
- Webchat primero. WhatsApp mediante `ChannelAdapter`; Kapso pendiente. Sentry y logs JSON con `correlation_id` previstos.

Estos son acuerdos y propuestas locales, no una verificación de versiones, precios o capacidades actuales de los proveedores.

## Estructura y mapa documental

| Ruta actual | Contenido y uso |
|---|---|
| [README.md](README.md) | Entrada al proyecto y estado real. |
| [GLOSSARY.md](GLOSSARY.md) | Términos del dominio, sin detalles de implementación. |
| [docs/PRODUCT.md](docs/PRODUCT.md) | Alcance y comportamiento funcional. |
| [docs/MVP_PLAN.md](docs/MVP_PLAN.md) | Orden de construcción y criterios por fase. |
| [docs/TECHNICAL_DESIGN.md](docs/TECHNICAL_DESIGN.md) | Arquitectura y flujos entre procesos. |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Relaciones e invariantes del dominio. |
| [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md) | Referencia única del esquema físico y de las definiciones propuestas de KPIs. |
| [docs/adr/](docs/adr/) | Decisiones numeradas con estado explícito. |
| [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) | Dudas, consecuencias, defaults y momento de resolución. |

La estructura de código prevista, todavía inexistente, es un solo paquete con `src/web`, `src/worker`, `src/modules`, `src/db` y `src/contracts`. Los módulos previstos son `identity`, `contacts`, `channels`, `conversations`, `knowledge`, `agents` y `analytics`. No crear `apps` y `packages` hasta que exista un segundo consumidor real.

## Convenciones

- Escribe documentación en español y nombra archivos documentales en inglés `UPPER_SNAKE_CASE.md`. Conserva `README.md`, `AGENTS.md` y `GLOSSARY.md`.
- Usa `git mv` para renombrar documentos y actualiza todos los enlaces relativos. Los ADRs usan `docs/adr/NNNN_TITLE.md`, con cuatro cifras consecutivas.
- Conserva la historia de las decisiones aceptadas. Una decisión que las sustituya necesita otro ADR y un enlace desde el anterior.
- Distingue decisión aceptada, diseño propuesto y resultado comprobado. No cierres dudas por ausencia de respuesta.
- La UI llama workspace al tenant; el diseño técnico usa `organization` y `organization_id`. No crees una segunda tabla `workspaces`.
- Cada operación de negocio recibe tenant verificado, también jobs, archivos, SSE y retrieval. Sesión activa y pertenencia no sustituyen permisos.
- Mantén idempotencia de entrada y salida, pausa de IA al atender una persona y separación entre simulación y envíos reales.
- Conserva esquema, restricciones e índices en `DATABASE_DESIGN.md`; evita copiarlos en otros documentos.
- Nunca incluyas secretos, tokens, credenciales reales ni payloads de clientes en documentos, commits o logs.

## Fuentes y precedencia

Las decisiones cerradas del plan y los ADRs aceptados orientan el diseño. El documento maestro citado por el plan no está disponible. Registra contradicciones o información ausente en `OPEN_QUESTIONS.md`; un default propuesto no es una confirmación. El ADR 0002 sigue propuesto aunque el plan incluya D-1 y D-2 entre defaults técnicos.

## Comandos

Comandos documentales desde la raíz, sin instalar dependencias:

```bash
git status --short
git ls-files '*.md'
git diff --check
```

Comprueba que todos los destinos de enlaces relativos existen y que las referencias a secciones apuntan a encabezados vigentes. No hay un validador de enlaces versionado. Al renombrar, busca también las rutas antiguas con `rg`.

Con dependencias instaladas (`pnpm install`, Node 24): `pnpm lint`, `pnpm format:check` (y `pnpm format`), `pnpm typecheck` y `pnpm test`. `dev:web`, `dev:worker`, `build`, `start:web` y `start:worker` son scripts previstos, no ejecutables actuales. No inventes comandos antes de crear y revisar el scaffold.
