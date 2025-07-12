#\!/bin/bash

echo "📊 Contando todos los tests E2E..."
echo "================================="

total_tests=0
total_passing=0
total_failing=0
total_skipped=0

for test_file in cypress/e2e/*.cy.js; do
    if [[ -f "$test_file" ]]; then
        echo -n "Analizando $(basename $test_file)... "
        
        # Contar tests
        tests=$(grep -E "^\s*(it|it\.skip|it\.only)\s*\(" "$test_file" | wc -l)
        skips=$(grep -E "^\s*it\.skip\s*\(" "$test_file" | wc -l)
        
        total_tests=$((total_tests + tests))
        total_skipped=$((total_skipped + skips))
        
        echo "$tests tests ($skips skipped)"
    fi
done

echo ""
echo "📈 RESUMEN TOTAL:"
echo "- Total tests: $total_tests"
echo "- Tests skipped: $total_skipped"
echo "- Tests activos: $((total_tests - total_skipped))"
echo ""
echo "Para alcanzar 100%, necesitamos que todos los tests activos pasen."
