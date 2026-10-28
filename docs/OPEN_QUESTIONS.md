# Preguntas abiertas

Revisión documental del 28 de octubre de 2026. Se aplicó `grill-with-docs` sin entrevista interactiva por instrucción de ejecución headless. Las respuestas siguientes proceden del repositorio; los defaults sugeridos no son decisiones aceptadas ni autorización para provisionar servicios.

## Árbol de revisión y respuestas disponibles

La revisión recorrió alcance, acceso, canales, atención, conocimiento, ejecución, indicadores y operación. Cada rama dependiente conserva sus preguntas sin resolver en la sección siguiente.

| Ronda | Pregunta | Respuesta y evidencia |
|---|---|---|
| 1. Alcance | ¿Qué se construye y para quién? | Inbox con IA basada en conocimiento para uno a tres negocios; webchat antes de WhatsApp. [Plan](MVP_PLAN.md). |
| 1. Estado | ¿Qué existe hoy? | Cuatro documentos originales y ningún código, manifiesto o migración. Las fases son trabajo pendiente. |
| 1. Fuentes | ¿Se puede contrastar el maestro? | No está disponible. Q-01 conserva la limitación. |
| 2. Acceso | ¿Cuál es el tenant y quién puede pertenecer? | Workspace equivale a organization; usuarios globales con membresías múltiples. [ADR 0001](adr/0001_ORGANIZATION_IS_WORKSPACE.md). |
| 2. Equipo | ¿Se separan humano e IA? | Roles Owner, Admin y Agente; un agente de IA por workspace. Sin Supervisor. [Plan](MVP_PLAN.md). |
| 2. Arquitectura | ¿Dónde vive el estado y quién procesa? | Postgres con pgvector, web y worker separados; Redis con BullMQ. [ADR 0003](adr/0003_POSTGRES_AND_SEPARATE_WORKER.md). |
| 3. Canales | ¿Qué canal valida primero el recorrido? | Webchat embebible con SSE al visitante. WhatsApp después; proveedor y piloto pendientes en Q-02 y Q-03. |
| 3. Entrega | ¿ACK inmediato permite perder el evento? | No. El [diseño de base de datos](DATABASE_DESIGN.md) exige persistencia antes del ACK y recuperación desde Postgres. No garantiza envío remoto único tras un timeout. Q-09 cubre lo pendiente. |
| 3. Atención | ¿Qué ocurre al asignar y desasignar? | Asignar pausa IA; el diseño propone reanudar explícitamente. Ciclo y concurrencia pendientes en Q-06 y Q-07. |
| 3. Evidencia | ¿La IA responde si no sabe? | No: deriva por intención, evidencia y horario; nunca usa confianza numérica autoreportada. [ADR 0004](adr/0004_EVIDENCE_BASED_HANDOFF.md). |
| 4. Versiones | ¿Publicación y simulador afectan al cliente? | Publicar conserva versiones; simulación no envía ni cuenta KPIs. La relación con revisiones de fuentes sigue propuesta en Q-08. |
| 4. Indicadores | ¿De dónde salen los seis números? | De eventos append-only. Las fórmulas propuestas están en la sección 11 de [DATABASE_DESIGN.md](DATABASE_DESIGN.md); aceptación pendiente en Q-10. |
| 4. Operación | ¿Están fijados límites, presupuesto y recuperación? | No; Q-04, Q-05 y Q-11 a Q-15 registran los datos ausentes. |

## Decisiones que faltan

| Id | Pregunta | Por qué importa | Default sugerido | Resolver antes de |
|---|---|---|---|---|
| Q-01 | ¿Dónde está `Compathium_Documento_Maestro_Diseno_MVP.docx` v1.0 y qué diferencias mantiene con el plan? | El plan le atribuye precedencia salvo decisiones cerradas, pero no se puede comprobar. | Usar decisiones cerradas del plan y ADRs aceptados; no inventar contenido del maestro. Incorporar una copia o referencia accesible y contrastar. | Confirmar alcance definitivo. |
| Q-02 | ¿Qué país, ciudad, zona IANA y negocios forman el piloto, D-10? | Define número de WhatsApp, horarios, idioma y moneda de ejemplos. | Exigir zona explícita al crear workspace; no inferir país ni usar UTC como elección de producto. | Fase 3 y conexión WhatsApp. |
| Q-03 | ¿Kapso tiene cuenta, costos viables y conexión del número del cliente mediante setup link, D-6? | Sin esto no se puede validar el adapter de WhatsApp ni el costo del piloto. | Mantener Kapso propuesto; evaluar Cloud API directo si no cumple. No contratar desde esta revisión. | Fase 4. |
| Q-04 | ¿Se confirma OpenAI, con cuenta y billing propios, modelo de chat y embeddings `text-embedding-3-small` de 1024 dimensiones, D-1 y D-2? | Cambiar embeddings obliga a reindexar. El silencio no prueba disponibilidad de cuenta ni aceptación del ADR. | Conservar [ADR 0002](adr/0002_AI_AND_EMBEDDING_PROVIDERS.md) como propuesto; configurar chat mediante `AI_CHAT_MODEL` y verificar capacidades y precios antes de fijarlo. | Migración lógica 0003 para embeddings y 0004 para agente. |
| Q-05 | ¿Qué umbral de retrieval, calidad top-3, latencia p95, costo máximo por respuesta y reglas de horario/política se aceptan? | La cobertura parcial no define por sí sola cuándo responder ni qué hacer fuera de horario. | Evaluar corpus real en español con al menos veinte preguntas y cincuenta salidas estructuradas como exige el ADR; derivar sin evidencia. No inventar umbrales ni presupuesto. | Aceptar proveedor y activar IA del piloto. |
| Q-06 | ¿Se acepta `pending` como atención humana, una conversación activa por identidad y conversación nueva tras resolver? | Cambia Inbox, historial y conteos. Son propuestas adicionales del diseño. | Conservar las propuestas de la sección 6 de [DATABASE_DESIGN.md](DATABASE_DESIGN.md); no reabrir ni reanudar IA de forma implícita. | Implementar ciclo del Inbox. |
| Q-07 | ¿Se acepta una ejecución lógica automática por entrada y que una entrada posterior invalide la respuesta anterior todavía pendiente? | Dos entradas seguidas pueden cancelar una generación; un envío ya autorizado puede llegar después de pausar. | Usar `automation_epoch`, historial con ambas entradas y bloqueo compartido de pausa/despacho; mostrar envíos en curso. Validar la carrera con producto. | Fase 3. |
| Q-08 | ¿Una versión de agente consulta revisiones publicadas vigentes y su rollback no revierte conocimiento? | Afecta reproducibilidad y expectativas al actualizar FAQs. | Mantener la propuesta de la sección 9 del diseño y snapshots de fuentes efectivamente usadas. | Publicación y rollback del agente. |
| Q-09 | ¿Qué garantías de idempotencia y retención ofrece el proveedor y cómo se reconcilia una salida `unknown`? | Tras timeout, reintentar puede duplicar un mensaje remoto aunque SQL no duplique filas. | Clave estable por mensaje; reconciliar por estado remoto o revisar manualmente antes de reenviar si no existe garantía vigente. Concretar política por adapter. | Primer envío real de cada adapter. |
| Q-10 | ¿Se aceptan cohortes temporales y fórmulas de los seis KPIs, incluida resolución IA aunque una persona marque resolver? | Evita presentar ausencia de respuesta humana como autonomía completa o excluir sin aviso conversaciones sin respuesta. | Usar las definiciones propuestas de la sección 11, día local, eventos registrados y tamaño de muestra; mostrar “—” sin denominador. | Fase 5. |
| Q-11 | ¿Cuánto se retienen mensajes, payloads, runs, auditoría y archivos, y cómo se purga o anonimiza un workspace? | Archivar no borra datos; las fuentes citadas y claves de deduplicación tienen dependencias históricas. | No exponer borrado en cascada ni purga automática hasta definir plazos; minimizar payloads y excluir secretos de logs. | Piloto con datos reales. |
| Q-12 | ¿Qué límites de PDF, adjuntos, páginas, tokens y frecuencia admite cada workspace? | Afecta abuso del widget público, costos, seguridad de archivos y tiempos de ingestión. | Aceptar solo tipos previstos y orígenes exactos; fijar límites explícitos de tamaño y frecuencia antes de habilitar uploads o widget público. No inventar cifras. | Exponer widget y cargas de archivos. |
| Q-13 | ¿Cuál es el presupuesto mensual, quién opera alertas y qué RPO y RTO se requieren? | No hay recuperación ensayada ni límite de gasto aprobado para Railway, R2, Sentry o IA. | Definir responsable y presupuesto; preparar backup y restauración de prueba en entorno separado antes de datos de clientes. No prometer disponibilidad ni retención concretas. | Piloto. |
| Q-14 | ¿Cómo recupera el cliente SSE tras desconexión o pérdida de pub/sub? | Pub/sub distribuye avisos, pero no garantiza replay o entrega durante desconexiones. | Al reconectar, volver a consultar estado autorizado y deduplicar por ID. Concretar cursor o replay solo si se requiere y probar notas internas y cambio de tenant. | Inbox y widget en fase 2. |
| Q-15 | ¿Qué versiones, gestor de paquetes, secretos de entorno y comandos exactos tendrá el scaffold? | No existe `package.json`, lockfile ni configuración ejecutable. | Un paquete y scripts previstos en el plan; fijar versiones al crear scaffold y documentar variables con valores ficticios, nunca credenciales. | Fase 1. |

No hay un owner de resolución o fecha comprometida para estas preguntas. “Antes de” expresa dependencia de implementación, no un bloqueo de esta entrega documental.
