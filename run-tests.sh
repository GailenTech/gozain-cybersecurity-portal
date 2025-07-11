#!/bin/bash

echo "🧪 Ejecutando suite de tests E2E para Gozain"
echo "============================================"

# Configuración
export CYPRESS_BASE_URL="https://gozain-h556ekexqa-uc.a.run.app"

# Ejecutar setup primero
echo ""
echo "1️⃣ Ejecutando configuración inicial..."
npm run cypress:run:prod -- --spec "cypress/e2e/00-setup.cy.js" --quiet

# Ejecutar tests principales
echo ""
echo "2️⃣ Ejecutando tests de navegación..."
npm run cypress:run:prod -- --spec "cypress/e2e/01-navigation.cy.js" --quiet

echo ""
echo "3️⃣ Ejecutando tests de inventario..."
npm run cypress:run:prod -- --spec "cypress/e2e/02-inventory.cy.js" --quiet

echo ""
echo "4️⃣ Ejecutando tests de impactos..."
npm run cypress:run:prod -- --spec "cypress/e2e/03-impacts.cy.js" --quiet

echo ""
echo "5️⃣ Ejecutando tests de integración..."
npm run cypress:run:prod -- --spec "cypress/e2e/04-integration.cy.js" --quiet

echo ""
echo "6️⃣ Ejecutando tests de gestión de tareas..."
npm run cypress:run:prod -- --spec "cypress/e2e/05-tasks.cy.js" --quiet

echo ""
echo "7️⃣ Ejecutando flujo completo del sistema..."
npm run cypress:run:prod -- --spec "cypress/e2e/06-full-journey.cy.js" --quiet

echo ""
echo "8️⃣ Ejecutando tests de problemas reportados..."
npm run cypress:run:prod -- --spec "cypress/e2e/07-reported-issues.cy.js" --quiet

echo ""
echo "✅ Tests completados!"
echo ""
echo "📊 Resumen:"
echo "- Videos guardados en: cypress/videos/"
echo "- Screenshots de errores en: cypress/screenshots/"