# Vitrine Pro - E-commerce System

Sistema completo de e-commerce com integração Mercado Pago, gestão de pedidos e painel administrativo.

## Funcionalidades

- ✅ Catálogo de produtos com busca e filtros
- ✅ Carrinho de compras
- ✅ Checkout com múltiplas formas de pagamento (PIX, Cartão, Boleto)
- ✅ Integração completa com Mercado Pago
- ✅ Sistema de status padronizado (pagamento + pedido)
- ✅ Painel administrativo completo
- ✅ Registro manual de pedidos
- ✅ Gestão de clientes
- ✅ Histórico de status dos pedidos
- ✅ Rastreamento de entregas
- ✅ Conta do cliente com histórico de pedidos
- ✅ Responsivo para mobile

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+ (via Docker recomendado)
- Conta no Mercado Pago (para pagamentos)

## Instalação Rápida

1. **Clone o repositório**
```bash
git clone <repo-url>
cd vitrine
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o banco de dados**
```bash
# Inicie o PostgreSQL via Docker
docker run -d \
  --name vitrinepro-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=vitrinepro \
  -p 5432:5432 \
  postgres:14

# Execute as migrations
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro < database/schema.sql
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-status-standardization.sql

# Configure timezone
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "ALTER DATABASE vitrinepro SET timezone TO 'America/Sao_Paulo';"
```

4. **Configure as variáveis de ambiente**
```bash
# Backend (.env na pasta backend/)
MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vitrinepro
PORT=3001
```

5. **Inicie o backend**
```bash
cd backend
node server.js
```

6. **Inicie o frontend**
```bash
npm run dev
```

7. **Acesse o sistema**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Documentação Completa

📚 **[Índice Completo da Documentação](DOCS_INDEX.md)** - Navegue por toda a documentação

### Guias Principais
- [Instalação Detalhada](SETUP.md)
- [Referência Rápida](QUICK_REFERENCE.md)
- [Solução de Problemas](TROUBLESHOOTING.md)

### Documentação Técnica
- [Documentação Completa](DOCUMENTACAO.md)
- [Sistema de Status](STATUS_PADRONIZACAO.md)
- [Integração Mercado Pago](MERCADOPAGO.md)
- [Banco de Dados](database/INSTALL.md)

### Deploy e Infraestrutura
- [Configuração Docker](DOCKER_SETUP.md)
- [Deploy na AWS EC2](DEPLOY_EC2.md)

### Histórico
- [Changelog](CHANGELOG.md)

## Estrutura do Projeto

```
vitrine/
├── backend/              # API Node.js + Express
│   ├── server.js        # Servidor principal
│   └── statusManager.js # Gerenciador de status
├── components/          # Componentes React
│   ├── AdminDashboard.tsx
│   ├── AdminOrderDetails.tsx
│   ├── ManualOrderForm.tsx
│   ├── CustomerAccount.tsx
│   ├── PaymentForm.tsx
│   └── StatusComponents.tsx
├── pages/              # Páginas React
├── shared/             # Código compartilhado
│   └── constants/
│       └── status.ts   # Enums e constantes de status
├── database/           # Schemas e migrations
└── docs/              # Documentação

```

## Tecnologias

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Banco**: PostgreSQL
- **Pagamentos**: Mercado Pago SDK
- **UI**: Lucide React (ícones)

## Suporte

Para dúvidas ou problemas, consulte a documentação completa ou abra uma issue.
