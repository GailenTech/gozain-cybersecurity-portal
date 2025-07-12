#!/bin/bash

# Script para arreglar todos los tests E2E sistemáticamente

echo "🔧 Arreglando todos los tests E2E..."
echo "=================================="

# Lista de tests y sus problemas conocidos
declare -A test_issues

# Tests con comandos obsoletos
test_issues["05-tasks.cy.js"]="Usar loginWithOrg en lugar de selectTool"
test_issues["06-full-journey.cy.js"]="Actualizar comandos de navegación"
test_issues["04-integration.cy.js"]="Problemas con selectores y navegación"

# Arreglar comandos obsoletos en todos los archivos
echo "1. Reemplazando comandos obsoletos..."

# Reemplazar selectTool
find cypress/e2e -name "*.cy.js" -exec grep -l "selectTool" {} \; | while read file; do
    echo "   - Arreglando selectTool en $file"
    sed -i '' "s/cy.selectTool('inventario')/cy.contains('.tool-card', 'Inventario de Activos').click()/g" "$file"
    sed -i '' "s/cy.selectTool('impactos')/cy.contains('.tool-card', 'Impactos de Negocio').click()/g" "$file"
    sed -i '' "s/cy.selectTool('madurez')/cy.contains('.tool-card', 'Madurez en Ciberseguridad').click()/g" "$file"
done

# Reemplazar navigateToTool
find cypress/e2e -name "*.cy.js" -exec grep -l "navigateToTool" {} \; | while read file; do
    echo "   - Arreglando navigateToTool en $file"
    sed -i '' "s/cy.navigateToTool('Inventario')/cy.contains('.tool-card', 'Inventario de Activos').click()/g" "$file"
    sed -i '' "s/cy.navigateToTool('Impactos')/cy.contains('.tool-card', 'Impactos de Negocio').click()/g" "$file"
    sed -i '' "s/cy.navigateToTool('Madurez')/cy.contains('.tool-card', 'Madurez en Ciberseguridad').click()/g" "$file"
done

# Reemplazar createMaturityAssessment (comando obsoleto)
find cypress/e2e -name "*.cy.js" -exec grep -l "createMaturityAssessment" {} \; | while read file; do
    echo "   - Arreglando createMaturityAssessment en $file"
    # Este comando necesita ser reemplazado con clicks directos en UI
done

# Reemplazar resetData y createTestOrganization con loginWithOrg
echo "2. Actualizando setup de tests..."
find cypress/e2e -name "*.cy.js" -exec grep -l "resetData\\|createTestOrganization" {} \; | while read file; do
    if grep -q "org-test" "$file"; then
        echo "   - Actualizando setup en $file"
        # Backup del archivo
        cp "$file" "$file.bak"
        
        # Reemplazar el patrón completo
        sed -i '' '/cy.resetData();/,/cy.selectOrganization.*org-test/c\
    cy.loginWithOrg('"'"'E2E Test Organization'"'"');' "$file"
    fi
done

echo ""
echo "3. Arreglos específicos por archivo..."

# Arreglar 05-tasks.cy.js
if [ -f "cypress/e2e/05-tasks.cy.js" ]; then
    echo "   - Arreglando 05-tasks.cy.js"
    # Ya lo arreglamos antes
fi

# Arreglar imports de Análisis de Impactos
find cypress/e2e -name "*.cy.js" -exec grep -l "Análisis de Impactos" {} \; | while read file; do
    echo "   - Corrigiendo nombre del módulo en $file"
    sed -i '' "s/'Análisis de Impactos'/'Impactos de Negocio'/g" "$file"
done

echo ""
echo "✅ Arreglos completados!"
echo ""
echo "4. Ejecutando verificación rápida..."

# Verificar que no quedan comandos obsoletos
obsolete_commands=(
    "selectTool"
    "navigateToTool" 
    "createMaturityAssessment"
    "selectOrganization.*org-test"
)

for cmd in "${obsolete_commands[@]}"; do
    count=$(grep -r "$cmd" cypress/e2e/*.cy.js 2>/dev/null | wc -l)
    if [ $count -gt 0 ]; then
        echo "   ⚠️  Todavía hay $count instancias de '$cmd'"
        grep -r "$cmd" cypress/e2e/*.cy.js | head -3
    else
        echo "   ✅ No hay instancias de '$cmd'"
    fi
done

echo ""
echo "🎯 Script completado!"