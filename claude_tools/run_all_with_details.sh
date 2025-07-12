#!/bin/bash

echo "🚀 Ejecutando TODOS los tests con detalles..."
echo "==========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores globales
total_files=0
passing_files=0
failing_files=0
total_tests=0
total_passing=0
total_failing=0
total_pending=0
total_skipped=0

# Array para resultados
declare -a results

# Función para ejecutar un test
run_test() {
    local file=$1
    local filename=$(basename "$file")
    
    echo -ne "📄 Testing $filename... "
    
    # Ejecutar test y capturar salida
    output=$(npx cypress run --spec "$file" 2>&1)
    
    # Extraer métricas
    tests=$(echo "$output" | grep -E "│ Tests:\s+[0-9]+" | grep -oE "[0-9]+" | head -1 || echo "0")
    passing=$(echo "$output" | grep -E "│ Passing:\s+[0-9]+" | grep -oE "[0-9]+" | head -1 || echo "0")
    failing=$(echo "$output" | grep -E "│ Failing:\s+[0-9]+" | grep -oE "[0-9]+" | head -1 || echo "0")
    pending=$(echo "$output" | grep -E "│ Pending:\s+[0-9]+" | grep -oE "[0-9]+" | head -1 || echo "0")
    skipped=$(echo "$output" | grep -E "│ Skipped:\s+[0-9]+" | grep -oE "[0-9]+" | head -1 || echo "0")
    
    # Actualizar contadores
    ((total_files++))
    ((total_tests+=tests))
    ((total_passing+=passing))
    ((total_failing+=failing))
    ((total_pending+=pending))
    ((total_skipped+=skipped))
    
    # Mostrar resultado
    if echo "$output" | grep -q "All specs passed!"; then
        echo -e "${GREEN}✅ PASSED${NC} ($passing/$tests)"
        ((passing_files++))
        results+=("${GREEN}✅${NC} $filename: $passing/$tests tests")
    else
        echo -e "${RED}❌ FAILED${NC} ($passing/$tests passing, $failing failing)"
        ((failing_files++))
        results+=("${RED}❌${NC} $filename: $passing/$tests passing, $failing failing")
    fi
}

# Ejecutar todos los tests
for file in cypress/e2e/*.cy.js; do
    if [[ -f "$file" ]]; then
        run_test "$file"
    fi
done

# Mostrar resumen
echo ""
echo "============================================"
echo "📊 RESUMEN FINAL"
echo "============================================"
echo ""

# Mostrar resultados por archivo
for result in "${results[@]}"; do
    echo -e "$result"
done

echo ""
echo "📈 ESTADÍSTICAS GLOBALES:"
echo "------------------------"
echo "Total de archivos: $total_files"
echo -e "Archivos pasando: ${GREEN}$passing_files${NC}"
echo -e "Archivos fallando: ${RED}$failing_files${NC}"
echo ""
echo "Total de tests: $total_tests"
echo -e "Tests pasando: ${GREEN}$total_passing${NC}"
echo -e "Tests fallando: ${RED}$total_failing${NC}"
echo -e "Tests pendientes: ${YELLOW}$total_pending${NC}"
echo "Tests skipped: $total_skipped"
echo ""

# Calcular porcentaje
if [[ $total_tests -gt 0 ]]; then
    percentage=$((total_passing * 100 / (total_tests - total_skipped)))
    echo -e "Porcentaje de éxito: ${GREEN}$percentage%${NC}"
fi

echo ""
if [[ $failing_files -eq 0 ]]; then
    echo -e "${GREEN}🎉 ¡OBJETIVO ALCANZADO! 100% DE TESTS PASANDO 🎉${NC}"
else
    echo -e "${YELLOW}⚠️  Aún quedan $failing_files archivos con tests fallando${NC}"
    echo "   Necesitamos arreglar $total_failing tests más"
fi