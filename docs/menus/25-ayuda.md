# 25 — Ayuda

**Ícono sugerido:** `circle-help`
**Tipo:** Estático/soporte (sin datos transaccionales de negocio)
**Descripción:** Centro de ayuda contextual, documentación de usuario y
canal de soporte. Es deliberadamente el módulo más simple del sistema —
no gestiona procesos de negocio, solo contenido de apoyo.
**Módulos relacionados:** ninguno como dependencia — puede referenciar
contextualmente la pantalla activa de cualquier módulo para mostrar
ayuda relevante.

## Submenú: Centro de Ayuda

| Elemento                              | Detalle                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| Consulta — Ayuda Contextual           | Qué muestra: artículo de ayuda relacionado con la pantalla actual del usuario   | Tablas: `ayuda.articulo` | Permiso: `ayuda.ver` |
| Consulta — Buscar en la Documentación | Búsqueda libre sobre todo el contenido de ayuda                                 | `ayuda.ver`              |
| Formulario — Artículo de Ayuda        | Alta/edición de contenido de ayuda (uso interno del equipo de producto/soporte) | `ayuda.articulo`         | `ayuda.configurar`   |

## Submenú: Soporte

| Elemento                       | Detalle                                                                  |
| ------------------------------ | ------------------------------------------------------------------------ |
| Formulario — Ticket de Soporte | Qué hace: el usuario reporta un problema o consulta al equipo de soporte | Tablas: `ayuda.ticket_soporte` | Permiso: `ayuda.crear` |
| Consulta — Mis Tickets         | Historial de tickets enviados por el usuario y su estado                 | `ayuda.ver`                    |

## Submenú: Novedades del Sistema

| Elemento                    | Detalle                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| Consulta — Notas de Versión | Qué muestra: cambios y mejoras publicadas por versión del sistema | `ayuda.ver` |

## Configuraciones del módulo

| Parámetro                  | Qué controla                                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| Canal de soporte activo    | Si los tickets se gestionan dentro del sistema o se redirigen a un canal externo (correo, mesa de ayuda) |
| Idioma de la documentación | Idioma por defecto del contenido de ayuda mostrado                                                       |
