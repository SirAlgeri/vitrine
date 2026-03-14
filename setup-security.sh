#!/bin/bash

echo "🔐 Configuração de Segurança - VitrinePro"
echo "=========================================="
echo ""

# Verificar se .env existe
if [ ! -f "backend/.env" ]; then
    echo "❌ Arquivo backend/.env não encontrado!"
    echo "📝 Criando a partir do .env.example..."
    cp backend/.env.example backend/.env
fi

# Gerar JWT Secret
echo "🔑 Gerando JWT Secret..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Verificar se JWT_SECRET já existe no .env
if grep -q "JWT_SECRET=" backend/.env; then
    echo "⚠️  JWT_SECRET já existe no .env"
    read -p "Deseja substituir? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" backend/.env
        echo "✅ JWT_SECRET atualizado!"
    else
        echo "⏭️  Mantendo JWT_SECRET existente"
    fi
else
    echo "JWT_SECRET=$JWT_SECRET" >> backend/.env
    echo "✅ JWT_SECRET adicionado ao .env!"
fi

# Configurar ALLOWED_ORIGINS
echo ""
echo "🌐 Configurando ALLOWED_ORIGINS..."
read -p "Digite o domínio principal (ex: microhub.com.br): " DOMAIN

if [ ! -z "$DOMAIN" ]; then
    ORIGINS="http://localhost:5173,https://$DOMAIN,https://*.$DOMAIN"
    
    if grep -q "ALLOWED_ORIGINS=" backend/.env; then
        sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=$ORIGINS|" backend/.env
        echo "✅ ALLOWED_ORIGINS atualizado!"
    else
        echo "ALLOWED_ORIGINS=$ORIGINS" >> backend/.env
        echo "✅ ALLOWED_ORIGINS adicionado ao .env!"
    fi
else
    echo "⏭️  Pulando configuração de ALLOWED_ORIGINS"
fi

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Revisar backend/.env"
echo "2. Reiniciar o backend: pm2 restart backend"
echo "3. Build do frontend: npm run build"
echo ""
echo "📚 Documentação: SECURITY_IMPLEMENTED.md"
