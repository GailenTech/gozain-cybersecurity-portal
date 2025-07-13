#!/bin/bash

echo "🚀 Ejecutando TODOS los tests rápidamente..."
echo "=========================================="

# Configuración para máxima velocidad
export CYPRESS_defaultCommandTimeout=10000
export CYPRESS_video=false
export CYPRESS_screenshotOnRunFailure=false
export CYPRESS_numTestsKeptInMemory=0

# Ejecutar todos los tests
npx cypress run --browser chrome --headless --quiet 2>&1 | tee test_output.log

# Analizar resultados
echo -e "\n📊 RESUMEN DE RESULTADOS:"
echo "========================"

# Extraer el resumen final
tail -50 test_output.log | grep -E "(Tests:|Passing:|Failing:|specs?)" | tail -10

# Mostrar specs que fallaron
echo -e "\n❌ SPECS FALLANDO:"
grep "✖" test_output.log | grep -v "0ms" | head -20

# Contar totales
TOTAL=$(grep -E "Running:.*\.cy\.js" test_output.log | wc -l | tr -d ' ')
PASSED=$(grep -c "✓.*cy\.js.*passing" test_output.log || echo "0")
FAILED=$(grep -c "✖.*cy\.js" test_output.log || echo "0")

echo -e "\n📈 ESTADÍSTICAS:"
echo "Total specs: $TOTAL"
echo "Specs pasando: $PASSED" 
echo "Specs fallando: $FAILED"

# Calcular porcentaje
if [ "$TOTAL" -gt 0 ]; then
    PERCENT=$((PASSED * 100 / TOTAL))
    echo "Porcentaje pasando: $PERCENT%"
    
    if [ "$PERCENT" -eq 100 ]; then
        echo -e "\n🎉 ¡100% DE TESTS PASANDO!"
    else
        echo -e "\n⚠️  Faltan $((100 - PERCENT))% para llegar al 100%"
    fi
fi

# Limpiar
rm -f test_output.log