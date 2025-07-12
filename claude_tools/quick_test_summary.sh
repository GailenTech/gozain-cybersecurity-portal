#\!/bin/bash

echo "🔍 Revisión rápida del estado de tests..."
echo "========================================"

# Array de archivos de test
test_files=(
    "00-setup.cy.js"
    "00-test-setup.cy.js"
    "01-navigation.cy.js"
    "01-navigation-fixed.cy.js"
    "02-inventory.cy.js"
    "03-impacts.cy.js"
    "04-integration.cy.js"
    "05-tasks.cy.js"
    "06-full-journey.cy.js"
    "07-reported-issues.cy.js"
    "07-tasks-issues-simple.cy.js"
    "08-tasks-advanced.cy.js"
    "09-maturity-module.cy.js"
    "10-navigation-between-modules.cy.js"
    "11-maturity-simple-test.cy.js"
    "12-maturity-navigation-fix-validation.cy.js"
    "13-maturity-navigation-final-check.cy.js"
    "14-business-processes-personal.cy.js"
    "15-business-processes-software.cy.js"
    "16-business-processes-hardware.cy.js"
    "17-business-processes-third-party.cy.js"
    "18-business-processes-physical.cy.js"
    "19-business-processes-cloud.cy.js"
)

echo "📊 Archivos conocidos hasta ahora:"
echo ""

passing=0
failing=0
unknown=0

# Basado en ejecuciones previas
for file in "${test_files[@]}"; do
    case $file in
        "00-setup.cy.js"|"00-test-setup.cy.js"|"01-navigation.cy.js"|"01-navigation-fixed.cy.js"|"02-inventory.cy.js"|"03-impacts.cy.js")
            echo "✅ $file - 100% PASANDO"
            ((passing++))
            ;;
        "04-integration.cy.js"|"05-tasks.cy.js"|"06-full-journey.cy.js")
            echo "⚠️  $file - PARCIAL (necesita arreglos)"
            ((failing++))
            ;;
        "14-business-processes-personal.cy.js"|"15-business-processes-software.cy.js"|"16-business-processes-hardware.cy.js"|"17-business-processes-third-party.cy.js"|"18-business-processes-physical.cy.js"|"19-business-processes-cloud.cy.js")
            echo "❌ $file - FALLANDO (procesos no existen)"
            ((failing++))
            ;;
        *)
            echo "❓ $file - Estado desconocido"
            ((unknown++))
            ;;
    esac
done

echo ""
echo "📈 RESUMEN:"
echo "- Archivos 100% funcionales: $passing"
echo "- Archivos con problemas: $failing"
echo "- Archivos por verificar: $unknown"
echo ""
echo "🎯 Para alcanzar 100%, necesitamos arreglar $((failing + unknown)) archivos más"
