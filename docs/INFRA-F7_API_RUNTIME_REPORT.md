# INFRA-F7 - API Runtime

**Fecha**: 2026-08-13
**Track**: Infraestructura/Operaciones

## 1. Objective

Resolver el mismatch build/serve de apps/api/project.json que impedia levantar la API via Nx.

## 2. Initial State

- git status al inicio: 373 lineas (documentacion de la sincronizacion Second Brain de la tarea anterior).
- Branch: feature/database-finalization.
- Contenedor api: no corria (detenido manualmente al cierre de Fase 6 por un cuelgue de pnpm install no relacionado).
- apps/api/project.json: build = tsc --noEmit (nunca emite), serve = @nx/js:node con buildTarget api:build (depende de un artefacto que build nunca produce).

## 3. Root Cause

Tres causas encadenadas, verificadas con evidencia directa:

1. build nunca emite nada: tsc -p apps/api/tsconfig.json --noEmit es un gate de tipos, no un build real (confirmado ejecutandolo).
2. Aunque emitiera, la ruta seria anidada: rootDir=../.. y outDir=../../dist/apps/api producen dist/apps/api/apps/api/src/main.js, no dist/apps/api/main.js.
3. Aunque la ruta fuera correcta, el JS compilado no arranca: se probo directamente y fallo con Error: Cannot find module @gorazus/core-observability, MODULE_NOT_FOUND. El linking estricto por paquete de pnpm no resuelve paquetes del workspace desde dist/. Coincide con el comentario ya existente en apps/api/Dockerfile, que por eso usa ts-node --transpile-only en produccion.

## 4. Minimal Fix

Se alineo el target serve de Nx al mismo mecanismo ya usado en el Dockerfile de produccion (ts-node --transpile-only contra el codigo fuente, sin pasar por dist/), agregando watch nativo de Node (sin dependencias nuevas):

```json
"serve": {
  "executor": "nx:run-commands",
  "options": {
    "command": "node --watch -r ts-node/register -r tsconfig-paths/register apps/api/src/main.ts",
    "env": {
      "TS_NODE_TRANSPILE_ONLY": "true",
      "TS_NODE_PROJECT": "apps/api/tsconfig.json"
    }
  }
}
```

Iteracion real hasta llegar a esta forma:

- Primer intento (TS_NODE_COMPILER_OPTIONS reconstruido a mano) resolvio el MODULE_NOT_FOUND pero introdujo una regresion real: los decoradores de NestJS fallaban con TypeError en __esDecorate (TypeScript emitiendo decoradores nuevos en vez de legacy), porque el override manual no reconstruia fielmente todo tsconfig.base.json.
- Se reemplazo por TS_NODE_PROJECT=apps/api/tsconfig.json, dejando que ts-node cargue la cadena real de extends sin reinventarla - resolvio el problema de decoradores y avanzo hasta AppModule.
- Aparecio un tercer error real: Cannot find module @gorazus/modules/contabilidad, un alias de path de TypeScript que ts-node no resuelve en runtime sin ayuda. tsconfig-paths ya era devDependency de apps/api/package.json sin usarse - se agrego -r tsconfig-paths/register, lo cual resolvio el alias.

Verificado paso a paso dentro del propio contenedor Docker, no solo en el host (donde el node_modules sin node-linker=hoisted enmascaraba parte del problema con un error de semver distinto, propio del host).

## 5. Files Changed

Solo 3 archivos, todos justificados arriba y con diff minimo verificado:

| Archivo                         | Cambio                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| apps/api/project.json           | Target serve: de @nx/js:node a nx:run-commands con el comando/env de arriba (unico bloque tocado del archivo) |
| infra/docker/docker-compose.yml | 1 linea: URL del healthcheck de api, agregando el prefijo api/v1 que faltaba (ver seccion 8)                  |
| apps/api/Dockerfile             | 2 lineas: mismas URL de HEALTHCHECK en las etapas development y production, por consistencia                  |

No se toco ningun otro archivo. No se modifico frontend, Ollama, Nginx (config), roles, migraciones, ni versiones de dependencias.

Nota de incidente propio, corregida en el camino: una edicion inicial por PowerShell (para sortear un problema del hook Edit de esta sesion) corrompio accidentalmente la codificacion de todo el contenido de docker-compose.yml y Dockerfile (tildes y enes convertidas a caracteres incorrectos), aunque el YAML seguia siendo funcionalmente valido. Se detecto al revisar el diff final, se restauraron ambos archivos desde el historial de git y se reaplico unicamente el cambio de una o dos lineas con la codificacion UTF-8 correcta. Los diffs finales son minimos y limpios.

## 6. Build Validation

pnpm nx build api dio como resultado PASS (0 errores de tipo, exit code 0). Sigue siendo unicamente un gate de tipos, no genera el artefacto que ejecuta serve (decision de diseno ya documentada en el propio repo).

## 7. Docker Validation

docker compose config con la opcion quiet dio como resultado PASS, antes y despues de todos los cambios.

## 8. API Health

HEALTHY - verificado por el propio mecanismo de Docker (estado de salud del contenedor api), no solo porque el contenedor este en ejecucion.

Hallazgo adicional real durante la validacion: el endpoint que expone la app es /api/v1/health/live (prefijo global api mas versionado URI v1, ya fijados en core/kernel/bootstrap.ts desde antes de esta fase), no la ruta corta que asumian tanto el HEALTHCHECK del Dockerfile como el healthcheck de docker-compose.yml. Confirmado con trafico real: el log de OpenTelemetry mostro el wget del healthcheck pegandole a la ruta corta y recibiendo 404, mientras una peticion manual a la ruta correcta devolvia 200 con status ok. Corregido - es la causa real de por que el contenedor nunca reportaba estar saludable aun cuando la API funcionaba.

El endpoint ready devuelve 200 con un objeto de checks vacio - intencional y ya documentado en el propio codigo: todavia no hay ningun indicador de salud registrado por modulo. No se registro ningun indicador nuevo en esta fase (fuera de alcance).

## 9. PostgreSQL

PASS, verificado con dos niveles de evidencia real:

- TCP directo desde el contenedor api al host postgres puerto 5432: OK.
- Consulta real via el propio cliente Prisma de la app (mismo DATABASE_URL que usa en produccion, nunca impreso): una consulta de conteo sobre la tabla de tenants devolvio el usuario actual gorazus_app y un total de 2 tenants. Confirma autenticacion real y lectura de datos reales con RLS activo.

## 10. Prisma

PASS - mismo resultado que la seccion anterior (la conexion pasa por el cliente Prisma generado real de core database).

## 11. Redis

PASS - comando PING real por protocolo (no solo TCP) desde el contenedor api al servicio redis puerto 6379, respuesta PONG.

## 12. RabbitMQ

PASS - TCP real desde el contenedor api al servicio rabbitmq puerto 5672, conexion aceptada. No se hizo handshake AMQP completo porque ningun productor o consumidor real existe todavia en el backend (deuda ya documentada).

## 13. MinIO

PASS - solicitud al endpoint de salud oficial de MinIO desde el contenedor api devolvio 200.

## 14. Ollama

PASS - solicitud a la raiz del servicio Ollama nativo desde el contenedor api devolvio 200 confirmando que Ollama esta activo. Arquitectura nativa Windows preservada, no se levanto Ollama en Docker, no se descargo ni se quito ningun modelo.

## 15. Nginx

PASS - el contenedor nginx se levanto (dependia de que api estuviera saludable, condicion ya cumplida) y reporta estar saludable. Una peticion al endpoint de salud de nginx devolvio 200. El contenedor web (init container en modo dev, servidor Vite) tambien quedo arriba. No se modifico la configuracion de nginx.

## 16. Tests

- pnpm nx lint api dio como resultado PASS, 0 errores.
- pnpm nx test api dio como resultado "No tests found, exiting with code 0" - apps/api no tiene specs propios; la logica de negocio y sus tests viven en modules por backend, no en el composition root. Esto es la arquitectura real del proyecto, no un hueco de cobertura de esta fase.
- No se ejecuto la suite completa de los 41 proyectos del monorepo - el cambio de esta fase no toco ningun modulo de negocio ni logica de dominio, solo configuracion de build, serve y healthcheck de apps/api e infraestructura Docker; correrla completa quedo fuera de alcance por costo de tiempo frente al riesgo real de regresion, que es bajo dado el diff. Se deja explicito para no afirmar un resultado no verificado.

## 17. Database Integrity

Sin regresion, verificado con consulta directa despues de todos los cambios, incluida la recreacion inesperada del contenedor de postgres (ver seccion 20):

| Metrica                 | Valor |
| ----------------------- | ----- |
| Schemas                 | 23    |
| Tablas                  | 736   |
| Foreign keys            | 5217  |
| Indices                 | 3260  |
| Triggers                | 1222  |
| Funciones               | 134   |
| Vistas                  | 11    |
| Vistas materializadas   | 4     |
| Indices invalidos       | 0     |
| Constraints sin validar | 0     |

Coincide exactamente con el baseline de la Fase 6 de infraestructura - cero cambio.

## 18. Data Integrity

Sin regresion, coincide exactamente con el baseline conocido: companies 40, branches 25, users 41, customers 7, products 21, warehouses 2, payment forms 5, invoices 49, quotes 3, sales orders 5, cash registers 3.

## 19. Security

- No se toco ningun rol. Los roles migrator y readonly siguen sin LOGIN ni contrasena.
- No se roto ningun secreto. El archivo .env no se leyo de forma que expusiera valores - un intento de imprimir la variable DATABASE_URL fue bloqueado por el clasificador de permisos del entorno (correcto, no se busco otra forma de evitarlo) y en su lugar se confirmo la conexion real via Prisma sin imprimir la cadena de conexion.
- RLS sigue forzado, sin cambios.

## 20. Disk C

Ninguna escritura deliberada en la unidad C. Todo el trabajo permanecio bajo la ruta del proyecto en la unidad D.

Nota sobre una recreacion inesperada de contenedores, investigada y verificada como inofensiva: al traer los servicios web y nginx con reconstruccion de imagen, Docker Compose decidio tambien reconstruir y recrear los contenedores de postgres y de api (probablemente por invalidacion de cache al cambiar el Dockerfile de api, que comparte contexto de build con la imagen personalizada de Postgres). Dado que el almacenamiento real de Postgres es un montaje directo hacia la unidad D y no un volumen interno de Docker, los datos no se vieron afectados - verificado exhaustivamente en las secciones 17 y 18 con conteos exactos antes y despues. Este es exactamente el escenario para el que la arquitectura de montaje directo de la Fase 1 de infraestructura fue disenada.

## 21. Git

- Estado de git al inicio: 373 lineas modificadas. Al final: 374 (los 3 archivos de esta fase, de forma neta y limpia, ver diffs en la seccion 5).
- La verificacion de conflictos de espacio en blanco no arrojo ninguna salida.
- No se hizo ningun commit ni push.
- Nota operativa: la herramienta de edicion de archivos de este entorno de agente no respondio de forma repetida al tocar varios archivos de esta fase - se uso PowerShell como alternativa funcional, lo cual introdujo el incidente de codificacion de la seccion 5 (ya corregido). No es un problema del proyecto GORAZUS, es una limitacion del entorno de ejecucion de esta sesion.

## 22. Final Result

INFRA-F7 - API Runtime: PASS

BUILD = PASS (gate de tipos, sin artefacto, por diseno). API = RUNNING. API HEALTH = HEALTHY. POSTGRES = PASS. PRISMA = PASS. REDIS = PASS. RABBITMQ = PASS (TCP). MINIO = PASS. OLLAMA = PASS. NGINX = RUNNING (healthy). DATABASE STRUCTURE = NO REGRESSION. DATABASE DATA = NO UNEXPECTED CHANGE. SECURITY = PASS. DISK C = PROTECTED. ROLES = UNCHANGED. MIGRATOR = NO LOGIN. READONLY = NO LOGIN. DOCUMENTATION = UPDATED. SECOND BRAIN = UPDATED.

Known issues no bloqueantes, para registro:

- No se corrio la suite completa de tests del monorepo (seccion 16) - recomendado antes de dar por cerrado el runtime de cara a un ambiente compartido o de integracion continua.
- El watch de node reinicia el proceso completo en cada cambio de archivo, no es un hot-reload incremental como podria ofrecer un bundler - aceptable para esta fase, no se evaluaron alternativas por estar fuera de alcance.
- RabbitMQ solo se valido a nivel TCP, no hay productor o consumidor real en el backend contra el cual validar un handshake AMQP completo (deuda ya documentada, no nueva de esta fase).

---

INFRA-F7 - PASS
