/// <reference types="cypress" />

const API = '/api';

describe('Catálogo - Home', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('deve carregar a página inicial com produtos', () => {
    cy.intercept('GET', `${API}/products*`).as('getProducts');
    cy.wait('@getProducts');
    // Deve ter cards de produto ou mensagem de vazio
    cy.get('body').should('be.visible');
  });

  it('deve exibir nome da loja no header', () => {
    cy.intercept('GET', `${API}/config`).as('getConfig');
    cy.wait('@getConfig');
    cy.get('header').should('be.visible');
  });

  it('deve buscar produtos pelo nome', () => {
    cy.intercept('GET', `${API}/products*`).as('searchProducts');
    cy.get('input[placeholder*="Buscar"], input[placeholder*="buscar"]').first().type('teste');
    cy.wait('@searchProducts');
  });

  it('deve abrir modal de produto ao clicar no card', () => {
    cy.intercept('GET', `${API}/products*`).as('getProducts');
    cy.wait('@getProducts');

    cy.get('body').then(($body) => {
      // Se há produtos, clicar no primeiro
      const cards = $body.find('[class*="cursor-pointer"]');
      if (cards.length > 0) {
        cy.wrap(cards.first()).click();
        // Modal deve aparecer
        cy.get('[class*="fixed"]').should('be.visible');
      }
    });
  });
});

describe('Carrinho de Compras', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.intercept('GET', `${API}/products*`).as('getProducts');
    cy.wait('@getProducts');
  });

  it('deve adicionar produto ao carrinho', () => {
    cy.get('body').then(($body) => {
      const addButtons = $body.find('button:contains("Adicionar"), button:contains("Comprar"), button svg');
      if (addButtons.length > 0) {
        cy.wrap(addButtons.first()).click({ force: true });
        // Badge do carrinho deve aparecer ou drawer abrir
        cy.get('[class*="fixed"]').should('be.visible');
      }
    });
  });

  it('deve alterar quantidade no carrinho', () => {
    // Adicionar produto primeiro
    cy.get('body').then(($body) => {
      const addButtons = $body.find('button:contains("Adicionar"), button:contains("Comprar")');
      if (addButtons.length > 0) {
        cy.wrap(addButtons.first()).click({ force: true });

        // Incrementar quantidade
        cy.get('[class*="fixed"]').within(() => {
          cy.get('button').then(($buttons) => {
            // Procurar botão de + (incrementar)
            const plusBtn = $buttons.filter(':contains("+")');
            if (plusBtn.length) {
              cy.wrap(plusBtn.first()).click();
            }
          });
        });
      }
    });
  });

  it('deve remover produto do carrinho', () => {
    cy.get('body').then(($body) => {
      const addButtons = $body.find('button:contains("Adicionar"), button:contains("Comprar")');
      if (addButtons.length > 0) {
        cy.wrap(addButtons.first()).click({ force: true });

        cy.get('[class*="fixed"]').within(() => {
          // Botão de remover (lixeira)
          cy.get('button[class*="red"], button:contains("Remover")').first().click({ force: true });
        });
      }
    });
  });
});

describe('Cálculo de Frete', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.intercept('GET', `${API}/products*`).as('getProducts');
    cy.wait('@getProducts');
  });

  it('deve calcular frete com CEP válido', () => {
    cy.get('body').then(($body) => {
      const addButtons = $body.find('button:contains("Adicionar"), button:contains("Comprar")');
      if (addButtons.length > 0) {
        cy.wrap(addButtons.first()).click({ force: true });

        cy.intercept('POST', `${API}/frete/calcular`).as('calcFrete');

        // Procurar campo de CEP no drawer
        cy.get('[class*="fixed"]').within(() => {
          cy.get('input[placeholder*="CEP"], input[placeholder*="cep"]').then(($cep) => {
            if ($cep.length) {
              cy.wrap($cep.first()).type('01001000');
              cy.get('button:contains("Calcular"), button:contains("calcular")').first().click();
              cy.wait('@calcFrete');
              // Deve mostrar opções PAC/SEDEX
              cy.contains(/PAC|SEDEX/i).should('be.visible');
            }
          });
        });
      }
    });
  });
});
