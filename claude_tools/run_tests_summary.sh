#!/bin/bash

echo "🧪 Ejecutando tests de Cypress..."
echo "================================"

# Configuración para tests más rápidos
export CYPRESS_defaultCommandTimeout=10000
export CYPRESS_video=false
export CYPRESS_screenshotOnRunFailure=false

# Ejecutar tests y capturar salida
npx cypress run --browser chrome --headless 2>&1 | tee cypress_output.log

# Extraer resumen
echo -e "\n📊 RESUMEN DE RESULTADOS:"
echo "========================"

# Contar tests
TOTAL_SPECS=$(grep -c "Running:" cypress_output.log || echo "0")
PASSED_SPECS=$(grep -c "✔  " cypress_output.log | tail -1 || echo "0")
FAILED_SPECS=$(grep -c "✖  " cypress_output.log | tail -1 || echo "0")

echo "Total de specs: $TOTAL_SPECS"
echo "Specs pasando: $PASSED_SPECS"
echo "Specs fallando: $FAILED_SPECS"

# Mostrar tests fallando
if [ "$FAILED_SPECS" -gt "0" ]; then
    echo -e "\n❌ TESTS FALLANDO:"
    grep -B2 "failing" cypress_output.log | grep -E "(\.cy\.js|failing)" | head -20
fi

# Limpiar
rm -f cypress_output.log

echo -e "\n✅ Análisis completado"