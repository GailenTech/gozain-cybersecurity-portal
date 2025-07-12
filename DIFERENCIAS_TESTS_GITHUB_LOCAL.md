# Diferencias entre Tests en GitHub y Local

## 🔍 Resumen de Diferencias

### 1. **Entorno de Ejecución**

| Aspecto | Local | GitHub Actions |
|---------|-------|----------------|
| **URL Base** | http://localhost:5001 | https://gozain-687354193398.us-central1.run.app |
| **Base de Datos** | Archivos JSON locales | Archivos JSON en producción |
| **Sistema Operativo** | macOS (tu máquina) | Ubuntu (Linux) |
| **Navegadores** | El que uses localmente | Chrome y Firefox en CI |

### 2. **Archivos de Test Ejecutados**

**GitHub Actions ejecuta un subconjunto específico:**
```yaml
# Tests ejecutados en deploy-gcp.yml:
- cypress/e2e/00-test-setup.cy.js (setup inicial)
- cypress/e2e/02-inventory.cy.js
- cypress/e2e/03-impacts.cy.js
- cypress/e2e/11-maturity-simple-test.cy.js
- cypress/e2e/19-all-business-processes.cy.js
```

**Localmente ejecutas todos:**
```bash
# 23 archivos de test en total
cypress/e2e/*.cy.js
```

### 3. **Configuración de Cypress**

**Local (cypress.config.js):**
```javascript
baseUrl: 'http://localhost:5001'
```

**GitHub Actions:**
```javascript
baseUrl: 'https://gozain-687354193398.us-central1.run.app'
```

### 4. **Datos de Prueba**

- **Local**: Crea y modifica datos en `data/e2e_test_organization/`
- **GitHub**: Crea datos en la instancia de producción
- **Persistencia**: Local persiste entre ejecuciones, GitHub puede limpiar

### 5. **Timing y Latencia**

- **Local**: Respuestas instantáneas, sin latencia de red
- **GitHub**: Latencia de red real, timeouts más largos necesarios

### 6. **Manejo de Errores**

GitHub Actions tiene `continue-on-error: true` en algunos tests:
```yaml
- name: Run setup test suite
  continue-on-error: true  # No falla el workflow si falla el setup
```

### 7. **Versiones de Software**

- **Node.js**: GitHub usa v18 específicamente
- **Cypress**: Misma versión (definida en package.json)
- **Chrome/Firefox**: Versiones pueden diferir

## 📋 Checklist para Sincronizar

### Para que los tests pasen igual en ambos entornos:

1. **✅ Actualizar baseUrl en local para pruebas de producción:**
   ```bash
   CYPRESS_BASE_URL=https://gozain-687354193398.us-central1.run.app npm run test:e2e
   ```

2. **✅ Verificar que los datos de prueba existen:**
   - La organización "E2E Test Organization" debe existir
   - Los datos iniciales deben estar configurados

3. **✅ Ajustar timeouts para producción:**
   - Aumentar waits en tests que fallan por timing
   - Considerar latencia de red

4. **✅ Ejecutar solo los tests críticos localmente:**
   ```bash
   npx cypress run --spec "cypress/e2e/02-inventory.cy.js,cypress/e2e/03-impacts.cy.js"
   ```

## 🚨 Problemas Comunes

1. **Tests pasan local pero fallan en GitHub:**
   - Datos no inicializados en producción
   - Timeouts muy cortos para latencia real
   - Diferencias en el estado de la base de datos

2. **Tests fallan local pero pasan en GitHub:**
   - GitHub ejecuta menos tests (subconjunto)
   - `continue-on-error` oculta fallos
   - Datos locales corruptos o inconsistentes

## 🎯 Recomendaciones

1. **Desarrollo**: Usa entorno local para desarrollo rápido
2. **Validación**: Ejecuta contra producción antes de push
3. **CI/CD**: Confía en GitHub Actions como fuente de verdad
4. **Debugging**: Usa artifacts (screenshots/videos) de GitHub

## 📊 Estado Actual

- **GitHub Actions**: Ejecuta 5 tests críticos después del deploy
- **Local**: Tienes 23 tests disponibles
- **Objetivo**: 100% de tests pasando en ambos entornos