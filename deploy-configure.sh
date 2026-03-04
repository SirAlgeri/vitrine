#!/bin/bash

# ========================================
# Configuração Final na EC2
# Execute este script DENTRO da instância EC2
# ========================================

set -e

echo "🔧 Configurando Vitrine Pro na EC2..."
echo ""

# Verificar se está no diretório correto
if [ ! -f "backend/server.js" ]; then
    echo "❌ Execute este script na pasta ~/vitrinepro"
    exit 1
fi

# Verificar se .env existe
if [ ! -f "backend/.env" ]; then
    echo "❌ Arquivo backend/.env não encontrado"
    echo "Crie o arquivo com as configurações SMTP"
    exit 1
fi

# ========================================
# 1. CONFIGURAR BANCO DE DADOS
# ========================================

echo "🗄️  Configurando PostgreSQL..."

# Parar container se já existir
docker stop vitrinepro-postgres 2>/dev/null || true
docker rm vitrinepro-postgres 2>/dev/null || true

# Iniciar PostgreSQL
docker run -d \
  --name vitrinepro-postgres \
  --restart unless-stopped \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=vitrinepro \
  -p 5432:5432 \
  -v vitrinepro-db:/var/lib/postgresql/data \
  postgres:14

echo "⏳ Aguardando PostgreSQL iniciar..."
sleep 10

# Executar migrations
echo "📊 Executando migrations..."

docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/schema.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-status-standardization.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-markup.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-frete.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-email-verification.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-multitenant.sql 2>/dev/null || true
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-admin-tenant.sql 2>/dev/null || true

# Configurar timezone
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "ALTER DATABASE vitrinepro SET timezone TO 'America/Sao_Paulo';"

echo "✅ Banco de dados configurado"
echo ""

# ========================================
# 2. CONFIGURAR BACKEND
# ========================================

echo "🔧 Configurando backend..."

cd backend

# Instalar dependências
npm install

# Criar usuário admin
node setup-admin.js || echo "⚠️  Admin já existe ou erro ao criar"

# Parar backend se já estiver rodando
pm2 stop vitrinepro-backend 2>/dev/null || true
pm2 delete vitrinepro-backend 2>/dev/null || true

# Iniciar backend com PM2
pm2 start server.js --name vitrinepro-backend
pm2 save

# Configurar PM2 para iniciar no boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

echo "✅ Backend configurado e rodando"
echo ""

cd ..

# ========================================
# 3. CONFIGURAR MICROSERVIÇO DE FRETE
# ========================================

echo "📦 Configurando microserviço de frete..."

cd frete-service

# Parar se já estiver rodando
pm2 stop vitrinepro-frete 2>/dev/null || true
pm2 delete vitrinepro-frete 2>/dev/null || true

# Iniciar microserviço
pm2 start server.py --name vitrinepro-frete --interpreter python3
pm2 save

echo "✅ Microserviço de frete configurado"
echo ""

cd ..

# ========================================
# 4. BUILD DO FRONTEND
# ========================================

echo "🎨 Fazendo build do frontend..."

# Instalar dependências
npm install

# Build de produção
npm run build

echo "✅ Frontend compilado"
echo ""

# ========================================
# 5. CONFIGURAR NGINX
# ========================================

echo "🌐 Configurando Nginx..."

# Obter IP público da instância
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Criar configuração do Nginx
sudo tee /etc/nginx/sites-available/vitrinepro > /dev/null << EOF
server {
    listen 80;
    server_name $PUBLIC_IP;

    # Frontend (arquivos estáticos)
    location / {
        root $HOME/vitrinepro/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Microserviço de frete
    location /frete {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # Logs
    access_log /var/log/nginx/vitrinepro-access.log;
    error_log /var/log/nginx/vitrinepro-error.log;
}
EOF

# Ativar site
sudo ln -sf /etc/nginx/sites-available/vitrinepro /etc/nginx/sites-enabled/

# Remover site padrão
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

echo "✅ Nginx configurado"
echo ""

# ========================================
# 6. CONFIGURAR FIREWALL
# ========================================

echo "🔒 Configurando firewall..."

# Permitir portas necessárias
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable

echo "✅ Firewall configurado"
echo ""

# ========================================
# 7. VERIFICAR STATUS
# ========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Status dos serviços:"
echo ""

# Status PM2
pm2 status

echo ""
echo "🗄️  PostgreSQL:"
docker ps | grep vitrinepro-postgres && echo "   ✅ Rodando" || echo "   ❌ Parado"

echo ""
echo "🌐 Nginx:"
sudo systemctl is-active nginx && echo "   ✅ Rodando" || echo "   ❌ Parado"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 APLICAÇÃO NO AR!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌍 Acesse: http://$PUBLIC_IP"
echo ""
echo "📋 Comandos úteis:"
echo "   pm2 logs vitrinepro-backend    # Ver logs do backend"
echo "   pm2 logs vitrinepro-frete      # Ver logs do frete"
echo "   pm2 restart all                # Reiniciar serviços"
echo "   docker logs vitrinepro-postgres # Ver logs do banco"
echo "   sudo systemctl restart nginx   # Reiniciar Nginx"
echo ""
echo "🔧 Painel admin:"
echo "   http://$PUBLIC_IP/admin"
echo "   Usuário: admin"
echo "   Senha: (a que você configurou no setup-admin.js)"
echo ""
