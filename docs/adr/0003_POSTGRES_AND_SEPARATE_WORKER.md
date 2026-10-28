# PostgreSQL con pgvector y worker separado

Estado: aceptado en las decisiones cerradas del plan v1.2. Registro documental del 28 de octubre de 2026; implementación pendiente.

Compathium necesita persistencia transaccional, recuperación de conocimiento y trabajo asíncrono. El [plan](../MVP_PLAN.md) elige PostgreSQL con pgvector desde la primera migración y procesos `web` y `worker` separados en Railway. Descarta D1 como fuente de verdad y Workers como host principal para este MVP.

Redis con BullMQ ejecutará ingestión, IA y envíos fuera del request. Un paquete compartido evita introducir un monorepo antes de tener otro consumidor. El costo es operar base, cola y dos procesos. El [diseño técnico](../TECHNICAL_DESIGN.md) explica los flujos; recepción durable y outbox son mecanismos propuestos en el [diseño de base de datos](../DATABASE_DESIGN.md), todavía sin implementar.
