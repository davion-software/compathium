# ADR 0002 — Proveedores de chat y embeddings

Fecha: 6 de septiembre de 2026. Estado: **propuesto por defecto**, pendiente de confirmación o veto del founder antes de la fase 3 (D-1, D-2).

## Contexto

El gateway de IA separa `ChatProvider` y `EmbeddingProvider`. El chat puede cambiarse por adapter, con validación de contratos, calidad y costos; el embedding no: los vectores quedan atados a modelo y dimensión, y cambiarlo obliga a reindexar todo el conocimiento de todos los tenants. Por eso el chat puede decidirse tarde y el embedding debe estar confirmado antes de la migración 0003 (`knowledge_chunks`).

El maestro (17.1) lista OpenAI / Anthropic / Gemini / Bedrock como opciones. xAI queda fuera salvo razón explícita.

## Base ya cerrada en el plan

- Gateway propio con `ChatProvider` y `EmbeddingProvider` separados.
- PostgreSQL (template pgvector de Railway) con extensión `vector` desde la primera migración.
- Cada chunk conserva `embedding_model` y `dimensions`; cambiar modelo requiere reindexación completa con pausa de IA.
- Handoff por intención, evidencia y horario; sin confianza numérica autoreportada.

## Decisión propuesta (default)

| | Chat — D-1 | Embeddings — D-2 |
|---|---|---|
| Proveedor | OpenAI | OpenAI |
| Modelo | Modelo económico vigente de la familia con structured outputs y tool calling; id configurable en `AI_CHAT_MODEL`, nunca hardcodeado | `text-embedding-3-small` |
| Dimensión | — | `N = 1024` vía parámetro `dimensions` (Matryoshka; nativo 1536, rango 256–1536) |
| Distancia | — | Coseno (`vector_cosine_ops` si se añade HNSW) |
| Costo verificado | Ver pricing vigente al fijar `AI_CHAT_MODEL` | $0.02 / M tokens ($0.01 batch), verificado 2026-09-06 |

Razones del default:

- Un solo vendor para chat y embeddings simplifica claves, facturación y límites en el piloto.
- `text-embedding-3-small` es multilingüe, barato y permite reducir dimensión sin reentrenar; 1024 equilibra recall y tamaño de índice.
- OpenAI está en la lista del maestro y tiene structured outputs maduros, necesarios para `AiRun` (`sources[]`, `evidence_coverage`, `handoff_reason`).

## Qué debe confirmar el founder

- Que existe (o se creará) cuenta y billing de OpenAI para Compathium, separada de otros proyectos.
- Que no hay razón de privacidad, costo o cuenta existente para preferir Anthropic, Gemini o Bedrock.
- Si hay veto, debe llegar **antes de la migración 0003**. Después, cambiar embeddings implica reindexar.

## Validación antes de cerrar definitivamente (fase 3, primera semana)

- Retrieval en español con las FAQs y PDFs reales del primer piloto: al menos 20 preguntas doradas, medir si la fuente correcta entra en el top-3.
- Structured output del chat: 50 llamadas con el schema de `AiRun`, cero fallos de parseo.
- Latencia p95 desde Railway al proveedor bajo el presupuesto por respuesta que fije el plan.

Si alguna falla, se reabre D-1/D-2 antes de indexar corpus de clientes.

## Consecuencias

- La migración 0003 se genera con `vector(1024)` y CHECK `dimensions = 1024`.
- El worker rechaza embeddings cuyo `embedding_model` no coincida con el corpus activo del tenant.
- Búsqueda exacta al inicio; HNSW solo tras medir volumen y recall (ver [diseño de base de datos](../DATABASE_DESIGN.md)).
