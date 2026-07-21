# tools/database/ — herramientas portables (no versionadas)

`dbeaver/`, `graphviz/`, `schemaspy/`, `jdk-21/`, `pgsql-client-17/` son binarios de
terceros (~600MB) — gitignored a propósito, nunca se commitean. Ver
`docs/database/DATABASE_VISUALIZATION.md` para versiones exactas, fuentes de descarga
y cómo reinstalarlas (siempre bajo este directorio, nunca en `C:\`).

`jdk-21/` es Eclipse Temurin 21 LTS (ZIP portable, `adoptium.net`) — el runtime que
`schemaspy.jar` necesita para ejecutarse (`java -jar ...`); no es necesario para
DBeaver (trae su propio JRE embebido) ni para nada del backend/frontend del proyecto.

`pgsql-client-17/` son solo las herramientas cliente de PostgreSQL 17 (`psql`,
`pg_dump`, `pg_restore`, etc. — instalado vía `winget install --override "--prefix ..."`,
sin el componente de servidor ni pgAdmin) para consultar el Postgres real del
proyecto (Docker, `docker-postgres-1`) desde una terminal nativa de Windows sin
depender de `docker exec`. No es un servidor — no escucha en ningún puerto ni
compite con el Postgres de Docker.
