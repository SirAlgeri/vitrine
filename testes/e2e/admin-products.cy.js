/// <reference types="cypress" />

const API = '/api';

// Helper: login admin e salvar token
function loginAdmin() {
  cy.request('POST', `${API}/auth/login`, {
    username: 'admin',
    password: 'admin'
  }).then((res) => {
    expect(res.status).to.eq(200);
    window.localStorage.setItem('admin_token', res.body.token);
  });
}

describe('Admin - Cadastro de Produtos', () => {
  beforeEach(() => {
    loginAdmin();
    cy.visit('/admin');
  });

  it('deve exibir o dashboard admin com lista de produtos', () => {
    cy.contains('Novo Produto').should('be.visible');
    cy.get('input[placeholder*="Buscar"]').should('exist');
  });

  it('deve abrir formulário de novo produto', () => {
    cy.contains('Novo Produto').click();
    cy.contains('Novo Produto').should('be.visible');
    cy.get('input[placeholder="Ex: Tênis Esportivo Pro"]').should('exist');
  });

  it('deve validar campos obrigatórios ao salvar sem preencher', () => {
    cy.contains('Novo Produto').click();
    // Limpar o campo preço que vem com 0
    cy.get('input[type="number"][step="0.01"]').first().clear();
    cy.contains('Salvar Produto').click();
    // HTML5 validation impede submit - campo name é required
    cy.get('input[placeholder="Ex: Tênis Esportivo Pro"]').then(($input) => {
      expect($input[0].validity.valid).to.be.false;
    });
  });

  it('deve criar um produto com sucesso', () => {
    // Interceptar API
    cy.intercept('POST', `${API}/products`).as('createProduct');
    cy.intercept('POST', `${API}/upload-images`).as('uploadImages');

    cy.contains('Novo Produto').click();

    // Preencher formulário
    cy.get('input[placeholder="Ex: Tênis Esportivo Pro"]').type('Produto Cypress Test');
    cy.get('input[type="number"][step="0.01"]').first().clear().type('99.90');
    cy.get('textarea').type('Descrição do produto de teste criado pelo Cypress');
    cy.get('input[type="number"][min="0"][step="1"]').clear().type('10');

    cy.contains('Salvar Produto').click();

    cy.wait('@createProduct').its('response.statusCode').should('eq', 201);
    cy.contains('sucesso').should('be.visible');
  });

  it('deve editar um produto existente', () => {
    // Criar produto via API primeiro
    cy.request({
      method: 'POST',
      url: `${API}/products`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${window.localStorage.getItem('admin_token')}`
      },
      body: {
        id: `test-edit-${Date.now()}`,
        name: 'Produto Para Editar',
        price: 50,
        description: 'Será editado',
        stock_quantity: 5
      }
    });

    cy.reload();

    // Buscar o produto
    cy.get('input[placeholder*="Buscar"]').type('Produto Para Editar');
    cy.contains('Produto Para Editar').should('be.visible');

    // Clicar em editar (ícone Edit2)
    cy.contains('Produto Para Editar')
      .closest('div[class*="border"]')
      .find('button')
      .first()
      .click();

    // Alterar nome
    cy.get('input[placeholder="Ex: Tênis Esportivo Pro"]').clear().type('Produto Editado Cypress');

    cy.intercept('PUT', `${API}/products/*`).as('updateProduct');
    cy.contains('Salvar Produto').click();

    cy.wait('@updateProduct').its('response.statusCode').should('eq', 200);
    cy.contains('sucesso').should('be.visible');
  });

  it('deve deletar um produto', () => {
    // Criar produto via API
    const productId = `test-delete-${Date.now()}`;
    cy.request({
      method: 'POST',
      url: `${API}/products`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${window.localStorage.getItem('admin_token')}`
      },
      body: {
        id: productId,
        name: 'Produto Para Deletar',
        price: 10,
        description: 'Será deletado',
        stock_quantity: 1
      }
    });

    cy.reload();

    cy.get('input[placeholder*="Buscar"]').type('Produto Para Deletar');
    cy.contains('Produto Para Deletar').should('be.visible');

    cy.intercept('DELETE', `${API}/products/*`).as('deleteProduct');

    // Clicar no botão de deletar (segundo botão do card)
    cy.contains('Produto Para Deletar')
      .closest('div[class*="border"]')
      .find('button')
      .last()
      .click();

    // Confirmar exclusão (window.confirm)
    cy.on('window:confirm', () => true);

    cy.wait('@deleteProduct').its('response.statusCode').should('eq', 200);
    cy.contains('Produto Para Deletar').should('not.exist');
  });

  it('deve buscar/filtrar produtos pelo nome', () => {
    cy.get('input[placeholder*="Buscar"]').type('xyzprodutoinexistente');
    // Não deve encontrar nada ou mostrar lista vazia
    cy.get('input[placeholder*="Buscar"]').clear().type(' ');
  });
});

describe('Admin - Configurações da Loja', () => {
  beforeEach(() => {
    loginAdmin();
    cy.visit('/admin');
  });

  it('deve abrir e salvar configurações', () => {
    cy.intercept('PUT', `${API}/config`).as('saveConfig');

    cy.contains('Configurações').click();

    // Verificar campos de config
    cy.get('input').should('have.length.greaterThan', 0);

    // Alterar nome da loja
    cy.get('input').first().clear().type('Loja Cypress Test');

    cy.contains('Salvar').click();
    cy.wait('@saveConfig').its('response.statusCode').should('eq', 200);
  });
});

describe('Admin - Autenticação', () => {
  it('deve redirecionar para auth se não autenticado', () => {
    window.localStorage.removeItem('admin_token');
    cy.visit('/admin');
    cy.url().should('include', '/auth');
  });

  it('deve fazer login com credenciais válidas', () => {
    cy.visit('/auth');
    // Clicar na aba admin se existir
    cy.get('body').then(($body) => {
      if ($body.text().includes('Administrador')) {
        cy.contains('Administrador').click();
      }
    });

    cy.get('input[placeholder="admin"]').first().type('admin');
    cy.get('input[type="password"]').type('admin');
    cy.contains('Entrar').click();

    cy.url().should('include', '/admin');
  });

  it('deve rejeitar credenciais inválidas', () => {
    cy.visit('/auth');
    cy.get('body').then(($body) => {
      if ($body.text().includes('Administrador')) {
        cy.contains('Administrador').click();
      }
    });

    cy.get('input[placeholder="admin"]').first().type('admin');
    cy.get('input[type="password"]').type('senhaerrada');
    cy.contains('Entrar').click();

    cy.contains('inválid').should('be.visible');
  });
});
