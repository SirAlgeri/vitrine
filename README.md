# Vitrine Pro - E-commerce System

Sistema completo de e-commerce com integração Mercado Pago, cálculo de frete, gestão de pedidos e painel administrativo.

## Funcionalidades

- ✅ Catálogo de produtos com busca e filtros
- ✅ Carrinho de compras
- ✅ **Cálculo de frete (PAC/SEDEX) via microserviço**
- ✅ Checkout com múltiplas formas de pagamento (PIX, Cartão, Boleto)
- ✅ Integração completa com Mercado Pago
- ✅ Sistema de margem/markup com desconto PIX
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
- Python 3.12+ (para microserviço de frete)
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
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-markup.sql
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-frete.sql

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

5. **Inicie o microserviço de frete (Python)**
```bash
cd frete-service
python3 server.py
# Rodará na porta 5001
```

6. **Inicie o backend (Node.js)**
```bash
cd backend
node server.js
# Rodará na porta 3001
```

7. **Inicie o frontend (React)**
```bash
npm run dev
# Rodará na porta 5173
```

8. **Configure o sistema**
- Acesse: http://localhost:5173/admin
- Vá em "Configurações"
- Configure:
  - CEP de Origem (para cálculo de frete)
  - Margem de Lucro (%)
  - Outras configurações

9. **Acesse o sistema**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Microserviço Frete: http://localhost:5001

## Documentação Completa

📚 **[Índice Completo da Documentação](DOCS_INDEX.md)** - Navegue por toda a documentação

### Guias Principais
- [Instalação Detalhada](SETUP.md)
- [Referência Rápida](QUICK_REFERENCE.md)
- [Solução de Problemas](TROUBLESHOOTING.md)

### Documentação Técnica
- [Documentação Completa](DOCUMENTACAO.md)
- [Sistema de Frete](FRETE.md) 🆕
- [Sistema de Status](STATUS_PADRONIZACAO.md)
- [Integração Mercado Pago](MERCADOPAGO.md)
- [Banco de Dados](database/INSTALL.md)

### Deploy e Infraestrutura
- [Configuração Docker](DOCKER_SETUP.md)
- [Deploy na AWS EC2](DEPLOY_EC2.md)

### Histórico
- [Changelog](CHANGELOG.md)

## Arquitetura

### Microserviços
```
┌─────────────────┐
│  Frontend React │ :5173
│  (TypeScript)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Backend Node   │ :3001
│  (Express)      │
└────┬────────┬───┘
     │        │
     │        └──────────┐
     ▼                   ▼
┌─────────────┐   ┌──────────────┐
│ PostgreSQL  │   │ Microserviço │
│   Banco     │   │ Frete Python │ :5001
└─────────────┘   └──────────────┘
```

## Estrutura do Projeto

```
vitrine/
├── frete-service/       # 🆕 Microserviço Python
│   ├── server.py       # Cálculo de frete
│   └── README.md       # Documentação
├── backend/            # API Node.js + Express
│   ├── server.js      # Servidor principal
│   └── statusManager.js
├── services/           # 🆕 Serviços frontend
│   ├── freteService.ts # Cliente HTTP frete
│   └── pricing.ts     # Cálculo de margem
├── components/         # Componentes React
│   ├── AdminDashboard.tsx
│   ├── CartDrawer.tsx # 🆕 Com cálculo de frete
│   ├── PaymentForm.tsx
│   └── ...
├── pages/             # Páginas React
│   ├── CheckoutPage.tsx # 🆕 Com frete
│   └── ...
├── database/          # Schemas e migrations
│   ├── migration-frete.sql # 🆕
│   └── migration-markup.sql # 🆕
└── docs/             # Documentação
```

## Tecnologias

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Microserviço**: Python 3 (stdlib apenas)
- **Banco**: PostgreSQL
- **Pagamentos**: Mercado Pago SDK
- **UI**: Lucide React (ícones)

## Novidades v2.0

### Sistema de Frete
- ✅ Microserviço Python independente
- ✅ Cálculo PAC e SEDEX
- ✅ Baseado em tabelas dos Correios
- ✅ Configuração de CEP origem
- ✅ Seleção de frete no carrinho
- ✅ Frete salvo no pedido

### Sistema de Margem/Markup
- ✅ Configuração de margem percentual
- ✅ Aplicação automática nos preços
- ✅ Desconto PIX igual à margem
- ✅ Cálculo inverso correto

## Suporte

Para dúvidas ou problemas, consulte a documentação completa ou abra uma issue.
