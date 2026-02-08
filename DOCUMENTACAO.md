# 📚 VITRINE - Documentação Completa

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Requisitos](#requisitos)
3. [Instalação e Configuração](#instalação-e-configuração)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Funcionalidades](#funcionalidades)
6. [Guia de Uso](#guia-de-uso)
7. [API Backend](#api-backend)
8. [Banco de Dados](#banco-de-dados)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

**VITRINE** é um sistema completo de e-commerce com:
- Catálogo de produtos personalizável
- Sistema de carrinho de compras
- Checkout online com validação de CPF e CEP
- Integração com WhatsApp
- Painel administrativo completo
- Dashboard de vendas
- Área do cliente
- Campos customizáveis por produto
- Sistema de pedidos

**Stack Tecnológica:**
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express
- Banco de Dados: PostgreSQL
- Containerização: Docker

---

## 💻 Requisitos

- Node.js 18+ e npm
- Docker e Docker Compose
- Navegador moderno (Chrome, Firefox, Safari, Edge)

---

## 🚀 Instalação e Configuração

### 1. Clone o Repositório
```bash
cd /home/aneca/vitrine
```

### 2. Configure o Banco de Dados

#### Inicie o PostgreSQL com Docker:
```bash
docker-compose up -d
```

Isso criará um container PostgreSQL com:
- Nome: `vitrinepro-postgres`
- Porta: 5432
- Database: `vitrinepro`
- Usuário: `postgres`
- Senha: (definida no docker-compose.yml)

#### Execute as Migrations:
```bash
# Schema inicial
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/schema.sql

# Migrations
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-custom-fields-v2.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-customers.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-addresses.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-whatsapp.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-select-fields.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-cpf-address.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-payment-config.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-fix-orders.sql
```

#### Crie o usuário admin:
```bash
cd backend
node setup-admin.js
```

**Credenciais padrão:**
- Email: `admin@admin.com`
- Senha: `admin`

### 3. Instale as Dependências

```bash
# Dependências do frontend
npm install

# Dependências do backend
cd backend
npm install
cd ..
```

### 4. Inicie os Servidores

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```
O backend estará rodando em `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
O frontend estará rodando em `http://localhost:5173`

### 5. Acesse o Sistema

- **Loja:** http://localhost:5173
- **Admin:** http://localhost:5173/admin (faça login com admin@admin.com / admin)

---

## 📁 Estrutura do Projeto

```
vitrine/
├── components/          # Componentes React
│   ├── AdminDashboard.tsx      # Dashboard admin
│   ├── CartDrawer.tsx          # Carrinho lateral
│   ├── CustomerAccount.tsx     # Área do cliente
│   ├── FieldManager.tsx        # Gerenciar campos
│   ├── Layout.tsx              # Layout principal
│   ├── PaymentSettings.tsx     # Config pagamentos
│   ├── ProductCard.tsx         # Card de produto
│   ├── ProductForm.tsx         # Formulário produto
│   ├── ProductModal.tsx        # Modal detalhes
│   ├── SalesDashboard.tsx      # Dashboard vendas
│   └── UnifiedAuth.tsx         # Login/Registro
│
├── pages/               # Páginas
│   ├── Home.tsx                # Catálogo
│   ├── AuthPage.tsx            # Autenticação
│   ├── AdminPage.tsx           # Admin
│   ├── AccountPage.tsx         # Conta cliente
│   ├── CheckoutPage.tsx        # Checkout
│   ├── OrderDetailsPage.tsx    # Detalhes pedido
│   └── NotFound.tsx            # 404
│
├── services/            # Serviços
│   ├── api.ts                  # API calls
│   ├── customerAuth.ts         # Auth cliente
│   ├── storageService.ts       # LocalStorage
│   └── validators.ts           # Validações
│
├── backend/             # Backend Node.js
│   ├── server.js               # Servidor Express
│   ├── db.js                   # Conexão PostgreSQL
│   └── setup-admin.js          # Setup admin
│
├── database/            # Migrations SQL
│   ├── schema.sql              # Schema inicial
│   └── migration-*.sql         # Migrations
│
├── App.tsx              # App principal
├── types.ts             # TypeScript types
├── index.tsx            # Entry point
└── index.html           # HTML base
```

---

## ✨ Funcionalidades

### 🛍️ Para Clientes

#### 1. Catálogo de Produtos
- Visualização em grid responsivo
- Busca por nome
- Filtros avançados:
  - Faixa de preço (R$ min - R$ max)
  - Campos customizados (ex: Marca, Tamanho)
- Modal com detalhes completos
- Campos customizados exibidos

#### 2. Carrinho de Compras
- Adicionar/remover produtos
- Ajustar quantidades
- Persistência em localStorage
- Cálculo automático do total
- Duas opções de checkout:
  - **Compra Online** (recomendado)
  - **WhatsApp** (envia pedido via WhatsApp)

#### 3. Checkout Online
**Fluxo em 5 etapas:**

**Etapa 1 - Identificação:**
- Login ou registro obrigatório
- Validação de CPF com dígitos verificadores
- Formatação automática (000.000.000-00)

**Etapa 2 - Endereço:**
- Busca automática por CEP (ViaCEP API)
- Preenchimento automático de endereço
- Validação de campos obrigatórios

**Etapa 3 - Pagamento:**
- Seleção de forma de pagamento (em desenvolvimento)

**Etapa 4 - Revisão:**
- Resumo completo do pedido
- Dados pessoais, endereço, produtos
- Fotos dos produtos
- Valor total

**Etapa 5 - Confirmação:**
- Número do pedido
- Detalhes da compra
- Botões para ver pedidos ou voltar à loja

**Recursos:**
- Linha do tempo visual com progresso
- Etapas clicáveis para edição (exceto após confirmação)
- Salvamento automático dos dados
- Carrinho limpo após confirmação

#### 4. Área do Cliente
- Visualização de dados pessoais
- Edição de perfil (nome, telefone, CPF)
- Alteração de senha
- Histórico de pedidos com:
  - Número, data, status
  - Produtos e valores
  - Clique para ver detalhes
- Exclusão de conta

#### 5. Detalhes do Pedido
- Informações completas
- Status colorido
- Dados do cliente
- Endereço de entrega
- Lista de produtos
- Forma de pagamento

### 👨‍💼 Para Administradores

#### 1. Dashboard Principal
- Lista de produtos
- Busca por nome
- Ações rápidas:
  - Adicionar produto
  - Editar produto
  - Excluir produto
- Acesso a configurações

#### 2. Gerenciamento de Produtos
**Cadastro/Edição:**
- Nome, preço, descrição
- Upload de imagem (base64)
- Campos customizados dinâmicos
- Preview da imagem

**Campos Suportados:**
- Texto
- Número
- Valor (R$)
- Seleção (dropdown com opções)

#### 3. Campos Customizáveis
- Criar campos adicionais para produtos
- Tipos: texto, número, moeda, seleção
- Para tipo seleção:
  - Adicionar múltiplas opções
  - Remover opções
  - Preview das opções
- Campos padrão não podem ser removidos
- Validação de nomes duplicados

#### 4. Configurações Visuais
- Nome da loja
- Logo (upload de imagem)
- Cor principal (primary)
- Cor secundária (secondary)
- Número do WhatsApp (formatado)
- Preview em tempo real

#### 5. Métodos de Pagamento
**Configurar Checkout:**
- Ativar/desativar compra online
- Ativar/desativar WhatsApp
- Número do WhatsApp (se ativo)

**Formas de Pagamento Online:**
- PIX
- Cartão de Crédito
- Boleto Bancário
- Seleção múltipla

#### 6. Dashboard de Vendas
**Métricas:**
- Faturamento total do período
- Quantidade de pedidos
- Ticket médio

**Filtros:**
- Período: Hoje, 7 dias, 30 dias, Personalizado
- Status: Todos, Aguardando, Confirmado, Enviado, Entregue, Cancelado

**Lista de Pedidos:**
- Tabela com todos os pedidos
- Informações: número, data, cliente, telefone, valor, status
- Telefone clicável (abre WhatsApp com mensagem automática)
- Clique no pedido para ver detalhes

**Detalhes do Pedido:**
- Dados completos do cliente
- Botão WhatsApp
- Endereço de entrega
- Produtos e valores
- Forma de pagamento
- Status atual

---

## 📖 Guia de Uso

### Primeiro Acesso

1. **Acesse o sistema:** http://localhost:5173
2. **Faça login como admin:** Clique no ícone de usuário → Login
   - Email: `admin@admin.com`
   - Senha: `admin`
3. **Configure a loja:**
   - Clique no ícone de engrenagem (⚙️)
   - Defina nome, logo e cores
   - Configure WhatsApp
   - Salve as configurações

### Cadastrar Produtos

1. No painel admin, clique em **"+ Novo Produto"**
2. Preencha os dados:
   - Nome
   - Preço
   - Descrição
   - Foto (clique na área de upload)
3. Preencha os campos customizados (se houver)
4. Clique em **"Salvar Produto"**

### Criar Campos Customizados

1. No admin, clique no ícone de tag (🏷️)
2. Clique em **"Adicionar Novo Campo"**
3. Digite o nome (ex: "Marca")
4. Selecione o tipo:
   - **Texto:** Campo de texto livre
   - **Número:** Apenas números
   - **Valor (R$):** Valores monetários
   - **Seleção:** Dropdown com opções pré-definidas
5. Se for seleção, adicione as opções (ex: Nike, Adidas, Puma)
6. Clique em **"Adicionar Campo"**

### Configurar Métodos de Pagamento

1. No admin, clique no ícone de cartão (💳)
2. Ative/desative os métodos de checkout
3. Configure o WhatsApp (se ativo)
4. Selecione as formas de pagamento online
5. Clique em **"Salvar Configurações"**

### Fazer um Pedido (Cliente)

1. Navegue pelo catálogo
2. Use filtros para encontrar produtos
3. Clique em um produto para ver detalhes
4. Clique em **"Adicionar ao Carrinho"**
5. Abra o carrinho (ícone no header)
6. Clique em **"Finalizar Compra"**
7. Escolha **"Compra Online"**
8. Complete as 5 etapas do checkout
9. Confirme o pedido

### Ver Pedidos (Cliente)

1. Faça login como cliente
2. Clique no seu nome no header
3. Vá para **"Minha Conta"**
4. Role até **"Meus Pedidos"**
5. Clique em um pedido para ver detalhes

### Acompanhar Vendas (Admin)

1. No admin, clique no ícone de gráfico (📊)
2. Use os filtros:
   - Selecione o período
   - Filtre por status
3. Veja as métricas no topo
4. Clique no telefone para contatar cliente via WhatsApp
5. Clique no ícone de olho (👁️) para ver detalhes do pedido

---

## 🔌 API Backend

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### Configuração
```
GET    /config                    # Obter configurações
PUT    /config                    # Atualizar configurações
```

#### Autenticação Admin
```
POST   /auth/login                # Login admin
Body: { username, password }
```

#### Clientes
```
POST   /customers/register        # Registrar cliente
Body: { nome_completo, email, senha, telefone }

POST   /customers/login           # Login cliente
Body: { email, senha }

GET    /customers/me/:id          # Obter dados do cliente
PUT    /customers/:id             # Atualizar cliente
PUT    /customers/:id/password    # Alterar senha
DELETE /customers/:id             # Excluir conta
```

#### Produtos
```
GET    /products                  # Listar produtos
POST   /products                  # Criar produto
PUT    /products/:id              # Atualizar produto
DELETE /products/:id              # Excluir produto
```

#### Campos Customizados
```
GET    /field-definitions         # Listar campos
POST   /field-definitions         # Criar campo
DELETE /field-definitions/:id    # Excluir campo
```

#### Pedidos
```
POST   /orders                    # Criar pedido
Body: { customer_id, customer_name, customer_phone, customer_address, payment_method, total, items }

GET    /orders                    # Listar todos pedidos
GET    /orders/:id                # Obter pedido específico
GET    /orders/customer/:customerId  # Pedidos do cliente
```

---

## 🗄️ Banco de Dados

### Tabelas Principais

#### `config`
Configurações da loja
```sql
- id (PK)
- store_name
- primary_color
- secondary_color
- whatsapp_number
- logo_url
- enable_online_checkout
- enable_whatsapp_checkout
- payment_methods (JSONB)
```

#### `users`
Administradores
```sql
- id (PK)
- username
- password_hash
- created_at
```

#### `customers`
Clientes
```sql
- id (PK)
- nome_completo
- email (unique)
- senha_hash
- telefone
- cpf
- cep, endereco, numero, complemento, bairro, cidade, estado
- aceita_marketing
- status
- criado_em
- ultimo_login_em
- deletado_em
```

#### `products`
Produtos
```sql
- id (PK)
- name
- price
- description
- image (base64)
- created_at
```

#### `field_definitions`
Definições de campos customizados
```sql
- id (PK)
- field_name
- field_type (text, number, currency, select)
- is_default
- can_delete
- field_order
- options (TEXT - JSON string para select)
```

#### `product_fields`
Valores dos campos por produto
```sql
- id (PK)
- product_id (FK)
- field_id (FK)
- field_value
```

#### `orders`
Pedidos
```sql
- id (PK)
- customer_id
- customer_name
- customer_phone
- customer_address
- payment_method (PIX, CARD, CASH)
- total
- status (PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED)
- created_at
- updated_at
- is_guest
```

#### `order_items`
Itens dos pedidos
```sql
- id (PK)
- order_id (FK)
- product_id
- product_name
- product_price
- quantity
- subtotal
```

### Enums

```sql
payment_method_type: PIX, CARD, CASH
order_status_type: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
customer_status_type: ativo, inativo, bloqueado
```

---

## 🔧 Troubleshooting

### Backend não inicia
```bash
# Verifique se a porta 3001 está livre
lsof -i :3001

# Mate o processo se necessário
kill -9 <PID>

# Reinicie o backend
cd backend && node server.js
```

### Frontend não conecta ao backend
- Verifique se o backend está rodando em http://localhost:3001
- Verifique o console do navegador para erros de CORS
- Confirme que o CORS está habilitado no backend

### Banco de dados não conecta
```bash
# Verifique se o container está rodando
docker ps | grep vitrinepro-postgres

# Se não estiver, inicie
docker-compose up -d

# Verifique os logs
docker logs vitrinepro-postgres
```

### Migrations falharam
```bash
# Conecte ao banco e verifique as tabelas
docker exec -it vitrinepro-postgres psql -U postgres -d vitrinepro

# Liste as tabelas
\dt

# Se necessário, recrie o banco
docker-compose down -v
docker-compose up -d
# Execute todas as migrations novamente
```

### Erro ao fazer upload de imagem
- Imagens são convertidas para base64
- Tamanho máximo: 50MB (configurado no backend)
- Formatos suportados: PNG, JPG, JPEG, GIF, SVG

### Produtos não aparecem
```bash
# Verifique se há produtos no banco
docker exec -it vitrinepro-postgres psql -U postgres -d vitrinepro -c "SELECT * FROM products;"

# Verifique o console do navegador
# Verifique se o backend está retornando dados
curl http://localhost:3001/api/products
```

### Não consigo fazer login
**Admin:**
- Email: `admin@admin.com`
- Senha: `admin`
- Se não funcionar, execute: `cd backend && node setup-admin.js`

**Cliente:**
- Registre-se primeiro em /auth
- Ou use um cliente existente no banco

### Cores não aplicam
- As cores são definidas como variáveis CSS no `:root`
- Verifique se salvou as configurações no admin
- Recarregue a página (F5)

### WhatsApp não abre
- Verifique se o número está configurado corretamente
- Formato: 5541988630921 (DDI + DDD + número)
- O link gerado é: `https://wa.me/5541988630921?text=...`

---

## 📝 Notas Importantes

1. **Segurança:**
   - Senhas são hasheadas com bcrypt
   - Sessões armazenadas em localStorage/sessionStorage
   - Em produção, use HTTPS e tokens JWT

2. **Performance:**
   - Imagens em base64 podem deixar o banco grande
   - Considere usar CDN para imagens em produção
   - Implemente paginação para muitos produtos

3. **Backup:**
   - Faça backup regular do banco de dados
   - Comando: `docker exec vitrinepro-postgres pg_dump -U postgres vitrinepro > backup.sql`

4. **Produção:**
   - Configure variáveis de ambiente
   - Use PM2 para gerenciar o backend
   - Configure nginx como reverse proxy
   - Use PostgreSQL em servidor dedicado

---

## 🎨 Personalização

### Cores
As cores são configuráveis pelo admin e aplicadas globalmente via CSS variables:
- `--primary`: Cor principal (botões, links, destaques)
- `--secondary`: Cor secundária (elementos de apoio)

### Logo
- Upload via admin
- Armazenada como base64
- Substitui o ícone padrão em todo o site

### Campos Customizados
- Totalmente dinâmicos
- Aparecem automaticamente em:
  - Formulário de produto
  - Card de produto
  - Modal de detalhes
  - Filtros (se tipo select)

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique esta documentação
2. Consulte a seção Troubleshooting
3. Verifique os logs do backend e console do navegador
4. Verifique o banco de dados

---

**Desenvolvido com ❤️ usando React, Node.js e PostgreSQL**
