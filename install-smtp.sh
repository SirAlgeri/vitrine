#!/bin/bash

echo "🚀 Instalando sistema de email SMTP..."
echo ""

# Instalar nodemailer
echo "📦 Instalando nodemailer..."
cd backend
npm install nodemailer

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Configure as variáveis SMTP no arquivo backend/.env"
echo "   Veja exemplos em: backend/.env.smtp.example"
echo ""
echo "2. Escolha um provedor SMTP:"
echo "   - Gmail (gratuito, 500 emails/dia)"
echo "   - Outlook (gratuito)"
echo "   - Zoho (gratuito, domínio próprio)"
echo "   - Seu servidor SMTP próprio"
echo ""
echo "3. Reinicie o backend:"
echo "   cd backend && node server.js"
echo ""
echo "📚 Documentação completa: SMTP_SETUP.md"
echo ""
