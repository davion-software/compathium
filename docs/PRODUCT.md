# Producto de Compathium

Estado: definición del MVP a partir del [plan v1.2](MVP_PLAN.md). No hay funcionalidades implementadas. Las reglas adicionales del diseño de datos siguen propuestas y se registran en [preguntas abiertas](OPEN_QUESTIONS.md).

## Problema y primer usuario

Compathium permite a un negocio atender chats con su propia información y transferir la atención a una persona cuando hace falta. El primer piloto previsto incluye de uno a tres negocios, con ejemplos como dark kitchen, tienda de ropa o barbería. El país, la ciudad y los participantes no están confirmados.

El founder configura manualmente el piloto. El MVP no depende de un onboarding autónomo ni de billing real.

## Alcance

El recorrido es workspace, canal, contactos, conocimiento, agente de IA, simulador, Inbox y seis indicadores. Webchat permite demostrar el producto antes de integrar WhatsApp. Cada workspace tiene un agente de IA y, en WhatsApp, un número.

Quedan fuera campañas, Instagram, marketplace, aplicación móvil, constructor de flujos, múltiples agentes de IA y rol Supervisor. Las plantillas aprobadas de WhatsApp también quedan fuera del piloto.

## Equipo y acceso

Owner, Admin y Agente son los roles del MVP. Owner y Admin administran configuración, conocimiento, agente de IA y equipo. El Agente humano atiende el Inbox y consulta contactos; no administra equipo ni accede a facturación.

Una persona puede pertenecer a varios workspaces. Cambiar el workspace activo exige comprobar membresía y permisos. Ningún miembro puede ver conversaciones, fuentes o archivos de otro negocio.

## Atención en el Inbox

El primer mensaje crea el contacto y su identidad de canal. El Inbox muestra lista de conversaciones, hilo y contacto. El equipo puede responder, asignar, añadir notas internas y resolver. Las notas nunca llegan al cliente.

La asignación a una persona pausa la IA. Desasignar no la reanuda; la reanudación es explícita. Una derivación incluye motivo y resumen para que la persona continúe la atención.

El diseño propone los estados `open`, `pending` y `resolved`, con `pending` para atención humana. También propone crear una conversación nueva si el contacto escribe después de resolver. Estas reglas requieren confirmación antes de implementar el Inbox.

## Conocimiento y agente de IA

El negocio prepara FAQs y PDFs. Solo el contenido publicado y listo se usa para responder; un fallo de publicación conserva la revisión anterior.

El agente tiene objetivo, tono, idioma, fuentes y reglas de derivación. Publicarlo crea una versión inmutable y permite volver a una anterior. El diseño propone que esa versión seleccione fuentes y consulte sus revisiones publicadas vigentes. Volver a una versión de agente no revertiría las fuentes.

Las reglas se evalúan en este orden:

1. Intención o política, como pedir una persona, un reclamo o un tema restringido.
2. Evidencia disponible en el conocimiento autorizado.
3. Horario y disponibilidad del negocio.

Si no hay evidencia suficiente para recuperar fuentes, la IA deriva con resumen y no responde al cliente. Las respuestas citan fuentes. El producto muestra cobertura y motivo de derivación, sin confianza numérica autoreportada. El umbral de recuperación y las reglas concretas de horario siguen pendientes.

El simulador permite probar borradores o versiones publicadas y revisar el resultado sin generar mensajes, envíos ni indicadores de conversaciones reales.

## Canales

Webchat incluye widget embebible, identidad anónima de visitante y actualización en vivo para cliente y equipo. El negocio limita los dominios donde permite usarlo.

WhatsApp se incorpora después, con Kapso como propuesta pendiente. Fuera de las 24 horas desde el último mensaje válido del cliente, el MVP bloquea el envío libre y muestra el aviso. La zona horaria del workspace se solicita al crearlo; no se deduce del entorno del desarrollador.

## Indicadores

El panel contiene conversaciones hoy, activas, resueltas, resolución IA, mediana de primera respuesta y handoffs. Cada tarjeta abre el Inbox filtrado. La referencia única de fórmulas y cohortes propuestas es la [sección 11 del diseño de base de datos](DATABASE_DESIGN.md#11-seis-kpis-a-partir-de-eventos--fase-5).

Resolución IA significa ausencia de respuesta humana enviada, no ausencia de toda intervención humana. Las definiciones temporales y de cohorte requieren aceptación antes de construir el panel.

## Comprobación del MVP

Los [criterios por fase del plan](MVP_PLAN.md) describen los recorridos pendientes de verificar:

- Crear workspace, invitar a un Agente humano y comprobar límites de sus permisos.
- Escribir desde un widget externo, recibir en Inbox, responder al visitante y resolver.
- Responder sobre una FAQ citándola; derivar una petición de persona y una pregunta sin evidencia.
- Recibir desde un celular real, responder o derivar, y comprobar la pausa de IA durante atención humana.
- Abrir el Inbox filtrado desde los seis indicadores del piloto.

La estimación original de nueve a once semanas es una previsión para un desarrollador, no un calendario iniciado ni un compromiso de entrega.
