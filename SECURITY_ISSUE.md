# Problema de Seguridad - Secretos OAuth en el Historial

## Descripción
Se detectaron secretos OAuth (client_id, client_secret y refresh tokens) en el historial de Git que impiden hacer push al repositorio.

## Archivos Afectados
- `data/organizaciones.json` - Contenía client_id/secret reales de Google OAuth
- `data/sessions.json` - Contenía refresh tokens
- `claude_tools/oauth_credentials*.json` - Archivos con credenciales
- `claude_tools/oauth_setup_summary.md` - Documentación con secretos
- `claude_tools/update_oauth_final.py` - Script con secretos hardcodeados

## Acciones Tomadas
1. Se eliminaron todos los archivos con secretos
2. Se reemplazaron los valores reales con valores de demostración en `organizaciones.json`
3. Se limpió `sessions.json`

## Acciones Pendientes
Para limpiar completamente el historial, se necesita:

### Opción 1: BFG Repo-Cleaner
```bash
# Descargar BFG
java -jar bfg.jar --delete-files oauth_credentials*.json
java -jar bfg.jar --replace-text passwords.txt
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

### Opción 2: Git Filter-Branch
```bash
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch claude_tools/oauth_credentials*.json' \
  --prune-empty --tag-name-filter cat -- --all
```

### Opción 3: Rebase Interactivo
```bash
# Rebase desde antes del primer commit con secretos
git rebase -i 83a205b

# Editar los commits problemáticos para eliminar los secretos
```

## Recomendaciones
1. Usar variables de entorno para secretos OAuth
2. Añadir los archivos sensibles a `.gitignore`
3. Habilitar GitHub Secret Scanning en el repositorio
4. Rotar las credenciales OAuth comprometidas

## Nota Importante
Los secretos OAuth expuestos deben ser revocados y regenerados en Google Cloud Console.