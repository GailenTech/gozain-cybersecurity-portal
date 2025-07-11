#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import logging
from google.cloud import storage
from google.cloud.exceptions import NotFound

logger = logging.getLogger(__name__)

class GCSStorageService:
    def __init__(self, bucket_name=None):
        self.bucket_name = bucket_name or os.environ.get('GCS_BUCKET_NAME', 'inventario-iso27001-data')
        try:
            self.client = storage.Client()
            self.bucket = self.client.bucket(self.bucket_name)
            logger.info(f"GCS Storage initialized with bucket: {self.bucket_name}")
        except Exception as e:
            logger.error(f"Error initializing GCS: {e}")
            self.client = None
            self.bucket = None
    
    def leer_archivo(self, filename):
        """Lee un archivo JSON desde GCS"""
        if not self.bucket:
            logger.error("GCS bucket not initialized")
            return None
            
        try:
            blob = self.bucket.blob(filename)
            if blob.exists():
                content = blob.download_as_text()
                return json.loads(content)
            logger.info(f"File {filename} not found in GCS")
            return None
        except Exception as e:
            logger.error(f"Error reading {filename} from GCS: {e}")
            return None
    
    def escribir_archivo(self, filename, data):
        """Escribe un archivo JSON a GCS"""
        if not self.bucket:
            logger.error("GCS bucket not initialized")
            return False
            
        try:
            blob = self.bucket.blob(filename)
            blob.upload_from_string(
                json.dumps(data, ensure_ascii=False, indent=2),
                content_type='application/json'
            )
            logger.info(f"Successfully wrote {filename} to GCS")
            return True
        except Exception as e:
            logger.error(f"Error writing {filename} to GCS: {e}")
            return False
    
    def archivo_existe(self, filename):
        """Verifica si un archivo existe en GCS"""
        if not self.bucket:
            return False
            
        try:
            blob = self.bucket.blob(filename)
            return blob.exists()
        except Exception as e:
            logger.error(f"Error checking if {filename} exists: {e}")
            return False
    
    def listar_archivos(self, prefix=None):
        """Lista archivos en el bucket con un prefijo opcional"""
        if not self.bucket:
            return []
            
        try:
            blobs = self.bucket.list_blobs(prefix=prefix)
            return [blob.name for blob in blobs]
        except Exception as e:
            logger.error(f"Error listing files: {e}")
            return []