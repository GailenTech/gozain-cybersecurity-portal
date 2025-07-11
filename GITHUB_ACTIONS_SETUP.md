# Configuración de GitHub Actions para Gozain

## Requisitos Previos

1. **Cuenta de Servicio GCP**: Necesitas crear una cuenta de servicio en Google Cloud con los siguientes permisos:
   - Cloud Run Admin
   - Service Account User
   - Storage Admin (si usas Cloud Storage)
   - Artifact Registry Writer

2. **Secrets en GitHub**: Configura los siguientes secrets en el repositorio:
   - `GCP_SA_KEY`: Contenido JSON de la clave de la cuenta de servicio

3. **Variables en GitHub** (opcional):
   - `SLACK_WEBHOOK_URL`: URL del webhook de Slack para notificaciones

## Crear Cuenta de Servicio GCP

```bash
# Definir variables
PROJECT_ID="inventario-iso27001-20250708"
SA_NAME="github-actions-deployer"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Crear cuenta de servicio
gcloud iam service-accounts create ${SA_NAME} \
    --display-name="GitHub Actions Deployer" \
    --project=${PROJECT_ID}

# Asignar roles necesarios
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/cloudbuild.builds.editor"

# Crear y descargar clave
gcloud iam service-accounts keys create key.json \
    --iam-account=${SA_EMAIL} \
    --project=${PROJECT_ID}

# El contenido de key.json debe agregarse como secret GCP_SA_KEY en GitHub
```

## Configurar Secrets en GitHub

1. Ve a Settings → Secrets and variables → Actions
2. Crea un nuevo secret llamado `GCP_SA_KEY`
3. Pega el contenido completo del archivo `key.json`

## Workflow de Despliegue

El workflow `.github/workflows/deploy-gcp.yml` realiza:

1. **Actualización de Versión**: Usa el número de build de GitHub Actions
2. **Despliegue a Cloud Run**: Construye y despliega la aplicación
3. **Tests E2E**: Ejecuta pruebas automatizadas después del despliegue

### Flujo de Versiones

- Formato: `MAJOR.MINOR.BUILD_NUMBER`
- El BUILD_NUMBER es el `github.run_number`
- Se actualiza automáticamente en cada despliegue

### Tests E2E Post-Despliegue

Los tests se ejecutan en dos fases:

1. **Setup Test** (`00-test-setup.cy.js`): Crea una organización limpia para pruebas
2. **Critical Path Tests**: Valida funcionalidades principales
   - Inventario de activos
   - Impactos de negocio
   - Madurez en ciberseguridad

## Monitoreo

### En GitHub Actions

- Ve a la pestaña Actions del repositorio
- Cada commit a `main` dispara el workflow
- Los resultados de tests se guardan como artifacts

### Logs de Cloud Run

```bash
gcloud run services logs read gozain \
    --region=us-central1 \
    --project=${PROJECT_ID}
```

## Troubleshooting

### Error: Permission denied

Verifica que la cuenta de servicio tenga todos los permisos necesarios:

```bash
gcloud projects get-iam-policy ${PROJECT_ID} \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${SA_EMAIL}"
```

### Tests E2E fallan

1. Verifica que la URL del servicio sea correcta
2. Espera suficiente tiempo para que el servicio se estabilice
3. Revisa los artifacts de Cypress para screenshots/videos

### El despliegue falla

1. Verifica que las APIs estén habilitadas:
   ```bash
   gcloud services list --enabled --project=${PROJECT_ID}
   ```

2. Verifica la cuota de Cloud Run en tu proyecto

## Mejoras Futuras

- [ ] Agregar ambientes staging/production
- [ ] Implementar rollback automático si fallan tests
- [ ] Agregar más tests E2E para nuevas funcionalidades
- [ ] Implementar cache de Docker para builds más rápidos