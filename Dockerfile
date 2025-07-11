# Imagen base Python
FROM python:3.9-slim

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de requerimientos
COPY requirements.txt .

# Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el código de la aplicación
COPY . .

# Crear directorios necesarios
RUN mkdir -p /app/data /app/uploads

# Inicializar organizaciones por defecto
RUN echo '[{"id": "demo", "nombre": "Organización Demo", "fecha_creacion": "2025-01-01T00:00:00", "activa": true}]' > /app/data/organizaciones.json

# Exponer puerto
EXPOSE 8080

# Variables de entorno para producción
ENV PORT=8080
ENV USE_GCS=true
ENV GCS_BUCKET_NAME=inventario-iso27001-data

# Comando para ejecutar la aplicación desde el directorio backend
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "4", "--timeout", "120", "--chdir", "/app/backend", "app:app"]