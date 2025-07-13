#!/bin/bash

echo "🚀 Estado rápido de tests principales..."
echo "======================================"

# Tests principales optimizados
TESTS=(
    "01-navigation.cy.js"
    "02-inventory.cy.js"
    "03-impacts-optimized.cy.js"
)

TOTAL=0
PASSING=0

for test in "${TESTS[@]}"; do
    echo -n "$test: "
    
    if npx cypress run --spec "cypress/e2e/$test" --browser chrome --headless --quiet 2>&1 | grep -q "All specs passed"; then
        echo "✅ PASANDO"
        ((PASSING++))
    else
        echo "❌ FALLANDO"
    fi
    ((TOTAL++))
done

echo ""
echo "📊 Resumen: $PASSING/$TOTAL tests pasando"

if [ $PASSING -eq $TOTAL ]; then
    echo "🎉 ¡Todos los tests optimizados están pasando!"
else
    echo "⚠️  Aún hay $(($TOTAL - $PASSING)) tests fallando"
fi