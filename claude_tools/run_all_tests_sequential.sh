#!/bin/bash

# Script para ejecutar todos los tests E2E secuencialmente
# Evita timeouts y permite ver el progreso completo

echo "🚀 Ejecutando todos los tests E2E secuencialmente..."
echo "=============================================="

# Inicializar contadores
TOTAL_TESTS=0
TOTAL_PASSING=0
TOTAL_FAILING=0
FAILED_SPECS=""

# Array con todos los tests en orden
TESTS=(
    "00-setup.cy.js"
    "00-test-setup.cy.js"
    "01-navigation.cy.js"
    "01-navigation-fixed.cy.js"
    "02-inventory.cy.js"
    "03-impacts.cy.js"
    "04-integration.cy.js"
    "05-tasks.cy.js"
    "06-full-journey.cy.js"
    "07-reported-issues.cy.js"
    "07-tasks-issues-simple.cy.js"
    "08-tasks-working.cy.js"
    "09-maturity-module.cy.js"
    "10-maturity-questionnaire-navigation.cy.js"
    "11-maturity-simple-test.cy.js"
    "12-maturity-navigation-fix-validation.cy.js"
    "13-maturity-navigation-final-check.cy.js"
    "14-business-processes-personal.cy.js"
    "15-business-processes-projects.cy.js"
    "16-business-processes-infrastructure.cy.js"
    "17-business-processes-security.cy.js"
    "18-business-processes-crisis.cy.js"
    "19-all-business-processes.cy.js"
)

# Función para ejecutar un test
run_test() {
    local test_file=$1
    local index=$2
    local total=${#TESTS[@]}
    
    echo ""
    echo "[$index/$total] Ejecutando: $test_file"
    echo "----------------------------------------"
    
    # Ejecutar test y capturar resultado
    npx cypress run --spec "cypress/e2e/$test_file" --reporter json > temp_result.json 2>&1
    
    # Extraer estadísticas
    if [ -f temp_result.json ]; then
        tests=$(grep -o '"tests": [0-9]*' temp_result.json | head -1 | grep -o '[0-9]*')
        passes=$(grep -o '"passes": [0-9]*' temp_result.json | head -1 | grep -o '[0-9]*')
        failures=$(grep -o '"failures": [0-9]*' temp_result.json | head -1 | grep -o '[0-9]*')
        
        # Si no hay valores, asumir fallo
        tests=${tests:-0}
        passes=${passes:-0}
        failures=${failures:-0}
        
        # Actualizar totales
        TOTAL_TESTS=$((TOTAL_TESTS + tests))
        TOTAL_PASSING=$((TOTAL_PASSING + passes))
        TOTAL_FAILING=$((TOTAL_FAILING + failures))
        
        # Mostrar resultado
        if [ "$failures" -eq 0 ] && [ "$tests" -gt 0 ]; then
            echo "✅ PASANDO: $passes/$tests tests"
        else
            echo "❌ FALLANDO: $passes/$tests tests ($failures fallos)"
            FAILED_SPECS="$FAILED_SPECS\n  - $test_file: $passes/$tests"
        fi
    else
        echo "❌ ERROR: No se pudo ejecutar el test"
        FAILED_SPECS="$FAILED_SPECS\n  - $test_file: ERROR"
        TOTAL_FAILING=$((TOTAL_FAILING + 1))
    fi
    
    # Limpiar archivo temporal
    rm -f temp_result.json
}

# Ejecutar todos los tests
index=1
for test in "${TESTS[@]}"; do
    run_test "$test" "$index"
    index=$((index + 1))
    
    # Pequeña pausa entre tests para evitar sobrecarga
    sleep 2
done

# Mostrar resumen final
echo ""
echo "=============================================="
echo "📊 RESUMEN FINAL"
echo "=============================================="
echo "Total de tests: $TOTAL_TESTS"
echo "Tests pasando: $TOTAL_PASSING"
echo "Tests fallando: $TOTAL_FAILING"
echo ""

# Calcular porcentaje
if [ $TOTAL_TESTS -gt 0 ]; then
    PERCENTAGE=$((TOTAL_PASSING * 100 / TOTAL_TESTS))
    echo "Porcentaje de éxito: $PERCENTAGE%"
else
    PERCENTAGE=0
    echo "Porcentaje de éxito: N/A"
fi

echo ""

# Mostrar tests fallidos
if [ "$TOTAL_FAILING" -gt 0 ]; then
    echo "❌ TESTS FALLIDOS:"
    echo -e "$FAILED_SPECS"
    echo ""
    echo "⚠️  NO SE ALCANZÓ EL 100% REQUERIDO"
    exit 1
else
    echo "✅ ¡TODOS LOS TESTS PASANDO! 100% 🎉"
    exit 0
fi