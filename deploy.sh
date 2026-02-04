#!/bin/bash

# Script de deploy rápido para EC2
# Uso: ./deploy.sh

echo "🚀 Iniciando deploy do VitrinePro..."

# Parar backend
echo "⏸️  Parando backend..."
pm2 stop vitrinepro-backend

# Atualizar código (se usando git)
# git pull

# Backend
echo "📦 Instalando dependências do backend..."
cd backend
npm install

echo "🔄 Reiniciando backend..."
pm2 restart vitrinepro-backend

# Frontend
echo "🎨 Buildando frontend..."
cd ..
npm install
npm run build

echo "🌐 Recarregando Nginx..."
sudo systemctl reload nginx

echo "✅ Deploy concluído!"
echo "📊 Status dos serviços:"
pm2 status
