# 🚀 Deploy Completo Vitrine Pro na AWS

**Documentação do deploy realizado em 17/02/2026**

## 📋 Arquitetura Implementada

```
┌─────────────────────────────────────────────────┐
│              Internet (HTTP)                     │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────▼─────────┐
        │   EC2 Instance    │
        │  54.221.171.166   │
        │                   │
        │  ┌─────────────┐  │
        │  │   Nginx     │  │ :80
        │  │  (Reverse   │  │
        │  │   Proxy)    │  │
        │  └──────┬──────┘  │
        │         │         │
        │  ┌──────▼──────┐  │
        │  │  Frontend   │  │
        │  │   (React)   │  │
        │  │   /dist     │  │
        │  └─────────────┘  │
        │         │         │
        │  ┌──────▼──────┐  │
        │  │  Backend    │  │ :3001
        │  │  (Node.js)  │  │
        │  │    PM2      │  │
        │  └──────┬──────┘  │
        └─────────┼─────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼──────────┐
│  RDS Postgres  │  │  Lambda Frete   │
│   vitrinedb    │  │   (Python)      │
│  PostgreSQL 18 │  │                 │
└────────────────┘  └─────────────────┘
```

## 🎯 Componentes Implementados

### 1. RDS PostgreSQL
- **Endpoint:** vitrine-db.cata6og4ssb9.us-east-1.rds.amazonaws.com
- **Engine:** PostgreSQL 18
- **Instance:** db.t3.micro (free tier)
- **Storage:** 20 GB gp2
- **Database:** vitrinedb
- **User:** master_vitrine
- **SSL:** Habilitado

### 2. EC2 Instance
- **IP Público:** 54.221.171.166
- **AMI:** Ubuntu Server 22.04 LTS
- **Instance Type:** t2.micro (free tier)
- **Storage:** 20 GB gp3
- **Region:** us-east-1

### 3. Lambda Function
- **Nome:** vitrine-frete
- **Runtime:** Python 3.12
- **URL:** https://7dwqzuotfn7yyfhokzrjz465rm0lcvlu.lambda-url.us-east-1.on.aws/
- **Função:** Cálculo de frete PAC/SEDEX

---

## 📝 Passo a Passo do Deploy

### PARTE 1: Banco de Dados RDS

#### 1.1 Criar RDS PostgreSQL

1. Acesse **AWS Console → RDS → Create database**
2. Configure:
   - Engine: PostgreSQL 18
   - Template: Free tier
   - DB instance identifier: vitrine-db
   - Master username: master_vitrine
   - Master password: [sua senha segura]
   - DB instance class: db.t3.micro
   - Storage: 20 GB gp2
   - **Disable** storage autoscaling (para manter free tier)
   - Public access: **Yes**
   - Database name: vitrinedb
3. Aguarde status **Available** (~10 minutos)

#### 1.2 Configurar Security Group

1. RDS → vitrine-db → Connectivity & security
2. Clique no Security Group
3. Edit inbound rules → Add rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: 0.0.0.0/0 (temporário para setup)

#### 1.3 Executar Migrations

Conecte via DBeaver ou psql e execute os scripts na ordem:

**Script 1 - Schema principal:**
```sql
CREATE TYPE payment_method_type AS ENUM ('PIX', 'CARD', 'CASH');
CREATE TYPE order_status_type AS ENUM ('PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED');

CREATE TABLE IF NOT EXISTS config (
  id SERIAL PRIMARY KEY,
  store_name VARCHAR(100) NOT NULL DEFAULT 'VitrinePro',
  primary_color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
  secondary_color VARCHAR(7) NOT NULL DEFAULT '#10b981',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_address TEXT NOT NULL,
  payment_method payment_method_type NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status order_status_type DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(200) NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_config_updated_at BEFORE UPDATE ON config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO config (store_name, primary_color, secondary_color) 
VALUES ('VitrinePro', '#3b82f6', '#10b981')
ON CONFLICT DO NOTHING;

ALTER DATABASE vitrinedb SET timezone TO 'America/Sao_Paulo';
```

**Script 2 - Status padronizados:**
```sql
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PAYMENT_PENDING',
  ADD COLUMN IF NOT EXISTS order_status VARCHAR(50) DEFAULT 'ORDER_PENDING_PAYMENT',
  ADD COLUMN IF NOT EXISTS payment_provider_status VARCHAR(100);

CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_payment_status VARCHAR(50),
  new_payment_status VARCHAR(50),
  previous_order_status VARCHAR(50),
  new_order_status VARCHAR(50),
  changed_by VARCHAR(100) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
```

**Script 3 - Markup:**
```sql
ALTER TABLE config ADD COLUMN IF NOT EXISTS markup_percentage DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE config ADD CONSTRAINT markup_percentage_range CHECK (markup_percentage >= 0 AND markup_percentage <= 100);
```

**Script 4 - Frete:**
```sql
ALTER TABLE config ADD COLUMN IF NOT EXISTS cep_origem VARCHAR(8);
ALTER TABLE config ADD COLUMN IF NOT EXISTS frete_gratis_acima DECIMAL(10,2) DEFAULT 0;
ALTER TABLE config ADD COLUMN IF NOT EXISTS prazo_adicional INTEGER DEFAULT 0;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS frete_servico VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS frete_valor DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS frete_prazo INTEGER DEFAULT 0;
```

**Script 5 - Múltiplas imagens:**
```sql
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image TEXT NOT NULL,
  image_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
```

**Script 6 - Estoque:**
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 1;
```

**Script 7 - Customers:**
```sql
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(36) PRIMARY KEY,
  nome_completo VARCHAR(200) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  cpf VARCHAR(14),
  cep VARCHAR(9) NOT NULL,
  rua VARCHAR(255) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  complemento VARCHAR(100),
  bairro VARCHAR(100) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  aceita_marketing BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'bloqueado')),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_login_em TIMESTAMP,
  deletado_em TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expira_em TIMESTAMP NOT NULL,
  usado BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id VARCHAR(36) REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_password_tokens_customer ON password_reset_tokens(customer_id);
CREATE INDEX IF NOT EXISTS idx_password_tokens_token ON password_reset_tokens(token);

CREATE OR REPLACE FUNCTION update_customer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_updated_at 
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_customer_updated_at();
```

**Script 8 - Email verification:**
```sql
CREATE TABLE IF NOT EXISTS email_verifications (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON email_verifications(code);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires ON email_verifications(expires_at);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
```

**Script 9 - Endereços:**
```sql
ALTER TABLE customers DROP COLUMN IF EXISTS cep;
ALTER TABLE customers DROP COLUMN IF EXISTS rua;
ALTER TABLE customers DROP COLUMN IF EXISTS numero;
ALTER TABLE customers DROP COLUMN IF EXISTS complemento;
ALTER TABLE customers DROP COLUMN IF EXISTS bairro;
ALTER TABLE customers DROP COLUMN IF EXISTS cidade;
ALTER TABLE customers DROP COLUMN IF EXISTS estado;

CREATE TABLE IF NOT EXISTS customer_addresses (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  nome_endereco VARCHAR(100) NOT NULL,
  cep VARCHAR(9) NOT NULL,
  rua VARCHAR(255) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  complemento VARCHAR(100),
  bairro VARCHAR(100) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON customer_addresses(customer_id, is_default);
```

**Script 10 - Custom fields:**
```sql
DROP TABLE IF EXISTS product_field_values CASCADE;
DROP TABLE IF EXISTS custom_fields CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TYPE IF EXISTS field_type CASCADE;

CREATE TYPE field_type AS ENUM ('text', 'number', 'currency');

CREATE TABLE IF NOT EXISTS field_definitions (
  id VARCHAR(36) PRIMARY KEY,
  field_name VARCHAR(100) NOT NULL UNIQUE,
  field_type field_type NOT NULL,
  is_default BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT true,
  field_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_fields (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  field_id VARCHAR(36) NOT NULL REFERENCES field_definitions(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  UNIQUE(product_id, field_id)
);

ALTER TABLE products DROP COLUMN IF EXISTS category_id;

INSERT INTO field_definitions (id, field_name, field_type, is_default, can_delete, field_order) VALUES
  ('field-name', 'Nome', 'text', true, false, 1),
  ('field-price', 'Preço', 'currency', true, false, 2),
  ('field-description', 'Descrição', 'text', true, false, 3),
  ('field-image', 'Imagem', 'text', true, false, 4)
ON CONFLICT (field_name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_product_fields_product ON product_fields(product_id);
CREATE INDEX IF NOT EXISTS idx_product_fields_field ON product_fields(field_id);
```

**Script 11 - Mercado Pago:**
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
```

**Script 12 - Order items image:**
```sql
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image TEXT;
```

**Script 13 - Payment config:**
```sql
ALTER TABLE config ADD COLUMN IF NOT EXISTS enable_online_checkout BOOLEAN DEFAULT true;
ALTER TABLE config ADD COLUMN IF NOT EXISTS enable_whatsapp_checkout BOOLEAN DEFAULT true;
ALTER TABLE config ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '["PIX", "CARD", "BOLETO"]'::jsonb;
```

**Script 14 - Colunas faltantes:**
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_deadline DATE;
ALTER TABLE config ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
ALTER TABLE config ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE field_definitions ADD COLUMN IF NOT EXISTS options TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS numero VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS estado VARCHAR(2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cep VARCHAR(9);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_code);
```

---

### PARTE 2: EC2 Instance

#### 2.1 Conectar na EC2

```bash
ssh -i sua-chave.pem ubuntu@54.221.171.166
```

#### 2.2 Atualizar Código

```bash
# Parar backend
pm2 stop vitrinepro-backend

# Backup do .env
cd ~/vitrine/backend
cp .env .env.backup

# Atualizar código
cd ~/vitrine
git pull origin main
```

#### 2.3 Configurar Backend

Criar/editar `backend/.env`:

```bash
cd ~/vitrine/backend
nano .env
```

Conteúdo:
```env
# Database RDS
DB_HOST=vitrine-db.cata6og4ssb9.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=master_vitrine
DB_PASSWORD='SUA_SENHA_AQUI'
DB_NAME=vitrinedb
DB_SSL=true

# Server
PORT=3001

# Mercado Pago
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx

# AWS SES (opcional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
EMAIL_FROM=noreply@seudominio.com

# Frontend URL
FRONTEND_URL=http://54.221.171.166
```

#### 2.4 Configurar SSL no db.js

Editar `backend/db.js`:

```javascript
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);
```

#### 2.5 Instalar Dependências e Iniciar Backend

```bash
cd ~/vitrine/backend
rm -rf node_modules package-lock.json
npm install

# Deletar processo antigo e criar novo
pm2 delete vitrinepro-backend
pm2 start server.js --name vitrinepro-backend
pm2 save

# Testar
curl http://localhost:3001/api/config
```

#### 2.6 Build do Frontend

```bash
cd ~/vitrine
npm install
npm run build
```

#### 2.7 Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/vitrine
```

Conteúdo:
```nginx
server {
    listen 80;
    server_name 54.221.171.166;

    # Frontend (arquivos estáticos)
    location / {
        root /home/ubuntu/vitrine/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ativar e reiniciar:
```bash
sudo ln -sf /etc/nginx/sites-available/vitrine /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 2.8 Configurar PM2 Startup

```bash
pm2 save
pm2 startup
# Copiar e executar o comando que aparecer
```

---

### PARTE 3: Lambda Function (Frete)

#### 3.1 Criar Lambda

1. AWS Console → Lambda → Create function
2. Configure:
   - Function name: vitrine-frete
   - Runtime: Python 3.12
   - Architecture: x86_64
3. Cole o código do `frete-service/lambda_function.py`
4. Deploy

#### 3.2 Criar Function URL

1. Configuration → Function URL → Create
2. Auth type: NONE
3. Enable CORS
4. Copiar URL gerada

#### 3.3 Configurar Backend para usar Lambda

Editar `backend/server.js`, procurar a rota `/api/frete/calcular` e substituir por:

```javascript
// ========== FRETE ==========
app.post('/api/frete/calcular', async (req, res) => {
  try {
    const { cepOrigem, cepDestino, peso, comprimento, altura, largura } = req.body;

    const response = await fetch('https://7dwqzuotfn7yyfhokzrjz465rm0lcvlu.lambda-url.us-east-1.on.aws/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cepOrigem,
        cepDestino,
        peso: peso || 0.3,
        comprimento: comprimento || 16,
        altura: altura || 2,
        largura: largura || 11
      })
    });

    if (!response.ok) {
      throw new Error('Erro ao calcular frete');
    }

    const resultado = await response.json();
    res.json(resultado);
  } catch (err) {
    console.error('Erro ao calcular frete:', err);
    res.status(500).json({ error: err.message });
  }
});
```

Reiniciar backend:
```bash
pm2 restart vitrinepro-backend
pm2 save
```

---

## ✅ Verificação Final

### Testar Backend
```bash
curl http://localhost:3001/api/config
```

### Testar Frete
```bash
curl -X POST http://localhost:3001/api/frete/calcular \
  -H "Content-Type: application/json" \
  -d '{"cepOrigem":"01310100","cepDestino":"20040020","peso":0.5}'
```

### Testar Frontend
Acesse: http://54.221.171.166

---

## 📊 Recursos AWS Utilizados

| Serviço | Tipo | Custo Mensal (Free Tier) |
|---------|------|--------------------------|
| RDS PostgreSQL | db.t3.micro | $0 (12 meses) |
| EC2 | t2.micro | $0 (12 meses) |
| Lambda | Python 3.12 | $0 (1M req/mês) |
| **Total** | | **$0/mês** |

Após free tier: ~$20-30/mês

---

## 🔧 Manutenção

### Atualizar Backend
```bash
ssh -i sua-chave.pem ubuntu@54.221.171.166
cd ~/vitrine
git pull
cd backend
npm install
pm2 restart vitrinepro-backend
```

### Atualizar Frontend
```bash
cd ~/vitrine
git pull
npm install
npm run build
sudo systemctl reload nginx
```

### Ver Logs
```bash
pm2 logs vitrinepro-backend
sudo tail -f /var/log/nginx/error.log
```

### Backup do Banco
```bash
pg_dump -h vitrine-db.cata6og4ssb9.us-east-1.rds.amazonaws.com \
  -U master_vitrine -d vitrinedb > backup.sql
```

---

## 🆘 Troubleshooting

### Backend não conecta no RDS
- Verificar Security Group do RDS (porta 5432)
- Verificar credenciais no .env
- Verificar SSL habilitado no db.js

### Frontend não carrega
- Verificar se Nginx está rodando: `sudo systemctl status nginx`
- Verificar logs: `sudo tail -f /var/log/nginx/error.log`
- Verificar build: `ls -la ~/vitrine/dist`

### Frete não calcula
- Testar Lambda diretamente
- Verificar URL da Lambda no server.js
- Ver logs: `pm2 logs vitrinepro-backend`

---

## 📞 Informações Importantes

**Endpoints:**
- Frontend: http://54.221.171.166
- Backend: http://54.221.171.166/api
- RDS: vitrine-db.cata6og4ssb9.us-east-1.rds.amazonaws.com:5432
- Lambda: https://7dwqzuotfn7yyfhokzrjz465rm0lcvlu.lambda-url.us-east-1.on.aws/

**Credenciais:**
- RDS User: master_vitrine
- Database: vitrinedb
- Admin padrão: admin/admin (alterar após primeiro login)

**Região AWS:** us-east-1

---

**Deploy realizado com sucesso em 17/02/2026** ✅
