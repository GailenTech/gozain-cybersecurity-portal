#!/bin/bash

# Script que prueba la aplicación antes de desplegar

echo "🚀 Iniciando proceso de prueba y despliegue..."
echo "=================================================="

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Incrementar versión
echo -e "${YELLOW}📝 Incrementando versión...${NC}"
python3 claude_tools/increment_version.py

# 2. Iniciar servidor local en background
echo -e "${YELLOW}🔧 Iniciando servidor local...${NC}"
./test_local.sh > test_server.log 2>&1 &
SERVER_PID=$!

# Esperar a que el servidor esté listo
echo "⏳ Esperando que el servidor inicie..."
sleep 5

# Verificar que el servidor está corriendo
if ! curl -s http://localhost:8080 > /dev/null; then
    echo -e "${RED}❌ El servidor no se inició correctamente${NC}"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ Servidor local iniciado${NC}"

# 3. Ejecutar pruebas automáticas
echo -e "${YELLOW}🧪 Ejecutando pruebas automáticas...${NC}"

# Ejecutar verificación estática
python3 claude_tools/pre_deploy_check.py
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Falló la verificación estática${NC}"
    kill $SERVER_PID
    exit 1
fi

# Ejecutar pruebas funcionales
python3 claude_tools/test_funcionalidades.py
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Fallaron las pruebas funcionales${NC}"
    kill $SERVER_PID
    exit 1
fi

# 4. Pruebas de navegación básicas con curl
echo -e "${YELLOW}🔍 Probando endpoints básicos...${NC}"

# Probar página principal
if curl -s http://localhost:8080 | grep -q "Gozain"; then
    echo "  ✅ Página principal OK"
else
    echo -e "  ${RED}❌ Error en página principal${NC}"
    kill $SERVER_PID
    exit 1
fi

# Probar API organizaciones
if curl -s http://localhost:8080/api/organizaciones | grep -q "\["; then
    echo "  ✅ API organizaciones OK"
else
    echo -e "  ${RED}❌ Error en API organizaciones${NC}"
    kill $SERVER_PID
    exit 1
fi

# Probar archivo de versión
if curl -s http://localhost:8080/version.json | grep -q "version"; then
    echo "  ✅ Archivo de versión OK"
else
    echo -e "  ${RED}❌ Error en archivo de versión${NC}"
    kill $SERVER_PID
    exit 1
fi

# 5. Detener servidor local
echo -e "${YELLOW}🛑 Deteniendo servidor local...${NC}"
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null

# 6. Preguntar si continuar con el despliegue
echo
echo -e "${YELLOW}❓ ¿Todas las pruebas pasaron. Deseas continuar con el despliegue? (s/n)${NC}"
read -r respuesta

if [[ ! "$respuesta" =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}⚠️  Despliegue cancelado por el usuario${NC}"
    exit 0
fi

# 7. Hacer commit con la nueva versión
echo -e "${YELLOW}📦 Creando commit...${NC}"
VERSION=$(cat version.json | grep version | cut -d'"' -f4)
git add -A
git commit -m "Deploy versión $VERSION

- Versión probada localmente
- Todas las pruebas pasaron

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 8. Desplegar
echo -e "${YELLOW}🚀 Desplegando a producción...${NC}"
./deploy_gcp.sh

echo
echo -e "${GREEN}✅ Proceso completado${NC}"