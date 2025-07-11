#!/bin/bash

# Script para arreglar imports incorrectos en tests E2E

echo "🔧 Arreglando imports en archivos de test..."

# Buscar archivos con imports incorrectos
FILES=$(grep -l "import.*test-helpers" cypress/e2e/*.cy.js 2>/dev/null || true)

if [ -z "$FILES" ]; then
    echo "✅ No se encontraron imports incorrectos"
    exit 0
fi

echo "📝 Archivos a modificar:"
echo "$FILES"

# Reemplazar imports incorrectos
for file in $FILES; do
    echo "  Procesando: $file"
    
    # Hacer backup
    cp "$file" "$file.bak"
    
    # Remover línea de import
    sed -i '' '/import.*test-helpers/d' "$file"
    
    # Reemplazar ensureOrganizationSelected
    sed -i '' 's/ensureOrganizationSelected()/cy.loginWithOrg('\''E2E Test Organization'\'')/g' "$file"
    
    # Reemplazar navigateToToolReliably para Inventario
    sed -i '' "s/navigateToToolReliably('Inventario de Activos')/cy.get('.tool-card').contains('Inventario de Activos').click()/g" "$file"
    
    # Reemplazar navigateToToolReliably para Impactos
    sed -i '' "s/navigateToToolReliably('Impactos de Negocio')/cy.get('.tool-card').contains('Impactos de Negocio').click()/g" "$file"
    
    # Reemplazar navigateToToolReliably para Madurez
    sed -i '' "s/navigateToToolReliably('Madurez en Ciberseguridad')/cy.get('.tool-card').contains('Madurez en Ciberseguridad').click()/g" "$file"
    
    # Remover backup si todo salió bien
    rm "$file.bak"
done

echo "✅ Imports arreglados exitosamente"