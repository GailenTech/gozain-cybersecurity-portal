#!/bin/bash

echo "🔍 Analizando tests que fallan..."
echo "================================="

# Lista de archivos de test
TEST_FILES=(
    "00-setup.cy.js"
    "00-test-setup.cy.js" 
    "01-navigation.cy.js"
    "02-inventory.cy.js"
    "03-impacts.cy.js"
    "04-integration.cy.js"
    "05-tasks.cy.js"
    "05-tasks-simple.cy.js"
    "06-full-journey.cy.js"
    "07-reported-issues.cy.js"
    "07-reports.cy.js"
    "08-imports.cy.js"
    "08-integration-actual.cy.js"
    "09-audit.cy.js"
    "10-export.cy.js"
    "10-maturity.cy.js"
    "inventory-filters.cy.js"
    "inventory-navigation.cy.js"
    "tareas-basico.cy.js"
    "tareas-completo.cy.js"
    "tasks-api.cy.js"
    "tasks-frontend.cy.js"
    "tasks-integration.cy.js"
    "tasks-ui.cy.js"
    "tasks.cy.js"
)

# Ejecutar análisis rápido
echo "📊 Ejecutando análisis rápido de cada spec..."
echo ""

PASSING=()
FAILING=()
PENDING=()

for file in "${TEST_FILES[@]}"; do
    if [ -f "cypress/e2e/$file" ]; then
        echo -n "Analizando $file... "
        
        # Ejecutar test y capturar resultado
        OUTPUT=$(npx cypress run --spec "cypress/e2e/$file" --browser chrome --headless --quiet 2>&1)
        
        if echo "$OUTPUT" | grep -q "All specs passed"; then
            echo "✅ PASANDO"
            PASSING+=("$file")
        elif echo "$OUTPUT" | grep -q "failing"; then
            echo "❌ FALLANDO"
            FAILING+=("$file")
        elif echo "$OUTPUT" | grep -q "pending"; then
            echo "⏸️  PENDIENTE"
            PENDING+=("$file")
        else
            echo "❓ DESCONOCIDO"
        fi
    fi
done

echo ""
echo "📈 RESUMEN:"
echo "==========="
echo "✅ Tests pasando: ${#PASSING[@]}"
echo "❌ Tests fallando: ${#FAILING[@]}"
echo "⏸️  Tests pendientes: ${#PENDING[@]}"
echo ""

if [ ${#FAILING[@]} -gt 0 ]; then
    echo "❌ Tests que necesitan arreglos:"
    printf '%s\n' "${FAILING[@]}"
fi

# Calcular porcentaje
TOTAL=$((${#PASSING[@]} + ${#FAILING[@]}))
if [ $TOTAL -gt 0 ]; then
    PERCENT=$((${#PASSING[@]} * 100 / TOTAL))
    echo ""
    echo "📊 Porcentaje pasando: $PERCENT%"
    
    if [ $PERCENT -eq 100 ]; then
        echo "🎉 ¡100% DE TESTS PASANDO!"
    else
        echo "⚠️  Faltan $((100 - PERCENT))% para llegar al 100%"
    fi
fi