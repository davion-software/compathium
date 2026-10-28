# Compathium — Plan de arranque del MVP (corregido)

Versión 1.2 — 6 de septiembre de 2026
Fuente de verdad de producto: `Compathium_Documento_Maestro_Diseno_MVP.docx` (v1.0). Este plan lo baja a un orden de construcción. Donde este plan y el maestro difieran, gana el maestro salvo en los puntos marcados como decisión cerrada.

Las marcas `[D-n]` referencian el registro de decisiones al final. Las cerradas por criterio técnico llevan default; las que dependen del founder están marcadas como pendientes.

Diseño derivado: [base de datos del MVP](diseno-base-de-datos.md), con relaciones, restricciones, índices y orden de migraciones. ADRs: [organization = workspace](adr/001-organization-es-workspace.md) (aceptado) y [proveedores de chat y embeddings](adr/002-proveedores-ia-y-embeddings.md) (default propuesto, pendiente de veto).

---

## Principio

Empieza por el núcleo que se puede vender, no por la plataforma. No uses el stack de RutaSec / Davos Links (Workers + D1 + KV): sirve para un catálogo o un acortador; Compathium es transaccional, en tiempo real y con IA.

## Decisión de stack

| Capa | Elección | Por qué / notas |
|---|---|---|
| App | TanStack Start + React 19 + TypeScript | Ya en RutaSec y Davos Links. El maestro lo eligió (13.1). Server functions tipadas, SSR, server routes para webhooks. |
| UI | Tailwind v4 + Base UI (`@base-ui/react`) `[D-4]` | Es lo que usa Davos Links, el proyecto más reciente; RutaSec quedó en Radix. Tokens del maestro (`#6558F5`, `#F7F8FC`, `#DDE3EE`). |
| Auth | Better Auth + plugin `organization` | Sesiones, invitaciones, roles. **Decisión cerrada:** `organization` de Better Auth = workspace. No se modela el segundo nivel `organizations → workspaces` del maestro en el MVP. En UI se llama "workspace"; en código, `organization`. |
| Host | Railway: `web` + `worker` + `pgvector` + `redis` | Mismo ADR 001 de Kaseis. Un solo modelo mental de deploy. |
| DB | Postgres (template **pgvector**) + Drizzle | El template Postgres estándar de Railway **no** trae pgvector y no se puede añadir después sin `pg_dump`/`pg_restore`. Desplegar `pgvector/pgvector:pg18` desde el día 1. Primera migración: `CREATE EXTENSION IF NOT EXISTS vector`. |
| Cola | Redis + BullMQ `[D-5]` | Webhooks, ingestión de docs, runs de IA, envíos. Ack rápido, proceso después. Redis también da el pub/sub para SSE multi-réplica. |
| Realtime | SSE primero | Suficiente con 1 réplica de `web`. Con más réplicas, fan-out por Redis pub/sub. WebSocket solo cuando SSE se quede corto. |
| Archivos | Cloudflare R2 | Adjuntos y PDFs. URLs firmadas, bucket privado. |
| WhatsApp | Kapso `[D-6]` **pendiente de confirmar** | Kaseis solo tiene runbook y reglas sobre Kapso; no hay código. Primera implementación real. El `ChannelAdapter` se diseña para que Cloud API directo sea un adapter alternativo. |
| IA — chat | Gateway propio, `ChatProvider` → OpenAI por defecto `[D-1]` | Modelo económico vigente de la familia con structured outputs y tool calling; id en `AI_CHAT_MODEL`. Un solo vendor para chat y embeddings simplifica facturación y claves en el piloto. |
| IA — embeddings | `EmbeddingProvider` → OpenAI `text-embedding-3-small`, 1024 dims `[D-2]` | $0.02/M tokens, multilingüe, dimensión ajustable (256–1536). 1024 mantiene índices HNSW cómodos. **Pegajosa:** cambiar modelo o dimensión = reindexar todo. Cada chunk guarda `embedding_model` y `dimensions`. |
| Observabilidad | Sentry (`@sentry/tanstackstart-react` + `@sentry/node` en worker) + logs JSON con `correlation_id` `[D-7]` | OpenTelemetry queda post-piloto. Cada mensaje, run de IA y webhook lleva el mismo `correlation_id`. |

**No uses:** D1 como source of truth, Workers como host principal, Next, Supabase como core, monorepo hexagonal día uno, builder de flujos, Instagram, confianza numérica autoreportada por el LLM como criterio de handoff.

Cloudflare queda para R2, DNS y CDN. Railway para la app.

## Cómo nace el repo

Un solo repo, un solo paquete, dos procesos `[D-3]`:

```text
compathium/
  src/
    web/             TanStack Start (routes, UI, auth, server routes de webhooks con ACK)
    worker/          entrypoint BullMQ: ingestión, IA, envíos, retries
    modules/
      identity       organization (=workspace), members, invitations, RBAC
      contacts       contacts, contact_identities
      channels       ChannelAdapter + webchat + kapso
      conversations  inbox, mensajes, asignación, handoff, pausa de IA
      knowledge      FAQs, docs, chunks, embeddings
      agents         prompt, reglas, versiones, simulator, ai_runs
      analytics      eventos append-only
    db/              Drizzle schema + migrations
    contracts/       eventos y DTOs internos (zod)
  docs/
    adr/
  package.json       scripts: dev:web, dev:worker, build, start:web, start:worker
```

Railway: dos servicios apuntando al mismo repo, distinto start command (`start:web`, `start:worker`). Sin `apps/` ni `packages/` mientras no haya un segundo consumidor externo del código. Si aparece (SDK público, segundo frontend), se migra a workspace pnpm `apps/*` + `packages/core`; el código de `src/modules` se mueve sin reescribirse.

**Reglas de oro**

- Todo mensaje de canal se convierte a un contrato interno. WhatsApp o webchat no se filtran al Inbox ni a la IA.
- Cada query lleva `organization_id`. Si una función no recibe tenant, no existe.
- Idempotencia en **ambas direcciones**: entrada por `provider_message_id` del canal; salida por `message_id` interno hacia el proveedor (un reintento del worker no puede duplicar un envío al cliente).

## Cómo empezar, en orden

### 0. Congelar el corte (1 día)

El primer producto es:

> Workspace → canal → contactos → conocimiento → agente → simulador → Inbox → 6 KPIs.

Fuera: campañas, flows builder, billing real, marketplace, app móvil, Instagram, Supervisor como rol.

Cinco contratos antes de UI:

1. `InboundMessage` / `OutboundMessage`
2. `Contact` + `ContactIdentity` (canal + id externo)
3. `Conversation` + estados + `ai_paused` + `assigned_to`
4. `AiRun`: `agent_version_id`, `sources[]`, `evidence_coverage` (`none | partial | strong`), `handoff_reason` (`no_evidence | intent | policy | schedule | manual`), `latency_ms`, `cost`. **Sin `confidence` numérica expuesta.**
5. `DomainEvent`: `message.received`, `message.sent|delivered|failed`, `conversation.assigned|resolved`, `ai.run.completed|handed_off`

Dos ADRs escritos antes de la primera migración: proveedor de IA (chat + embeddings) y `organization = workspace`.

### 1. Cimientos (semana 1)

- Scaffold TanStack Start + worker con la estructura elegida
- Railway: `pgvector`, `redis`, `web`, `worker`
- Drizzle: `organizations`, `members`, `invitations` (Better Auth), `contacts`, `contact_identities`, `conversations` (`status`, `assigned_to`, `ai_paused`), `messages` (`direction`, `provider_message_id` único por cuenta de canal, `provider_timestamp`, `ingested_at`, `status`), `audit_events`
- Primera migración incluye `CREATE EXTENSION IF NOT EXISTS vector`
- Better Auth + organization; middleware de tenant que lee `activeOrganizationId` de la sesión
- Layout del maestro: sidebar, topbar, `/dashboard` vacío

Listo cuando: un admin crea workspace, invita a un agente, y el agente no ve facturación ni equipo.

### 2. Canal + Inbox (semanas 2–4)

Primer canal: webchat embebible. Sirve para demo sin esperar a Meta.

Webchat no es solo un widget:
- Script embebible servido por `web` en `/widget.js?key=...` con `Cache-Control` largo; CDN de Cloudflare delante solo si el piloto lo pide `[D-9]`
- Identidad de visitante: token de sesión anónimo → `contact_identity` de tipo `webchat`
- CORS por dominio permitido del tenant
- Realtime hacia el visitante (SSE), no solo hacia el Inbox

Inbox:
- Webhook/evento → cola → worker → Postgres → SSE al Inbox
- Contacto creado automáticamente desde el primer mensaje
- 3 paneles: lista, hilo, contacto
- Asignar, nota interna, resolver
- Al asignar a un humano, `ai_paused = true` en esa conversación
- Idempotencia de entrada y salida

Listo cuando: escribes en el widget desde una página externa, el mensaje aparece en el Inbox en vivo con su contacto, se responde, el visitante lo ve, y se cierra.

### 3. Conocimiento + agente + simulador (semanas 5–7)

Esto es lo que diferencia a Compathium de un help desk.

- CRUD de FAQs (draft/publicado)
- Subir PDF → R2 → job → chunk → embeddings → pgvector; cada chunk con `embedding_model` y `dimensions`
- Un agente: objetivo, tono, fuentes, idioma, reglas de handoff
- Reglas de handoff, en este orden:
  1. **Intención:** pide humano, reclamo, tema restringido → handoff inmediato
  2. **Evidencia:** retrieval sin fuentes sobre el score mínimo → `evidence_coverage = none` → handoff con resumen
  3. **Horario / disponibilidad**
- La respuesta cita fuentes. Si `evidence_coverage = none`, no responde: deriva.
- La IA no responde en conversaciones con `ai_paused = true`
- Simulador que nunca envía a un cliente; muestra fuentes, cobertura y motivo de derivación, no un porcentaje
- Versión inmutable de agente al publicar; rollback a la anterior

Listo cuando: "¿cuánto cuesta el delivery?" usa la FAQ y la cita; "quiero hablar con alguien" deriva por intención; algo que no existe deriva por falta de evidencia con resumen.

### 4. WhatsApp real (semanas 8–9)

Kapso sobre el mismo `ChannelAdapter`. Primera implementación, no reutilización.

- Verificar firma del webhook; idempotencia por `X-Idempotency-Key` / id del evento
- 200 inmediato, procesar en worker
- Enviar con clave de idempotencia; estados sent/delivered/failed
- Ventana de 24h: `conversations.last_inbound_at`; si supera 24h, el composer bloquea el envío libre y muestra "fuera de ventana, espera a que el cliente escriba". Plantillas aprobadas quedan para después del piloto `[D-8]`
- Un número por workspace; el setup lo hace el founder (setup link de Kapso). Zona horaria del workspace obligatoria en la creación `[D-10]`

Listo cuando: un celular real entra al Inbox, el agente IA responde o deriva, un humano toma el hilo y la IA se calla.

### 5. Panel mínimo y piloto (semana 10)

Seis números, no analytics. Calculados desde `DomainEvent`, no desde estados mutables:

- Conversaciones hoy
- Activas
- Resueltas
- Resolución IA (resuelta sin mensaje humano)
- Primera respuesta (mediana)
- Handoffs

Cada card abre el Inbox filtrado.

Piloto con 1–3 negocios (dark kitchen, tienda de ropa, barbería). Setup manual; el producto todavía no se onboardea solo.

**Estimación honesta:** 9–11 semanas para un desarrollador solo. Siete era optimista con Kapso sin implementar, webchat embebible, RAG y realtime.

## Por qué este orden vende

Cada fase termina en algo que se enseña en una llamada:

1. "Tus chats viven aquí, con quién es cada cliente."
2. "La IA responde con *tu* información y te muestra de dónde la sacó."
3. "Si no sabe o el cliente pide una persona, te llega a ti con contexto y la IA se aparta."
4. "Esto ya corre en tu WhatsApp."

## Decisiones cerradas (no reabrir)

- Postgres con pgvector desde el día 1, no D1, no template estándar.
- Worker aparte, no "todo en el request".
- Webchat primero, WhatsApp segundo.
- `organization` de Better Auth = workspace. Un nivel de tenant.
- Roles del MVP: Owner, Admin, Agente. Supervisor queda fuera.
- Un agente, no orquestación multi-agente.
- Plantillas, no canvas de flujos (y ni siquiera plantillas en el primer corte).
- Gateway de IA con `ChatProvider` y `EmbeddingProvider` separados.
- Handoff por intención y evidencia, nunca por un número de confianza autoreportado.
- Idempotencia en entrada y en salida.
- Sin `apps/` + `packages/` hasta que exista un segundo consumidor real del código.

## Decisiones cerradas por criterio técnico (reversibles antes del primer commit)

Se cierran aquí para no bloquear el scaffold. Si alguna no te convence, cámbiala ahora; después del primer commit tienen costo.

| Id | Decisión | Por qué este default |
|---|---|---|
| D-3 | Un solo paquete `src/{web,worker,modules,db,contracts}` | Coherente con "no packages hasta que duela". Dos start commands en Railway. Migrar a workspace pnpm es mover carpetas, no reescribir. |
| D-4 | Base UI (`@base-ui/react`) | Es la elección de tu proyecto más reciente (Davos Links). Mantener dos librerías de primitives entre proyectos es deuda. |
| D-5 | Redis + BullMQ | Mismo ADR de Kaseis; retries, DLQ y tooling maduros; el mismo Redis resuelve el fan-out de SSE. pg-boss ahorraría un servicio pero obligaría a LISTEN/NOTIFY para realtime multi-réplica. |
| D-7 | Sentry solo; OpenTelemetry post-piloto | El maestro pide OTel, pero para 1–3 pilotos Sentry + `correlation_id` en logs JSON cubre diagnóstico. OTel entra cuando haya más de un servicio que trazar de verdad. |
| D-8 | Fuera de la ventana de 24h: bloquear envío libre y avisar | Evita depender de la aprobación de plantillas de Meta para el piloto. Plantillas en Fase 4+ si los pilotos responden tarde con frecuencia. |
| D-9 | Widget servido por `web` con caché larga | Un dominio menos que configurar. CDN de Cloudflare delante cuando haya tráfico real. |
| D-1 | Chat: OpenAI, modelo económico vigente con structured outputs | Está en las opciones del maestro. Un solo vendor para chat y embeddings simplifica claves y facturación en el piloto. El `ChatProvider` permite cambiar después. **Requiere tu cuenta y billing de OpenAI.** |
| D-2 | Embeddings: OpenAI `text-embedding-3-small`, 1024 dims | $0.02/M tokens, multilingüe, Matryoshka (dimensión ajustable 256–1536). 1024 equilibra recall y tamaño de índice HNSW. **Pegajosa: cambiarla después implica reindexar.** |

## Lo que no va en el commit inicial

Diseño de las 17 pantallas, hexagonal tipo Kaseis, Cloudflare Queues + Durable Objects, entrenar modelos, campañas, flows, billing.

Empieza con: tenant + contacto + mensaje interno + Inbox vivo + un agente con FAQs.

---

## Decisiones pendientes (solo el founder puede cerrarlas)

| Id | Decisión | Qué necesito de ti | Bloquea |
|---|---|---|---|
| D-6 | Kapso vs WhatsApp Cloud API directo | ¿Tienes cuenta Kapso activa? ¿Pricing por número y por mensaje en tu país es viable para cobrar al piloto? ¿Los setup links permiten que el cliente conecte su propio número? Si alguna es "no", el adapter alternativo es Cloud API directo con Business Manager propio. | Fase 4. No bloquea fases 1–3. |
| D-10 | País, ciudad y zona horaria del piloto | Un país y una zona horaria. Define el número de WhatsApp, el horario por defecto de handoff, la moneda en ejemplos del simulador y el idioma/tono de los prompts base. | Fase 3 (horarios, ejemplos) y Fase 4. |
| D-1/D-2 (veto) | Confirmar OpenAI como vendor de IA | Solo si prefieres otro de los del maestro (Anthropic, Gemini, Bedrock) por cuenta existente, privacidad o costo. Si no dices nada, se implementa OpenAI. El veto debe llegar antes de la fase 3; después, cambiar embeddings implica reindexar. | Fase 3. |
