# 09 — Contabilidad

**Ícono sugerido:** `book-text`
**Tipo:** Dueño de datos
**Descripción:** Plan de cuentas, asientos contables, libros oficiales,
cierres de período y estados financieros. Consume eventos de los
módulos operativos para generar asientos automáticos — nunca dicta
cómo debe operar un módulo operativo (ver
[04-catalogo-modulos-negocio.md](../architecture/04-catalogo-modulos-negocio.md#contabilidad-como-consumidor-no-como-orquestador)).
**Módulos relacionados:** `ventas`, `compras`, `caja`, `bancos`,
`nomina`, `activos-fijos`, `produccion` (todos como emisores de
eventos), `configuracion` (empresa/moneda/período fiscal),
`reportes`/`bi`.

## Submenú: Plan de Cuentas

### Formularios

| Formulario                   | Qué hace                                                                                                        | Tablas principales              | Permiso                   | Documento que genera |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------- | -------------------- |
| Cuenta Contable              | Alta/edición de una cuenta del plan (naturaleza, nivel, cuenta padre)                                           | `contabilidad.cuenta`           | `contabilidad.configurar` | —                    |
| Centro de Costo              | Define unidades de costeo (sucursal, área, proyecto)                                                            | `contabilidad.centro_costo`     | `contabilidad.configurar` | —                    |
| Tipo de Comprobante Contable | Define tipos de asiento (diario, ajuste, apertura, cierre)                                                      | `contabilidad.tipo_comprobante` | `contabilidad.configurar` | —                    |
| Regla de Asiento Automático  | Mapea un evento de otro módulo (`VentaConfirmada`, `NominaLiquidada`) a la plantilla de asiento correspondiente | `contabilidad.regla_asiento`    | `contabilidad.configurar` | —                    |

## Submenú: Asientos Contables

### Formularios

| Formulario          | Qué hace                                                                                             | Tablas principales                                   | Permiso              | Documento que genera |
| ------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------- | -------------------- |
| Asiento Manual      | Registra un asiento contable manual (ajustes, previsiones)                                           | `contabilidad.asiento`, `contabilidad.asiento_linea` | `contabilidad.crear` | Asiento Contable     |
| Asiento Recurrente  | Define una plantilla de asiento que se repite periódicamente (amortizaciones, previsiones mensuales) | `contabilidad.asiento_recurrente`                    | `contabilidad.crear` | —                    |
| Asiento de Apertura | Registra los saldos iniciales al comenzar un ejercicio                                               | `contabilidad.asiento`                               | `contabilidad.crear` | Asiento de Apertura  |

### Acciones

| Acción                                  | Qué hace                                                                                                                    | Permiso                  | Efecto/Evento                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------- |
| Contabilizar evento de módulo operativo | Genera el asiento automático a partir de un evento recibido (`VentaConfirmada`, etc.) según la Regla de Asiento configurada | Automático (sistema)     | Consume evento del módulo origen; publica `AsientoGenerado` |
| Confirmar/Mayorizar asiento             | Pasa un asiento manual a definitivo (ya no editable)                                                                        | `contabilidad.confirmar` | Publica `AsientoGenerado`                                   |
| Anular/Reversar asiento                 | Genera el asiento inverso de uno ya mayorizado                                                                              | `contabilidad.anular`    | Publica `AsientoReversado`                                  |
| Reprocesar asiento fallido              | Reintenta la generación automática de un asiento que falló (evento recibido pero regla incompleta)                          | `contabilidad.confirmar` | —                                                           |

## Submenú: Cierres y Períodos

| Elemento                     | Detalle                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| Formulario — Período Fiscal  | Define los períodos contables abiertos/cerrados del ejercicio                                        | Tablas: `contabilidad.periodo` | Permiso: `contabilidad.configurar` |
| Acción — Cerrar Período      | Bloquea la carga de nuevos asientos en un período ya cerrado                                         | `contabilidad.aprobar`         | Publica `PeriodoCerrado`           |
| Acción — Reabrir Período     | Habilita temporalmente un período cerrado (con auditoría)                                            | `contabilidad.aprobar`         | Publica `PeriodoReabierto`         |
| Acción — Cierre de Ejercicio | Traslada resultados del ejercicio a cuentas patrimoniales y genera asiento de apertura del siguiente | `contabilidad.aprobar`         | Documento: Asiento de Cierre       |

## Submenú: Multimoneda

| Elemento                                          | Detalle                                                         |
| ------------------------------------------------- | --------------------------------------------------------------- |
| Formulario — Tipo de Cambio                       | Registra la cotización diaria por moneda                        | Tablas: `contabilidad.tipo_cambio` (coordina con `configuracion.moneda`) | Permiso: `contabilidad.configurar` |
| Acción — Revaluación de Saldos por Tipo de Cambio | Recalcula saldos en moneda extranjera a la cotización de cierre | `contabilidad.confirmar`                                                 | Documento: Asiento de Revaluación  |

## Submenú: Estados Financieros

| Reporte                                          | Qué muestra                               | Filtros principales             |
| ------------------------------------------------ | ----------------------------------------- | ------------------------------- |
| Balance General (Estado de Situación Financiera) | Activo, pasivo y patrimonio a una fecha   | Fecha de corte, centro de costo |
| Estado de Resultados                             | Ingresos, costos y gastos de un período   | Período, centro de costo        |
| Estado de Flujo de Efectivo                      | Origen y aplicación de fondos del período | Período                         |
| Balance de Comprobación (Sumas y Saldos)         | Saldo por cuenta a una fecha              | Fecha de corte                  |
| Libro Diario                                     | Todos los asientos en orden cronológico   | Período                         |
| Libro Mayor                                      | Movimientos agrupados por cuenta          | Cuenta, período                 |
| Estado de Resultados por Centro de Costo         | Rentabilidad por sucursal/área/proyecto   | Período, centro de costo        |

## Submenú: Impuestos

| Elemento                                                | Detalle                                              |
| ------------------------------------------------------- | ---------------------------------------------------- |
| Formulario — Régimen/Tasa de Impuesto                   | Define tasas de IVA/IGV/impuestos locales aplicables | Tablas: `contabilidad.impuesto` | Permiso: `contabilidad.configurar` |
| Reporte — Libro de IVA Ventas                           | Detalle fiscal de IVA/impuesto repercutido           | Período                         |
| Reporte — Libro de IVA Compras                          | Detalle fiscal de IVA/impuesto soportado             | Período                         |
| Reporte — Declaración de Impuesto (según régimen local) | Resumen para presentación ante autoridad fiscal      | Período                         |

## Submenú: Consultas

| Consulta                                   | Qué muestra                                                              | Permiso            |
| ------------------------------------------ | ------------------------------------------------------------------------ | ------------------ |
| Buscar asiento                             | Búsqueda libre por número, cuenta, monto, referencia de origen           | `contabilidad.ver` |
| Trazabilidad de asiento a documento origen | Desde un asiento, navega al documento del módulo operativo que lo generó | `contabilidad.ver` |
| Saldo de cuenta a la fecha                 | Consulta interactiva de saldo de una cuenta específica                   | `contabilidad.ver` |

## Configuraciones del módulo

| Parámetro                                          | Qué controla                                                            |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| Plan de cuentas base                               | Plantilla inicial según régimen contable local                          |
| Moneda funcional                                   | Moneda en la que se lleva la contabilidad oficial                       |
| Requiere doble aprobación para cierre de ejercicio | Si el cierre anual necesita `contabilidad.aprobar` de más de un usuario |
| Tolerancia de descuadre en asiento manual          | Si se permite guardar un borrador descuadrado (no confirmarlo)          |
