# 01 — Dashboard

**Ícono sugerido:** `layout-dashboard`
**Tipo:** Composición (sin datos propios) — ver
[04-catalogo-modulos-negocio.md](../architecture/04-catalogo-modulos-negocio.md#dashboard-como-composición-pura-igual-que-pos)
**Descripción:** Panel de inicio tras el login. Muestra un resumen
ejecutivo de la operación del día/período según los módulos a los que
el usuario tiene acceso. No registra información propia — cada widget
consume una proyección de solo lectura publicada por su módulo dueño.
**Módulos relacionados:** todos los módulos con datos operativos
(ventas, compras, inventario, caja, bancos, contabilidad, crm, pos,
producción, servicios, proyectos, rrhh).

## Submenú: Panel General

| Elemento                               | Detalle                                                                                                                                                                                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formulario                             | Ninguno — es una pantalla de solo lectura, configurable por el usuario (elegir qué widgets mostrar y en qué orden)                                                                                                                                                                    |
| Acción — Personalizar panel            | Qué hace: agrega/quita/reordena widgets visibles. Tablas: `dashboard.preferencia_usuario`. Permiso: `dashboard.configurar`                                                                                                                                                            |
| Acción — Fijar empresa/sucursal activa | Qué hace: cambia el contexto multiempresa/multisucursal que filtra todos los widgets. Tablas: ninguna propia, resuelve `TenantContext` (ver [09-seguridad-y-multiempresa.md](../architecture/09-seguridad-y-multiempresa.md)). Permiso: implícito según empresas asignadas al usuario |
| Consulta — Alertas del día             | Qué muestra: vencimientos de CxC/CxP, stock bajo mínimo, tareas de producción/servicio atrasadas. Tablas: proyecciones de `ventas`, `compras`, `inventario`, `produccion`, `servicios`. Permiso: `dashboard.ver` (implica tener permiso `.ver` en el módulo de origen de cada alerta) |

## Widgets estándar (por módulo habilitado)

| Widget                              | Módulo origen         | Qué muestra                                       | Documento relacionado             |
| ----------------------------------- | --------------------- | ------------------------------------------------- | --------------------------------- |
| Ventas del día/mes                  | `ventas`              | Total facturado, comparación vs. período anterior | —                                 |
| Top clientes                        | `clientes` + `ventas` | Ranking por facturación                           | —                                 |
| Cuentas por cobrar vencidas         | `tesoreria`           | Monto y antigüedad de saldo                       | Estado de Cuenta (ver `clientes`) |
| Cuentas por pagar próximas a vencer | `tesoreria`           | Monto y fecha de vencimiento                      | —                                 |
| Posición de caja y bancos           | `tesoreria`           | Saldo consolidado disponible                      | —                                 |
| Stock bajo mínimo                   | `inventario`          | Productos que requieren reposición                | —                                 |
| Órdenes de producción activas       | `produccion`          | Avance por orden                                  | —                                 |
| Órdenes de servicio abiertas        | `servicios`           | Pendientes por técnico/SLA                        | —                                 |
| Oportunidades en pipeline           | `crm`                 | Valor total por etapa                             | —                                 |
| Ventas POS del turno                | `pos`                 | Total del turno activo                            | —                                 |
| Proyectos activos                   | `proyectos`           | Avance vs. presupuesto                            | —                                 |
| Cumpleaños/vencimientos de contrato | `recursos-humanos`    | Próximos 30 días                                  | —                                 |

## Configuraciones

| Parámetro                   | Qué controla                                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Widgets habilitados por rol | Qué widgets pueden verse según el rol del usuario (`seguridad`)                                                                                                                                  |
| Período por defecto         | Rango de fechas inicial de los widgets (hoy, mes actual, últimos 30 días)                                                                                                                        |
| Refresco automático         | Intervalo de actualización de los widgets en tiempo real (vía WebSocket, ver [05-flujo-de-datos.md](../architecture/05-flujo-de-datos.md#2-ciclo-de-vida-de-un-evento-en-tiempo-real-websocket)) |
