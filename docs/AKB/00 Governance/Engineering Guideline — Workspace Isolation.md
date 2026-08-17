---
id: governance-engineering-guideline-workspace-isolation
title: Engineering Guideline — Workspace Isolation
version: 1.0.0
status: active
owner: Chief Software Architect
domain: governance
subdomain: engineering-guideline
created: 2026-08-04
updated: 2026-08-04
tags: [governance, engineering-guideline, workspace, tooling]
related:
  - '[[Architecture Principles]]'
  - '[[Decision Log]]'
---

# Purpose

Regla operativa permanente: ninguna ejecución de trabajo sobre GORAZUS — humana o asistida por IA —
escribe fuera del workspace del proyecto. Existe para que temporales, cachés o salidas de
herramientas no terminen dispersos en rutas del sistema (`C:`), donde no se versionan, no se
respaldan con el resto del repositorio y quedan invisibles para cualquier auditoría futura del
proyecto.

# Scope

Aplica a toda categoría de trabajo sobre el repositorio: desarrollo backend y frontend, scripts,
migraciones, tests, builds, herramientas CLI, automatizaciones, generación de documentación y
reportes de ejecución.

# Business Rules

- No usar el disco `C:` para escritura de archivos de ningún tipo.
- No crear temporales fuera del workspace autorizado del proyecto (`D:\15_Codigo_Fuente\GORAZUS`).
- No almacenar cachés de herramientas fuera del proyecto.
- No generar outputs, reportes, backups, dumps ni artefactos temporales en `C:`.
- No usar rutas del sistema como almacenamiento auxiliar.

**Antes de cualquier operación de escritura**, validar: ruta actual de trabajo, workspace activo, que
la operación ocurre dentro del repositorio GORAZUS, y que no se está usando una ruta temporal
externa.

# Design Decisions

**Excepción**: se permite _lectura_ de información del sistema (`C:` incluido) cuando sea
estrictamente necesaria para diagnóstico — por ejemplo, inspeccionar configuración de una
herramienta instalada globalmente. No se permite _escritura_ fuera del workspace bajo ningún caso
cubierto por esta regla.

No se emite ADR para esta regla — es una convención operativa de ejecución, no una decisión de
arquitectura del sistema.

# Related ADRs

Ninguno — ver [[Architecture Principles]] para las decisiones de arquitectura ya formales.

# References

[[Decision Log]] — entrada 2026-08-04.
