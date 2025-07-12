const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      // Organización de pruebas
      TEST_ORG_ID: 'demo',
      TEST_ORG_NAME: 'Organización Demo',
      // URLs de producción para pruebas opcionales
      PROD_URL: 'https://gozain-h556ekexqa-uc.a.run.app'
    },
    setupNodeEvents(on, config) {
      // Allow overriding baseUrl from environment
      if (config.env.baseUrl) {
        config.baseUrl = config.env.baseUrl;
      }
      
      // Configuración específica para CI
      if (process.env.CI || config.baseUrl.includes('run.app')) {
        console.log('🤖 Detectado entorno CI - aplicando configuración especial')
        
        // Timeouts más largos para CI (pero no excesivos)
        config.defaultCommandTimeout = 15000  // Reducido de 20000
        config.pageLoadTimeout = 20000       // Reducido de 30000
        config.requestTimeout = 10000        // Reducido de 15000
        config.responseTimeout = 10000       // Reducido de 15000
        
        // Viewport más grande para evitar problemas de elementos ocultos
        config.viewportWidth = 1920
        config.viewportHeight = 1080
        
        // Reintentos automáticos
        config.retries = {
          runMode: 2,
          openMode: 0
        }
        
        // Variables de entorno para CI
        config.env.CI = true
        
        // Deshabilitar animaciones
        config.env.ANIMATION_DISTANCE_THRESHOLD = 999999
      }
      
      return config;
    },
  },
})