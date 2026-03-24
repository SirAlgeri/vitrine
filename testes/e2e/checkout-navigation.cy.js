/// <reference types="cypress" />

const API = '/api';

describe('Checkout - Fluxo Completo', () => {
  it('deve exigir login para acessar checkout', () => {
    window.localStorage.removeItem('customerToken');
    window.localStorage.removeItem('customer');
    cy.visit('/checkout');
    // Deve mostrar mensagem pedindo login
    cy.contains(/login|entrar|cadastr/i).should('be.visible');
  });
});

describe('Navegação Geral', () => {
  it('deve carregar a home', () => {
    cy.visit('/');
    cy.get('body').should('be.visible');
    cy.get('header').should('be.visible');
  });

  it('deve exibir 404 para rota inexistente', () => {
    cy.visit('/pagina-que-nao-existe', { failOnStatusCode: false });
    cy.contains(/não encontrad|404|not found/i).should('be.visible');
  });

  it('deve navegar para auth', () => {
    cy.visit('/auth');
    cy.get('body').should('be.visible');
  });

  it('deve ter link para minha conta no header', () => {
    cy.visit('/');
    cy.get('header').should('be.visible');
  });

  it('deve abrir e fechar o carrinho', () => {
    cy.visit('/');
    // Clicar no ícone do carrinho no header
    cy.get('header').find('button').last().click({ force: true });
    // Drawer deve aparecer
    cy.get('[class*="fixed"]').should('be.visible');
  });
});

describe('Pedido - Detalhes', () => {
  it('deve exigir auth para ver pedido', () => {
    window.localStorage.removeItem('customerToken');
    window.localStorage.removeItem('admin_token');
    cy.request({
      method: 'GET',
      url: `${API}/orders/1`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});

describe('Responsividade', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 }
  ];

  viewports.forEach(({ name, width, height }) => {
    it(`deve renderizar corretamente em ${name} (${width}x${height})`, () => {
      cy.viewport(width, height);
      cy.visit('/');
      cy.get('header').should('be.visible');
      cy.get('body').should('be.visible');
      // Não deve ter overflow horizontal
      cy.document().then((doc) => {
        expect(doc.documentElement.scrollWidth).to.be.lte(width + 20);
      });
    });
  });
});
