#\!/bin/bash

echo "🌐 Probando contra Google Cloud URL..."
echo "====================================="
echo ""

export CYPRESS_BASE_URL=https://gozain-h556ekexqa-uc.a.run.app

# Ejecutar solo el test de cambio de vista que está fallando
echo "Ejecutando test específico de Vista Lista..."
npx cypress run --spec "cypress/e2e/02-inventory.cy.js" \
  --config "defaultCommandTimeout=20000" \
  --env "retries=2" \
  --reporter spec 2>&1 | grep -E "(Vista Lista|failing|passing|✓|×)" | head -20

echo ""
echo "Comparando con ejecución local..."
export CYPRESS_BASE_URL=http://localhost:5001

npx cypress run --spec "cypress/e2e/02-inventory.cy.js" \
  --reporter spec 2>&1 | grep -E "(Vista Lista|failing|passing|✓|×)" | head -20
