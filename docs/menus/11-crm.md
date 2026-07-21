# 11 — CRM

**Ícono sugerido:** `handshake`
**Tipo:** Dueño de datos
**Descripción:** Gestión comercial: prospectos, oportunidades, pipeline
de ventas, actividades de seguimiento y campañas de marketing básicas.
**Módulos relacionados:** `clientes` (conversión de prospecto),
`ventas` (conversión de oportunidad en pedido), `recursos-humanos`
(vendedores como usuarios del sistema), `documentos`, `reportes`/`bi`.

## Submenú: Prospectos

### Formularios

| Formulario       | Qué hace                                                        | Tablas principales  | Permiso          | Documento que genera |
| ---------------- | --------------------------------------------------------------- | ------------------- | ---------------- | -------------------- |
| Prospecto        | Registra un contacto comercial que aún no es cliente            | `crm.prospecto`     | `crm.crear`      | —                    |
| Fuente de Origen | Define de dónde provienen los prospectos (referido, web, feria) | `crm.fuente_origen` | `crm.configurar` | —                    |

### Acciones

| Acción                         | Qué hace                                                            | Permiso         | Efecto/Evento                                       |
| ------------------------------ | ------------------------------------------------------------------- | --------------- | --------------------------------------------------- |
| Convertir Prospecto en Cliente | Llama al comando público de `clientes` para crear el cliente formal | `crm.confirmar` | Llamada síncrona a `ClientesCommandService.crear()` |
| Descalificar Prospecto         | Marca un prospecto como no viable, con motivo                       | `crm.editar`    | —                                                   |

## Submenú: Oportunidades (Pipeline)

### Formularios

| Formulario        | Qué hace                                                                              | Tablas principales   | Permiso          | Documento que genera |
| ----------------- | ------------------------------------------------------------------------------------- | -------------------- | ---------------- | -------------------- |
| Oportunidad       | Registra una posible venta: cliente/prospecto, valor estimado, etapa, probabilidad    | `crm.oportunidad`    | `crm.crear`      | —                    |
| Etapa de Pipeline | Define las etapas del embudo de ventas (calificación, propuesta, negociación, cierre) | `crm.etapa_pipeline` | `crm.configurar` | —                    |
| Motivo de Pérdida | Cataloga razones por las que se pierde una oportunidad                                | `crm.motivo_perdida` | `crm.configurar` | —                    |

### Acciones

| Acción                   | Qué hace                                                                    | Permiso         | Efecto/Evento                                                          |
| ------------------------ | --------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------- |
| Avanzar/Retroceder Etapa | Mueve la oportunidad en el pipeline (drag & drop o manual)                  | `crm.editar`    | Publica `OportunidadActualizada`                                       |
| Ganar Oportunidad        | Cierra la oportunidad como ganada y genera la Cotización/Pedido en `ventas` | `crm.confirmar` | Llamada síncrona a `VentasCommandService`; publica `OportunidadGanada` |
| Perder Oportunidad       | Cierra la oportunidad como perdida, con motivo                              | `crm.confirmar` | Publica `OportunidadPerdida`                                           |

## Submenú: Actividades

### Formularios

| Formulario                          | Qué hace                                                                         | Tablas principales          | Permiso          | Documento que genera |
| ----------------------------------- | -------------------------------------------------------------------------------- | --------------------------- | ---------------- | -------------------- |
| Actividad (Llamada, Reunión, Tarea) | Registra una interacción o pendiente asociado a un prospecto/cliente/oportunidad | `crm.actividad`             | `crm.crear`      | —                    |
| Plantilla de Seguimiento            | Define secuencias de actividades sugeridas por etapa                             | `crm.plantilla_seguimiento` | `crm.configurar` | —                    |

### Acciones

| Acción                          | Qué hace                                          | Permiso      | Efecto/Evento |
| ------------------------------- | ------------------------------------------------- | ------------ | ------------- |
| Completar Actividad             | Marca una actividad como realizada, con resultado | `crm.editar` | —             |
| Reasignar Actividad/Oportunidad | Cambia el vendedor responsable                    | `crm.editar` | —             |

## Submenú: Campañas

| Elemento                           | Detalle                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| Formulario — Campaña               | Qué hace: agrupa prospectos/oportunidades bajo una iniciativa de marketing con presupuesto | Tablas: `crm.campana` | Permiso: `crm.crear` |
| Reporte — Retorno de Campaña (ROI) | Qué muestra: costo de campaña vs. valor de oportunidades generadas/ganadas                 | Campaña, período      |

## Submenú: Reportes de CRM

| Reporte                           | Qué muestra                                         | Filtros principales |
| --------------------------------- | --------------------------------------------------- | ------------------- |
| Pipeline por Etapa                | Valor total y cantidad de oportunidades por etapa   | Vendedor, período   |
| Tasa de Conversión                | Prospecto→Oportunidad→Venta, por vendedor/fuente    | Período             |
| Oportunidades Perdidas por Motivo | Ranking de motivos de pérdida                       | Período             |
| Actividad Comercial por Vendedor  | Cantidad de actividades realizadas vs. planificadas | Vendedor, período   |

## Submenú: Consultas

| Consulta                        | Qué muestra                                | Permiso   |
| ------------------------------- | ------------------------------------------ | --------- |
| Buscar prospecto/oportunidad    | Búsqueda libre por nombre, vendedor, etapa | `crm.ver` |
| Próximas actividades pendientes | Agenda del vendedor logueado               | `crm.ver` |

## Configuraciones del módulo

| Parámetro                       | Qué controla                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| Probabilidad por etapa          | Porcentaje de cierre esperado asignado a cada etapa del pipeline (usado en forecast) |
| Días de inactividad para alerta | Dispara recordatorio si una oportunidad no tuvo actividad en N días                  |
| Campos obligatorios por etapa   | Qué datos deben completarse antes de avanzar de etapa                                |
