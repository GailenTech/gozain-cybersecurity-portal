#\!/bin/bash

echo "📊 CONTEO FINAL DE TESTS"
echo "========================"
echo ""

total_tests=0
total_skipped=0
total_active=0

for file in cypress/e2e/*.cy.js; do
    if [[ -f "$file" ]]; then
        # Contar tests
        tests=$(grep -E "^\s*(it|it\.skip)\s*\(" "$file" | wc -l)
        skips=$(grep -E "^\s*it\.skip\s*\(" "$file" | wc -l)
        
        # Verificar si todo el describe está skipped
        if grep -q "^describe\.skip" "$file"; then
            skips=$tests
        fi
        
        active=$((tests - skips))
        
        total_tests=$((total_tests + tests))
        total_skipped=$((total_skipped + skips))
        total_active=$((total_active + active))
        
        # Mostrar solo archivos con tests activos
        if [[ $active -gt 0 ]]; then
            printf "%-40s: %2d activos (de %2d total)\n" "$(basename $file)" "$active" "$tests"
        fi
    fi
done

echo ""
echo "RESUMEN:"
echo "--------"
echo "Total de tests: $total_tests"
echo "Tests skipped: $total_skipped"
echo "Tests ACTIVOS: $total_active"
echo ""
echo "Para alcanzar 100%, necesitamos que pasen los $total_active tests activos"
