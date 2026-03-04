# 🚀 Deploy Vitrine Pro na AWS

## Arquitetura Recomendada

```
┌─────────────────────────────────────────────────┐
│                  CloudFront                      │
│              (CDN + SSL/HTTPS)                   │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼──────────┐
│   S3 Bucket    │  │   EC2 Instance  │
│   (Frontend)   │  │   (Backend)     │
└────────────────┘  └─────────┬───────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼────────┐  ┌──────▼──────┐
            │   RDS Postgres │  │  SES Email  │
            │   (Database)   │  │  (Emails)   │
            └────────────────┘  └─────────────┘
```

---

## 📋 PRÉ-REQUISITOS

- [ ] Conta AWS ativa
- [ ] AWS CLI instalado e configurado
- [ ] Domínio registrado (opcional, mas recomendado)
- [ ] Credenciais do Mercado Pago (produção)
- [ ] Credenciais AWS SES configuradas

---

## 🗄️ PASSO 1: BANCO DE DADOS (RDS)

### 1.1 Criar RDS PostgreSQL

```bash
# Via AWS Console:
# 1. Acesse RDS → Create database
# 2. Engine: PostgreSQL 14+
# 3. Template: Free tier (ou Production)
# 4. DB instance identifier: vitrinepro-db
# 5. Master username: postgres
# 6. Master password: [SENHA_SEGURA]
# 7. DB instance class: db.t3.micro (free tier)
# 8. Storage: 20 GB
# 9. Public access: No
# 10. VPC security group: Criar novo
# 11. Database name: vitrinepro
```

### 1.2 Configurar Security Group

```bash
# Adicionar regra de entrada:
# Type: PostgreSQL
# Protocol: TCP
# Port: 5432
# Source: Security Group da EC2
```

### 1.3 Executar Migrations

```bash
# Conectar ao RDS
psql -h [RDS_ENDPOINT] -U postgres -d vitrinepro

# Executar migrations na ordem:
\i database/schema.sql
\i database/migration-status-standardization.sql
\i database/migration-markup.sql
\i database/migration-frete.sql
\i database/migration-customer-email.sql
\i database/migration-multiple-images.sql
\i database/migration-stock.sql

# Configurar timezone
ALTER DATABASE vitrinepro SET timezone TO 'America/Sao_Paulo';

# Criar registro inicial de config
INSERT INTO config (id, store_name, primary_color, secondary_color) 
VALUES (1, 'Minha Loja', '#3b82f6', '#10b981');
```

---

## 🖥️ PASSO 2: BACKEND (EC2)

### 2.1 Criar EC2 Instance

```bash
# Via AWS Console:
# 1. EC2 → Launch Instance
# 2. Name: vitrinepro-backend
# 3. AMI: Ubuntu Server 22.04 LTS
# 4. Instance type: t2.micro (free tier)
# 5. Key pair: Criar novo ou usar existente
# 6. Network: VPC padrão
# 7. Security group: Criar novo
#    - SSH (22) - Seu IP
#    - HTTP (80) - 0.0.0.0/0
#    - HTTPS (443) - 0.0.0.0/0
#    - Custom TCP (3001) - 0.0.0.0/0
#    - Custom TCP (5001) - 0.0.0.0/0
# 8. Storage: 20 GB
```

### 2.2 Conectar via SSH

```bash
ssh -i sua-chave.pem ubuntu@[EC2_PUBLIC_IP]
```

### 2.3 Instalar Dependências

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Python 3
sudo apt install -y python3 python3-pip

# Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx

# Instalar Git
sudo apt install -y git
```

### 2.4 Clonar Repositório

```bash
cd /home/ubuntu
git clone [SEU_REPOSITORIO_GIT]
cd vitrine
```

### 2.5 Configurar Backend

```bash
cd backend

# Criar .env
cat > .env << EOF
# Database
DATABASE_URL=postgresql://postgres:[SENHA]@[RDS_ENDPOINT]:5432/vitrinepro

# Server
PORT=3001

# Mercado Pago (PRODUÇÃO)
MERCADOPAGO_ACCESS_TOKEN=[TOKEN_PRODUCAO]

# AWS SES
AWS_ACCESS_KEY_ID=[SUA_KEY]
AWS_SECRET_ACCESS_KEY=[SUA_SECRET]
AWS_REGION=us-east-1
EMAIL_FROM=noreply@seudominio.com

# Frontend URL
FRONTEND_URL=https://seudominio.com
EOF

# Instalar dependências
npm install

# Testar
node server.js
```

### 2.6 Configurar Microserviço de Frete

```bash
cd /home/ubuntu/vitrine/frete-service

# Testar
python3 server.py
```

### 2.7 Configurar PM2

```bash
cd /home/ubuntu/vitrine

# Criar ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'vitrinepro-backend',
      cwd: '/home/ubuntu/vitrine/backend',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'vitrinepro-frete',
      cwd: '/home/ubuntu/vitrine/frete-service',
      script: 'server.py',
      interpreter: 'python3',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
EOF

# Iniciar serviços
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
# Copie e execute o comando que aparecer
```

### 2.8 Configurar Nginx (Reverse Proxy)

```bash
sudo nano /etc/nginx/sites-available/vitrinepro

# Adicionar:
server {
    listen 80;
    server_name api.seudominio.com;

    location / {
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

server {
    listen 80;
    server_name frete.seudominio.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Ativar site
sudo ln -s /etc/nginx/sites-available/vitrinepro /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🌐 PASSO 3: FRONTEND (S3 + CloudFront)

### 3.1 Build do Frontend

```bash
# No seu computador local
cd /home/aneca/vitrine

# Atualizar variáveis de ambiente
# Editar services/api.ts e trocar localhost por sua URL de produção

# Build
npm run build
```

### 3.2 Criar S3 Bucket

```bash
# Via AWS Console:
# 1. S3 → Create bucket
# 2. Bucket name: vitrinepro-frontend
# 3. Region: us-east-1
# 4. Block all public access: OFF
# 5. Create bucket
```

### 3.3 Configurar Bucket para Hosting

```bash
# Properties → Static website hosting
# Enable
# Index document: index.html
# Error document: index.html
```

### 3.4 Adicionar Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::vitrinepro-frontend/*"
    }
  ]
}
```

### 3.5 Upload dos Arquivos

```bash
# Via AWS CLI
aws s3 sync dist/ s3://vitrinepro-frontend --delete
```

### 3.6 Criar CloudFront Distribution

```bash
# Via AWS Console:
# 1. CloudFront → Create distribution
# 2. Origin domain: vitrinepro-frontend.s3.amazonaws.com
# 3. Origin path: vazio
# 4. Viewer protocol policy: Redirect HTTP to HTTPS
# 5. Allowed HTTP methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
# 6. Cache policy: CachingOptimized
# 7. Alternate domain names (CNAMEs): seudominio.com, www.seudominio.com
# 8. SSL certificate: Request certificate (ACM)
# 9. Default root object: index.html
# 10. Create distribution
```

### 3.7 Configurar Error Pages

```bash
# CloudFront → Error pages
# Create custom error response:
# HTTP error code: 403
# Customize error response: Yes
# Response page path: /index.html
# HTTP response code: 200

# Repetir para erro 404
```

---

## 🔒 PASSO 4: SSL/HTTPS (Certificate Manager)

### 4.1 Solicitar Certificado

```bash
# Via AWS Console:
# 1. Certificate Manager → Request certificate
# 2. Request a public certificate
# 3. Domain names:
#    - seudominio.com
#    - *.seudominio.com
# 4. Validation method: DNS validation
# 5. Request
```

### 4.2 Validar Domínio

```bash
# Adicionar registros CNAME no seu provedor de DNS (GoDaddy, etc)
# Os registros aparecem no Certificate Manager
```

---

## 🌍 PASSO 5: DNS (Route 53 ou seu provedor)

### 5.1 Configurar Registros DNS

```bash
# No seu provedor de DNS (GoDaddy, etc):

# Frontend (CloudFront)
Type: A (ou ALIAS)
Name: @
Value: [CLOUDFRONT_DOMAIN] ou usar ALIAS para CloudFront

Type: CNAME
Name: www
Value: [CLOUDFRONT_DOMAIN]

# Backend API
Type: A
Name: api
Value: [EC2_PUBLIC_IP]

# Microserviço Frete
Type: A
Name: frete
Value: [EC2_PUBLIC_IP]
```

---

## ✅ PASSO 6: VERIFICAÇÕES FINAIS

### 6.1 Testar Backend

```bash
curl https://api.seudominio.com/api/config
```

### 6.2 Testar Frontend

```bash
# Abrir no navegador
https://seudominio.com
```

### 6.3 Testar Checkout

- [ ] Adicionar produto ao carrinho
- [ ] Calcular frete
- [ ] Finalizar pedido
- [ ] Verificar email recebido
- [ ] Verificar pedido no admin

### 6.4 Monitoramento

```bash
# Ver logs do backend
pm2 logs vitrinepro-backend

# Ver logs do frete
pm2 logs vitrinepro-frete

# Status dos serviços
pm2 status
```

---

## 🔄 ATUALIZAÇÕES FUTURAS

### Atualizar Backend

```bash
ssh -i sua-chave.pem ubuntu@[EC2_PUBLIC_IP]
cd /home/ubuntu/vitrine
git pull
cd backend
npm install
pm2 restart vitrinepro-backend
```

### Atualizar Frontend

```bash
# No seu computador
cd /home/aneca/vitrine
npm run build
aws s3 sync dist/ s3://vitrinepro-frontend --delete

# Invalidar cache do CloudFront
aws cloudfront create-invalidation --distribution-id [DISTRIBUTION_ID] --paths "/*"
```

---

## 💰 CUSTOS ESTIMADOS (AWS Free Tier)

- **RDS (db.t3.micro):** $0/mês (12 meses free tier)
- **EC2 (t2.micro):** $0/mês (12 meses free tier)
- **S3:** ~$0.50/mês (primeiros 5GB grátis)
- **CloudFront:** ~$1/mês (primeiros 50GB grátis)
- **Route 53:** $0.50/mês por hosted zone
- **SES:** $0 (primeiros 62.000 emails/mês grátis)

**Total estimado:** ~$2-5/mês (após free tier: ~$20-30/mês)

---

## 🆘 TROUBLESHOOTING

### Backend não conecta ao RDS
- Verificar Security Group do RDS
- Verificar string de conexão no .env
- Testar conexão: `psql -h [RDS_ENDPOINT] -U postgres -d vitrinepro`

### Frontend não carrega
- Verificar se CloudFront está distribuído (pode levar 15-20 min)
- Verificar se bucket policy está correta
- Verificar error pages no CloudFront

### Emails não enviam
- Verificar se SES está fora do sandbox
- Verificar credenciais AWS no .env
- Verificar logs: `pm2 logs vitrinepro-backend`

### CORS errors
- Adicionar domínio frontend no CORS do backend
- Verificar se FRONTEND_URL está correto no .env

---

## 📞 SUPORTE

Para dúvidas ou problemas, consulte a documentação completa ou abra uma issue.

**Boa sorte com o deploy! 🚀**
