#!/bin/bash

echo "📊 Obteniendo estadísticas de tests..."
echo "===================================="

# Ejecutar solo el listado de tests
OUTPUT=$(npx cypress run --browser chrome --headless 2>&1)

# Extraer el resumen final
echo "$OUTPUT" | tail -100 | grep -A30 "Run Finished" > summary.txt

# Mostrar resumen
echo -e "\n📈 RESUMEN FINAL:"
cat summary.txt | grep -E "(Tests:|Passing:|Failing:|Pending:|Skipped:)" | head -5

# Contar specs
echo -e "\n📄 POR SPEC:"
TOTAL=$(cat summary.txt | grep -E "│\s+(✓|✖)" | wc -l | tr -d ' ')
PASSING=$(cat summary.txt | grep "│ ✓" | wc -l | tr -d ' ')
FAILING=$(cat summary.txt | grep "│ ✖" | wc -l | tr -d ' ')

echo "Total specs: $TOTAL"
echo "Specs pasando: $PASSING"
echo "Specs fallando: $FAILING"

# Mostrar specs fallando
if [ "$FAILING" -gt 0 ]; then
    echo -e "\n❌ SPECS FALLANDO:"
    cat summary.txt | grep "│ ✖" | awk -F'│' '{print $2}' | sed 's/✖//' | tr -s ' '
fi

# Calcular porcentaje
if [ "$TOTAL" -gt 0 ]; then
    PERCENT=$((PASSING * 100 / TOTAL))
    echo -e "\n📊 Porcentaje: $PERCENT% pasando"
fi

rm -f summary.txt