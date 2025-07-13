#!/bin/bash

echo "🔍 Identificando tests fallando..."
echo "================================="

# Lista de tests principales
TESTS=(
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
    "07-tasks-issues-simple.cy.js"
    "08-tasks-working.cy.js"
    "10-maturity.cy.js"
)

PASSING=()
FAILING=()

for test in "${TESTS[@]}"; do
    if [ -f "cypress/e2e/$test" ]; then
        echo -n "Probando $test... "
        
        # Ejecutar test en modo silencioso
        if npx cypress run --spec "cypress/e2e/$test" --browser chrome --headless --quiet 2>&1 | grep -q "All specs passed"; then
            echo "✅"
            PASSING+=("$test")
        else
            echo "❌"
            FAILING+=("$test")
        fi
    fi
done

echo -e "\n📊 RESULTADO:"
echo "============"
echo "✅ Pasando: ${#PASSING[@]}"
echo "❌ Fallando: ${#FAILING[@]}"

if [ ${#FAILING[@]} -gt 0 ]; then
    echo -e "\n❌ Tests que necesitan arreglos:"
    for test in "${FAILING[@]}"; do
        echo "  - $test"
    done
fi

# Porcentaje
TOTAL=$((${#PASSING[@]} + ${#FAILING[@]}))
if [ $TOTAL -gt 0 ]; then
    PERCENT=$((${#PASSING[@]} * 100 / TOTAL))
    echo -e "\n📈 Porcentaje: $PERCENT%"
    
    if [ $PERCENT -lt 100 ]; then
        echo "⚠️  Faltan $((100 - PERCENT))% para el 100%"
    fi
fi