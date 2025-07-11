#!/bin/bash

echo "🧪 Ejecutando pruebas E2E contra Google Cloud Run"
echo "================================================"

# Configuración de producción
PROD_URL="https://gozain-h556ekexqa-uc.a.run.app"
export CYPRESS_BASE_URL=$PROD_URL

# Verificar si el servidor de producción está accesible
echo "🔍 Verificando acceso a producción..."
if ! curl -s "$PROD_URL" > /dev/null 2>&1; then
    echo "⚠️  No se puede acceder al servidor en $PROD_URL"
    echo "Verifica que el servicio esté desplegado y accesible"
    exit 1
fi

echo "✅ Servidor de producción accesible"
echo "🌐 URL: $PROD_URL"
echo ""

# Opciones de ejecución
case "$1" in
    "--spec"|"-s")
        if [ -n "$2" ]; then
            echo "🎯 Ejecutando test específico en PRODUCCIÓN: $2"
            npx cypress run --spec "cypress/e2e/$2" --config baseUrl=$PROD_URL
        else
            echo "❌ Por favor especifica el archivo de test"
            echo "Ejemplo: ./run-tests-prod.sh --spec 05-tasks.cy.js"
        fi
        ;;
    "--issues"|"-i")
        echo "🐛 Ejecutando tests de problemas reportados en PRODUCCIÓN..."
        npx cypress run --spec "cypress/e2e/07-reported-issues.cy.js" --config baseUrl=$PROD_URL
        ;;
    "--tasks"|"-t")
        echo "📋 Ejecutando tests de gestión de tareas en PRODUCCIÓN..."
        npx cypress run --spec "cypress/e2e/05-tasks.cy.js" --config baseUrl=$PROD_URL
        ;;
    "--journey"|"-j")
        echo "🚀 Ejecutando flujo completo del sistema en PRODUCCIÓN..."
        npx cypress run --spec "cypress/e2e/06-full-journey.cy.js" --config baseUrl=$PROD_URL
        ;;
    "--smoke"|"-sm")
        echo "💨 Ejecutando smoke tests en PRODUCCIÓN..."
        echo "  • Setup inicial"
        echo "  • Navegación básica"
        echo "  • Flujo principal"
        npx cypress run --spec "cypress/e2e/00-setup.cy.js,cypress/e2e/01-navigation.cy.js,cypress/e2e/06-full-journey.cy.js" --config baseUrl=$PROD_URL
        ;;
    "--critical"|"-c")
        echo "🚨 Ejecutando tests críticos en PRODUCCIÓN..."
        echo "  • Inventario"
        echo "  • Impactos"
        echo "  • Integración"
        npx cypress run --spec "cypress/e2e/02-inventory.cy.js,cypress/e2e/03-impacts.cy.js,cypress/e2e/04-integration.cy.js" --config baseUrl=$PROD_URL
        ;;
    "--all"|"-a")
        echo "🤖 Ejecutando TODAS las pruebas en PRODUCCIÓN..."
        ./run-tests.sh
        ;;
    "--help")
        echo "Uso: ./run-tests-prod.sh [opción]"
        echo ""
        echo "Opciones:"
        echo "  --spec, -s <file>  Ejecutar un test específico"
        echo "  --issues, -i       Ejecutar tests de problemas reportados"
        echo "  --tasks, -t        Ejecutar tests de gestión de tareas"
        echo "  --journey, -j      Ejecutar flujo completo del sistema"
        echo "  --smoke, -sm       Ejecutar smoke tests (básicos)"
        echo "  --critical, -c     Ejecutar tests críticos"
        echo "  --all, -a          Ejecutar todas las pruebas"
        echo "  --help             Mostrar esta ayuda"
        echo ""
        echo "URL de producción: $PROD_URL"
        ;;
    *)
        echo "🔥 Ejecutando smoke tests por defecto..."
        echo ""
        echo "Para ejecutar todos los tests usa: ./run-tests-prod.sh --all"
        echo ""
        npx cypress run --spec "cypress/e2e/00-setup.cy.js,cypress/e2e/01-navigation.cy.js,cypress/e2e/06-full-journey.cy.js" --config baseUrl=$PROD_URL
        ;;
esac

# Mostrar resumen al finalizar
if [ "$1" != "--help" ]; then
    echo ""
    echo "📊 Resultados de tests en PRODUCCIÓN:"
    echo "  • URL testeada: $PROD_URL"
    echo "  • Videos: cypress/videos/"
    echo "  • Screenshots: cypress/screenshots/"
    echo ""
    echo "⚠️  Nota: Los tests en producción pueden afectar datos reales"
fi