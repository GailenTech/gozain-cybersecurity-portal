#\!/bin/bash

echo "🔍 Verificando archivos que probablemente están fallando..."
echo "========================================================="
echo ""

# Archivos que sabemos que pueden tener problemas
problem_files=(
    "04-integration.cy.js"
    "07-reported-issues.cy.js"
    "07-tasks-issues-simple.cy.js"
    "08-tasks-working.cy.js"
    "09-maturity-module.cy.js"
    "10-maturity-questionnaire-navigation.cy.js"
)

echo "Archivos a verificar:"
for file in "${problem_files[@]}"; do
    if [[ -f "cypress/e2e/$file" ]]; then
        active=$(grep -E "^\s*it\s*\(" "cypress/e2e/$file" | grep -v "it\.skip" | wc -l)
        echo "- $file: $active tests activos"
    fi
done

echo ""
echo "Ejecutemos el test de integración mejorado:"
npx cypress run --spec "cypress/e2e/04-integration.cy.js" --reporter spec 2>&1 | tail -20
