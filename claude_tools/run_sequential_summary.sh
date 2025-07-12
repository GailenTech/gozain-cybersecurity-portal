#\!/bin/bash

echo "🚀 Ejecutando todos los tests secuencialmente..."
echo "=============================================="

passing_files=0
failing_files=0
total_passing=0
total_failing=0

# Array para guardar resultados
declare -a results

for file in cypress/e2e/*.cy.js; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file")
        echo -n "Testing $filename... "
        
        # Ejecutar test y capturar salida
        output=$(npx cypress run --spec "$file" 2>&1)
        
        # Buscar resultados
        if echo "$output" | grep -q "All specs passed\!"; then
            tests=$(echo "$output" | grep -E "Tests:\s+[0-9]+" | grep -oE "[0-9]+" | head -1)
            passing=$(echo "$output" | grep -E "Passing:\s+[0-9]+" | grep -oE "[0-9]+" | head -1)
            echo "✅ PASSED ($passing/$tests)"
            ((passing_files++))
            ((total_passing+=passing))
            results+=("✅ $filename: $passing/$tests tests passing")
        else
            tests=$(echo "$output" | grep -E "Tests:\s+[0-9]+" | grep -oE "[0-9]+" | head -1)
            passing=$(echo "$output" | grep -E "Passing:\s+[0-9]+" | grep -oE "[0-9]+" | head -1)
            failing=$(echo "$output" | grep -E "Failing:\s+[0-9]+" | grep -oE "[0-9]+" | head -1)
            echo "❌ FAILED ($passing/$tests passing, $failing failing)"
            ((failing_files++))
            ((total_failing+=failing))
            results+=("❌ $filename: $passing/$tests passing, $failing failing")
        fi
    fi
done

echo ""
echo "📊 RESUMEN FINAL:"
echo "================"
echo ""
for result in "${results[@]}"; do
    echo "$result"
done
echo ""
echo "TOTALES:"
echo "- Archivos 100% pasando: $passing_files"
echo "- Archivos con fallos: $failing_files"
echo "- Tests pasando: $total_passing"
echo "- Tests fallando: $total_failing"
echo ""
if [[ $failing_files -eq 0 ]]; then
    echo "🎉 ¡100% DE TESTS PASANDO\!"
else
    echo "⚠️  Aún quedan $failing_files archivos con tests fallando"
fi
