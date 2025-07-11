#!/bin/bash

# Script para ejecutar tests E2E específicos del módulo de madurez
echo "🧪 Ejecutando tests E2E del módulo de Madurez en Ciberseguridad"
echo "================================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurar variables
PRODUCTION_URL="https://gozain-687354193398.us-central1.run.app"
LOCAL_URL="http://localhost:8080"

# Función para verificar si el servidor está corriendo
check_server() {
    local url=$1
    echo -e "${YELLOW}🔍 Verificando disponibilidad del servidor en $url${NC}"
    
    if curl -s --head --fail "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Servidor disponible${NC}"
        return 0
    else
        echo -e "${RED}❌ Servidor no disponible${NC}"
        return 1
    fi
}

# Función para ejecutar tests
run_tests() {
    local base_url=$1
    local environment=$2
    
    echo -e "${YELLOW}🚀 Ejecutando tests en $environment ($base_url)${NC}"
    
    # Ejecutar solo los tests del módulo de madurez
    npx cypress run \
        --config baseUrl="$base_url" \
        --spec "cypress/e2e/00-setup.cy.js,cypress/e2e/09-maturity-module.cy.js,cypress/e2e/10-maturity-questionnaire-navigation.cy.js" \
        --browser chrome \
        --reporter spec
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ Tests completados exitosamente en $environment${NC}"
    else
        echo -e "${RED}❌ Tests fallaron en $environment${NC}"
    fi
    
    return $exit_code
}

# Función principal
main() {
    echo -e "${YELLOW}📋 Opciones disponibles:${NC}"
    echo "1. Ejecutar tests en producción"
    echo "2. Ejecutar tests en local (requiere servidor corriendo)"
    echo "3. Ejecutar ambos"
    echo "4. Solo abrir Cypress UI"
    
    read -p "Selecciona una opción (1-4): " option
    
    case $option in
        1)
            echo -e "${YELLOW}🌐 Ejecutando tests en PRODUCCIÓN${NC}"
            if check_server "$PRODUCTION_URL"; then
                run_tests "$PRODUCTION_URL" "PRODUCCIÓN"
            else
                echo -e "${RED}❌ No se puede acceder al servidor de producción${NC}"
                exit 1
            fi
            ;;
        2)
            echo -e "${YELLOW}🏠 Ejecutando tests en LOCAL${NC}"
            if check_server "$LOCAL_URL"; then
                run_tests "$LOCAL_URL" "LOCAL"
            else
                echo -e "${RED}❌ Servidor local no está corriendo. Ejecuta './test_local.sh' primero${NC}"
                exit 1
            fi
            ;;
        3)
            echo -e "${YELLOW}🔄 Ejecutando tests en AMBOS entornos${NC}"
            
            # Producción primero
            if check_server "$PRODUCTION_URL"; then
                echo -e "${YELLOW}--- TESTS EN PRODUCCIÓN ---${NC}"
                run_tests "$PRODUCTION_URL" "PRODUCCIÓN"
                prod_result=$?
            else
                echo -e "${RED}❌ Servidor de producción no disponible${NC}"
                prod_result=1
            fi
            
            echo ""
            
            # Local después
            if check_server "$LOCAL_URL"; then
                echo -e "${YELLOW}--- TESTS EN LOCAL ---${NC}"
                run_tests "$LOCAL_URL" "LOCAL"
                local_result=$?
            else
                echo -e "${RED}❌ Servidor local no disponible${NC}"
                local_result=1
            fi
            
            # Resumen
            echo -e "${YELLOW}📊 RESUMEN DE RESULTADOS:${NC}"
            if [ $prod_result -eq 0 ]; then
                echo -e "${GREEN}✅ Producción: ÉXITO${NC}"
            else
                echo -e "${RED}❌ Producción: FALLO${NC}"
            fi
            
            if [ $local_result -eq 0 ]; then
                echo -e "${GREEN}✅ Local: ÉXITO${NC}"
            else
                echo -e "${RED}❌ Local: FALLO${NC}"
            fi
            ;;
        4)
            echo -e "${YELLOW}🖥️  Abriendo Cypress UI${NC}"
            npx cypress open --config baseUrl="$PRODUCTION_URL"
            ;;
        *)
            echo -e "${RED}❌ Opción inválida${NC}"
            exit 1
            ;;
    esac
}

# Verificar que Cypress está instalado
if ! command -v npx cypress &> /dev/null; then
    echo -e "${RED}❌ Cypress no está instalado. Ejecuta 'npm install' primero${NC}"
    exit 1
fi

# Ejecutar función principal
main

echo -e "${YELLOW}🎯 Para ver resultados detallados, revisa los videos en cypress/videos/${NC}"
echo -e "${YELLOW}📸 Screenshots de errores están en cypress/screenshots/${NC}"