# Changelog - Vitrine Pro

## [2.0.0] - 2026-02-10

### 🆕 Adicionado

#### Sistema de Frete
- **Microserviço Python** para cálculo de frete (porta 5001)
- Cálculo de **PAC e SEDEX** baseado em tabelas dos Correios
- **Campo CEP de origem** no painel administrativo
- **UI de cálculo de frete** no carrinho de compras
- Seleção de opção de frete (PAC/SEDEX) pelo cliente
- **Armazenamento de frete** no pedido (serviço, valor, prazo)
- Atualização automática do total com frete selecionado
- Endpoint `/api/frete/calcular` no backend
- Serviço frontend `freteService.ts`
- Campos no banco: `cep_origem`, `frete_servico`, `frete_valor`, `frete_prazo`

#### Sistema de Margem/Markup
- **Campo de margem percentual** no painel administrativo (0-100%)
- Aplicação automática da margem em todos os preços
- **Desconto PIX** igual à margem configurada
- Cálculo inverso correto para desconto PIX
- Serviço `pricing.ts` com funções de cálculo
- Campo no banco: `markup_percentage`

### 🔧 Modificado

#### Backend
- `server.js`: Adicionado endpoint de frete e suporte a margem
- Comunicação HTTP nativa com microserviço Python
- Atualização de pedidos para incluir dados de frete

#### Frontend
- `CartDrawer.tsx`: UI completa de cálculo de frete
- `CheckoutPage.tsx`: Integração com frete no checkout
- `AdminDashboard.tsx`: Campos de CEP origem e margem
- `PaymentForm.tsx`: Cálculo de desconto PIX com margem
- `ProductCard.tsx`: Aplicação de margem nos preços
- `App.tsx`: Carregamento de configurações de frete e margem

#### Banco de Dados
- Tabela `config`: Novos campos `cep_origem` e `markup_percentage`
- Tabela `orders`: Novos campos `frete_servico`, `frete_valor`, `frete_prazo`
- Migration `migration-frete.sql`
- Migration `migration-markup.sql`

### 📚 Documentação
- Criado `FRETE.md` com documentação completa do sistema de frete
- Atualizado `README.md` com arquitetura de microserviços
- Atualizado `frete-service/README.md` com detalhes técnicos
- Criado `CHANGELOG.md` (este arquivo)

### 🏗️ Arquitetura
- Implementada arquitetura de **microserviços**
- Separação de responsabilidades:
  - Python: Cálculo de frete
  - Node.js: API principal e proxy
  - React: Interface do usuário
- Comunicação via HTTP entre serviços

### ⚡ Performance
- Cálculo de frete local (< 100ms)
- Sem dependência de APIs externas
- Microserviço Python leve (~20MB memória)

---

## [1.0.0] - 2026-02-08

### Funcionalidades Iniciais
- Sistema completo de e-commerce
- Integração com Mercado Pago (PIX, Cartão, Boleto)
- Sistema de status padronizado
- Painel administrativo
- Gestão de pedidos e clientes
- Conta do cliente
- Registro manual de pedidos
- Histórico de status
- Rastreamento de entregas

---

## Formato

Este changelog segue o formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

### Tipos de Mudanças
- `Adicionado` para novas funcionalidades
- `Modificado` para mudanças em funcionalidades existentes
- `Depreciado` para funcionalidades que serão removidas
- `Removido` para funcionalidades removidas
- `Corrigido` para correções de bugs
- `Segurança` para vulnerabilidades corrigidas
