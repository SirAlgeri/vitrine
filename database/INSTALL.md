# Guia de Instalação do PostgreSQL - VitrinePro

## 📦 Instalação do PostgreSQL

### No Ubuntu/Debian (AWS EC2)
```bash
# Atualizar pacotes
sudo apt update

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar status
sudo systemctl status postgresql
```

### No Windows
1. Baixar PostgreSQL Installer: https://www.postgresql.org/download/windows/
2. Executar instalador (versão 14+)
3. Anotar a senha do usuário postgres

### No macOS
```bash
# Usando Homebrew
brew install postgresql@14

# Iniciar serviço
brew services start postgresql@14
```

### Usando Docker (Recomendado para desenvolvimento)
```bash
# Criar container PostgreSQL
docker run -d \
  --name vitrinepro-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=vitrinepro \
  -p 5432:5432 \
  postgres:14

# Verificar se está rodando
docker ps
```

## 🗄️ Criar o Banco de Dados

### Opção 1: Via linha de comando (Linux/Mac)
```bash
# Conectar como usuário postgres
sudo -u postgres psql

# Criar banco
CREATE DATABASE vitrinepro WITH ENCODING 'UTF8';

# Conectar ao banco
\c vitrinepro

# Executar schema (copiar e colar conteúdo do schema.sql)
# Ou sair e executar:
\q

# Executar arquivo SQL
sudo -u postgres psql vitrinepro < /caminho/para/vitrine/database/schema.sql
```

### Opção 2: Usando Docker (Recomendado)
```bash
# Executar schema inicial
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/schema.sql

# Executar migration de status
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-status-standardization.sql

# Configurar timezone para GMT-3 (America/Sao_Paulo)
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "ALTER DATABASE vitrinepro SET timezone TO 'America/Sao_Paulo';"
docker exec vitrinepro-postgres psql -U postgres -c "ALTER USER postgres SET timezone TO 'America/Sao_Paulo';"

# Reiniciar container para aplicar timezone
docker restart vitrinepro-postgres

# Verificar timezone
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "SHOW timezone;"
```

### Opção 3: Executar diretamente
```bash
# Se PostgreSQL está instalado localmente
psql -U postgres -d vitrinepro -f /caminho/para/vitrine/database/schema.sql
psql -U postgres -d vitrinepro -f /caminho/para/vitrine/database/migration-status-standardization.sql
```

## ✅ Verificar Instalação

```bash
# Conectar ao banco
psql -U postgres -d vitrinepro

# Verificar tabelas criadas
\dt

# Deve mostrar:
# - config
# - customers
# - field_definitions
# - order_items
# - order_status_history (nova)
# - orders
# - product_fields
# - products
# - users

# Ver estrutura de uma tabela
\d products
\d orders
\d order_status_history

# Verificar timezone
SHOW timezone;
# Deve retornar: America/Sao_Paulo

# Ver tipos customizados
\dT

# Sair
\q
```

## 📊 Estrutura do Banco

### Tabelas Principais

**customers** - Dados dos clientes
- `id` (UUID, PK)
- `nome_completo`, `email`, `senha_hash`
- `telefone`, `cpf`
- `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `cep`
- `aceita_marketing`, `status`
- `criado_em`, `ultimo_login_em`, `deletado_em`

**orders** - Pedidos
- `id` (PK)
- `customer_id` (FK)
- `payment_status` (VARCHAR) - Status interno do pagamento
- `order_status` (VARCHAR) - Status interno do pedido
- `payment_provider_status` (VARCHAR) - Status bruto do gateway
- `tracking_code` (VARCHAR) - Código de rastreio
- `delivery_deadline` (DATE) - Prazo de entrega
- `total`, `payment_method`
- `created_at`, `updated_at`

**order_status_history** - Histórico de mudanças de status
- `id` (PK)
- `order_id` (FK)
- `previous_payment_status`, `new_payment_status`
- `previous_order_status`, `new_order_status`
- `changed_by` (gateway/system/admin/webhook)
- `notes` (TEXT)
- `created_at`

**products** - Produtos
- `id` (PK)
- `name`, `price`, `description`, `image`
- `created_at`

**field_definitions** - Campos customizados
- `id` (PK)
- `field_name`, `field_type`
- `is_default`, `can_delete`
- `options` (TEXT - JSON para select)

### Status do Sistema

**PaymentStatus** (7 status):
- PAYMENT_PENDING
- PAYMENT_PROCESSING
- PAYMENT_APPROVED
- PAYMENT_REFUSED
- PAYMENT_CANCELED
- PAYMENT_EXPIRED
- PAYMENT_REFUNDED

**OrderStatus** (7 status):
- ORDER_PENDING_PAYMENT
- ORDER_PAID
- ORDER_PREPARING
- ORDER_SHIPPED
- ORDER_DELIVERED
- ORDER_CANCELED
- ORDER_REFUNDED

## 🔐 Criar Usuário para a Aplicação (Recomendado)

```sql
-- Conectar como postgres
psql -U postgres

-- Criar usuário específico
CREATE USER vitrinepro_user WITH PASSWORD 'senha_segura_aqui';

-- Dar permissões no banco vitrinepro
GRANT ALL PRIVILEGES ON DATABASE vitrinepro TO vitrinepro_user;

-- Conectar ao banco vitrinepro
\c vitrinepro

-- Dar permissões nas tabelas
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vitrinepro_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vitrinepro_user;

-- Sair
\q
```

## 📝 Credenciais para .env (próximo passo)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=vitrinepro_user
DB_PASSWORD=senha_segura_aqui
DB_NAME=vitrinepro
```

## 🧪 Testar Conexão

```bash
psql -U vitrinepro_user -d vitrinepro -h localhost
```

Se conectar com sucesso, está tudo pronto! ✅

## 🔧 Comandos Úteis PostgreSQL

```bash
# Listar bancos
\l

# Listar tabelas
\dt

# Descrever tabela
\d nome_tabela

# Executar query
SELECT * FROM products;

# Sair
\q
```
