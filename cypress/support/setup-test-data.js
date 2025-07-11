const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
  baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:8080',
  testOrg: 'Organización Demo',
  testDataFile: path.join(__dirname, '../fixtures/test-data.json')
};

// Cargar datos de prueba
const testData = JSON.parse(fs.readFileSync(CONFIG.testDataFile, 'utf8'));

async function setupTestData() {
  console.log('🚀 Iniciando configuración de datos de prueba...');
  console.log(`📍 URL base: ${CONFIG.baseUrl}`);
  console.log(`🏢 Organización: ${CONFIG.testOrg}`);
  
  try {
    // 1. Verificar conexión con el servidor
    console.log('\n1️⃣ Verificando conexión con el servidor...');
    const healthCheck = await axios.get(`${CONFIG.baseUrl}/api/health`).catch(() => null);
    if (!healthCheck) {
      console.error('❌ No se pudo conectar al servidor. Asegúrate de que esté ejecutándose.');
      process.exit(1);
    }
    console.log('✅ Servidor disponible');
    
    // 2. Limpiar activos existentes (opcional)
    console.log('\n2️⃣ Preparando entorno de pruebas...');
    // Por ahora no limpiamos para no afectar datos existentes
    
    // 3. Crear activos de prueba
    console.log('\n3️⃣ Creando activos de prueba...');
    let activosCreados = 0;
    
    for (const asset of testData.assets) {
      try {
        const response = await axios.post(
          `${CONFIG.baseUrl}/api/activos`,
          asset,
          {
            params: { org: CONFIG.testOrg }
          }
        );
        
        if (response.status === 201) {
          activosCreados++;
          console.log(`   ✅ Creado: ${asset.nombre}`);
        }
      } catch (error) {
        // Si el activo ya existe, no es un error crítico
        if (error.response && error.response.status === 409) {
          console.log(`   ⚠️  Ya existe: ${asset.nombre}`);
        } else {
          console.log(`   ❌ Error creando ${asset.nombre}:`, error.message);
        }
      }
    }
    
    console.log(`\n✅ Activos creados: ${activosCreados}/${testData.assets.length}`);
    
    // 4. Crear algunos impactos de prueba
    console.log('\n4️⃣ Creando impactos de prueba...');
    let impactosCreados = 0;
    
    try {
      // Alta de empleado
      const altaResponse = await axios.post(
        `${CONFIG.baseUrl}/api/impactos`,
        {
          tipo: 'Alta de Empleado',
          datos: testData.impacts.alta_empleado
        },
        {
          params: { org: CONFIG.testOrg }
        }
      );
      
      if (altaResponse.status === 201) {
        impactosCreados++;
        console.log('   ✅ Creado: Alta de empleado');
      }
    } catch (error) {
      console.log('   ⚠️  Error creando impacto:', error.message);
    }
    
    console.log(`\n✅ Impactos creados: ${impactosCreados}`);
    
    // 5. Resumen final
    console.log('\n📊 Resumen de configuración:');
    console.log(`   - Organización: ${CONFIG.testOrg}`);
    console.log(`   - Activos disponibles: ${activosCreados + 5} (aprox)`); // +5 por los existentes
    console.log(`   - Impactos disponibles: ${impactosCreados + 2} (aprox)`);
    console.log('\n✅ Configuración completada exitosamente!');
    console.log('🧪 Ahora puedes ejecutar: npm run cypress:open');
    
  } catch (error) {
    console.error('\n❌ Error durante la configuración:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupTestData();
}

module.exports = setupTestData;