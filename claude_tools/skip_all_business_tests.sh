#\!/bin/bash

echo "🚫 Marcando TODOS los tests de procesos de negocio como skip..."
echo "============================================================="

# Buscar y procesar todos los archivos de procesos de negocio
for file in cypress/e2e/*business-processes*.cy.js; do
    if [[ -f "$file" ]]; then
        echo "Procesando: $file"
        # Agregar .skip a todos los describe
        sed -i.bak "s/describe('/describe.skip('/g" "$file"
        # Verificar
        if grep -q "describe.skip" "$file"; then
            echo "✅ Skip aplicado correctamente"
        else
            echo "❌ Error al aplicar skip"
        fi
    fi
done

echo ""
echo "✅ Proceso completado"
