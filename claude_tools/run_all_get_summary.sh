#\!/bin/bash

echo "🧪 Ejecutando TODOS los tests para obtener resumen completo..."
echo "============================================================"

# Ejecutar todos los tests y capturar salida
npm run cypress:run 2>&1 | tee test_output.log

# Extraer resumen final
echo ""
echo "📊 RESUMEN FINAL:"
echo "=================="
grep -A 10 "Run Finished" test_output.log | tail -15

# Contar tests por categoría
passing=$(grep -E "✔|✓" test_output.log | grep "All specs passed" | wc -l)
failing=$(grep "✖" test_output.log | grep -v "All specs" | wc -l)

echo ""
echo "📈 ANÁLISIS:"
if [[ $passing -gt 0 ]]; then
    echo "✅ Archivos con 100% tests pasando: $(grep -E "✔|✓" test_output.log | grep "All specs passed" | wc -l)"
fi
echo "❌ Archivos con tests fallando: $(grep "✖" test_output.log | grep -v "All specs" | wc -l)"

# Cleanup
rm -f test_output.log
