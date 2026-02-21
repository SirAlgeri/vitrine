#!/bin/bash

echo "📧 Testando configuração SMTP..."
echo ""

# Verificar se nodemailer está instalado
if ! npm list nodemailer &> /dev/null; then
    echo "❌ nodemailer não está instalado"
    echo "Execute: ./install-smtp.sh"
    exit 1
fi

echo "✅ nodemailer instalado"

# Verificar variáveis de ambiente
if [ ! -f "backend/.env" ]; then
    echo "❌ Arquivo backend/.env não encontrado"
    exit 1
fi

echo "✅ Arquivo .env encontrado"

# Verificar variáveis SMTP
if ! grep -q "SMTP_HOST" backend/.env; then
    echo "❌ Variáveis SMTP não configuradas no .env"
    echo "Veja exemplos em: backend/.env.smtp.example"
    exit 1
fi

echo "✅ Variáveis SMTP configuradas"
echo ""
echo "🎉 Configuração OK!"
echo ""
echo "Para testar o envio:"
echo "1. Inicie o backend: cd backend && node server.js"
echo "2. Acesse o painel admin"
echo "3. Atualize o status de um pedido"
echo ""
