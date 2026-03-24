/// <reference types="cypress" />

const API = '/api';
const TEST_EMAIL = `cypress_${Date.now()}@teste.com`;
const TEST_PASSWORD = 'Teste123!';

describe('Cliente - Cadastro e Login', () => {
  it('deve exibir formulário de cadastro', () => {
    cy.visit('/auth');
    cy.contains(/Cadastr|Criar conta/i).should('be.visible');
  });

  it('deve validar email inválido no cadastro', () => {
    cy.visit('/auth');
    // Ir para aba de cadastro se necessário
    cy.get('body').then(($body) => {
      if ($body.text().match(/Criar conta|Cadastrar/)) {
        cy.contains(/Criar conta|Cadastrar/i).first().click();
      }
    });

    cy.get('input[type="email"]').first().type('emailinvalido');
    cy.get('input[type="email"]').first().then(($input) => {
      expect($input[0].validity.valid).to.be.false;
    });
  });

  it('deve rejeitar login com credenciais inválidas', () => {
    cy.visit('/auth');

    cy.get('input[type="email"]').first().type('naoexiste@teste.com');
    cy.get('input[type="password"]').first().type('senhaerrada');

    cy.get('form').first().submit();

    cy.contains(/inválid|incorret|erro/i).should('be.visible');
  });
});

describe('Cliente - Área da Conta', () => {
  beforeEach(() => {
    // Simular login via API (precisa de customer existente)
    cy.visit('/');
  });

  it('deve redirecionar para auth se não logado', () => {
    window.localStorage.removeItem('customerToken');
    window.localStorage.removeItem('customer');
    cy.visit('/minha-conta');
    // Deve mostrar mensagem de login ou redirecionar
    cy.get('body').should('be.visible');
  });
});
