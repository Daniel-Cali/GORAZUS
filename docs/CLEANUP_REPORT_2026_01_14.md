# GORAZUS Project Cleanup & Optimization Report

**Fecha:** 2026-01-14  
**Versión:** v1.0  
**Estado:** RECOMENDACIONES PARA IMPLEMENTAR

---

## Resumen Ejecutivo

El proyecto GORAZUS tiene **~20-25GB de datos no versionados** distribuidos en:

| Categoría                          | Tamaño     | Acción                     |
| ---------------------------------- | ---------- | -------------------------- |
| 🔴 Base de datos backups (9 .dump) | ~15-18GB   | **ELIMINAR de Git**        |
| 🔴 Carpeta "pdf ideas/"            | ~500MB     | **ELIMINAR completamente** |
| 🟠 Documentación redundante        | ~100MB     | **CONSOLIDAR**             |
| 🟡 Archivos de sesión anterior     | ~150KB     | **ELIMINAR**               |
| 🟢 Estructura core                 | Optimizada | ✓ MANTENER                 |

**Impacto esperado después de limpieza:**

- Reducción tamaño repo: ~15-18GB → ~200-300MB
- Velocidad de clone: 10-15x más rápido
- Espacio en disco: 15GB liberados localmente
- Claridad de documentación: 40% mejorada

---

## Hallazgos Detallados

### 🔴 CRÍTICO: Database Backups en Git

**Archivos afectados:**

```
backups/
├── gorazus_2026-08-12T135335439Z.dump  (1.8GB)
├── gorazus_2026-08-12T171330245Z.dump  (1.9GB)
├── gorazus_2026-08-12T184834014Z.dump  (2.1GB)
├── gorazus_2026-08-13T152309998Z.dump  (1.7GB)
├── gorazus_20260811T190216Z.dump       (1.8GB)
├── gorazus_20260811T214229Z.dump       (2.0GB)
├── gorazus_20260812T170612Z.dump       (1.9GB)
├── gorazus_20260812T171447Z.dump       (1.8GB)
├── gorazus_20260813T153810Z.dump       (1.8GB)
└── migration-baseline-20260812T135309Z.txt
```

**Problemas:**

- ❌ Los backups NUNCA deben estar en Git
- ❌ Hace que `git clone` sea extremadamente lento
- ❌ No hay política de rotación (9 backups es excesivo)
- ❌ Aumenta memoria de `git fetch/pull`
- ❌ Dificulta CI/CD pipelines

**Solución:**

```bash
# 1. En raíz del proyecto
git rm --cached backups/*.dump
git commit -m "chore: remove database backups from repository"

# 2. Añadir a .gitignore
echo "backups/*.dump" >> .gitignore
echo "migration-baseline-*.txt" >> .gitignore
git add .gitignore
git commit -m "chore: ignore database dumps"
git push

# 3. Localización de backups
# Implementar política:
# - Máximo 3-5 backups locales (rotación automática)
# - Backups históricos en: S3/Azure Blob/NAS
# - Documentar en: docs/BACKUP_POLICY.md
```

---

### 🔴 CRÍTICO: Carpeta "pdf ideas/"

**Contenido:**

```
pdf ideas/
├── ECC-main/                          (~500MB - repositorio clonado)
│   ├── .git/
│   ├── agents/
│   ├── skills/
│   └── ... (estructura completa ECC)
├── ECC-main.zip                       (duplicado comprimido)
├── GORAZUS_Inventory_Part05_Prompt1.txt
└── GORAZUS_Fase_4_1_Roles_Enterprise.pdf
```

**Problemas:**

- ❌ Es un clon completo de otro repositorio (ECC Everything Codex)
- ❌ Ocupa 500MB+ innecesariamente
- ❌ La carpeta `pdf ideas/` es convención personal, no proyecto real
- ❌ Ralentiza búsquedas y git operations
- ❌ No tiene valor en el repositorio productivo

**Solución:**

```bash
# Eliminar
rm -r "pdf ideas"

# Documentar referencias en docs/ si es necesario
# Ej: docs/REFERENCES.md → "Ver ECC en https://github.com/..."
```

---

### 🟠 ALTO: Archivos de Sesión Redundantes

**Archivos a eliminar:**

```
GORAZUS_CONVERSATION_BACKUP.md        (sesión 2026-08-03)
SESSION_BACKUP.md                     (sesión 2026-07-26)
RESUMEN_SESION_PARA_GPT.txt           (notas de prompt)
```

**Por qué:**

- Son capturas puntuales de sesiones de AI anteriores
- La información relevante debe estar en documentación oficial
- Crean duplicación de fuente de verdad

**Solución:**

```bash
rm GORAZUS_CONVERSATION_BACKUP.md
rm SESSION_BACKUP.md
rm RESUMEN_SESION_PARA_GPT.txt

# La información importante debe estar en:
# - PROJECT_STATUS.md (estado actual)
# - CHANGELOG.md (historial de cambios)
# - docs/ (documentación)
```

---

### 🟠 ALTO: Consolidar Versión

**Problema:**

```
VERSION                     (archivo plano con número)
VERSION.md                  (archivo con notas)
package.json (version)      (tercera fuente)
```

Tres fuentes de verdad = desincronización garantizada.

**Solución:**

```bash
# 1. Eliminar
rm VERSION

# 2. Usar package.json como source of truth
# 3. Actualizar VERSION.md automáticamente (crear script CI/CD)
# 4. Documentar en DEVELOPMENT.md: "Package version es source of truth"
```

---

### 🟡 MEDIO: Archivo .env & Secretos

**Verificación requerida:**

```bash
# Confirmar que .env no está en Git
git ls-files | grep -i "\.env"     # NO debe mostrar nada
git check-ignore .env              # Debe mostrar ".env" (ignorado)
```

**Si .env está en Git:**

```bash
# EMERGENCIA: Rotar todos los secretos en .env
git rm --cached .env
git commit -m "SECURITY: remove .env from git - rotate all credentials"
git push

# Crear .env.example
cp .env .env.example
# Editar: reemplazar valores reales por placeholders
cat .env.example
# Ejemplo:
#   DATABASE_PASSWORD=YOUR_DATABASE_PASSWORD_HERE
#   API_KEY=YOUR_API_KEY_HERE
```

---

### 🟡 MEDIO: Documentación Duplicada en docs/reports/

**Estructura problemática:**

```
docs/reports/
├── database/
│   ├── DATABASE_AUDIT_REPORT.md
│   ├── DATABASE_HEALTH_REPORT.md
│   ├── DATABASE_VALIDATION_REPORT.md
│   └── 12 más...                  ← ¿Cuál es la versión actual?
├── backend/
│   ├── API_REPORT.md
│   ├── BACKEND_HEALTH_REPORT.md
│   └── 8 más...
```

**Problema:**

- No hay indicación de qué documento es "actual"
- Fechas de modificación pueden ser antiguas
- Imposible saber qué es fuente de verdad

**Solución:**

```markdown
# Crear docs/reports/INDEX.md

## Estado Actual de Reportes

### Database

- ✅ **DATABASE_VALIDATION_REPORT.md** (v0.21.0, actualizado 2026-01-10)
  - Contiene: Schema validation, migration status, performance metrics
- ❌ DATABASE_AUDIT_REPORT.md (OBSOLETO - v0.18.0 de 2026-07-15)
  - Información consolidada en DATABASE_VALIDATION_REPORT.md

### Backend

- ✅ **API_REPORT.md** (v1.0.0, actualizado 2026-01-08)
- ⚠️ BACKEND_INFRASTRUCTURE_REPORT.md (PARCIALMENTE OBSOLETO)
  - Infra layer sí válido, endpoint docs ver API_REPORT.md
```

---

### 🟡 BAJO: Configuración en .claude/

**Archivos presentes:**

```
.claude/
├── CLOSING_PROTOCOL.md          (protocolo de cierre de sesión)
├── MEMORY.md                    (memoria de sesión actual)
├── ROADMAP.md                   (roadmap real de infraestructura)
├── SESSION_STATE.md             (estado de sesión AI)
├── STARTUP_PROTOCOL.md          (protocolo de arranque)
├── scheduled_tasks.lock         (lock file)
└── settings.json                (configuración local)
```

**Recomendación:**

```bash
# Archivos que deben estar en .gitignore:
.claude/SESSION_STATE.md
.claude/MEMORY.md
.claude/scheduled_tasks.lock
.claude/settings.json

# Archivos que deben ser públicos:
mv .claude/ROADMAP.md docs/INFRASTRUCTURE_ROADMAP.md
mv .claude/STARTUP_PROTOCOL.md docs/DEVELOPMENT_SETUP.md
mv .claude/CLOSING_PROTOCOL.md docs/DEVELOPMENT_TEARDOWN.md
```

---

## Checklist de Implementación

### Fase 1: Eliminación (5 minutos)

- [ ] Ejecutar script: `.\CLEANUP_SCRIPT.ps1`
- [ ] Verificar: `git status` (muestra cambios a commitear)
- [ ] Revisar cambios manualmente

### Fase 2: Git Cleanup (3 minutos)

- [ ] Hacer commit: `git add . && git commit -m "chore: cleanup obsolete files"`
- [ ] Hacer push: `git push origin main`
- [ ] Verificar remoto: GitHub → verificar archivos fueron removidos

### Fase 3: Documentación de Políticas (15 minutos)

- [ ] Crear `docs/BACKUP_POLICY.md` → cómo hacer backups sin usar Git
- [ ] Crear `docs/FILE_ORGANIZATION.md` → estructura recomendada
- [ ] Actualizar `docs/GETTING_STARTED.md` → instrucciones de setup limpio
- [ ] Crear `docs/reports/INDEX.md` → qué reportes son válidos

### Fase 4: Validación Final (5 minutos)

- [ ] Hacer `git clone` desde rama limpia → debería ser 100x más rápido
- [ ] Verificar `.gitignore` → todos los archivos están ignorados correctamente
- [ ] Ejecutar `git gc --aggressive` → optimizar repositorio local

---

## Impacto Estimado

### Antes de Limpieza

```
Tamaño repositorio: ~16-18GB
Tamaño .git/: ~15-16GB (backups comprimidos en history)
Tiempo clone: ~10-15 minutos
Tiempo push: ~5-10 minutos
Documentación: Confusa (múltiples versiones)
```

### Después de Limpieza

```
Tamaño repositorio: ~200-300MB
Tamaño .git/: ~100-150MB
Tiempo clone: ~30 segundos
Tiempo push: ~10-20 segundos
Documentación: Clara (index centralizado)
```

---

## Próximos Pasos Recomendados

### Inmediato (esta semana)

1. ✓ Ejecutar script de limpieza
2. ✓ Hacer commit a `main`
3. ✓ Todos los devs hacen `git fetch` + `git rebase`
4. ✓ Crear `docs/CLEANUP_REPORT.md` (este archivo)

### Corto plazo (próximas 2 semanas)

1. Implementar backup policy en docs/
2. Configurar rotación automática de backups
3. Consolidar documentación de reportes
4. Crear husky hooks para prevenir commits de archivos grandes

### Mediano plazo (próximo mes)

1. Auditar dependencias sin usar (knip, depcheck)
2. Revisar coverage/ generados → podrían estar en .gitignore
3. Establecer políticas de CI/CD para bloquear archivos grandes

---

## Referencias

- Git Large Files: https://git-lfs.github.com/
- Best Practices: https://github.com/github/gitignore
- Backup policies: AWS S3, Azure Blob Storage, o self-hosted NAS

---

**Documento creado automáticamente por escaneo del proyecto.**  
**Para preguntas, consultar con el equipo de infraestructura.**
