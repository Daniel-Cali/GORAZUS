# 19 — Documentos

**Ícono sugerido:** `folder-archive`
**Tipo:** Dueño de datos (transversal) — ver
[04-catalogo-modulos-negocio.md](../architecture/04-catalogo-modulos-negocio.md#documentos-como-repositorio-transversal-no-como-dueño-de-negocio)
**Descripción:** Repositorio documental centralizado: adjuntos,
versionado y flujos de aprobación de archivos referenciados desde
cualquier módulo. No interpreta el contenido de negocio de lo que
guarda.
**Módulos relacionados:** todos (cualquier módulo puede adjuntar
archivos a sus propios registros a través de este servicio),
almacenamiento físico en MinIO (ver
[08-infraestructura-y-despliegue.md](../architecture/08-infraestructura-y-despliegue.md#5-minio-buckets)).

## Submenú: Repositorio de Documentos

### Formularios

| Formulario          | Qué hace                                                                               | Tablas principales          | Permiso                 | Documento que genera |
| ------------------- | -------------------------------------------------------------------------------------- | --------------------------- | ----------------------- | -------------------- |
| Documento           | Sube un archivo y lo asocia a un registro de otro módulo (`moduloOrigen`, `entidadId`) | `documentos.documento`      | `documentos.crear`      | —                    |
| Tipo de Documento   | Cataloga tipos (contrato, comprobante, certificado, plano) con reglas de retención     | `documentos.tipo_documento` | `documentos.configurar` | —                    |
| Carpeta / Categoría | Organiza documentos en árbol de carpetas por módulo o libre                            | `documentos.carpeta`        | `documentos.configurar` | —                    |

### Acciones

| Acción                               | Qué hace                                                                     | Permiso             | Efecto/Evento                 |
| ------------------------------------ | ---------------------------------------------------------------------------- | ------------------- | ----------------------------- |
| Subir Nueva Versión                  | Registra una nueva versión del mismo documento, conservando el historial     | `documentos.editar` | Publica `DocumentoVersionado` |
| Descargar Documento                  | Genera URL firmada de corta duración hacia MinIO                             | `documentos.ver`    | —                             |
| Eliminar Documento                   | Marca el documento como eliminado (soft delete, según política de retención) | `documentos.anular` | —                             |
| Compartir Documento (enlace externo) | Genera un enlace temporal para compartir con un tercero                      | `documentos.ver`    | —                             |

## Submenú: Flujos de Aprobación

| Elemento                                          | Detalle                                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Formulario — Flujo de Aprobación de Documento     | Qué hace: define secuencia de aprobadores requerida para un tipo de documento (p. ej. contratos) | Tablas: `documentos.flujo_aprobacion` | Permiso: `documentos.configurar`                   |
| Acción — Aprobar/Rechazar Documento               | Registra la decisión de un paso del flujo                                                        | `documentos.aprobar`                  | Publica `DocumentoAprobado` / `DocumentoRechazado` |
| Consulta — Documentos Pendientes de mi Aprobación | Qué muestra: bandeja de aprobación del usuario logueado                                          | Permiso: `documentos.ver`             |

## Submenú: Firma Electrónica

| Elemento                   | Detalle                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| Acción — Enviar a Firma    | Qué hace: envía el documento a firma electrónica (propia o de un proveedor externo integrado) | Permiso: `documentos.confirmar` |
| Consulta — Estado de Firma | Qué muestra: quién firmó, quién falta, fecha de cada firma                                    | Permiso: `documentos.ver`       |

## Submenú: Reportes de Documentos

| Reporte                                  | Qué muestra                                                     | Filtros principales |
| ---------------------------------------- | --------------------------------------------------------------- | ------------------- |
| Documentos por Vencer Retención/Vigencia | Documentos próximos a su fecha límite (contratos, certificados) | Rango de días, tipo |
| Documentos Pendientes de Aprobación      | Antigüedad de cada solicitud pendiente                          | Período             |
| Uso de Almacenamiento                    | Volumen ocupado por módulo/tipo de documento                    | —                   |

## Submenú: Consultas

| Consulta                             | Qué muestra                                                                        | Permiso          |
| ------------------------------------ | ---------------------------------------------------------------------------------- | ---------------- |
| Buscar documento                     | Búsqueda libre por nombre, tipo, módulo de origen, contenido (si hay OCR/indexado) | `documentos.ver` |
| Documentos de un registro específico | Todos los archivos adjuntos a una factura/contrato/empleado puntual                | `documentos.ver` |

## Configuraciones del módulo

| Parámetro                                   | Qué controla                                          |
| ------------------------------------------- | ----------------------------------------------------- |
| Tamaño máximo por archivo                   | Límite de subida                                      |
| Tipos de archivo permitidos                 | Extensiones/MIME types aceptados                      |
| Política de retención por tipo de documento | Tiempo mínimo de conservación antes de poder eliminar |
| Bucket de MinIO por módulo                  | Dónde se almacena físicamente cada tipo de documento  |
