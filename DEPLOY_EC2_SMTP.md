# 🚀 Deploy Rápido na EC2 com SMTP

Guia simplificado para subir o Vitrine Pro na AWS EC2 com sistema de email SMTP.

## 📋 Pré-requisitos

- ✅ Instância EC2 criada (Ubuntu 22.04)
- ✅ Security Group com portas abertas: 22, 80, 443
- ✅ Chave .pem para acesso SSH
- ✅ Email configurado (Gmail, Outlook, etc)

---

## 🚀 Deploy Automático (Recomendado)

### 1. Execute o script de deploy

No seu computador local, na pasta do projeto:

```bash
./deploy-to-ec2.sh
```

O script vai pedir:
- IP da instância EC2
- Caminho da chave .pem
- Usuário SSH (padrão: ubuntu)

### 2. Conecte na instância

```bash
ssh -i sua-chave.pem ubuntu@SEU-IP-EC2
```

### 3. Configure o .env

```bash
cd ~/vitrinepro
nano backend/.env
```

Cole esta configuração (ajuste com seus dados):

```env
# Banco de Dados
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vitrinepro

# Servidor
PORT=3001
FRONTEND_URL=http://SEU-IP-EC2

# Mercado Pago (PRODUÇÃO)
MERCADOPAGO_ACCESS_TOKEN=seu_token_de_producao_aqui

# SMTP - Gmail (exemplo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app-16-digitos
SMTP_FROM=seu-email@gmail.com
SMTP_FROM_NAME=Sua Loja
```

**Como obter senha de app do Gmail:**
1. https://myaccount.google.com/security → Ativar verificação em 2 etapas
2. https://myaccount.google.com/apppasswords → Criar senha de app
3. Copiar senha de 16 caracteres

Salvar: `Ctrl+O` → `Enter` → `Ctrl+X`

### 4. Execute a configuração final

```bash
./deploy-configure.sh
```

Aguarde 2-3 minutos. O script vai:
- ✅ Configurar PostgreSQL
- ✅ Executar migrations
- ✅ Instalar dependências
- ✅ Iniciar backend com PM2
- ✅ Iniciar microserviço de frete
- ✅ Fazer build do frontend
- ✅ Configurar Nginx

### 5. Acesse a aplicação

```
http://SEU-IP-EC2
```

**Painel Admin:**
```
http://SEU-IP-EC2/admin
Usuário: admin
Senha: admin123 (ou a que você configurou)
```

---

## 🔧 Deploy Manual (Alternativo)

Se preferir fazer passo a passo manualmente:

### 1. Conectar na EC2

```bash
chmod 400 sua-chave.pem
ssh -i sua-chave.pem ubuntu@SEU-IP-EC2
```

### 2. Instalar dependências

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Docker
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# PM2
sudo npm install -g pm2

# Nginx
sudo apt install -y nginx

# Python3 (para microserviço de frete)
sudo apt install -y python3 python3-pip

# Relogar para aplicar grupo docker
exit
ssh -i sua-chave.pem ubuntu@SEU-IP-EC2
```

### 3. Enviar código

**No seu PC local:**

```bash
cd /home/aneca/vitrine

# Criar pacote
tar -czf vitrinepro.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='backend/.env' \
  .

# Enviar para EC2
scp -i sua-chave.pem vitrinepro.tar.gz ubuntu@SEU-IP-EC2:~/
```

**Na EC2:**

```bash
mkdir ~/vitrinepro
tar -xzf vitrinepro.tar.gz -C ~/vitrinepro
cd ~/vitrinepro
```

### 4. Configurar PostgreSQL

```bash
docker run -d \
  --name vitrinepro-postgres \
  --restart unless-stopped \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=vitrinepro \
  -p 5432:5432 \
  -v vitrinepro-db:/var/lib/postgresql/data \
  postgres:14

# Aguardar 10 segundos
sleep 10

# Executar migrations
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/schema.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-status-standardization.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-markup.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-frete.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-email-verification.sql

# Configurar timezone
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "ALTER DATABASE vitrinepro SET timezone TO 'America/Sao_Paulo';"
```

### 5. Configurar Backend

```bash
cd ~/vitrinepro/backend

# Criar .env
nano .env
# Cole a configuração do passo 3 do deploy automático

# Instalar dependências
npm install

# Criar admin
node setup-admin.js

# Iniciar com PM2
pm2 start server.js --name vitrinepro-backend
pm2 save
pm2 startup
```

### 6. Configurar Microserviço de Frete

```bash
cd ~/vitrinepro/frete-service
pm2 start server.py --name vitrinepro-frete --interpreter python3
pm2 save
```

### 7. Build do Frontend

```bash
cd ~/vitrinepro
npm install
npm run build
```

### 8. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/vitrinepro
```

Cole:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        root /home/ubuntu/vitrinepro/dist;
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

    location /frete {
        proxy_pass http://localhost:5001;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/vitrinepro /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Reiniciar
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📊 Comandos Úteis

```bash
# Ver logs do backend
pm2 logs vitrinepro-backend

# Ver logs do frete
pm2 logs vitrinepro-frete

# Ver status dos serviços
pm2 status

# Reiniciar backend
pm2 restart vitrinepro-backend

# Ver logs do PostgreSQL
docker logs vitrinepro-postgres

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 Atualizar Aplicação

```bash
# Conectar na EC2
ssh -i sua-chave.pem ubuntu@SEU-IP-EC2

cd ~/vitrinepro

# Parar serviços
pm2 stop all

# Atualizar código (envie novo tar.gz ou use git pull)
# ...

# Backend
cd backend
npm install
pm2 restart vitrinepro-backend

# Frontend
cd ~/vitrinepro
npm install
npm run build
sudo systemctl reload nginx

# Iniciar tudo
pm2 start all
```

---

## 🐛 Troubleshooting

### Backend não inicia

```bash
pm2 logs vitrinepro-backend
# Verificar erros de conexão com banco ou SMTP
```

### Emails não enviam

```bash
# Ver logs
pm2 logs vitrinepro-backend | grep -i email

# Verificar .env
cat backend/.env | grep SMTP

# Testar SMTP manualmente
node -e "
const nodemailer = require('nodemailer');
const t = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'seu@email.com', pass: 'senha-app' }
});
t.verify().then(console.log).catch(console.error);
"
```

### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Testar conexão
docker exec -it vitrinepro-postgres psql -U postgres -d vitrinepro
```

### Frontend não carrega

```bash
# Verificar se build foi feito
ls -la ~/vitrinepro/dist/

# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Verificar permissões
sudo chown -R www-data:www-data ~/vitrinepro/dist/
```

### Porta 587 bloqueada (SMTP)

Algumas instâncias EC2 bloqueiam porta 587. Soluções:

**Opção 1: Usar porta 465**
```env
SMTP_PORT=465
SMTP_SECURE=true
```

**Opção 2: Solicitar desbloqueio à AWS**
- Abra ticket no AWS Support
- Solicite remoção de throttling SMTP

**Opção 3: Usar SendGrid/Mailgun**
- Não usam porta 587 padrão

---

## 🔒 Configurar HTTPS (Opcional)

Se você tem um domínio:

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seudominio.com

# Renovação automática já está configurada
```

Atualizar `FRONTEND_URL` no `.env`:
```env
FRONTEND_URL=https://seudominio.com
```

---

## ✅ Checklist Final

Antes de considerar o deploy completo:

- [ ] Aplicação acessível via http://SEU-IP
- [ ] Painel admin funcionando
- [ ] Consegue criar produtos
- [ ] Consegue fazer pedidos
- [ ] Emails sendo enviados (verificar logs)
- [ ] Cálculo de frete funcionando
- [ ] Pagamento Mercado Pago configurado (produção)
- [ ] PM2 configurado para iniciar no boot
- [ ] PostgreSQL com volume persistente
- [ ] Nginx configurado corretamente
- [ ] Firewall configurado (portas 22, 80, 443)

---

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs: `pm2 logs`
2. Verifique o status: `pm2 status`
3. Verifique o Nginx: `sudo nginx -t`
4. Verifique o banco: `docker ps`

---

**Deploy criado em:** 20/02/2026
**Sistema de email:** SMTP (sem dependência de AWS SES)
