#!/bin/bash

# Script para desarrollo local del sistema Gozain

echo "🚀 Iniciando sistema Gozain en modo desarrollo..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 no está instalado${NC}"
    exit 1
fi

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Creando entorno virtual...${NC}"
    python3 -m venv venv
fi

# Activar entorno virtual
echo -e "${YELLOW}🔧 Activando entorno virtual...${NC}"
source venv/bin/activate

# Instalar dependencias
echo -e "${YELLOW}📥 Instalando dependencias...${NC}"
pip install -q -r requirements.txt

# Crear directorios necesarios
mkdir -p data
mkdir -p uploads

# Crear archivo de organizaciones si no existe
if [ ! -f "data/organizaciones.json" ]; then
    echo -e "${YELLOW}📝 Creando organizaciones por defecto...${NC}"
    echo '[
  {
    "id": "demo",
    "nombre": "Organización Demo",
    "fecha_creacion": "2025-01-01T00:00:00",
    "activa": true
  }
]' > data/organizaciones.json
fi

# Iniciar servidor
echo -e "${GREEN}✅ Iniciando servidor Flask...${NC}"
echo -e "${GREEN}🌐 Accede a: http://localhost:8888${NC}"
echo -e "${YELLOW}💡 Presiona Ctrl+C para detener${NC}"
echo ""

# Ejecutar la aplicación principal (sistema Gozain modular)
cd backend && PORT=8888 python app.py