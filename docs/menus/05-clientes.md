# 05 — Clientes

**Ícono sugerido:** `users`
**Tipo:** Dueño de datos
**Descripción:** Maestro único de clientes de la empresa: datos
fiscales, contactos, direcciones, condiciones comerciales y su
situación de cuenta corriente.
**Módulos relacionados:** `ventas` (facturación), `crm` (seguimiento
comercial), `tesoreria`/`contabilidad` (cuentas por cobrar), `pos`
(cliente de mostrador), `documentos` (adjuntos contractuales).

## Submenú: Maestro de Clientes

### Formularios

| Formulario                    | Qué hace                                                                       | Tablas principales             | Permiso               | Documento que genera |
| ----------------------------- | ------------------------------------------------------------------------------ | ------------------------------ | --------------------- | -------------------- |
| Cliente                       | Alta/edición de cliente: datos fiscales, condición de pago, límite de crédito  | `clientes.cliente`             | `clientes.crear`      | —                    |
| Contacto de Cliente           | Registra personas de contacto dentro de una cuenta cliente                     | `clientes.contacto`            | `clientes.editar`     | —                    |
| Dirección de Cliente          | Registra direcciones de facturación/entrega                                    | `clientes.direccion`           | `clientes.editar`     | —                    |
| Categoría/Segmento de Cliente | Clasifica clientes para precios/reportes                                       | `clientes.categoria`           | `clientes.configurar` | —                    |
| Condición Comercial           | Define plazo de pago, descuento por pronto pago, límite de crédito por defecto | `clientes.condicion_comercial` | `clientes.configurar` | —                    |

### Acciones

| Acción                       | Qué hace                                                    | Permiso            | Efecto/Evento                                                  |
| ---------------------------- | ----------------------------------------------------------- | ------------------ | -------------------------------------------------------------- |
| Bloquear/Desbloquear Cliente | Impide nuevas ventas a un cliente (mora, riesgo)            | `clientes.editar`  | Publica `ClienteBloqueado`; `ventas` valida antes de confirmar |
| Ajustar Límite de Crédito    | Modifica el techo de crédito autorizado                     | `clientes.aprobar` | Publica `ClienteActualizado`                                   |
| Fusionar Clientes Duplicados | Unifica dos registros de cliente detectados como duplicados | `clientes.editar`  | Reasigna historial, publica `ClienteActualizado`               |

## Submenú: Cuenta Corriente

| Elemento                            | Detalle                                                                                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consulta — Estado de Cuenta         | Qué muestra: saldo y detalle de movimientos de un cliente (facturas, notas, cobros). Tablas: proyección de `ventas` + `tesoreria`. Permiso: `clientes.ver` |
| Reporte — Estado de Cuenta (formal) | Versión imprimible/enviable del estado de cuenta, para el cliente                                                                                          | `clientes.ver` |
| Reporte — Antigüedad de Saldos      | Saldo vencido agrupado por rango de días (0-30, 31-60, 61-90, +90)                                                                                         | `clientes.ver` |

## Submenú: Reportes de Clientes

| Reporte                             | Qué muestra                                                        | Filtros principales                  |
| ----------------------------------- | ------------------------------------------------------------------ | ------------------------------------ |
| Listado de Clientes                 | Ficha resumida de todos los clientes                               | Categoría, estado (activo/bloqueado) |
| Clientes Nuevos del Período         | Altas registradas en un rango de fechas                            | Período                              |
| Clientes Inactivos                  | Sin compras en N días                                              | Rango de días                        |
| Ranking de Clientes por Facturación | Ver también en [Ventas](./02-ventas.md#submenú-reportes-de-ventas) | Período                              |

## Submenú: Consultas

| Consulta                   | Qué muestra                                                               | Permiso                                                                                 |
| -------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Buscar cliente             | Búsqueda libre por nombre, identificación fiscal, teléfono                | `clientes.ver`                                                                          |
| Historial 360° del cliente | Ventas, cobros, oportunidades CRM y tickets de servicio en una sola vista | `clientes.ver` (requiere también `.ver` en los módulos de origen para ver cada sección) |

## Configuraciones del módulo

| Parámetro                           | Qué controla                                                              |
| ----------------------------------- | ------------------------------------------------------------------------- |
| Validación de identificación fiscal | Formato/dígito verificador según país                                     |
| Bloqueo automático por mora         | Días de atraso que disparan bloqueo automático (coordina con `tesoreria`) |
| Campos obligatorios de alta         | Qué campos son requeridos para dar de alta un cliente                     |
