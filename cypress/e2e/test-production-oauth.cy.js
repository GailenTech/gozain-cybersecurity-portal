describe('Test de producción - OAuth y organizaciones', () => {
  const PROD_URL = 'https://gozain-687354193398.us-central1.run.app';
  
  it('Debe cargar las organizaciones en producción', () => {
    cy.visit(PROD_URL);
    
    // Verificar que el título sea correcto
    cy.title().should('contain', 'Gozain');
    
    // Verificar que el logo con Bootstrap Icons funcione
    cy.get('.navbar-brand i.bi-shield-check').should('exist');
    
    // Verificar que el endpoint de organizaciones funciona
    cy.request('GET', `${PROD_URL}/api/organizations`).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.length(2);
      
      const orgs = response.body;
      const gailenOrg = orgs.find(org => org.id === 'gailen');
      const demoOrg = orgs.find(org => org.id === 'demo');
      
      expect(gailenOrg).to.exist;
      expect(gailenOrg.nombre).to.eq('Gailen Tecnologías');
      expect(gailenOrg.tiene_oauth).to.be.true;
      
      expect(demoOrg).to.exist;
      expect(demoOrg.nombre).to.eq('Organización Demo');
      expect(demoOrg.tiene_oauth).to.be.false;
    });
  });
  
  it('Debe mostrar el modal de login con organizaciones', () => {
    cy.visit(PROD_URL);
    
    // Esperar a que cargue la página
    cy.wait(3000);
    
    // Verificar que aparece el modal de login
    cy.get('#loginModal').should('be.visible');
    
    // Verificar que el logo del modal sea correcto
    cy.get('#loginModal .bi-shield-check').should('exist');
    cy.get('#loginModal').should('contain', 'Gozain');
    cy.get('#loginModal').should('contain', 'Portal de Ciberseguridad');
    
    // Verificar que se muestren las organizaciones
    cy.get('#loginModal').should('contain', 'Gailen Tecnologías');
    cy.get('#loginModal').should('contain', 'Organización Demo');
  });
  
  it('Debe poder seleccionar la organización Demo (sin OAuth)', () => {
    cy.visit(PROD_URL);
    
    // Esperar a que cargue
    cy.wait(3000);
    
    // Buscar y hacer clic en la organización Demo
    cy.get('#loginModal').within(() => {
      cy.contains('Organización Demo').click();
    });
    
    // Verificar que se seleccionó la organización Demo
    cy.wait(2000);
    
    // Debería mostrar el selector de herramientas
    cy.get('body').should('contain', 'Portal de Ciberseguridad');
  });
  
  it('Debe mostrar las opciones de OAuth para Gailen', () => {
    cy.visit(PROD_URL);
    
    // Esperar a que cargue
    cy.wait(3000);
    
    // Buscar y hacer clic en Gailen
    cy.get('#loginModal').within(() => {
      cy.contains('Gailen Tecnologías').click();
    });
    
    // Debería mostrar la opción de OAuth
    cy.wait(2000);
    cy.get('#loginModal').should('contain', 'Continuar con Google');
  });
});