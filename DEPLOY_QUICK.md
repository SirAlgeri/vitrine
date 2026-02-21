# 🎯 GUIA RÁPIDO - Deploy EC2 com SMTP

## 🚀 Opção 1: Deploy Automático (5 minutos)

```bash
# 1. No seu PC, execute:
./deploy-to-ec2.sh

# 2. Informe quando solicitado:
#    - IP da EC2
#    - Caminho da chave .pem
#    - Usuário (ubuntu)

# 3. Conecte na EC2:
ssh -i sua-chave.pem ubuntu@SEU-IP

# 4. Configure o .env:
cd ~/vitrinepro
nano backend/.env

# Cole (ajuste com seus dados):
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vitrinepro
PORT=3001
FRONTEND_URL=http://SEU-IP
MERCADOPAGO_ACCESS_TOKEN=seu_token_producao
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=senha-app-16-digitos
SMTP_FROM=seu-email@gmail.com
SMTP_FROM_NAME=Sua Loja

# Salvar: Ctrl+O, Enter, Ctrl+X

# 5. Execute a configuração:
./deploy-configure.sh

# 6. Acesse:
http://SEU-IP
```

---

## 📧 Como obter senha de app do Gmail

1. https://myaccount.google.com/security
   → Ativar "Verificação em duas etapas"

2. https://myaccount.google.com/apppasswords
   → Criar senha de app
   → Copiar 16 caracteres

---

## 📋 Comandos Úteis

```bash
# Ver logs
pm2 logs vitrinepro-backend

# Status dos serviços
pm2 status

# Reiniciar backend
pm2 restart vitrinepro-backend

# Ver logs do banco
docker logs vitrinepro-postgres

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🐛 Problemas Comuns

### Emails não enviam
```bash
# Ver logs
pm2 logs vitrinepro-backend | grep -i email

# Verificar .env
cat backend/.env | grep SMTP
```

### Backend não inicia
```bash
pm2 logs vitrinepro-backend
# Verificar DATABASE_URL e SMTP_*
```

### Frontend não carrega
```bash
# Verificar build
ls -la ~/vitrinepro/dist/

# Ver logs Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## ✅ Checklist

- [ ] Aplicação acessível via http://SEU-IP
- [ ] Painel admin funcionando (/admin)
- [ ] Emails sendo enviados
- [ ] Cálculo de frete funcionando
- [ ] Mercado Pago configurado

---

📚 **Documentação completa:** DEPLOY_EC2_SMTP.md
