# 22 — Configuración

**Ícono sugerido:** `settings`
**Tipo:** Dueño de datos
**Descripción:** Parametrización general del sistema: empresas,
sucursales, monedas, series de numeración e impuestos base. Es la
fuente de verdad que todos los demás módulos leen al arrancar
(empresa/sucursal activa, moneda funcional).
**Módulos relacionados:** todos los módulos leen configuración de
empresa activa; `seguridad` (roles/permisos que dependen de la
estructura de empresas/sucursales); `contabilidad` (moneda funcional,
períodos fiscales).

## Submenú: Empresa y Sucursales

### Formularios

| Formulario                     | Qué hace                                                                                                | Tablas principales               | Permiso                    | Documento que genera |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- | -------------------------------- | -------------------------- | -------------------- |
| Empresa                        | Alta/edición de una empresa (razón social, identificación fiscal, logo, régimen) — soporte multiempresa | `configuracion.empresa`          | `configuracion.configurar` | —                    |
| Sucursal                       | Alta de sucursales/puntos de operación dentro de una empresa — soporte multisucursal                    | `configuracion.sucursal`         | `configuracion.configurar` | —                    |
| Almacén por Sucursal (vínculo) | Asocia almacenes de `inventario` a una sucursal                                                         | `configuracion.sucursal_almacen` | `configuracion.configurar` | —                    |

## Submenú: Monedas y Series de Numeración

### Formularios

| Formulario          | Qué hace                                                                     | Tablas principales               | Permiso                    | Documento que genera |
| ------------------- | ---------------------------------------------------------------------------- | -------------------------------- | -------------------------- | -------------------- |
| Moneda              | Define monedas habilitadas y moneda funcional de cada empresa                | `configuracion.moneda`           | `configuracion.configurar` | —                    |
| Serie de Numeración | Define la numeración correlativa por tipo de comprobante, empresa y sucursal | `configuracion.serie_numeracion` | `configuracion.configurar` | —                    |

## Submenú: Parámetros Fiscales y Regionales

### Formularios

| Formulario                    | Qué hace                                                                        | Tablas principales                 | Permiso                    | Documento que genera |
| ----------------------------- | ------------------------------------------------------------------------------- | ---------------------------------- | -------------------------- | -------------------- |
| Parámetro Fiscal por País     | Define reglas fiscales locales (formato de identificación, régimen de impuesto) | `configuracion.parametro_fiscal`   | `configuracion.configurar` | —                    |
| Feriados / Días No Laborables | Calendario usado por `nomina`/`servicios` para cálculo de plazos                | `configuracion.feriado`            | `configuracion.configurar` | —                    |
| Idioma y Formato Regional     | Define idioma, formato de fecha/número por empresa                              | `configuracion.parametro_regional` | `configuracion.configurar` | —                    |

## Submenú: Parámetros Generales del Sistema

| Elemento                           | Detalle                                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Formulario — Parámetro del Sistema | Qué hace: catálogo genérico de banderas/valores de configuración no cubiertos por un formulario específico | Tablas: `configuracion.parametro_sistema` | Permiso: `configuracion.configurar` |
| Consulta — Todos los Parámetros    | Vista de auditoría de todos los parámetros configurados y su valor actual                                  | Permiso: `configuracion.ver`              |

## Submenú: Reportes de Configuración

| Reporte                             | Qué muestra                                      | Filtros principales |
| ----------------------------------- | ------------------------------------------------ | ------------------- |
| Estructura de Empresas y Sucursales | Árbol completo de la organización                | —                   |
| Historial de Cambios de Parámetros  | Auditoría de quién cambió qué parámetro y cuándo | Período             |

## Configuraciones del módulo

| Parámetro                                      | Qué controla                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Empresa por defecto al iniciar sesión          | Empresa activa inicial para usuarios con acceso a más de una                               |
| Permite cambio de moneda funcional post-cierre | Si se puede modificar la moneda funcional una vez hay ejercicios cerrados (normalmente no) |
