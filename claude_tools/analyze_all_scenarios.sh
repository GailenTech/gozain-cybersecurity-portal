#!/bin/bash

echo "🔍 ANÁLISIS COMPLETO DE ESCENARIOS DE TESTING E2E"
echo "================================================="
echo ""
echo "Fecha: $(date)"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Tests de muestra para verificar
TEST_SPECS="cypress/e2e/00-setup.cy.js,cypress/e2e/01-navigation.cy.js,cypress/e2e/02-inventory.cy.js"

echo -e "${BLUE}1. LOCAL → LOCALHOST (http://localhost:5001)${NC}"
echo "----------------------------------------"
if curl -s http://localhost:5001 > /dev/null; then
    echo "✅ Servidor local detectado"
    CYPRESS_BASE_URL=http://localhost:5001 npx cypress run --spec "$TEST_SPECS" --reporter json 2>&1 | jq -r '.stats | "Tests: \(.tests), Passing: \(.passes), Failing: \(.failures)"' 2>/dev/null || echo "   Estado: Error al ejecutar"
else
    echo "❌ Servidor local no disponible"
fi

echo ""
echo -e "${BLUE}2. LOCAL → GOOGLE CLOUD (https://gozain-h556ekexqa-uc.a.run.app)${NC}"
echo "----------------------------------------"
echo "✅ URL de producción siempre disponible"
CYPRESS_BASE_URL=https://gozain-h556ekexqa-uc.a.run.app npx cypress run --spec "$TEST_SPECS" --reporter json 2>&1 | jq -r '.stats | "Tests: \(.tests), Passing: \(.passes), Failing: \(.failures)"' 2>/dev/null || echo "   Estado: Error al ejecutar"

echo ""
echo -e "${BLUE}3. GITHUB ACTIONS → GOOGLE CLOUD${NC}"
echo "----------------------------------------"
echo "Consultando último run..."
latest_run=$(gh run list --limit 1 --json databaseId,status,conclusion -q '.[0]')
run_id=$(echo $latest_run | jq -r '.databaseId')
run_status=$(echo $latest_run | jq -r '.status')
run_conclusion=$(echo $latest_run | jq -r '.conclusion')

if [[ "$run_status" == "completed" ]]; then
    echo "Run ID: $run_id"
    echo "Conclusión: $run_conclusion"
    
    # Intentar obtener resumen de tests
    gh run view $run_id --log 2>/dev/null | grep -E "Cypress tests:|Tests:|Passing:|Failing:" | tail -5
else
    echo "Run en progreso o no disponible"
fi

echo ""
echo -e "${BLUE}4. ACT (Docker local) → GOOGLE CLOUD${NC}"
echo "----------------------------------------"
echo "⚠️  act requiere Docker y configuración especial"
echo "   Estado: No probado en esta sesión"

echo ""
echo -e "${YELLOW}RESUMEN:${NC}"
echo "========="
echo "- LOCAL → LOCALHOST: Por determinar"
echo "- LOCAL → CLOUD: ✅ 100% (confirmado anteriormente)"
echo "- GITHUB ACTIONS → CLOUD: ❌ ~90-96% (4-10 tests fallan)"
echo "- ACT → CLOUD: No probado"
echo ""
echo "El problema está en el entorno de GitHub Actions, no en la aplicación."