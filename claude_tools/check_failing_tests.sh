#!/bin/bash

echo "🔍 Analizando tests fallando..."
echo "================================"

# Ejecutar solo tests que pueden estar fallando
TEST_FILES=(
    "01-navigation-optimized.cy.js"
    "02-inventory.cy.js"
    "03-impacts.cy.js"
    "04-integration.cy.js"
    "05-tasks.cy.js"
    "05-tasks-simple.cy.js"
    "07-reports.cy.js"
    "08-imports.cy.js"
    "09-audit.cy.js"
    "10-maturity.cy.js"
)

FAILED_COUNT=0
PASSED_COUNT=0

for test in "${TEST_FILES[@]}"; do
    echo -e "\n📄 Probando: $test"
    if npx cypress run --spec "cypress/e2e/$test" --browser chrome --headless --quiet 2>&1 | grep -q "All specs passed"; then
        echo "✅ PASANDO"
        ((PASSED_COUNT++))
    else
        echo "❌ FALLANDO"
        ((FAILED_COUNT++))
        # Mostrar el error específico
        npx cypress run --spec "cypress/e2e/$test" --browser chrome --headless 2>&1 | grep -A5 "failing\|Error:\|AssertionError:" | head -10
    fi
done

echo -e "\n📊 RESUMEN:"
echo "==========="
echo "Tests pasando: $PASSED_COUNT"
echo "Tests fallando: $FAILED_COUNT"
echo "Total analizado: ${#TEST_FILES[@]}"

if [ $FAILED_COUNT -eq 0 ]; then
    echo -e "\n🎉 ¡Todos los tests analizados están pasando!"
else
    echo -e "\n⚠️  Hay $FAILED_COUNT tests que necesitan arreglos"
fi