#!/bin/bash

# Script para ejecutar los tests E2E de Cypress

echo "🧪 Ejecutando tests E2E..."
echo "========================="

# Configuración
export CYPRESS_BASE_URL=http://localhost:8080

# Verificar que el servidor esté corriendo
if ! curl -s http://localhost:8080 > /dev/null; then
    echo "❌ Error: El servidor no está corriendo en http://localhost:8080"
    echo "Ejecuta primero: ./test_local.sh"
    exit 1
fi

# Ejecutar todos los tests
npx cypress run --browser chrome --headless

# Para ejecutar un test específico, usa:
# npx cypress run --spec cypress/e2e/nombre-del-test.cy.js --browser chrome --headless

# Para abrir Cypress en modo interactivo:
# npx cypress open