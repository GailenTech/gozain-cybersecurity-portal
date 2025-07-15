/**
 * Script para copiar datos de prueba precargados
 * Copia datos desde fixtures a la carpeta data
 */

const fs = require('fs');
const path = require('path');

const TEST_ORG_ID = 'e2e_test_organization';
const FIXTURES_PATH = path.join(__dirname, '../fixtures/test-data', TEST_ORG_ID);
const DATA_PATH = path.join(__dirname, '../../data', TEST_ORG_ID);

function copyTestData() {
  console.log('📋 Copiando datos de prueba E2E...');
  
  try {
    // Crear directorio si no existe
    if (!fs.existsSync(DATA_PATH)) {
      fs.mkdirSync(DATA_PATH, { recursive: true });
      console.log(`📁 Creado directorio: ${DATA_PATH}`);
    }
    
    // Copiar archivos de fixtures a data
    const files = fs.readdirSync(FIXTURES_PATH);
    
    files.forEach(file => {
      const sourcePath = path.join(FIXTURES_PATH, file);
      const destPath = path.join(DATA_PATH, file);
      
      // Copiar archivo
      fs.copyFileSync(sourcePath, destPath);
      console.log(`📄 Copiado: ${file}`);
    });
    
    // Actualizar organizaciones.json
    const orgsFile = path.join(__dirname, '../../data/organizaciones.json');
    let organizaciones = [];
    
    if (fs.existsSync(orgsFile)) {
      const content = fs.readFileSync(orgsFile, 'utf-8');
      organizaciones = JSON.parse(content);
    }
    
    // Convertir a array si es un objeto
    let orgsArray = Array.isArray(organizaciones) ? organizaciones : Object.values(organizaciones);
    let orgsObject = Array.isArray(organizaciones) ? {} : organizaciones;
    
    // Si es array, convertir a objeto
    if (Array.isArray(organizaciones)) {
      orgsArray.forEach(org => {
        orgsObject[org.id] = org;
      });
    }
    
    // Verificar si la organización de prueba existe
    const existeOrg = TEST_ORG_ID in orgsObject;
    
    if (!existeOrg) {
      orgsObject[TEST_ORG_ID] = {
        id: TEST_ORG_ID,
        nombre: "E2E Test Organization",
        fecha_creacion: new Date().toISOString(),
        activa: true,
        oauth_config: {
          provider: "google",
          client_id: "test-client-id",
          client_secret: "test-client-secret",
          allowed_domains: ["test.com"],
          require_domain_match: false,
          custom_claims: {}
        },
        seguridad: {
          require_mfa: false,
          session_timeout: 3600,
          ip_whitelist: []
        }
      };
      
      fs.writeFileSync(orgsFile, JSON.stringify(orgsObject, null, 2));
      console.log('📝 Añadida organización de prueba a organizaciones.json');
    }
    
    console.log('✅ Datos de prueba copiados correctamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error copiando datos de prueba:', error);
    return false;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  copyTestData();
}

module.exports = { copyTestData, TEST_ORG_ID };