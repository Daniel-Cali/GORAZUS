# 16 — Nómina

**Ícono sugerido:** `receipt`
**Tipo:** Dueño de datos
**Descripción:** Cálculo y liquidación de sueldos, cargas sociales,
retenciones, préstamos y beneficios. Consume los datos maestros del
empleado desde `recursos-humanos` — nunca los duplica.
**Módulos relacionados:** `recursos-humanos` (empleado, contrato,
ausencias), `contabilidad` (asiento de sueldos), `bancos` (pago por
transferencia), `configuracion` (parámetros legales/fiscales).

## Submenú: Conceptos de Nómina

### Formularios

| Formulario                                   | Qué hace                                                                                                              | Tablas principales           | Permiso             | Documento que genera |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------- | -------------------- |
| Concepto de Nómina                           | Define un componente de haber/descuento (sueldo básico, horas extra, bono, cuota de préstamo) y su fórmula de cálculo | `nomina.concepto`            | `nomina.configurar` | —                    |
| Estructura Salarial                          | Asocia conceptos aplicables por puesto/categoría                                                                      | `nomina.estructura_salarial` | `nomina.configurar` | —                    |
| Tabla de Retenciones/Impuesto sobre la Renta | Define tramos y porcentajes de retención fiscal                                                                       | `nomina.tabla_retencion`     | `nomina.configurar` | —                    |
| Tabla de Cargas Sociales                     | Define aportes/contribuciones patronales y del empleado                                                               | `nomina.tabla_carga_social`  | `nomina.configurar` | —                    |

## Submenú: Liquidación de Sueldos

### Formularios

| Formulario                    | Qué hace                                                                                                 | Tablas principales                                  | Permiso        | Documento que genera          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------- | ----------------------------- |
| Período de Liquidación        | Define el período a liquidar (mensual, quincenal)                                                        | `nomina.periodo`                                    | `nomina.crear` | —                             |
| Liquidación Individual        | Calcula el recibo de un empleado para el período, a partir de asistencia/ausencias de `recursos-humanos` | `nomina.liquidacion`, `nomina.liquidacion_concepto` | `nomina.crear` | Recibo de Sueldo              |
| Novedad Manual                | Registra un concepto puntual fuera de la estructura estándar (bono extraordinario, descuento puntual)    | `nomina.novedad`                                    | `nomina.crear` | —                             |
| Liquidación Final (Finiquito) | Calcula la liquidación por egreso de un empleado                                                         | `nomina.liquidacion_final`                          | `nomina.crear` | Finiquito / Liquidación Final |
| Aguinaldo / Bono Legal Anual  | Calcula el bono legal anual según normativa local                                                        | `nomina.aguinaldo`                                  | `nomina.crear` | Recibo de Aguinaldo           |

### Acciones

| Acción                            | Qué hace                                                                         | Permiso            | Efecto/Evento                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| Calcular Período (proceso masivo) | Genera las liquidaciones individuales de todos los empleados activos del período | `nomina.confirmar` | —                                                                                              |
| Confirmar/Cerrar Período          | Bloquea el período calculado, ya no editable                                     | `nomina.aprobar`   | Publica `NominaLiquidada`, consumido por `contabilidad` (asiento) y `bancos` (archivo de pago) |
| Generar Archivo de Pago Bancario  | Arma el batch de transferencias para el banco                                    | `nomina.confirmar` | Llamada al comando público de `bancos`                                                         |
| Recalcular Liquidación Individual | Rehace el cálculo de un empleado puntual dentro de un período aún no cerrado     | `nomina.editar`    | —                                                                                              |

## Submenú: Préstamos y Beneficios

| Elemento                                         | Detalle                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| Formulario — Préstamo a Empleado                 | Qué hace: registra un préstamo con plan de cuotas a descontar en nómina | Tablas: `nomina.prestamo`, `nomina.prestamo_cuota` | Permiso: `nomina.crear` |
| Formulario — Beneficio (Seguro, Vale, Bono Fijo) | Define beneficios recurrentes por empleado/categoría                    | `nomina.beneficio`                                 | `nomina.configurar`     |
| Acción — Cancelar Préstamo Anticipadamente       | Salda el saldo pendiente fuera del plan de cuotas original              | `nomina.aprobar`                                   | —                       |

## Submenú: Reportes de Nómina

| Reporte                           | Qué muestra                                                   | Filtros principales   |
| --------------------------------- | ------------------------------------------------------------- | --------------------- |
| Recibo de Sueldo                  | Detalle de haberes y descuentos de un empleado (para entrega) | Empleado, período     |
| Libro de Sueldos y Jornales       | Registro legal consolidado del período                        | Período               |
| Costo Laboral por Departamento    | Total de sueldos + cargas patronales por área                 | Período, departamento |
| Declaración de Cargas Sociales    | Resumen para presentación ante el organismo correspondiente   | Período               |
| Provisión de Aguinaldo/Vacaciones | Devengado acumulado a la fecha, para contabilidad             | Fecha de corte        |
| Préstamos Vigentes                | Saldo pendiente por empleado                                  | —                     |

## Submenú: Consultas

| Consulta                                  | Qué muestra                                                         | Permiso      |
| ----------------------------------------- | ------------------------------------------------------------------- | ------------ |
| Historial de liquidaciones de un empleado | Todos los recibos emitidos                                          | `nomina.ver` |
| Simulación de liquidación                 | Calcula un recibo hipotético sin confirmar (para consultas de RRHH) | `nomina.ver` |

## Configuraciones del módulo

| Parámetro                                     | Qué controla                                                        |
| --------------------------------------------- | ------------------------------------------------------------------- |
| Periodicidad de pago                          | Mensual, quincenal, semanal                                         |
| País/régimen legal aplicado                   | Determina tablas de retención y cargas sociales por defecto         |
| Requiere doble aprobación para cerrar período | Si el cierre necesita `nomina.aprobar` de más de un usuario         |
| Cuenta contable de sueldos por departamento   | Referencia para el asiento automático (coordina con `contabilidad`) |
