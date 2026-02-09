# 📋 Referência Rápida - Vitrine Pro

Comandos e informações essenciais para uso diário.

## 🚀 Iniciar o Sistema

```bash
# 1. Iniciar banco de dados (se não estiver rodando)
docker start vitrinepro-postgres

# 2. Iniciar backend (terminal 1)
cd backend
node server.js

# 3. Iniciar frontend (terminal 2)
npm run dev
```

## 🔑 Credenciais Padrão

**Admin:**
- URL: http://localhost:5173/admin
- Email: `admin@admin.com`
- Senha: `admin`

**Banco de Dados:**
- Host: `localhost`
- Porta: `5432`
- Database: `vitrinepro`
- User: `postgres`
- Password: `postgres`

## 🔌 Endpoints Principais

```
Backend:  http://localhost:3001
Frontend: http://localhost:5173
Health:   http://localhost:3001/api/health
```

## 📊 Status do Sistema

### Status de Pagamento (7)
- `PAYMENT_PENDING` - Aguardando pagamento
- `PAYMENT_PROCESSING` - Processando
- `PAYMENT_APPROVED` - Aprovado
- `PAYMENT_REFUSED` - Recusado
- `PAYMENT_CANCELED` - Cancelado
- `PAYMENT_EXPIRED` - Expirado
- `PAYMENT_REFUNDED` - Reembolsado

### Status de Pedido (7)
- `ORDER_PENDING_PAYMENT` - Aguardando pagamento
- `ORDER_PAID` - Pago
- `ORDER_PREPARING` - Preparando
- `ORDER_SHIPPED` - Enviado
- `ORDER_DELIVERED` - Entregue
- `ORDER_CANCELED` - Cancelado
- `ORDER_REFUNDED` - Reembolsado

## 🗄️ Comandos do Banco

```bash
# Conectar ao banco
docker exec -it vitrinepro-postgres psql -U postgres -d vitrinepro

# Listar tabelas
\dt

# Ver estrutura
\d orders

# Consultas úteis
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM customers;

# Últimos pedidos
SELECT id, customer_name, total, order_status, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

# Sair
\q
```

## 🔧 Comandos de Manutenção

```bash
# Reiniciar backend
pkill -f "node server.js"
cd backend && node server.js

# Reiniciar banco
docker restart vitrinepro-postgres

# Ver logs do banco
docker logs vitrinepro-postgres

# Verificar saúde
curl http://localhost:3001/api/health

# Verificar timezone
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "SHOW timezone;"
```

## 📦 Backup e Restore

```bash
# Fazer backup
docker exec vitrinepro-postgres pg_dump -U postgres vitrinepro > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < backup_20260209.sql
```

## 🎨 Estrutura de Arquivos Importantes

```
vitrine/
├── backend/
│   ├── server.js              # Servidor principal
│   ├── statusManager.js       # Gerenciador de status
│   └── .env                   # Variáveis de ambiente
├── components/
│   ├── AdminDashboard.tsx     # Dashboard admin
│   ├── AdminOrderDetails.tsx  # Detalhes do pedido (admin)
│   ├── ManualOrderForm.tsx    # Registro manual de pedidos
│   ├── CustomerAccount.tsx    # Conta do cliente
│   ├── PaymentForm.tsx        # Formulário de pagamento
│   └── StatusComponents.tsx   # Componentes de status
├── shared/constants/
│   └── status.ts              # Enums de status
└── database/
    ├── schema.sql             # Schema inicial
    └── migration-*.sql        # Migrations
```

## 🐛 Problemas Comuns

| Problema | Solução Rápida |
|----------|----------------|
| Backend não inicia | `pkill -f "node server.js"` e reiniciar |
| Porta 3001 ocupada | `lsof -i :3001` e `kill -9 <PID>` |
| Banco não conecta | `docker start vitrinepro-postgres` |
| Login não funciona | `cd backend && node setup-admin.js` |
| Produtos não aparecem | Verificar console do navegador (F12) |
| Cores não aplicam | Limpar cache (Ctrl+Shift+R) |

## 📚 Documentação Completa

- [README.md](README.md) - Visão geral
- [SETUP.md](SETUP.md) - Instalação detalhada
- [DOCUMENTACAO.md](DOCUMENTACAO.md) - Documentação técnica
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Solução de problemas
- [CHANGELOG.md](CHANGELOG.md) - Histórico de mudanças
- [STATUS_PADRONIZACAO.md](STATUS_PADRONIZACAO.md) - Sistema de status
- [MERCADOPAGO.md](MERCADOPAGO.md) - Integração de pagamentos
- [database/INSTALL.md](database/INSTALL.md) - Instalação do banco

## 🔐 Segurança

**Produção:**
- Altere a senha do admin
- Use variáveis de ambiente para senhas
- Configure HTTPS
- Use tokens JWT
- Implemente rate limiting
- Configure firewall

**Desenvolvimento:**
- Não commite o arquivo `.env`
- Use senhas diferentes para cada ambiente
- Mantenha dependências atualizadas

## 📞 Suporte

1. Consulte [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Verifique logs do backend e banco
3. Verifique console do navegador (F12)
4. Consulte [CHANGELOG.md](CHANGELOG.md) para mudanças recentes
