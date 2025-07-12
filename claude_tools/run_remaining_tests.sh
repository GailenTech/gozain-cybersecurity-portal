#\!/bin/bash

echo "🧪 Ejecutando tests restantes para verificar estado..."
echo "===================================================="

# Tests que necesitamos verificar
test_files=(
    "cypress/e2e/07-reported-issues.cy.js"
    "cypress/e2e/07-tasks-issues-simple.cy.js"
    "cypress/e2e/08-tasks-advanced.cy.js"
    "cypress/e2e/09-maturity-module.cy.js"
    "cypress/e2e/10-navigation-between-modules.cy.js"
    "cypress/e2e/11-maturity-simple-test.cy.js"
    "cypress/e2e/12-maturity-navigation-fix-validation.cy.js"
    "cypress/e2e/13-maturity-navigation-final-check.cy.js"
)

for file in "${test_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo ""
        echo "📄 Ejecutando: $(basename $file)"
        echo "----------------------------------------"
        
        # Ejecutar y capturar resultado
        if npx cypress run --spec "$file" --reporter json 2>&1 | grep -q '"failures": 0'; then
            echo "✅ PASANDO: Todos los tests pasaron"
        else
            # Contar tests
            total=$(grep -E "^\s*it\s*\(" "$file" | wc -l)
            skipped=$(grep -E "^\s*it\.skip\s*\(" "$file" | wc -l)
            echo "❌ FALLANDO o PARCIAL: Verificar manualmente ($total tests, $skipped skipped)"
        fi
    fi
done
