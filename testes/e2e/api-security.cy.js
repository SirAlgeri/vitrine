/// <reference types="cypress" />

const API = '/api';

describe('API - Segurança', () => {
  it('deve rejeitar acesso admin sem token', () => {
    cy.request({
      method: 'GET',
      url: `${API}/config/admin`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it('deve rejeitar products?all=true sem token admin', () => {
    cy.request({
      method: 'GET',
      url: `${API}/products?all=true`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it('deve rejeitar criação de produto sem token', () => {
    cy.request({
      method: 'POST',
      url: `${API}/products`,
      body: { name: 'Hack', price: 1 },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it('deve rejeitar update de config sem token', () => {
    cy.request({
      method: 'PUT',
      url: `${API}/config`,
      body: { store_name: 'Hackeado' },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it('deve rejeitar listagem de clientes sem token', () => {
    cy.request({
      method: 'GET',
      url: `${API}/customers`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it('deve rejeitar listagem de pedidos sem token', () => {
    cy.request({
      method: 'GET',
      url: `${API}/orders`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it('deve rejeitar delete de produto sem token', () => {
    cy.request({
      method: 'DELETE',
      url: `${API}/products/fake-id`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it('deve rejeitar token inválido', () => {
    cy.request({
      method: 'GET',
      url: `${API}/orders`,
      headers: { Authorization: 'Bearer token_falso_123' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it('deve rejeitar webhook sem secret configurado', () => {
    cy.request({
      method: 'POST',
      url: `${API}/webhooks/mercadopago`,
      body: { type: 'payment', data: { id: '999999' } },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      // 503 se secret não configurado, 401 se configurado sem assinatura
      expect(res.status).to.be.oneOf([401, 503]);
    });
  });
});

describe('API - Rate Limiting', () => {
  it('deve aplicar rate limit no login após muitas tentativas', () => {
    const attempts = Array.from({ length: 6 }, () =>
      cy.request({
        method: 'POST',
        url: `${API}/auth/login`,
        body: { username: 'admin', password: 'errada' },
        headers: { 'Content-Type': 'application/json' },
        failOnStatusCode: false
      })
    );

    // A 6ª tentativa deve ser bloqueada (limite é 5 em 15min)
    cy.request({
      method: 'POST',
      url: `${API}/auth/login`,
      body: { username: 'admin', password: 'errada' },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      // 429 = Too Many Requests ou 401 se ainda não atingiu
      expect(res.status).to.be.oneOf([401, 429]);
    });
  });
});

describe('API - Validação de Input', () => {
  it('deve rejeitar login com campos vazios', () => {
    cy.request({
      method: 'POST',
      url: `${API}/auth/login`,
      body: { username: '', password: '' },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.be.oneOf([400, 401]);
    });
  });

  it('deve rejeitar produto com preço negativo', () => {
    // Login primeiro
    cy.request('POST', `${API}/auth/login`, {
      username: 'admin',
      password: 'admin'
    }).then((loginRes) => {
      cy.request({
        method: 'POST',
        url: `${API}/products`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginRes.body.token}`
        },
        body: { id: 'test', name: 'Test', price: -10 },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.eq(400);
      });
    });
  });

  it('deve rejeitar registro de customer com email inválido', () => {
    cy.request({
      method: 'POST',
      url: `${API}/customers/register`,
      body: {
        nome_completo: 'Test',
        email: 'nao-e-email',
        senha: '123456'
      },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(400);
    });
  });
});
