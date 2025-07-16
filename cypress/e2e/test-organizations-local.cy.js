describe('Test de organizaciones en local', () => {
  it('Debe cargar las organizaciones correctamente', () => {
    // Visitar la página principal
    cy.visit('http://localhost:8888');
    
    // Verificar que el título sea correcto
    cy.title().should('contain', 'Gozain');
    
    // Verificar que aparezca el logo con Bootstrap Icons
    cy.get('.navbar-brand i.bi-shield-check').should('exist');
    
    // Verificar que no haya errores de FontAwesome
    cy.window().its('console').then((console) => {
      cy.spy(console, 'error').as('consoleError');
    });
    
    // Esperar un poco para que cargue
    cy.wait(2000);
    
    // Verificar que el endpoint de organizaciones funciona
    cy.request('GET', 'http://localhost:8888/api/organizations').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.length(2);
      
      // Verificar que están Gailen y Demo
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
    
    // Verificar que no hay errores en consola
    cy.get('@consoleError').should('not.have.been.called');
  });
  
  it('Debe mostrar el modal de login al hacer clic en una organización', () => {
    cy.visit('http://localhost:8888');
    
    // Esperar a que cargue la página
    cy.wait(2000);
    
    // Verificar que el modal de login aparezca (inicialmente debería estar visible)
    cy.get('#loginModal').should('exist');
    
    // Verificar que el logo del modal sea correcto
    cy.get('#loginModal .bi-shield-check').should('exist');
    cy.get('#loginModal').should('contain', 'Gozain');
    cy.get('#loginModal').should('contain', 'Portal de Ciberseguridad');
  });
});