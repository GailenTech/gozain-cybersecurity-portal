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
      return config;
    },
  },
})