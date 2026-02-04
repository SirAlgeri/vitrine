# 🚀 Deploy na AWS EC2 - VitrinePro

## 📋 Pré-requisitos

1. **Instância EC2 criada** (Ubuntu 22.04 LTS recomendado)
2. **Security Group configurado** com portas:
   - 22 (SSH)
   - 80 (HTTP)
   - 443 (HTTPS)
   - 3001 (Backend - temporário)
   - 5432 (PostgreSQL - apenas se externo)
3. **Par de chaves (.pem)** para acesso SSH

---

## 🔧 Passo 1: Conectar na EC2

```bash
# Dar permissão à chave
chmod 400 sua-chave.pem

# Conectar via SSH
ssh -i sua-chave.pem ubuntu@SEU-IP-PUBLICO
```

---

## 📦 Passo 2: Instalar Dependências na EC2

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Docker e Docker Compose
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Instalar Nginx
sudo apt install -y nginx

# Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# Relogar para aplicar grupo docker
exit
# Conectar novamente
ssh -i sua-chave.pem ubuntu@SEU-IP-PUBLICO
```

---

## 📤 Passo 3: Enviar Código para EC2

### Opção A: Via Git (Recomendado)

```bash
# Na EC2
cd ~
git clone https://github.com/SEU-USUARIO/vitrinepro-catalog.git
cd vitrinepro-catalog
```

### Opção B: Via SCP (do seu PC)

```bash
# No seu PC local
cd /home/samuelalgeri/vitrinepro-catalog
tar -czf vitrinepro.tar.gz --exclude=node_modules --exclude=.git .

# Enviar para EC2
scp -i sua-chave.pem vitrinepro.tar.gz ubuntu@SEU-IP-PUBLICO:~

# Na EC2
cd ~
mkdir vitrinepro-catalog
tar -xzf vitrinepro.tar.gz -C vitrinepro-catalog
cd vitrinepro-catalog
```

---

## 🗄️ Passo 4: Configurar PostgreSQL na EC2

```bash
# Subir PostgreSQL com Docker
docker-compose up -d

# Verificar se está rodando
docker ps

# Executar migration do WhatsApp
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-whatsapp.sql
```

---

## 🔧 Passo 5: Configurar Backend

```bash
cd backend

# Instalar dependências
npm install

# Criar usuário admin
node setup-admin.js

# Configurar variáveis de ambiente (já está no .env)
# Verificar se está correto:
cat .env

# Iniciar backend com PM2
pm2 start server.js --name vitrinepro-backend
pm2 save
pm2 startup
```

---

## 🎨 Passo 6: Build do Frontend

```bash
cd ~/vitrinepro-catalog

# Instalar dependências
npm install

# Build de produção
npm run build

# Isso cria a pasta 'dist' com arquivos estáticos
```

---

## 🌐 Passo 7: Configurar Nginx

```bash
# Criar configuração do Nginx
sudo nano /etc/nginx/sites-available/vitrinepro
```

Cole este conteúdo:

```nginx
server {
    listen 80;
    server_name SEU-IP-PUBLICO;  # ou seu domínio

    # Frontend (arquivos estáticos)
    location / {
        root /home/ubuntu/vitrinepro-catalog/dist;
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
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/vitrinepro /etc/nginx/sites-enabled/

# Remover site padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## ✅ Passo 8: Verificar Deploy

```bash
# Ver logs do backend
pm2 logs vitrinepro-backend

# Ver status
pm2 status

# Ver logs do PostgreSQL
docker logs vitrinepro-postgres
```

Acesse no navegador: **http://SEU-IP-PUBLICO**

---

## 🔒 Passo 9: Configurar HTTPS (Opcional mas Recomendado)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado SSL (precisa de domínio)
sudo certbot --nginx -d seudominio.com

# Renovação automática já está configurada
```

---

## 🔄 Atualizar Aplicação

```bash
# Parar backend
pm2 stop vitrinepro-backend

# Atualizar código (git pull ou scp novo arquivo)
cd ~/vitrinepro-catalog
git pull

# Backend
cd backend
npm install
pm2 restart vitrinepro-backend

# Frontend
cd ~/vitrinepro-catalog
npm install
npm run build
sudo systemctl reload nginx
```

---

## 📊 Comandos Úteis

```bash
# Ver logs em tempo real
pm2 logs vitrinepro-backend --lines 100

# Reiniciar backend
pm2 restart vitrinepro-backend

# Ver uso de recursos
pm2 monit

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 🐛 Troubleshooting

### Backend não inicia
```bash
pm2 logs vitrinepro-backend
# Verificar se PostgreSQL está rodando
docker ps
```

### Erro de conexão com banco
```bash
# Verificar .env do backend
cat backend/.env
# Testar conexão
docker exec -it vitrinepro-postgres psql -U postgres -d vitrinepro
```

### Frontend não carrega
```bash
# Verificar se build foi feito
ls -la dist/
# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

---

Pronto! Seu e-commerce está no ar! 🎉
