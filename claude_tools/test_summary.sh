#!/bin/bash

echo "📊 Ejecutando resumen rápido de tests..."
echo "======================================="

# Configuración
export CYPRESS_defaultCommandTimeout=10000
export CYPRESS_video=false
export CYPRESS_screenshotOnRunFailure=false

# Ejecutar y analizar
npx cypress run --browser chrome --headless 2>&1 | tee output.log

# Extraer resumen
echo -e "\n📈 RESUMEN FINAL:"
echo "================"

# Buscar el resumen final de Cypress
tail -100 output.log | grep -A20 "Run Finished" | grep -E "(Tests:|Passing:|Failing:|Pending:|Skipped:)" | head -5

# Contar specs
TOTAL_SPECS=$(grep -c "Running:.*\.cy\.js" output.log)
PASSING_SPECS=$(grep "✓.*\.cy\.js" output.log | grep -E "\s+[0-9]+\s+[0-9]+\s+-" | wc -l | tr -d ' ')
FAILING_SPECS=$(grep "✖.*\.cy\.js" output.log | wc -l | tr -d ' ')

echo ""
echo "📄 SPECS:"
echo "Total: $TOTAL_SPECS"
echo "Pasando: $PASSING_SPECS"
echo "Fallando: $FAILING_SPECS"

# Mostrar tests que fallan
if [ "$FAILING_SPECS" -gt 0 ]; then
    echo -e "\n❌ SPECS CON FALLOS:"
    grep "✖.*\.cy\.js" output.log | head -10
fi

# Calcular porcentaje
if [ "$TOTAL_SPECS" -gt 0 ]; then
    PERCENT=$((PASSING_SPECS * 100 / TOTAL_SPECS))
    echo -e "\n📊 Porcentaje de specs pasando: $PERCENT%"
    
    if [ "$PERCENT" -eq 100 ]; then
        echo "🎉 ¡100% DE SPECS PASANDO!"
    fi
fi

rm -f output.log