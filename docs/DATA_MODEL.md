# Modelo de datos de Compathium

Estado: modelo propuesto del MVP. Este documento explica relaciones del dominio; el catálogo físico, sus índices y el diagrama completo viven en [DATABASE_DESIGN.md](DATABASE_DESIGN.md). No hay esquema Drizzle ni migraciones generadas.

## Pertenencia al workspace

El workspace es la raíz de los datos del negocio. Una persona puede ser miembro de varios workspaces y tener un rol distinto en cada uno. Identidad de usuario y pertenencia son conceptos separados.

Canales, contactos, conversaciones, conocimiento, agente y eventos pertenecen a un workspace. Una referencia entre entidades de negocio debe conservar esa pertenencia. La configuración del workspace incluye zona horaria e idioma; la zona se solicita explícitamente al crearlo.

El [ADR 0001](adr/0001_ORGANIZATION_IS_WORKSPACE.md) fija `organization = workspace`. Usuarios y credenciales de autenticación son globales; no forman otro nivel de negocio.

## Contacto, identidad y conversación

Un workspace tiene cuentas de canal y contactos. Cada identidad une un contacto con su identificador externo en una cuenta de canal. El email o teléfono declarado no fusiona contactos automáticamente.

Una conversación pertenece a una identidad y conserva contacto y cuenta de canal coherentes con ella. Contiene mensajes entrantes, salientes y notas internas. Los archivos adjuntos heredan la visibilidad del mensaje.

El diseño propone una sola conversación no resuelta por identidad y crear una nueva después de resolver. La asignación a un miembro pausa la IA. Retirar al miembro exige desasignar sin borrar autores históricos. Estas reglas se mantienen explícitas en [preguntas abiertas](OPEN_QUESTIONS.md).

## Conocimiento y versiones

Una fuente es FAQ o documento. Tiene borrador y revisiones; una revisión publicada y preparada contiene los fragmentos consultables. Archivar excluye la fuente de consultas nuevas sin romper evidencia histórica.

El workspace tiene un agente de IA, con borrador y versiones publicadas inmutables. Una versión selecciona fuentes. El diseño propone consultar sus revisiones publicadas vigentes, de modo que actualizar una FAQ no obligue a publicar otra versión de agente.

Una ejecución de IA referencia la versión o el snapshot de borrador usado y conserva su evidencia. Una ejecución real se relaciona con conversación y entrada; una simulación no produce mensajes al cliente. La evidencia conserva los fragmentos evaluados y citados.

## Historia y trabajo pendiente

Los mensajes conservan el estado de transporte. Generar una respuesta no significa haberla enviado o entregado. El historial de eventos de dominio registra hechos de conversación para explicar los indicadores. La auditoría registra cambios administrativos y no reemplaza ese historial.

La recepción durable conserva sobres entrantes; la outbox conserva trabajo por ejecutar después de un commit. Ambos permiten recuperar trabajo perdido en la cola. Son mecanismos técnicos del modelo físico, no conversaciones ni mensajes adicionales.

## Invariantes

- Una relación de negocio no cruza workspaces.
- Una conversación asignada, derivada o resuelta mantiene la IA pausada.
- Una nota interna no se envía ni cuenta como primera respuesta.
- Una simulación no modifica conversaciones reales ni alimenta sus KPIs.
- Una versión publicada de agente no se modifica.
- Un borrador de conocimiento no aparece en retrieval.
- Una respuesta sin evidencia no se envía automáticamente.
- Un reintento conserva identificadores y no representa otro mensaje o run lógico.

Las restricciones físicas y los bloqueos necesarios para sostener estas reglas están en el diseño de base de datos. Que una regla aparezca aquí no demuestra que ya esté implementada.
