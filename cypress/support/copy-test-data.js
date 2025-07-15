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
    
    // Verificar si la organización de prueba existe
    const existeOrg = organizaciones.some(org => org.id === TEST_ORG_ID);
    
    if (!existeOrg) {
      organizaciones.push({
        id: TEST_ORG_ID,
        nombre: "E2E Test Organization",
        fecha_creacion: new Date().toISOString(),
        activa: true
      });
      
      fs.writeFileSync(orgsFile, JSON.stringify(organizaciones, null, 2));
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