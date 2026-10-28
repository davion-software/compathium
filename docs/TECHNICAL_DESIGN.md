# Diseño técnico de Compathium

Estado: arquitectura objetivo documentada, sin implementación ni infraestructura comprobada. El [plan](MVP_PLAN.md) determina las fases; el [diseño de base de datos](DATABASE_DESIGN.md) concentra tablas, restricciones, transacciones e índices.

## Un paquete y dos procesos

TanStack Start, React 19 y TypeScript forman la aplicación. `web` atiende UI, autenticación, server functions, webhooks y SSE. `worker` ejecuta ingestión, IA, envíos y reintentos con BullMQ. Ambos comparten módulos y contratos en un solo paquete.

La estructura prevista es `src/web`, `src/worker`, `src/modules`, `src/db` y `src/contracts`. No existe todavía. Los módulos de dominio previstos separan identidad, contactos, canales, conversaciones, conocimiento, agentes y analítica.

Railway alojará `web`, `worker`, PostgreSQL con pgvector y Redis. El plan fija partir de una imagen con pgvector y habilitar `vector` en la primera migración. Antes de provisionar, hay que comprobar versión e imagen disponibles; no hay despliegue realizado.

R2 conserva archivos privados; Postgres conserva metadatos y referencias. La descarga requiere autorización antes de emitir una URL firmada. La arquitectura elegida se registra en el [ADR 0003](adr/0003_POSTGRES_AND_SEPARATE_WORKER.md).

## Identidad y aislamiento

Better Auth con `organization` administra sesiones, miembros e invitaciones. Una `organization` es un workspace, según el [ADR 0001](adr/0001_ORGANIZATION_IS_WORKSPACE.md). No se crea otro nivel de tenant.

La sesión selecciona el workspace activo. Cada operación vuelve a validar membresía y permiso. HTTP, worker, SSE, archivos y retrieval reciben tenant verificado y filtran por `organization_id`. Las FK compuestas impiden referencias cruzadas entre tenants, pero no sustituyen filtros de lectura.

Drizzle administrará migraciones después de generar el esquema de Better Auth con versiones fijadas. El diseño propone aislamiento de lectura en la aplicación con pruebas de dos tenants. RLS no está implementado ni se presupone como protección existente.

## Contratos y canales

`ChannelAdapter` normaliza mensajes y estados; Inbox e IA no dependen del payload de WhatsApp o webchat. Antes de construir UI se concretan `InboundMessage`, `OutboundMessage`, `Contact`, `ContactIdentity`, `Conversation`, `AiRun` y `DomainEvent`. Son contratos previstos, no tipos existentes.

El modelo detallado usa `assigned_to_user_id` para la asignación y `last_customer_message_at` para la ventana de WhatsApp. Los nombres abreviados del listado inicial del plan no definen columnas adicionales.

Webchat obtiene una identidad de visitante mediante token firmado y permite orígenes exactos configurados. La clave pública del widget identifica la cuenta de canal, pero no autentica al visitante. WhatsApp requiere firma de webhook, normalización de IDs y validación del timestamp del cliente. Las capacidades de Kapso deben comprobarse antes de construir el adapter.

## Recepción y trabajo durable

El diseño propone este flujo:

1. `web` valida la entrada y resuelve canal y tenant.
2. Guarda el sobre en `inbound_events` y confirma recepción. Si no puede persistir, devuelve error reintentable.
3. El worker deduplica, crea el mensaje, actualiza conversación y escribe eventos y outbox en una transacción.
4. Los jobs ejecutan IA, envío o publicación SSE después del commit.

Redis y BullMQ ejecutan trabajo; Postgres conserva la intención recuperable. Un barrido de entradas y outbox permite reconstruir jobs perdidos. Leases con token impiden que un worker vencido confirme efectos locales.

Las entradas se deduplican por evento y mensaje del proveedor dentro de la cuenta de canal. Las salidas conservan el mismo `message_id` como clave del adapter en cada intento. Una restricción local no garantiza un solo envío remoto después de un timeout. El estado `unknown` requiere reconciliar aceptación remota o revisión antes de reenviar.

SSE actualiza Inbox y visitante, respetando visibilidad y tenant. Para varias réplicas de `web`, el plan prevé fan-out mediante Redis pub/sub. Persistencia de historia y recuperación de jobs no implican un contrato de replay SSE; la reconexión sigue pendiente de concretar.

## IA y conocimiento

`ChatProvider` y `EmbeddingProvider` son interfaces separadas del gateway propio. El [ADR 0002](adr/0002_AI_AND_EMBEDDING_PROVIDERS.md) propone OpenAI para ambos y `text-embedding-3-small` con 1024 dimensiones para embeddings. El identificador de chat se configuraría en `AI_CHAT_MODEL`; no hay modelo de chat fijado.

La primera migración habilita la extensión. La columna vectorial de conocimiento se crea después de confirmar modelo, dimensión y distancia. Cada chunk conserva modelo y dimensión; cambiarlos exige reindexar y evitar consultas con modelos mezclados. El diseño comienza con búsqueda exacta y pospone HNSW hasta medir volumen y calidad.

Publicar conocimiento crea una revisión y su trabajo de ingestión. Solo al terminar se activa como revisión publicada. Publicar agente crea configuración inmutable; cada run conserva configuración y evidencia para revisión. El simulador no escribe mensajes salientes, jobs de envío ni eventos KPI reales.

El [ADR 0004](adr/0004_EVIDENCE_BASED_HANDOFF.md) recoge la derivación por intención, evidencia y horario. Una ejecución sin evidencia termina en handoff sin respuesta automática.

## Carreras con atención humana

El diseño usa `automation_epoch` para invalidar respuestas pendientes ante nuevas entradas, asignación, pausa o resolución. El run conserva el epoch capturado al programarse y lo verifica antes de persistir y autorizar despacho.

Pausa y despacho comparten bloqueo de conversación. Una pausa cancela trabajo aún no autorizado; un envío ya autorizado puede llegar después y no puede retirarse de la red. No se mantiene una transacción abierta durante la llamada al modelo. Las [transacciones del diseño](DATABASE_DESIGN.md#10-transacciones-y-carreras-que-la-implementación-debe-resolver) detallan estos límites.

## Observabilidad y operación

Sentry y logs JSON con `correlation_id` están previstos para web y worker. No hay instrumentación instalada. Los eventos de dominio append-only explican KPIs; la auditoría administrativa conserva cambios de configuración y permisos. Ninguno debe copiar secretos o contenido innecesario.

OpenTelemetry queda después del piloto. Presupuestos, retención, límites de archivos, recuperación de datos y comportamiento ante proveedores caídos todavía necesitan definición en [preguntas abiertas](OPEN_QUESTIONS.md).

## Verificación pendiente

El [diseño de base de datos](DATABASE_DESIGN.md#13-borrado-retención-y-validación-antes-del-piloto) enumera pruebas de integración sobre Postgres real: aislamiento, permisos, idempotencia, callbacks fuera de orden, recuperación de jobs, pausa durante generación y despacho, simulación y calidad de retrieval.

Antes de aceptar el ADR 0002 se prevén al menos veinte preguntas de referencia para retrieval, cincuenta llamadas con salida estructurada y medición de p95. Falta fijar el umbral de calidad y el presupuesto de latencia. Ninguna de estas pruebas se ha ejecutado como parte de esta consolidación documental.
