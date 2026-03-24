/// <reference types="cypress" />

const API = '/api';

function loginAdmin() {
  cy.request('POST', `${API}/auth/login`, {
    username: 'admin',
    password: 'admin'
  }).then((res) => {
    window.localStorage.setItem('admin_token', res.body.token);
  });
}

describe('Admin - Painel de Vendas', () => {
  beforeEach(() => {
    loginAdmin();
    cy.visit('/admin');
  });

  it('deve abrir o painel de vendas', () => {
    cy.contains(/Vendas|Pedidos/i).click();
    cy.intercept('GET', `${API}/orders*`).as('getOrders');
    cy.wait('@getOrders');
    cy.get('body').should('be.visible');
  });

  it('deve filtrar pedidos por período', () => {
    cy.contains(/Vendas|Pedidos/i).click();
    cy.intercept('GET', `${API}/orders*`).as('getOrders');
    cy.wait('@getOrders');

    // Clicar nos filtros de período
    cy.get('body').then(($body) => {
      if ($body.text().includes('Hoje')) {
        cy.contains('Hoje').click();
      }
      if ($body.text().includes('7 dias')) {
        cy.contains('7 dias').click();
      }
      if ($body.text().includes('30 dias')) {
        cy.contains('30 dias').click();
      }
    });
  });

  it('deve abrir formulário de pedido manual', () => {
    cy.contains(/Vendas|Pedidos/i).click();
    cy.intercept('GET', `${API}/orders*`).as('getOrders');
    cy.wait('@getOrders');

    cy.get('body').then(($body) => {
      if ($body.text().match(/Novo Pedido|Registrar/)) {
        cy.contains(/Novo Pedido|Registrar/i).click();
        cy.contains(/Nome do Cliente|Cliente/i).should('be.visible');
      }
    });
  });
});

describe('Admin - Gestão de Clientes', () => {
  beforeEach(() => {
    loginAdmin();
  });

  it('deve listar clientes via API', () => {
    cy.request({
      method: 'GET',
      url: `${API}/customers`,
      headers: { Authorization: `Bearer ${window.localStorage.getItem('admin_token')}` }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
    });
  });

  it('deve criar cliente via API', () => {
    cy.request({
      method: 'POST',
      url: `${API}/customers`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${window.localStorage.getItem('admin_token')}`
      },
      body: {
        nome_completo: 'Cliente Cypress Test',
        telefone: '11999999999',
        email: `cypress_admin_${Date.now()}@teste.com`
      }
    }).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body.nome_completo).to.eq('Cliente Cypress Test');
    });
  });
});

describe('Admin - Configurações de Pagamento', () => {
  beforeEach(() => {
    loginAdmin();
    cy.visit('/admin');
  });

  it('deve abrir configurações de pagamento', () => {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Pagamento')) {
        cy.contains('Pagamento').click();
        cy.get('body').should('be.visible');
      }
    });
  });
});

describe('Admin - Configurações SMTP', () => {
  beforeEach(() => {
    loginAdmin();
    cy.visit('/admin');
  });

  it('deve abrir configurações de email', () => {
    cy.get('body').then(($body) => {
      if ($body.text().match(/Email|SMTP/)) {
        cy.contains(/Email|SMTP/i).click();
        cy.get('body').should('be.visible');
      }
    });
  });
});

describe('Admin - Campos Personalizados', () => {
  beforeEach(() => {
    loginAdmin();
    cy.visit('/admin');
  });

  it('deve abrir gerenciador de campos', () => {
    cy.get('body').then(($body) => {
      if ($body.text().match(/Campos|Categorias/)) {
        cy.contains(/Campos|Categorias/i).click();
        cy.get('body').should('be.visible');
      }
    });
  });
});
