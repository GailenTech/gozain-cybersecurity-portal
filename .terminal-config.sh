#!/bin/bash
# Script para configurar el entorno completo del proyecto InventarioActivos

# Configurar Google Cloud
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/gcloud/application_default_credentials.json"
export GOOGLE_CLOUD_PROJECT="inventario-iso27001-20250708"

# Configurar título del Terminal
export DISABLE_AUTO_TITLE="true"

# Función para mantener el título
set_persistent_title() {
    echo -ne "\033]0;$1\007"
    if [[ -n "$ZSH_VERSION" ]]; then
        print -Pn "\e]0;$1\a"
    fi
}

# Establecer el título
if [ -n "$1" ]; then
    set_persistent_title "$1"
else
    set_persistent_title "InventarioActivos - Sistema Gozain"
fi

echo "✅ Entorno configurado:"
echo "   - Google Cloud Project: $GOOGLE_CLOUD_PROJECT"
echo "   - Credentials: Configuradas"
echo "   - Título del Terminal: Establecido"