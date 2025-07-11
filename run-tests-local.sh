#!/bin/bash

echo "🧪 Ejecutando pruebas E2E con Cypress (LOCAL)..."
echo "================================================"

# Verificar si el servidor está corriendo
if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "⚠️  El servidor no está corriendo en http://localhost:8080"
    echo "Por favor, ejecuta ./test_local.sh en otra terminal"
    exit 1
fi

echo "✅ Servidor local detectado"
echo ""

# Configuración para entorno local
export CYPRESS_BASE_URL="http://localhost:8080"

# Opciones de ejecución
case "$1" in
    "--headed"|"-h")
        echo "🖥️  Abriendo Cypress en modo interactivo..."
        npx cypress open
        ;;
    "--spec"|"-s")
        if [ -n "$2" ]; then
            echo "🎯 Ejecutando test específico: $2"
            npx cypress run --spec "cypress/e2e/$2"
        else
            echo "❌ Por favor especifica el archivo de test"
            echo "Ejemplo: ./run-tests-local.sh --spec 05-tasks.cy.js"
        fi
        ;;
    "--issues"|"-i")
        echo "🐛 Ejecutando tests de problemas reportados..."
        npx cypress run --spec "cypress/e2e/07-reported-issues.cy.js"
        ;;
    "--tasks"|"-t")
        echo "📋 Ejecutando tests de gestión de tareas..."
        npx cypress run --spec "cypress/e2e/05-tasks.cy.js"
        ;;
    "--journey"|"-j")
        echo "🚀 Ejecutando flujo completo del sistema..."
        npx cypress run --spec "cypress/e2e/06-full-journey.cy.js"
        ;;
    "--all"|"-a")
        echo "🤖 Ejecutando TODAS las pruebas..."
        npx cypress run
        ;;
    "--help")
        echo "Uso: ./run-tests-local.sh [opción]"
        echo ""
        echo "Opciones:"
        echo "  --headed, -h       Abrir Cypress en modo interactivo"
        echo "  --spec, -s <file>  Ejecutar un test específico"
        echo "  --issues, -i       Ejecutar tests de problemas reportados"
        echo "  --tasks, -t        Ejecutar tests de gestión de tareas"
        echo "  --journey, -j      Ejecutar flujo completo del sistema"
        echo "  --all, -a          Ejecutar todas las pruebas"
        echo "  --help             Mostrar esta ayuda"
        echo ""
        echo "Sin opciones: Ejecuta todas las pruebas en modo headless"
        ;;
    *)
        echo "🤖 Ejecutando todas las pruebas en modo headless..."
        echo ""
        echo "Tests a ejecutar:"
        echo "  ✓ 00-setup.cy.js         - Configuración inicial"
        echo "  ✓ 01-navigation.cy.js    - Navegación general"
        echo "  ✓ 02-inventory.cy.js     - Módulo de inventario"
        echo "  ✓ 03-impacts.cy.js       - Módulo de impactos"
        echo "  ✓ 04-integration.cy.js   - Integración entre módulos"
        echo "  ✓ 05-tasks.cy.js         - Gestión de tareas"
        echo "  ✓ 06-full-journey.cy.js  - Flujo completo"
        echo "  ✓ 07-reported-issues.cy.js - Problemas conocidos"
        echo ""
        npx cypress run
        ;;
esac

# Mostrar resumen al finalizar
if [ "$1" != "--headed" ] && [ "$1" != "-h" ] && [ "$1" != "--help" ]; then
    echo ""
    echo "📊 Resultados guardados en:"
    echo "  • Videos: cypress/videos/"
    echo "  • Screenshots: cypress/screenshots/"
    echo "  • Reportes: cypress/results/ (si está configurado)"
fi