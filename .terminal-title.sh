#!/bin/bash
# Script para establecer el título del Terminal
# Uso: ./.terminal-title.sh [título personalizado]

if [ -n "$1" ]; then
    # Si se proporciona un argumento, usar ese título
    echo -n -e "\033]0;$1\007"
else
    # Si no, usar el título por defecto
    echo -n -e "\033]0;InventarioActivos - Sistema Gozain\007"
fi