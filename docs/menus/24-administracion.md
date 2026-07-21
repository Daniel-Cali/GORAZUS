# 24 — Administración

**Ícono sugerido:** `server-cog`
**Tipo:** Infraestructura/sistema — ver
[04-catalogo-modulos-negocio.md](../architecture/04-catalogo-modulos-negocio.md#administracion-vs-seguridad-por-qué-son-módulos-distintos)
**Descripción:** Administración técnica del sistema en sí: respaldo y
restauración, salud de la infraestructura, integraciones externas,
importación/exportación masiva de datos y licenciamiento. Distinto de
`seguridad` (autorización de negocio).
**Módulos relacionados:** transversal — opera sobre `core/`
(base de datos, cache, mensajería, almacenamiento; ver
[08-infraestructura-y-despliegue.md](../architecture/08-infraestructura-y-despliegue.md)),
no sobre datos de negocio de otros módulos directamente.

## Submenú: Respaldo y Restauración

| Elemento                              | Detalle                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------- |
| Formulario — Programación de Respaldo | Qué hace: define frecuencia y retención de backups de PostgreSQL/MinIO                | Tablas: `administracion.programacion_backup` | Permiso: `administracion.configurar` |
| Acción — Ejecutar Respaldo Manual     | Corre un backup fuera de la programación                                              | `administracion.confirmar`                   | —                                    |
| Acción — Restaurar desde Respaldo     | Restaura el sistema a un punto anterior (acción crítica, requiere doble confirmación) | `administracion.aprobar`                     | —                                    |
| Consulta — Historial de Respaldos     | Qué muestra: backups ejecutados, tamaño, estado (exitoso/fallido)                     | Permiso: `administracion.ver`                |

## Submenú: Salud del Sistema

| Elemento                                          | Detalle                                                                                                                                                   |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta — Estado de Servicios                    | Qué muestra: disponibilidad de Postgres, Redis, RabbitMQ, MinIO en tiempo real                                                                            | Permiso: `administracion.ver` |
| Consulta — Colas de Eventos                       | Qué muestra: mensajes pendientes/fallidos por cola de RabbitMQ (ver [06-comunicacion-entre-modulos.md](../architecture/06-comunicacion-entre-modulos.md)) | Permiso: `administracion.ver` |
| Acción — Reprocesar Mensajes de Dead-Letter Queue | Reintenta manualmente eventos que fallaron repetidamente                                                                                                  | `administracion.confirmar`    | —   |
| Reporte — Uso de Recursos                         | CPU/memoria/almacenamiento por servicio                                                                                                                   | Período                       |

## Submenú: Integraciones Externas

### Formularios

| Formulario          | Qué hace                                                                                                    | Tablas principales           | Permiso                     | Documento que genera |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------- | -------------------- |
| Integración Externa | Registra la configuración de una integración (facturación electrónica, pasarela de pago, banco, e-commerce) | `administracion.integracion` | `administracion.crear`      | —                    |
| Credenciales de API | Guarda claves/tokens de servicios externos (cifradas)                                                       | `administracion.credencial`  | `administracion.configurar` | —                    |

### Acciones

| Acción                         | Qué hace                                           | Permiso                    | Efecto/Evento |
| ------------------------------ | -------------------------------------------------- | -------------------------- | ------------- |
| Probar Conexión                | Verifica que la integración responde correctamente | `administracion.confirmar` | —             |
| Activar/Desactivar Integración | Habilita o deshabilita sin borrar la configuración | `administracion.editar`    | —             |

## Submenú: Importación y Exportación Masiva

| Elemento                              | Detalle                                                                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Formulario — Plantilla de Importación | Qué hace: define el mapeo de columnas de un archivo a los campos de un módulo destino (clientes, productos, saldos iniciales) | Tablas: `administracion.plantilla_importacion` | Permiso: `administracion.configurar`                                                   |
| Acción — Importar Datos               | Ejecuta la carga masiva validando contra las reglas del módulo destino                                                        | `administracion.confirmar`                     | Llama a los comandos públicos del módulo destino — nunca inserta directo en sus tablas |
| Consulta — Registro de Importaciones  | Qué muestra: importaciones ejecutadas, filas procesadas/rechazadas, motivo de rechazo                                         | Permiso: `administracion.ver`                  |
| Acción — Exportar Datos Masivos       | Exporta datos de un módulo a archivo para migración o respaldo externo                                                        | `administracion.exportar`                      | —                                                                                      |

## Submenú: Licenciamiento

| Elemento                      | Detalle                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| Consulta — Estado de Licencia | Qué muestra: módulos habilitados, cantidad de usuarios/empresas contratados vs. en uso | Permiso: `administracion.ver` |
| Formulario — Activar Licencia | Registra el código/certificado de licencia                                             | `administracion.configurar`   | —   |

## Submenú: Reportes de Administración

| Reporte                              | Qué muestra                                       | Filtros principales |
| ------------------------------------ | ------------------------------------------------- | ------------------- |
| Bitácora de Acciones Administrativas | Auditoría de toda acción ejecutada en este módulo | Período, usuario    |
| Errores de Integración               | Fallos de conexión/envío por integración          | Período             |

## Configuraciones del módulo

| Parámetro                                | Qué controla                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| Retención de respaldos                   | Cuántas copias/días se conservan                                              |
| Requiere doble aprobación para restaurar | Si restaurar un backup necesita `administracion.aprobar` de más de un usuario |
| Notificación de fallos de integración    | A quién se alerta cuando una integración falla                                |
