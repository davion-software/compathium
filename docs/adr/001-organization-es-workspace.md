# ADR 001 — Organization de Better Auth representa un workspace

Fecha: 6 de septiembre de 2026. Estado: aceptado por decisión cerrada del plan del MVP.

## Contexto

El plan elimina el segundo nivel `organizations → workspaces` del documento maestro para el MVP. Better Auth con el plugin `organization` será responsable de sesiones, membresías e invitaciones.

## Decisión

- Una fila de `organizations` es un workspace; no crear otra tabla `workspaces`.
- La UI dice «workspace»; contratos, repositorios y base usan `organization` / `organization_id`.
- Usuarios y credenciales son globales. Un usuario puede tener membresías en varios workspaces.
- Cada entidad de negocio incluye tenant y sus referencias usan claves compuestas para impedir relaciones entre tenants.
- El workspace activo se obtiene de la sesión y se valida contra la membresía vigente. No equivale a una autorización por sí mismo.
- Roles del producto: Owner, Admin y Agente. El diseño propone mapear Agente al rol `member` de Better Auth y definir permisos explícitos del producto.

## Consecuencias

No hay jerarquía de organizaciones, equipos internos ni rol Supervisor en el corte. No se crea un sistema de autenticación paralelo. El esquema de Better Auth se genera desde la configuración/versiones fijadas; las migraciones se ejecutan con Drizzle.

Las pruebas de aislamiento deben cubrir HTTP, worker, SSE, archivos y búsqueda semántica. Las FK no sustituyen los filtros de lectura ni RBAC.

Detalle: [diseño de base de datos](../diseno-base-de-datos.md).
