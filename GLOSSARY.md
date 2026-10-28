# Atención de conversaciones en Compathium

Este glosario fija el vocabulario del MVP. Las propuestas sobre ciclo de conversación y métricas se detallan en los documentos de diseño.

## Lenguaje

**Workspace**:
Espacio de trabajo de un negocio que reúne su equipo, canales, contactos, conocimiento y agente de IA.
_Evitar_: cuenta como sinónimo de workspace, organización superior al workspace.

**Miembro**:
Persona que pertenece al equipo de un workspace y tiene un rol en él. Puede pertenecer a varios workspaces.

**Owner**:
Rol de propietario del workspace.

**Admin**:
Rol que administra configuración, conocimiento, agente de IA y equipo del workspace.

**Agente humano**:
Miembro con rol Agente que atiende conversaciones y consulta contactos.
_Evitar_: agente sin aclaración cuando pueda confundirse con el agente de IA.

**Agente de IA**:
Configuración de atención automática del workspace, con objetivo, tono, idioma, fuentes y reglas de derivación. El MVP contempla uno por workspace.

**Canal**:
Medio por el que el negocio conversa con sus clientes. El MVP contempla webchat y WhatsApp.

**Cuenta de canal**:
Conexión concreta de un workspace a un canal, como su número de WhatsApp o su webchat.
_Evitar_: cuenta de usuario.

**Contacto**:
Persona atendida por el negocio en sus canales.
_Evitar_: miembro, usuario interno.

**Identidad de contacto**:
Identidad externa de un contacto dentro de una cuenta de canal. Un contacto puede tener varias identidades.

**Conversación**:
Hilo de atención de un contacto en una cuenta de canal, con mensajes y un estado de atención.

**Inbox**:
Interfaz del equipo para consultar conversaciones, responder, asignar atención y resolver hilos.
_Evitar_: bandejas separadas por proveedor como concepto del producto.

**Nota interna**:
Mensaje del equipo dentro de una conversación que el cliente no puede ver.

**Derivación o handoff**:
Paso de una conversación a atención humana con motivo y resumen del contexto.
_Evitar_: confianza baja como explicación única de la derivación.

**Pausa de IA**:
Condición de una conversación que impide nuevas respuestas automáticas. Quitar una asignación no equivale a reanudar la IA.

**Fuente de conocimiento**:
FAQ o documento que aporta información del negocio para responder a clientes.

**Revisión publicada**:
Contenido de una fuente habilitado para consulta después de completar su preparación. Un borrador no es conocimiento publicado.

**Versión de agente**:
Configuración publicada del agente de IA, conservada sin modificaciones para poder revisarla o volver a ella.

**Ejecución de IA**:
Intento lógico de responder o derivar, con la configuración y evidencia utilizadas y su resultado.

**Cobertura de evidencia**:
Clasificación de la evidencia recuperada como ninguna, parcial o fuerte. No representa un porcentaje de confianza del modelo.

**Simulador**:
Entorno para probar el agente y examinar fuentes, cobertura y derivaciones sin enviar mensajes a clientes.

**Ventana de WhatsApp**:
Período de 24 horas desde el último mensaje válido del cliente durante el que el MVP permite envío libre por WhatsApp.

**Resolución IA**:
Indicador propuesto de conversaciones resueltas con al menos una respuesta enviada por IA y ninguna enviada por una persona. Una persona puede haber marcado la resolución.
