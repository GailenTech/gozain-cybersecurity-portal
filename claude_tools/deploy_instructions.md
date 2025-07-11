# Deployment Instructions for Gozain with GCS Support

Since we cannot run gcloud directly, please follow these steps to deploy:

## 1. Build and Push Docker Image

```bash
# In the project directory
cd /Volumes/DevelopmentProjects/Claude/InventarioActivos

# Build the Docker image
docker build -t gcr.io/gozain-suite-iso27001/gozain:latest .

# Push to Google Container Registry
docker push gcr.io/gozain-suite-iso27001/gozain:latest
```

## 2. Deploy to Cloud Run

```bash
gcloud run deploy gozain \
  --image gcr.io/gozain-suite-iso27001/gozain:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "USE_GCS=true,GCS_BUCKET_NAME=inventario-iso27001-data" \
  --service-account gozain-gcs@gozain-suite-iso27001.iam.gserviceaccount.com \
  --project gozain-suite-iso27001
```

## 3. Current Status

- ✅ Backend updated to support GCS storage
- ✅ Organizations cleaned up in GCS (3 organizations)
- ✅ Inventory data uploaded for all organizations
- ✅ Environment variables configured in Dockerfile
- ✅ Google Cloud Storage dependency added

## 4. Data Summary

Current data in GCS:
- Gailen: 1 asset
- Haiko: 1 asset  
- Superventas: 73 assets

Total: 75 assets across 3 organizations

## 5. Important Notes

- The backend will use GCS when USE_GCS=true is set
- Organizations are stored in `organizaciones.json` in GCS
- Inventory files are named `inventario_<org_id>.json` in GCS
- The service account needs Storage Object Admin permission on the bucket