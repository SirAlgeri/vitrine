# Vitrine Pro

E-commerce multi-tenant com integração Mercado Pago, cálculo de frete, gestão de pedidos e painel administrativo.

## Funcionalidades

- Catálogo de produtos com busca e filtros
- Carrinho de compras com cálculo de frete (PAC/SEDEX)
- Checkout com PIX, Cartão e Boleto via Mercado Pago
- Sistema de margem/markup com desconto PIX automático
- Painel administrativo completo
- Registro manual de pedidos
- Gestão de clientes e histórico de pedidos
- Rastreamento de entregas
- Conta do cliente
- Multi-tenant por subdomínio
- Responsivo para mobile

## Tecnologias

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Microserviço de frete**: Python 3 (stdlib)
- **Banco**: PostgreSQL
- **Pagamentos**: Mercado Pago SDK

## Pré-requisitos

- Node.js 18+
- Python 3.12+
- Docker (para PostgreSQL)

## Instalação local

### 1. Banco de dados

```bash
docker run -d \
  --name vitrinepro-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=vitrinepro \
  -p 5432:5432 \
  postgres:14

docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/schema.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-status-standardization.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-markup.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-frete.sql
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "ALTER DATABASE vitrinepro SET timezone TO 'America/Sao_Paulo';"
```

### 2. Variáveis de ambiente

Crie `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vitrinepro
PORT=3001
MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui
FRONTEND_URL=http://localhost:5173
```

### 3. Dependências e admin

```bash
npm install
cd backend && npm install
node setup-admin.js   # cria admin@admin.com / admin
```

### 4. Iniciar serviços

```bash
# Terminal 1 — microserviço de frete
cd frete-service && python3 server.py

# Terminal 2 — backend
cd backend && node server.js

# Terminal 3 — frontend
npm run dev
```

### 5. Acessar

- Frontend: http://localhost:5173
- Admin: http://localhost:5173/admin
- Backend: http://localhost:3001
- Frete: http://localhost:5001

### 6. Configuração inicial

No painel admin → Configurações:
- CEP de origem (para cálculo de frete)
- Margem de lucro (%)
- Nome, logo e cores da loja

## Deploy na EC2 (Ubuntu)

### Instalar dependências

```bash
sudo apt update && sudo apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs docker.io docker-compose nginx
sudo npm install -g pm2

sudo systemctl start docker && sudo systemctl enable docker
sudo usermod -aG docker ubuntu
```

### Subir a aplicação

```bash
git clone <repo-url>
cd vitrinepro-catalog

# Banco
docker-compose up -d

# Backend
cd backend && npm install
node setup-admin.js
pm2 start server.js --name vitrinepro-backend
pm2 save && pm2 startup

# Frontend
cd .. && npm install && npm run build
```

### Nginx

```bash
sudo nano /etc/nginx/sites-available/vitrinepro
```

```nginx
server {
    listen 80;
    server_name SEU-DOMINIO.com;

    location / {
        root /home/ubuntu/vitrinepro-catalog/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/vitrinepro /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

### HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com
```

### Atualizar

```bash
cd ~/vitrinepro-catalog && git pull
cd backend && npm install && pm2 restart vitrinepro-backend
cd .. && npm install && npm run build && sudo systemctl reload nginx
```

## Comandos úteis

```bash
# Logs do backend
pm2 logs vitrinepro-backend

# Status
pm2 status

# Reiniciar banco
docker restart vitrinepro-postgres

# Backup do banco
docker exec vitrinepro-postgres pg_dump -U postgres vitrinepro > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < backup.sql

# Health check
curl http://localhost:3001/api/health
```

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Backend não inicia | `pm2 logs vitrinepro-backend` — verificar `.env` |
| Banco não conecta | `docker start vitrinepro-postgres` |
| Porta 3001 ocupada | `lsof -i :3001` e `kill -9 <PID>` |
| Login não funciona | `cd backend && node setup-admin.js` |
| Frontend não carrega | `ls dist/` — verificar se build foi feito |
| Emails não enviam | `pm2 logs \| grep -i email` — verificar SMTP no `.env` |

## Arquitetura

```
Frontend React :5173
      │
      ▼
Backend Node.js :3001
      │              │
      ▼              ▼
PostgreSQL    Microserviço
              Frete Python :5001
```

## Status dos pedidos

**Pagamento:** `PAYMENT_PENDING` → `PAYMENT_PROCESSING` → `PAYMENT_APPROVED` / `PAYMENT_REFUSED` / `PAYMENT_CANCELED` / `PAYMENT_EXPIRED` / `PAYMENT_REFUNDED`

**Pedido:** `ORDER_PENDING_PAYMENT` → `ORDER_PAID` → `ORDER_PREPARING` → `ORDER_SHIPPED` → `ORDER_DELIVERED` / `ORDER_CANCELED` / `ORDER_REFUNDED`
