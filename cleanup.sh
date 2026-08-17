#!/bin/bash
# GORAZUS Project Cleanup Script (Linux/macOS)
# Ejecutar desde la raíz del proyecto
# ADVERTENCIA: Esta operación eliminará archivos. Hacer backup primero.

set -e  # Exit on error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${RED}🔴 LIMPIEZA DEL PROYECTO GORAZUS${NC}"
echo "================================"
echo ""
echo "Este script eliminará archivos redundantes y configurará .gitignore"
echo "Se recomienda hacer commit de cambios actuales antes de ejecutar."
echo ""

# Confirmación
read -p "¿Deseas continuar? (escribe 'SÍ' para confirmar): " confirm
if [[ "$confirm" != "SÍ" ]]; then
    echo -e "${YELLOW}Operación cancelada.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}Iniciando limpieza...${NC}"
echo ""

# 1. Eliminar carpeta "pdf ideas/"
echo -e "${CYAN}1. Eliminando carpeta 'pdf ideas/'...${NC}"
if [ -d "pdf ideas" ]; then
    rm -rf "pdf ideas"
    echo -e "${GREEN}   ✓ Eliminado: pdf ideas/${NC}"
else
    echo -e "${YELLOW}   ⚠ No encontrado: pdf ideas/${NC}"
fi

# 2. Eliminar carpeta "backups;C/" (si existe)
echo -e "${CYAN}2. Eliminando carpeta con nombre problemático...${NC}"
if [ -d "backups;C" ]; then
    rm -rf "backups;C"
    echo -e "${GREEN}   ✓ Eliminado: backups;C/${NC}"
else
    echo -e "${YELLOW}   ⚠ No encontrado: backups;C/${NC}"
fi

# 3. Eliminar archivos de sesión redundantes
echo -e "${CYAN}3. Eliminando archivos de sesión anterior...${NC}"
session_files=(
    "GORAZUS_CONVERSATION_BACKUP.md"
    "SESSION_BACKUP.md"
    "RESUMEN_SESION_PARA_GPT.txt"
)

for file in "${session_files[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo -e "${GREEN}   ✓ Eliminado: $file${NC}"
    else
        echo -e "${YELLOW}   ⚠ No encontrado: $file${NC}"
    fi
done

# 4. Eliminar archivo VERSION (redundante con VERSION.md)
echo -e "${CYAN}4. Eliminando archivo VERSION (redundante)...${NC}"
if [ -f "VERSION" ]; then
    rm "VERSION"
    echo -e "${GREEN}   ✓ Eliminado: VERSION${NC}"
else
    echo -e "${YELLOW}   ⚠ No encontrado: VERSION${NC}"
fi

# 5. Actualizar .gitignore
echo -e "${CYAN}5. Actualizando .gitignore...${NC}"

# Crear backup de .gitignore actual
if [ -f ".gitignore" ]; then
    cp .gitignore .gitignore.backup
    echo -e "${GREEN}   ✓ Backup creado: .gitignore.backup${NC}"
fi

# Agregar nuevas líneas a .gitignore si no existen
{
    echo ""
    echo "# Database backups (NUNCA en Git - usar cloud storage)"
    echo "backups/*.dump"
    echo "migration-baseline-*.txt"
    echo ""
    echo "# Session/AI files (no reutilizables)"
    echo ".claude/SESSION_STATE.md"
    echo ".claude/MEMORY.md"
    echo ".claude/scheduled_tasks.lock"
    echo ".claude/settings.json"
} >> .gitignore

echo -e "${GREEN}   ✓ .gitignore actualizado${NC}"

# 6. Git: Remover backups del índice
echo -e "${CYAN}6. Removiendo archivos .dump del Git...${NC}"

# Verificar si estamos en un repo Git
if git rev-parse --git-dir > /dev/null 2>&1; then
    dump_count=$(find backups -name "*.dump" 2>/dev/null | wc -l)
    if [ "$dump_count" -gt 0 ]; then
        echo "   Encontrados $dump_count archivos .dump"
        echo -e "${YELLOW}   Ejecutando: git rm --cached 'backups/*.dump'${NC}"
        git rm --cached "backups/*.dump" 2>/dev/null || true
        echo -e "${GREEN}   ✓ Archivos removidos del índice Git${NC}"
        echo -e "${YELLOW}   ⚠ Recuerda hacer commit: git commit -m 'chore: remove db dumps from git'${NC}"
    else
        echo -e "${CYAN}   ℹ No hay archivos .dump para remover${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠ No se detectó repositorio Git${NC}"
fi

echo ""
echo -e "${GREEN}✓ LIMPIEZA COMPLETADA${NC}"
echo ""
echo -e "${CYAN}Próximos pasos:${NC}"
echo "1. Revisar cambios: git status"
echo "2. Hacer commit: git add . && git commit -m 'chore: cleanup obsolete files and config'"
echo "3. Hacer push: git push origin main"
echo "4. Considerar: archivo de políticas de backups en docs/"
echo ""
echo -e "${CYAN}Documentación de referencia guardada en:${NC}"
echo "  docs/CLEANUP_REPORT_2026_01_14.md"
echo "  CLEANUP_SUMMARY.md"
