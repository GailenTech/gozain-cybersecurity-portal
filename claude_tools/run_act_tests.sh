#!/bin/bash

echo "🧪 Ejecutando tests con act..."
echo "============================="

# Configurar evento de push para la rama actual
cat > push-event.json << EOF
{
  "push": {
    "ref": "refs/heads/refactor/inventario-dashboard-lista",
    "repository": {
      "name": "InventarioActivos",
      "full_name": "user/InventarioActivos"
    }
  }
}
EOF

# Ejecutar con act
act push -W .github/workflows/cypress-tests-optimized.yml \
    -e push-event.json \
    --artifact-server-path /tmp/artifacts \
    --container-architecture linux/amd64 \
    -P ubuntu-latest=catthehacker/ubuntu:act-latest

# Limpiar
rm -f push-event.json