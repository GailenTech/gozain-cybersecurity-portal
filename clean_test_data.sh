#!/bin/bash

# Script para limpiar datos de prueba E2E

echo "🧹 Limpiando datos de prueba E2E..."

# Activar entorno virtual si existe
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Ejecutar script de limpieza
python claude_tools/limpiar_datos_e2e.py --force

echo "✅ Limpieza completada"