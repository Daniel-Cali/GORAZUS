# 08 — Bancos

**Ícono sugerido:** `landmark`
**Tipo:** Dueño de datos
**Descripción:** Cuentas bancarias de la empresa, movimientos,
conciliación bancaria y transferencias/pagos electrónicos.
**Módulos relacionados:** `compras` (pago a proveedores), `nomina`
(pago de sueldos), `caja` (depósitos), `contabilidad` (asiento),
`tesoreria` (posición consolidada).

## Submenú: Cuentas Bancarias

### Formularios

| Formulario      | Qué hace                                               | Tablas principales       | Permiso             | Documento que genera |
| --------------- | ------------------------------------------------------ | ------------------------ | ------------------- | -------------------- |
| Cuenta Bancaria | Da de alta una cuenta bancaria de la empresa           | `bancos.cuenta_bancaria` | `bancos.configurar` | —                    |
| Chequera        | Registra un talonario de cheques asociado a una cuenta | `bancos.chequera`        | `bancos.configurar` | —                    |

## Submenú: Movimientos Bancarios

### Formularios

| Formulario                      | Qué hace                                                                 | Tablas principales                   | Permiso        | Documento que genera         |
| ------------------------------- | ------------------------------------------------------------------------ | ------------------------------------ | -------------- | ---------------------------- |
| Transferencia Emitida           | Registra un pago por transferencia a proveedor/nómina                    | `bancos.movimiento`                  | `bancos.crear` | Comprobante de Transferencia |
| Cheque Emitido                  | Registra la emisión de un cheque                                         | `bancos.movimiento`, `bancos.cheque` | `bancos.crear` | Cheque                       |
| Depósito                        | Registra el ingreso de fondos (transferencia recibida, depósito de caja) | `bancos.movimiento`                  | `bancos.crear` | Comprobante de Depósito      |
| Nota de Débito/Crédito Bancaria | Registra cargos/abonos del banco (comisiones, intereses)                 | `bancos.movimiento`                  | `bancos.crear` | —                            |

### Acciones

| Acción                                   | Qué hace                                                                   | Permiso            | Efecto/Evento                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------- |
| Confirmar movimiento                     | Pasa el movimiento a definitivo                                            | `bancos.confirmar` | Publica `MovimientoBancarioConfirmado`, consumido por `contabilidad` |
| Anular movimiento                        | Revierte un movimiento no conciliado                                       | `bancos.anular`    | Publica `MovimientoBancarioAnulado`                                  |
| Generar archivo de pago (batch bancario) | Genera archivo en formato del banco para pago masivo (proveedores, nómina) | `bancos.confirmar` | —                                                                    |

## Submenú: Conciliación Bancaria

| Elemento                                | Detalle                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| Formulario — Importar Extracto Bancario | Carga el movimiento del banco (archivo o conexión) para conciliar              | Tablas: `bancos.extracto` | Permiso: `bancos.crear` |
| Acción — Conciliar Movimientos          | Empareja movimientos propios contra el extracto importado, automático + manual | `bancos.confirmar`        |
| Reporte — Conciliación Bancaria         | Qué muestra: movimientos conciliados y partidas pendientes                     | Cuenta, período           |

## Submenú: Reportes de Bancos

| Reporte                              | Qué muestra                             | Filtros principales |
| ------------------------------------ | --------------------------------------- | ------------------- |
| Movimientos Bancarios                | Detalle de ingresos/egresos por cuenta  | Cuenta, período     |
| Saldo por Cuenta Bancaria            | Saldo contable vs. saldo según extracto | Fecha de corte      |
| Cheques Emitidos Pendientes de Cobro | Cheques librados aún no debitados       | —                   |

## Submenú: Consultas

| Consulta                   | Qué muestra                                  | Permiso      |
| -------------------------- | -------------------------------------------- | ------------ |
| Buscar movimiento bancario | Búsqueda libre por número, monto, referencia | `bancos.ver` |
| Estado de conciliación     | Partidas pendientes de conciliar por cuenta  | `bancos.ver` |

## Configuraciones del módulo

| Parámetro                                                 | Qué controla                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------- |
| Formato de archivo de pago por banco                      | Layout del archivo batch según el banco de la cuenta                |
| Cuenta contable por cuenta bancaria                       | Referencia para el asiento automático (coordina con `contabilidad`) |
| Requiere doble aprobación para transferencias mayores a X | Umbral que exige `bancos.aprobar`                                   |
