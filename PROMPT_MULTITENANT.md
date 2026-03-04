# Prompt para Implementação Multi-Tenant

Preciso transformar meu e-commerce em um sistema multi-tenant (SaaS) onde cada cliente terá seu próprio subdomínio (ex: `mcptennis.meudominio.com`, `outraloja.meudominio.com`).

## Contexto do Projeto

- **Stack:** React + TypeScript (frontend), Node.js + Express (backend), PostgreSQL (RDS)
- **Arquitetura atual:** Single tenant rodando em EC2 + RDS na AWS
- **Localização:** `/home/aneca/vitrine` (local) e `~/vitrine` (EC2)

## Requisitos da Implementação

### 1. Banco de Dados (PostgreSQL)

Adicionar suporte multi-tenant:

- Criar tabela `tenants` com campos:
  - `id` (VARCHAR 50, PK)
  - `subdomain` (VARCHAR 50, UNIQUE)
  - `store_name` (VARCHAR 100)
  - `active` (BOOLEAN)
  - `created_at` (TIMESTAMP)

- Adicionar coluna `tenant_id` (VARCHAR 50) em TODAS as tabelas existentes:
  - `config`
  - `products`
  - `product_images`
  - `orders`
  - `order_items`
  - `order_status_history`
  - `customers`
  - `customer_addresses`
  - `field_definitions`
  - `product_fields`
  - `email_verifications`
  - `password_reset_tokens`

- Criar índices para `tenant_id` em todas as tabelas principais

- Criar migration SQL completa para essas alterações

### 2. Backend (Node.js + Express)

Modificar `backend/server.js`:

- Criar middleware que:
  - Extrai o subdomínio do header `Host`
  - Busca o tenant no banco pela coluna `subdomain`
  - Valida se o tenant está ativo
  - Adiciona `req.tenant` com os dados do tenant
  - Retorna 404 se tenant não existir ou estiver inativo

- Modificar TODAS as queries SQL para filtrar por `tenant_id`:
  - Produtos
  - Pedidos
  - Clientes
  - Configurações
  - Etc.

- Criar rotas administrativas para gerenciar tenants:
  - `POST /api/admin/tenants` - Criar novo tenant
  - `GET /api/admin/tenants` - Listar todos os tenants
  - `PUT /api/admin/tenants/:id` - Atualizar tenant
  - `DELETE /api/admin/tenants/:id` - Desativar tenant

- Garantir que ao criar um tenant, seja criado automaticamente:
  - Registro na tabela `config` com `tenant_id`
  - Campos padrão em `field_definitions` com `tenant_id`

### 3. Frontend (React + TypeScript)

Modificar para detectar tenant:

- Criar hook `useTenant()` que:
  - Detecta o subdomínio atual
  - Busca dados do tenant via API
  - Armazena no contexto React

- Modificar `App.tsx` para:
  - Carregar configurações específicas do tenant
  - Mostrar nome da loja do tenant
  - Aplicar cores/logo do tenant

- Garantir que todas as requisições incluam o tenant correto (via subdomínio no header)

### 4. Nginx

Atualizar configuração em `/etc/nginx/sites-available/vitrine`:

- Aceitar wildcard subdomain: `server_name *.meudominio.com;`
- Passar header `Host` para o backend: `proxy_set_header Host $host;`

### 5. Dados de Exemplo

Criar script para popular tenant de exemplo:

```sql
-- Tenant exemplo
INSERT INTO tenants (id, subdomain, store_name, active) 
VALUES ('tenant-mcptennis', 'mcptennis', 'MCP Tennis Store', true);

-- Config do tenant
INSERT INTO config (tenant_id, store_name, primary_color, secondary_color)
VALUES ('tenant-mcptennis', 'MCP Tennis Store', '#ff6b00', '#00a86b');
```

## Requisitos Técnicos

- Manter compatibilidade com código existente
- Não quebrar funcionalidades atuais
- Adicionar validações de segurança (tenant isolation)
- Criar migrations incrementais (não destrutivas)
- Documentar todas as mudanças

## Estrutura de Arquivos

```
vitrine/
├── backend/
│   ├── server.js (modificar)
│   ├── middleware/
│   │   └── tenant.js (criar)
│   └── migrations/
│       └── migration-multitenant.sql (criar)
├── src/
│   ├── hooks/
│   │   └── useTenant.ts (criar)
│   ├── contexts/
│   │   └── TenantContext.tsx (criar)
│   └── App.tsx (modificar)
└── database/
    └── migration-multitenant.sql (criar)
```

## Entregáveis

1. Migration SQL completa
2. Middleware de tenant para backend
3. Rotas administrativas de tenant
4. Hook e contexto React para tenant
5. Configuração Nginx atualizada
6. Script de dados de exemplo
7. Documentação de como criar novos tenants

## Observações Importantes

- O sistema já está em produção na AWS (EC2 + RDS)
- Preciso de migrations que possam ser executadas sem downtime
- Cada tenant deve ser completamente isolado (não pode ver dados de outros)
- O tenant "default" ou "admin" deve ter acesso a gerenciar outros tenants
- Considerar performance (índices adequados)

## Configuração DNS

Após implementação, configurar no provedor de DNS:
```
Type: A
Name: *
Value: 54.221.171.166
TTL: 300
```

---

**Implemente essa arquitetura multi-tenant seguindo as melhores práticas de segurança e isolamento de dados. Forneça código completo e testável.**
