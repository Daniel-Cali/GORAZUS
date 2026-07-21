# 15 — Recursos Humanos

**Ícono sugerido:** `contact`
**Tipo:** Dueño de datos
**Descripción:** Legajo del empleado, estructura organizacional,
contratación, asistencia, ausencias, evaluación de desempeño,
capacitación y régimen disciplinario. No calcula sueldos — eso es
responsabilidad de `nomina`, que consume los datos de este módulo.
**Módulos relacionados:** `nomina` (datos maestros del empleado),
`seguridad` (usuario del sistema vinculado), `proyectos` (asignación de
horas), `servicios` (técnicos), `documentos` (legajo digital).

## Submenú: Legajo de Empleados

### Formularios

| Formulario                              | Qué hace                                                                           | Tablas principales                           | Permiso           | Documento que genera |
| --------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------- | ----------------- | -------------------- |
| Empleado                                | Alta/edición de ficha personal: datos civiles, contacto, cuenta bancaria para pago | `rrhh.empleado`                              | `rrhh.crear`      | —                    |
| Contrato Laboral                        | Registra tipo de contrato, fecha de inicio/fin, condiciones                        | `rrhh.contrato`                              | `rrhh.crear`      | Contrato de Trabajo  |
| Puesto / Cargo                          | Define puestos con requisitos y banda salarial                                     | `rrhh.puesto`                                | `rrhh.configurar` | —                    |
| Estructura Organizacional (Organigrama) | Define departamentos y jerarquía de reporte                                        | `rrhh.departamento`, `rrhh.puesto.reporta_a` | `rrhh.configurar` | —                    |

### Acciones

| Acción                                              | Qué hace                                       | Permiso        | Efecto/Evento                                                                                          |
| --------------------------------------------------- | ---------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| Dar de Baja Empleado                                | Registra el egreso con motivo y fecha          | `rrhh.aprobar` | Publica `EmpleadoDadoDeBaja`, consumido por `nomina` (liquidación final) y `seguridad` (revoca acceso) |
| Cambiar de Puesto/Departamento (movimiento interno) | Registra promoción/transferencia               | `rrhh.aprobar` | Publica `EmpleadoActualizado`                                                                          |
| Vincular Usuario del Sistema                        | Asocia el empleado a un usuario de `seguridad` | `rrhh.editar`  | Llamada síncrona a `seguridad`                                                                         |

## Submenú: Asistencia y Ausencias

### Formularios

| Formulario                                            | Qué hace                                                                                       | Tablas principales   | Permiso           | Documento que genera  |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------- | ----------------- | --------------------- |
| Registro de Asistencia                                | Carga manual o importada de marcaciones (entrada/salida)                                       | `rrhh.asistencia`    | `rrhh.crear`      | —                     |
| Solicitud de Ausencia (Vacaciones, Licencia, Permiso) | Registra pedido de ausencia con tipo y rango de fechas                                         | `rrhh.ausencia`      | `rrhh.crear`      | Solicitud de Ausencia |
| Tipo de Ausencia                                      | Cataloga tipos (vacaciones, enfermedad, maternidad/paternidad, sin goce) y su regla de cómputo | `rrhh.tipo_ausencia` | `rrhh.configurar` | —                     |

### Acciones

| Acción                       | Qué hace                                                        | Permiso                     | Efecto/Evento                                                                  |
| ---------------------------- | --------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------ |
| Aprobar/Rechazar Ausencia    | Decide sobre la solicitud del empleado                          | `rrhh.aprobar`              | Publica `AusenciaAprobada`, consumido por `nomina` para el cálculo del período |
| Calcular Saldo de Vacaciones | Recalcula días disponibles según antigüedad y ausencias tomadas | Automático/`rrhh.confirmar` | —                                                                              |

## Submenú: Desempeño y Capacitación

| Elemento                                | Detalle                                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| Formulario — Evaluación de Desempeño    | Qué hace: registra evaluación periódica del empleado según competencias definidas | Tablas: `rrhh.evaluacion_desempeno` | Permiso: `rrhh.crear` |
| Formulario — Plan de Capacitación       | Define cursos/entrenamientos disponibles y su vigencia                            | `rrhh.capacitacion`                 | `rrhh.crear`          |
| Formulario — Inscripción a Capacitación | Registra la asistencia de un empleado a una capacitación                          | `rrhh.capacitacion_inscripcion`     | `rrhh.crear`          |
| Formulario — Acción Disciplinaria       | Registra llamados de atención/sanciones con motivo y documentación                | `rrhh.accion_disciplinaria`         | `rrhh.crear`          |

## Submenú: Reclutamiento y Selección

### Formularios

| Formulario         | Qué hace                                                   | Tablas principales     | Permiso           | Documento que genera |
| ------------------ | ---------------------------------------------------------- | ---------------------- | ----------------- | -------------------- |
| Vacante            | Publica una posición abierta con requisitos                | `rrhh.vacante`         | `rrhh.crear`      | —                    |
| Candidato          | Registra postulantes a una vacante                         | `rrhh.candidato`       | `rrhh.crear`      | —                    |
| Etapa de Selección | Define el proceso (CV, entrevista, prueba técnica, oferta) | `rrhh.etapa_seleccion` | `rrhh.configurar` | —                    |

### Acciones

| Acción                     | Qué hace                                      | Permiso          | Efecto/Evento                    |
| -------------------------- | --------------------------------------------- | ---------------- | -------------------------------- |
| Avanzar Candidato de Etapa | Mueve al candidato en el proceso de selección | `rrhh.editar`    | —                                |
| Contratar Candidato        | Convierte un candidato aprobado en Empleado   | `rrhh.confirmar` | Crea registro en `rrhh.empleado` |

## Submenú: Reportes de RRHH

| Reporte                               | Qué muestra                                  | Filtros principales   |
| ------------------------------------- | -------------------------------------------- | --------------------- |
| Nómina de Personal Activo             | Listado de empleados activos con datos clave | Departamento, puesto  |
| Rotación de Personal                  | Altas y bajas del período, tasa de rotación  | Período               |
| Ausentismo                            | Días de ausencia por tipo, departamento      | Período               |
| Vencimiento de Contratos              | Contratos a plazo próximos a vencer          | Rango de días         |
| Antigüedad de Personal                | Empleados agrupados por años de antigüedad   | —                     |
| Resultados de Evaluación de Desempeño | Consolidado de calificaciones por período    | Período, departamento |

## Submenú: Consultas

| Consulta                           | Qué muestra                                  | Permiso    |
| ---------------------------------- | -------------------------------------------- | ---------- |
| Buscar empleado                    | Búsqueda libre por nombre, documento, puesto | `rrhh.ver` |
| Organigrama interactivo            | Estructura jerárquica navegable              | `rrhh.ver` |
| Saldo de vacaciones de un empleado | Días disponibles/tomados                     | `rrhh.ver` |

## Configuraciones del módulo

| Parámetro                       | Qué controla                                                        |
| ------------------------------- | ------------------------------------------------------------------- |
| Régimen de vacaciones           | Días anuales según legislación/convenio, forma de cómputo           |
| Requiere aprobación de ausencia | Si toda solicitud necesita `rrhh.aprobar` antes de afectar `nomina` |
| Campos obligatorios de legajo   | Qué datos son requeridos para el alta de un empleado                |
