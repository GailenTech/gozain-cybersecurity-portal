#!/bin/bash

# Script para probar completamente el sistema Gozain nuevo

echo "🧪 Probando sistema Gozain completo..."

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Probar servidor local
echo -e "${YELLOW}1️⃣ Iniciando servidor local...${NC}"
./test_local.sh &
LOCAL_PID=$!
sleep 10

# 2. Probar endpoints básicos
echo -e "${YELLOW}2️⃣ Probando endpoints básicos...${NC}"

# Página principal
if curl -s http://localhost:8080 | grep -q "Gozain"; then
    echo -e "  ✅ Página principal OK"
else
    echo -e "  ${RED}❌ Error en página principal${NC}"
    kill $LOCAL_PID
    exit 1
fi

# API organizaciones
if curl -s http://localhost:8080/api/organizaciones | grep -q "\["; then
    echo -e "  ✅ API organizaciones OK"
else
    echo -e "  ${RED}❌ Error en API organizaciones${NC}"
    kill $LOCAL_PID
    exit 1
fi

# API debug (solo local)
if curl -s http://localhost:8080/api/debug/gcs | grep -q "use_gcs"; then
    echo -e "  ✅ API debug OK"
else
    echo -e "  ${RED}❌ Error en API debug${NC}"
    kill $LOCAL_PID
    exit 1
fi

# 3. Ejecutar test de Cypress
echo -e "${YELLOW}3️⃣ Ejecutando test de Cypress...${NC}"
npx cypress run --spec "cypress/e2e/00-setup.cy.js" --headless --quiet

if [ $? -eq 0 ]; then
    echo -e "  ✅ Tests de Cypress OK"
else
    echo -e "  ${RED}❌ Error en tests de Cypress${NC}"
    kill $LOCAL_PID
    exit 1
fi

# 4. Detener servidor
echo -e "${YELLOW}4️⃣ Deteniendo servidor local...${NC}"
kill $LOCAL_PID
wait $LOCAL_PID 2>/dev/null

# 5. Probar producción
echo -e "${YELLOW}5️⃣ Probando sistema en producción...${NC}"

# Probar página principal en producción
if curl -s https://gozain-687354193398.us-central1.run.app | grep -q "Gozain"; then
    echo -e "  ✅ Producción OK"
else
    echo -e "  ${RED}❌ Error en producción${NC}"
    exit 1
fi

echo
echo -e "${GREEN}✅ Todos los tests pasaron correctamente${NC}"
echo -e "${GREEN}🎉 Sistema Gozain funcionando en local y producción${NC}"