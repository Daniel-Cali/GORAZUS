# Database Visualization — GORAZUS

> Guía de uso del entorno de visualización de base de datos. Herramientas: **DBeaver
> Community Edition** (exploración interactiva, la herramienta principal pedida) +
> **SchemaSpy + Graphviz** (generación automática de diagramas ERD y documentación
> HTML navegable, ya que DBeaver CE no ofrece exportación de diagramas por línea de
> comandos — decisión confirmada con el usuario, ver
> [DATABASE_HEALTH_REPORT.md](./DATABASE_HEALTH_REPORT.md) para el detalle de esa
> limitación). Todo instalado en `D:\15_Codigo_Fuente\GORAZUS\tools\database\`, nada
> en `C:\`. 100% gratuito y open source. No modifica lógica de negocio, arquitectura
> ni esquema de la base de datos.

## 1. Qué se instaló y dónde

| Herramienta                          | Ubicación                                      | Versión                                                             |
| ------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------------- |
| DBeaver Community Edition (portable) | `tools/database/dbeaver/`                      | Última CE estable (ZIP portable oficial, con JRE embebido)          |
| Graphviz                             | `tools/database/graphviz/`                     | 15.1.0 (instalado vía `winget install --location`, sin tocar `C:\`) |
| SchemaSpy                            | `tools/database/schemaspy/schemaspy.jar`       | 6.2.4                                                               |
| Driver JDBC de PostgreSQL            | `tools/database/schemaspy/postgresql-jdbc.jar` | 42.7.4                                                              |

Nada de esto se instaló como servicio de Windows ni modificó el `PATH` del sistema —
Graphviz se referencia por ruta completa o agregando
`tools/database/graphviz/bin` al `PATH` de la sesión de terminal donde se trabaje
(ver §4).

## 2. Cómo abrir DBeaver

1. Ejecutar `tools/database/dbeaver/dbeaver.exe` (doble clic o desde terminal).
2. En el primer arranque, DBeaver pregunta por un workspace — apuntar a
   `tools/database/dbeaver/workspace/` (ya existe, es donde vive la configuración
   portable de este proyecto, incluida la conexión `GORAZUS_DEV` ya preconfigurada,
   ver §3).
3. No se requiere instalación adicional — es la distribución ZIP portable oficial,
   autocontenida (incluye su propio JRE en `tools/database/dbeaver/jre/`).

## 3. La conexión `GORAZUS_DEV`

Preconfigurada en el workspace de DBeaver (`tools/database/dbeaver/workspace/`) —
al abrir DBeaver apuntando a ese workspace, la conexión ya aparece en el árbol de
Database Navigator, sin necesitar crearla a mano. Parámetros (coinciden con
`infra/docker/docker-compose.dev.yml` y `.env`, nunca hardcodeados por fuera de esos
archivos):

| Parámetro        | Valor                                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Host             | `localhost`                                                                                                                               |
| Puerto           | `5432`                                                                                                                                    |
| Base de datos    | `gorazus`                                                                                                                                 |
| Usuario          | `gorazus_app`                                                                                                                             |
| Password         | (la de `.env`, `POSTGRES_PASSWORD` — no se repite acá, `.env` está gitignored)                                                            |
| SSL              | Deshabilitado (solo entorno local de desarrollo; producción usa `sslmode=verify-full`, ver `docs/database/06-estrategia-seguridad.md §3`) |
| Schemas visibles | Los 21 de negocio + `core` + `public`                                                                                                     |

**Si la conexión no aparece** (workspace nuevo o corrupto): crearla a mano con
`Database > New Database Connection > PostgreSQL`, usando la tabla de arriba —
el driver JDBC ya está en `tools/database/dbeaver/drivers/`, no hace falta descargar
nada adicional dentro de DBeaver.

## 4. Cómo regenerar los diagramas ERD (SchemaSpy)

DBeaver CE **no** permite exportar diagramas ER por línea de comandos — es
puramente una función de su interfaz gráfica (clic derecho sobre un schema → "View
Diagram", luego exportar manualmente imagen por imagen). Para la generación
**automática** de los ~20 diagramas (maestro + por módulo) exigida por este EPIC, se
usa SchemaSpy, que sí es 100% scriptable:

```
# Desde la raíz del repositorio, con Postgres corriendo (ver §5):
export PATH="$PATH:tools/database/graphviz/bin"   # o el equivalente en PowerShell: $env:PATH += ";tools\database\graphviz\bin"

java -jar tools/database/schemaspy/schemaspy.jar \
  -t pgsql \
  -dp tools/database/schemaspy/postgresql-jdbc.jar \
  -db gorazus -host localhost -port 5432 \
  -u gorazus_app -p <password de .env> \
  -s <nombre_del_schema> \
  -o docs/database/erd/<carpeta_destino> \
  -imageformat png -hq
```

Para el diagrama **maestro** (todos los schemas combinados), se usa `-all` en vez de
`-s <schema>`:

```
java -jar tools/database/schemaspy/schemaspy.jar -t pgsql -dp tools/database/schemaspy/postgresql-jdbc.jar \
  -db gorazus -host localhost -port 5432 -u gorazus_app -p <password> \
  -all -x "^(created_by|updated_by|deleted_by)$" \
  -o docs/database/erd/master -imageformat png -hq
```

**Advertencia real (PHASE 01, 2026-07-18):** un intento de `-all` sin el flag `-x`
(exclusión de columnas indirectas) quedó **colgado más de 24 horas** intentando
renderizar el diagrama de relaciones de `core.users` — esa tabla es referenciada
por prácticamente las 501 tablas vía `created_by`/`updated_by`/`deleted_by`
(columnas universales), y Graphviz no termina de dibujar un grafo de esa densidad
en un tiempo razonable. El flag `-x` de arriba excluye esas 3 columnas de los
diagramas de relación (siguen visibles en la tabla de columnas de cada tabla, solo
no se dibujan como flecha en el ERD) — sin él, **no intentar regenerar el maestro
completo**. El diagrama maestro real y navegable de este proyecto es
`docs/database/erd/master/index.html` (generado exitosamente en la corrida
original de la fase anterior) más
`docs/database/erd/master/diagrams/summary/master-schema-relationships.*`
(diagrama a nivel de schema, hecho a mano con Graphviz directo — 21 nodos, no 501,
por eso se renderiza en segundos en vez de colgarse).

**Aviso realista sobre el diagrama maestro:** con 501 tablas y 3,631 foreign keys, el
diagrama de relaciones combinado es, por naturaleza del tamaño del ERP, extremadamente
denso — el archivo estático (PNG/SVG/PDF) es útil como referencia de escala y para
buscar una tabla puntual con zoom, pero **el sitio HTML navegable que SchemaSpy genera
junto al diagrama** (`docs/database/erd/master/index.html`) es la forma real y
práctica de explorar el maestro — con búsqueda, clic para expandir relaciones, y
navegación por schema. Esto no es una limitación de la herramienta, es inherente a
visualizar 501 tablas a la vez; los diagramas por módulo (10-70 tablas cada uno) sí
son legibles como imagen estática completa.

### 4.1 Mapeo de carpetas (`docs/database/erd/`)

| Carpeta                                             | Schema(s) real(es)                                                                                                       | Nota                                                                                                      |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `master/`                                           | Los 21 + `core`                                                                                                          | Diagrama combinado + sitio HTML completo                                                                  |
| `core/`                                             | `core`                                                                                                                   | Incluye Companies, Branches, Users (tablas), notificaciones                                               |
| `security/`                                         | `security`                                                                                                               | Roles, permisos, ACL                                                                                      |
| `configuration/`                                    | `configuration`                                                                                                          | —                                                                                                         |
| `customers/`                                        | `customers`                                                                                                              | —                                                                                                         |
| `suppliers/`                                        | `suppliers`                                                                                                              | —                                                                                                         |
| `products/`                                         | `products`                                                                                                               | Categorías, marcas, unidades — todo vive en este schema                                                   |
| `inventory/`                                        | `inventory`                                                                                                              | Almacenes, Kardex (vista, no tabla propia)                                                                |
| `purchasing/`                                       | `purchases`                                                                                                              | —                                                                                                         |
| `sales/`                                            | `sales`                                                                                                                  | Incluye Facturas; POS no tiene schema propio (orquesta `sales`+`inventory`+`cash`)                        |
| `accounting/`                                       | `accounting`                                                                                                             | —                                                                                                         |
| `finance/cash/`, `finance/banks/`, `finance/taxes/` | `cash`, `banks`, `taxes`                                                                                                 | Agrupados bajo "Finanzas" (mismo criterio que `docs/product/05_INFORMATION_ARCHITECTURE.md §3`)           |
| `crm/`                                              | `crm`                                                                                                                    | —                                                                                                         |
| `hr/`, `hr/payroll/`                                | `hr`, `payroll`                                                                                                          | Agrupados bajo "Gente"                                                                                    |
| `services/`                                         | `services`                                                                                                               | —                                                                                                         |
| `projects/`                                         | `projects`                                                                                                               | —                                                                                                         |
| `assets/`                                           | `assets`                                                                                                                 | Activos Fijos                                                                                             |
| `reports/`, `reports/bi/`                           | `reports`, `bi`                                                                                                          | Agrupados bajo "Análisis"                                                                                 |
| `audit/`                                            | Subconjunto filtrado de `core` (`audit_logs`, `system_logs`, `activity_logs`, `login_attempts`, `session_activity_logs`) | No es un schema propio — ver `docs/architecture/04-catalogo-modulos-negocio.md`, Auditoría vive en `core` |

Módulos del pedido original **sin schema/tabla propia** (ya establecido en trabajo
previo de este proyecto, no un gap nuevo): **POS** (orquesta `sales`+`inventory`+`cash`,
`docs/architecture/04-catalogo-modulos-negocio.md`), **Producción** (BOM en `products`,
ejecución en `inventory`, ver `docs/standards/NAMING_CONVENTIONS.md §5`),
**Notificaciones** (tablas dentro de `core`, no schema propio), **IA** e
**Integraciones** (sin modelo de datos confirmado — `docs/00-roadmap-fases.md`, fases
26-27 pendientes). Ninguno de estos tiene un diagrama propio fabricado — se
documenta la razón en vez de inventar un schema vacío.

## 5. Prerrequisito: Postgres corriendo

```
docker compose --env-file .env -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.dev.yml up -d postgres
```

Esto expone el puerto `5432` al host (`docker-compose.dev.yml`, comentario explícito
"acceso directo para clientes SQL locales (pgAdmin, DBeaver, etc.)"). Verificar salud:
`docker inspect --format='{{.State.Health.Status}}' docker-postgres-1` debe devolver
`healthy`.

## 6. Cómo exportar diagramas a PNG/SVG/PDF

SchemaSpy ya genera PNG por cada tabla (`-imageformat png`, ver `diagrams/tables/` de
cada carpeta). Para el diagrama de relaciones completo del schema (equivalente al
"diagrama ERD del módulo"), SchemaSpy genera el `.dot` fuente
(`diagrams/summary/relationships.real.large.dot` y `.compact.dot`) que se renderiza a
los 3 formatos pedidos con Graphviz directamente:

```
cd docs/database/erd/<módulo>/diagrams/summary
dot -Tpng relationships.real.large.dot -o relationships.real.large.png
dot -Tsvg relationships.real.large.dot -o relationships.real.large.svg
dot -Tpdf relationships.real.large.dot -o relationships.real.large.pdf
```

(Y lo mismo para `relationships.real.compact.dot` — la versión condensada sin
columnas, útil quan la versión "large" es demasiado densa para un módulo grande).

## 7. Cómo agregar una tabla nueva y actualizar los diagramas

1. Agregar la tabla siguiendo
   [docs/standards/DATABASE_GUIDELINES.md §4](../standards/DATABASE_GUIDELINES.md#4-cómo-agregar-una-tabla-nueva-procedimiento)
   (esto no cambia por tener el entorno de visualización).
2. Aplicar el SQL contra la base de desarrollo (`docker exec -i docker-postgres-1 psql
-U gorazus_app -d gorazus -f <archivo.sql>`, o vía DBeaver SQL Editor).
3. Regenerar **solo el diagrama del schema afectado** (§4) — no hace falta regenerar
   el maestro por cada tabla nueva, dado su costo de render; se regenera el maestro
   periódicamente (p. ej. al cerrar un módulo completo) o antes de una entrega.
4. En DBeaver, la tabla nueva aparece automáticamente al refrescar el Database
   Navigator (clic derecho sobre la conexión → Refresh) — no requiere reconfigurar
   la conexión.

## 8. Buenas prácticas

- El diagrama por módulo (SchemaSpy) es la referencia versionada y compartida
  (commiteada en `docs/database/erd/`); DBeaver es la herramienta de **exploración
  interactiva del día a día** (ver una fila, correr una query ad-hoc, inspeccionar un
  índice) — no se espera que cada desarrollador regenere diagramas constantemente,
  solo cuando un schema cambia de forma significativa.
- No editar los archivos `.dot`/`.html` generados a mano — son artefactos derivados,
  se regeneran desde SchemaSpy, nunca se versionan como "fuente editable".
- El proyecto de DBeaver (`tools/database/dbeaver/project/`) y el workspace sí se
  commitea (a diferencia de credenciales reales, que nunca están en el workspace —
  DBeaver pide la contraseña al conectar la primera vez, o se referencia una variable
  de entorno, nunca la contraseña en texto plano dentro del proyecto versionado).

## 9. Trazabilidad

| Punto pedido en el EPIC    | Cerrado en |
| -------------------------- | ---------- |
| Cómo abrir DBeaver         | §2         |
| Cómo abrir el proyecto     | §2, §3     |
| Cómo regenerar diagramas   | §4, §7     |
| Cómo exportar diagramas    | §6         |
| Cómo agregar nuevas tablas | §7         |
| Cómo actualizar diagramas  | §7         |
| Buenas prácticas           | §8         |
