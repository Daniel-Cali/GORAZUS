# GORAZUS Project Cleanup Script
# Ejecutar en PowerShell (Admin) desde la raíz del proyecto
# ADVERTENCIA: Esta operación eliminará archivos. Hacer backup primero.

Write-Host "🔴 LIMPIEZA DEL PROYECTO GORAZUS" -ForegroundColor Red
Write-Host "================================" -ForegroundColor Red
Write-Host ""
Write-Host "Este script eliminará archivos redundantes y configurará .gitignore"
Write-Host "Se recomienda hacer commit de cambios actuales antes de ejecutar."
Write-Host ""

# Confirmación
$confirm = Read-Host "¿Deseas continuar? (escribe 'SÍ' para confirmar)"
if ($confirm -ne "SÍ") {
    Write-Host "Operación cancelada." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Iniciando limpieza..." -ForegroundColor Green
Write-Host ""

# 1. Eliminar carpeta "pdf ideas/"
Write-Host "1. Eliminando carpeta 'pdf ideas/'..." -ForegroundColor Cyan
if (Test-Path "pdf ideas") {
    Remove-Item -Path "pdf ideas" -Recurse -Force
    Write-Host "   ✓ Eliminado: pdf ideas/" -ForegroundColor Green
} else {
    Write-Host "   ⚠ No encontrado: pdf ideas/" -ForegroundColor Yellow
}

# 2. Eliminar carpeta "backups;C/"
Write-Host "2. Eliminando carpeta con nombre inválido 'backups;C/'..." -ForegroundColor Cyan
if (Test-Path "backups;C") {
    Remove-Item -Path "backups;C" -Recurse -Force
    Write-Host "   ✓ Eliminado: backups;C/" -ForegroundColor Green
} else {
    Write-Host "   ⚠ No encontrado: backups;C/" -ForegroundColor Yellow
}

# 3. Eliminar archivos de sesión redundantes
Write-Host "3. Eliminando archivos de sesión anterior..." -ForegroundColor Cyan
$sessionFiles = @(
    "GORAZUS_CONVERSATION_BACKUP.md",
    "SESSION_BACKUP.md",
    "RESUMEN_SESION_PARA_GPT.txt"
)

foreach ($file in $sessionFiles) {
    if (Test-Path $file) {
        Remove-Item -Path $file -Force
        Write-Host "   ✓ Eliminado: $file" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ No encontrado: $file" -ForegroundColor Yellow
    }
}

# 4. Eliminar archivo VERSION (redundante con VERSION.md)
Write-Host "4. Eliminando archivo VERSION (redundante)..." -ForegroundColor Cyan
if (Test-Path "VERSION") {
    Remove-Item -Path "VERSION" -Force
    Write-Host "   ✓ Eliminado: VERSION" -ForegroundColor Green
} else {
    Write-Host "   ⚠ No encontrado: VERSION" -ForegroundColor Yellow
}

# 5. Actualizar .gitignore
Write-Host "5. Actualizando .gitignore..." -ForegroundColor Cyan

$gitignoreContent = @"
# Temporary directories
tmp/
logs/
coverage/

# OS & Editor
.DS_Store
.idea/
.vscode/
*.swp
*.swo

# Build & dist
dist/
.nx/
.qodo/
build/
out/

# Environment (IMPORTANTE: Estos NUNCA deben estar en Git)
.env
.env.local
.env.*.local
.env.production.local

# Cache
.playwright-browsers/
node_modules/.cache/

# Database backups (NUNCA en Git - usar cloud storage)
backups/*.dump
backups/*/*.dump
migration-baseline-*.txt

# Session/AI files (no reutilizables)
.claude/SESSION_STATE.md
.claude/MEMORY.md
.claude/scheduled_tasks.lock
.claude/settings.json

# IDE
.vscode/
.idea/
*.iml
.DS_Store

# npm
npm-debug.log*
npm-cache/

# pnpm
.pnpm-debug.log*

# Coverage
coverage/
*.lcov

# Test results
junit.xml
"@

# Leer .gitignore actual para no perder configuración
$existingGitignore = ""
if (Test-Path ".gitignore") {
    $existingGitignore = Get-Content ".gitignore" -Raw
}

# Combinar si no están ya presentes
$newLines = @(
    "# Database backups (NUNCA en Git - usar cloud storage)",
    "backups/*.dump",
    "backups/*/*.dump",
    "migration-baseline-*.txt",
    "",
    "# Session/AI files (no reutilizables)",
    ".claude/SESSION_STATE.md",
    ".claude/MEMORY.md",
    ".claude/scheduled_tasks.lock",
    ".claude/settings.json"
)

$updated = $false
foreach ($line in $newLines) {
    if ($line -and $existingGitignore -notmatch [regex]::Escape($line)) {
        $existingGitignore += "`n$line"
        $updated = $true
    }
}

if ($updated) {
    Set-Content ".gitignore" -Value $existingGitignore
    Write-Host "   ✓ .gitignore actualizado" -ForegroundColor Green
} else {
    Write-Host "   ℹ .gitignore ya tiene todas las entradas" -ForegroundColor Cyan
}

# 6. Git: Remover backups del índice
Write-Host "6. Removiendo archivos .dump del Git..." -ForegroundColor Cyan
$dumpFiles = Get-ChildItem -Path "backups" -Filter "*.dump" -ErrorAction SilentlyContinue
if ($dumpFiles.Count -gt 0) {
    Write-Host "   Encontrados $($dumpFiles.Count) archivos .dump"
    Write-Host "   Ejecutando: git rm --cached backups/*.dump" -ForegroundColor Yellow

    # Verificar si estamos en un repo Git
    $gitCheck = & git rev-parse --git-dir 2>&1
    if ($?) {
        & git rm --cached "backups/*.dump" 2>&1
        Write-Host "   ✓ Archivos removidos del índice Git" -ForegroundColor Green
        Write-Host "   ⚠ Recuerda hacer commit: git commit -m 'chore: remove db dumps from git'" -ForegroundColor Yellow
    } else {
        Write-Host "   ⚠ No se detectó repositorio Git" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ℹ No hay archivos .dump para remover" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "✓ LIMPIEZA COMPLETADA" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Revisar cambios: git status"
Write-Host "2. Hacer commit: git add . && git commit -m 'chore: cleanup obsolete files and config'"
Write-Host "3. Hacer push: git push origin main"
Write-Host "4. Considerar: archivo de políticas de backups en docs/"
Write-Host ""
Write-Host "Documentación de referencia guardada en:" -ForegroundColor Cyan
Write-Host "  docs/CLEANUP_REPORT.md"
