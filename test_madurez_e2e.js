const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Iniciando prueba del módulo de Madurez...\n');

    // 1. Navegar a la aplicación
    console.log('1. Navegando a http://localhost:8080...');
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
    
    // 2. Verificar que la página cargó
    const title = await page.title();
    console.log(`   ✓ Página cargada: ${title}`);

    // 3. Buscar el módulo de Madurez en la navegación
    console.log('\n2. Buscando módulo de Madurez...');
    
    // Primero, veamos qué elementos de navegación existen
    const navItems = await page.$$eval('.nav-link, .dropdown-item, [href*="madurez"], button', elements => 
      elements.map(el => ({
        text: el.textContent.trim(),
        href: el.href || 'No href',
        tagName: el.tagName,
        classes: el.className
      }))
    );
    
    console.log('   Elementos de navegación encontrados:');
    navItems.forEach(item => {
      console.log(`   - ${item.tagName}: "${item.text}" (${item.href})`);
    });

    // 4. Intentar diferentes formas de acceder al módulo
    console.log('\n3. Intentando acceder al módulo de Madurez...');
    
    // Opción 1: Link directo
    const madurezLink = await page.$('a[href*="madurez"], a:has-text("Madurez"), a:has-text("Evaluaciones")');
    if (madurezLink) {
      console.log('   ✓ Encontrado link de Madurez');
      await madurezLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      // Opción 2: Menú dropdown
      const dropdown = await page.$('.dropdown-toggle:has-text("Módulos"), .dropdown-toggle:has-text("Aplicaciones")');
      if (dropdown) {
        console.log('   ✓ Encontrado menú dropdown');
        await dropdown.click();
        await page.waitForTimeout(500);
        
        const dropdownItem = await page.$('.dropdown-item:has-text("Madurez"), .dropdown-item:has-text("Evaluaciones")');
        if (dropdownItem) {
          await dropdownItem.click();
          await page.waitForLoadState('networkidle');
        }
      }
    }

    // 5. Verificar que estamos en el módulo de Madurez
    console.log('\n4. Verificando acceso al módulo...');
    await page.waitForTimeout(2000); // Esperar que cargue la aplicación
    
    // Verificar URL o contenido
    const currentUrl = page.url();
    console.log(`   URL actual: ${currentUrl}`);
    
    // 6. Verificar contenido del módulo
    console.log('\n5. Verificando contenido del módulo...');
    
    // Buscar elementos específicos de Madurez
    const hasMaturityContent = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('evaluación') || text.includes('madurez') || text.includes('assessment');
    });
    
    console.log(`   ¿Contiene contenido de madurez?: ${hasMaturityContent ? 'Sí' : 'No'}`);

    // 7. Hacer llamada directa a la API para verificar datos
    console.log('\n6. Verificando API de Madurez...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/madurez/assessments', {
          headers: {
            'X-Organization-Id': 'e2e_test_organization'
          }
        });
        const data = await response.json();
        return {
          status: response.status,
          count: Array.isArray(data) ? data.length : 0,
          data: data
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log(`   Estado API: ${apiResponse.status}`);
    console.log(`   Evaluaciones encontradas: ${apiResponse.count}`);
    
    if (apiResponse.count > 0) {
      console.log('   Primeras evaluaciones:');
      apiResponse.data.slice(0, 2).forEach(eval => {
        console.log(`   - ${eval.nombre || 'Sin nombre'} (${eval.estado})`);
      });
    }

    // 8. Tomar screenshot
    await page.screenshot({ path: 'madurez-test.png', fullPage: true });
    console.log('\n✅ Screenshot guardado como madurez-test.png');

    // 9. Listar todos los módulos disponibles
    console.log('\n7. Módulos disponibles en la aplicación:');
    const allModules = await page.evaluate(() => {
      const modules = [];
      // Buscar en diferentes lugares donde podrían estar los módulos
      document.querySelectorAll('[data-module], [data-app], .module-card, .app-card').forEach(el => {
        modules.push(el.textContent.trim());
      });
      return modules;
    });
    
    if (allModules.length > 0) {
      allModules.forEach(mod => console.log(`   - ${mod}`));
    } else {
      console.log('   No se encontraron módulos con los selectores estándar');
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    console.log('\n🏁 Prueba completada. Revisa el screenshot madurez-test.png');
    await browser.close();
  }
})();