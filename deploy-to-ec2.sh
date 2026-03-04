#!/bin/bash

# ========================================
# Deploy Vitrine Pro na EC2 com SMTP
# ========================================

set -e  # Parar em caso de erro

echo "🚀 Deploy Vitrine Pro - Iniciando..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para printar com cor
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ========================================
# 1. PREPARAR CÓDIGO LOCALMENTE
# ========================================

echo "📦 Preparando código para deploy..."

# Instalar nodemailer localmente
cd backend
npm install nodemailer
cd ..

# Criar arquivo tar excluindo node_modules e arquivos desnecessários
tar -czf vitrinepro-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='.env.local' \
  --exclude='dist' \
  --exclude='backend/.env' \
  --exclude='*.swp' \
  --exclude='*.bak' \
  .

print_success "Código empacotado: vitrinepro-deploy.tar.gz"
echo ""

# ========================================
# 2. INFORMAÇÕES DA INSTÂNCIA
# ========================================

echo "🔑 Informações necessárias:"
echo ""
read -p "IP da instância EC2: " EC2_IP
read -p "Caminho da chave .pem: " PEM_KEY
read -p "Usuário SSH (padrão: ubuntu): " SSH_USER
SSH_USER=${SSH_USER:-ubuntu}

echo ""
print_warning "Testando conexão SSH..."

if ssh -i "$PEM_KEY" -o ConnectTimeout=5 "$SSH_USER@$EC2_IP" "echo 'Conexão OK'" &> /dev/null; then
    print_success "Conexão SSH estabelecida"
else
    print_error "Não foi possível conectar na instância"
    echo "Verifique:"
    echo "  - IP da instância está correto"
    echo "  - Chave .pem tem permissão 400 (chmod 400 $PEM_KEY)"
    echo "  - Security Group permite SSH (porta 22)"
    exit 1
fi

echo ""

# ========================================
# 3. ENVIAR CÓDIGO PARA EC2
# ========================================

echo "📤 Enviando código para EC2..."

scp -i "$PEM_KEY" vitrinepro-deploy.tar.gz "$SSH_USER@$EC2_IP:~/"

print_success "Código enviado"
echo ""

# ========================================
# 4. EXECUTAR INSTALAÇÃO NA EC2
# ========================================

echo "🔧 Instalando na EC2..."
echo ""

ssh -i "$PEM_KEY" "$SSH_USER@$EC2_IP" << 'ENDSSH'

set -e

echo "📦 Descompactando código..."
mkdir -p ~/vitrinepro
tar -xzf vitrinepro-deploy.tar.gz -C ~/vitrinepro
cd ~/vitrinepro

echo "✅ Código descompactado"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "🐳 Instalando Docker..."
    sudo apt update
    sudo apt install -y docker.io docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado"
else
    echo "✅ Docker já instalado"
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    echo "✅ Node.js instalado: $(node -v)"
else
    echo "✅ Node.js já instalado: $(node -v)"
fi

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "🔄 Instalando PM2..."
    sudo npm install -g pm2
    echo "✅ PM2 instalado"
else
    echo "✅ PM2 já instalado"
fi

# Verificar se Nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo "🌐 Instalando Nginx..."
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    echo "✅ Nginx instalado"
else
    echo "✅ Nginx já instalado"
fi

echo ""
echo "✅ Todas as dependências instaladas!"
echo ""
echo "⚠️  PRÓXIMOS PASSOS MANUAIS:"
echo ""
echo "1. Configure o arquivo .env do backend:"
echo "   nano ~/vitrinepro/backend/.env"
echo ""
echo "2. Execute o script de configuração:"
echo "   cd ~/vitrinepro && ./deploy-configure.sh"
echo ""

ENDSSH

print_success "Instalação base concluída!"
echo ""

# ========================================
# 5. INSTRUÇÕES FINAIS
# ========================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 PRÓXIMOS PASSOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Conectar na instância:"
echo "   ssh -i $PEM_KEY $SSH_USER@$EC2_IP"
echo ""
echo "2️⃣  Configurar variáveis de ambiente:"
echo "   cd ~/vitrinepro"
echo "   nano backend/.env"
echo ""
echo "   Adicione as configurações SMTP:"
echo "   ────────────────────────────────────"
echo "   SMTP_HOST=smtp.gmail.com"
echo "   SMTP_PORT=587"
echo "   SMTP_SECURE=false"
echo "   SMTP_USER=seu-email@gmail.com"
echo "   SMTP_PASS=sua-senha-de-app"
echo "   SMTP_FROM=seu-email@gmail.com"
echo "   SMTP_FROM_NAME=Sua Loja"
echo "   FRONTEND_URL=http://$EC2_IP"
echo "   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vitrinepro"
echo "   MERCADOPAGO_ACCESS_TOKEN=seu_token_producao"
echo "   PORT=3001"
echo "   ────────────────────────────────────"
echo ""
echo "3️⃣  Executar configuração final:"
echo "   ./deploy-configure.sh"
echo ""
echo "4️⃣  Acessar aplicação:"
echo "   http://$EC2_IP"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Limpar arquivo temporário
rm vitrinepro-deploy.tar.gz
print_success "Deploy preparado com sucesso!"
