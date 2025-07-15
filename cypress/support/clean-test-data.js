/**
 * Limpieza de datos de prueba antes de ejecutar tests E2E
 */

const { exec } = require('child_process');
const path = require('path');
const { copyTestData } = require('./copy-test-data');

function cleanTestData() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../../claude_tools/limpiar_datos_e2e.py');
    
    console.log('🧹 Limpiando datos de prueba E2E...');
    
    exec(`python3 ${scriptPath} --force`, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error limpiando datos:', error);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error('⚠️ Advertencias:', stderr);
      }
      
      console.log(stdout);
      console.log('✅ Datos de prueba limpiados');
      
      // Después de limpiar, copiar datos de prueba
      console.log('\n📋 Preparando datos de prueba...');
      const copied = copyTestData();
      
      if (copied) {
        resolve();
      } else {
        reject(new Error('Error copiando datos de prueba'));
      }
    });
  });
}

// Exportar para usar en otros lugares
module.exports = { cleanTestData };

// Si se ejecuta directamente
if (require.main === module) {
  cleanTestData()
    .then(() => {
      console.log('\n✅ Entorno de pruebas listo');
      process.exit(0);
    })
    .catch(() => process.exit(1));
}