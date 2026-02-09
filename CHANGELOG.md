# Changelog - Vitrine Pro

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [2026-02-09] - Melhorias na Área do Cliente e Pagamentos

### Corrigido
- **Campo de endereço na conta do cliente**: Corrigido bug onde o campo `rua` estava sendo usado ao invés de `endereco`, causando dados incompletos na exibição do endereço do cliente
- **Validação de boleto**: Adicionada validação de dados do cliente antes de gerar boleto, com mensagens de erro claras

### Melhorado
- **Botão de excluir conta**: Redesenhado para ser mais discreto e menos chamativo
  - Removido card vermelho "Zona de Perigo"
  - Removido ícone de lixeira
  - Removido texto explicativo
  - Botão pequeno com texto vermelho discreto
  - Mantém confirmação de segurança ao clicar

### Técnico
- Componente `CustomerAccount.tsx`: Campo `customer.rua` alterado para `customer.endereco`
- Componente `PaymentForm.tsx`: Adicionada validação de `customerData` antes de processar boleto
- Melhor tratamento de erros na geração de boleto

---

## [2026-02-08] - Sistema de Status e Gestão de Pedidos

### Adicionado
- **Sistema de status padronizado globalmente**
  - Enums para PaymentStatus e OrderStatus
  - Mapeamento automático entre status de pagamento e pedido
  - Histórico completo de mudanças de status
  - Componentes visuais (StatusBadge, OrderTimeline)

- **Registro manual de pedidos**
  - Formulário completo para admin registrar pedidos manualmente
  - Busca de produtos por ID ou nome
  - Criação de clientes inline (apenas nome obrigatório)
  - Data customizável
  - Status customizáveis

- **Gestão avançada de pedidos**
  - Edição de status com validação
  - Campos obrigatórios para envio (tracking code, delivery deadline)
  - Timeline visual de status
  - Histórico de mudanças

- **Dashboard de vendas aprimorado**
  - Filtros por data e status
  - Métricas de faturamento
  - Integração com registro manual
  - Visualização detalhada de pedidos

### Modificado
- **Banco de dados**
  - Timezone configurado para America/Sao_Paulo (GMT-3)
  - Email de clientes agora é opcional e não único
  - Adicionadas colunas: `tracking_code`, `delivery_deadline`
  - Nova tabela: `order_status_history`

- **Componentes**
  - `CustomerAccount.tsx`: Usa StatusBadge para exibição consistente
  - `SalesDashboard.tsx`: Integrado com ManualOrderForm e AdminOrderDetails
  - `PaymentForm.tsx`: Melhorias na criação de cardForm

### Técnico
- Arquivo compartilhado: `/shared/constants/status.ts`
- Backend: `statusManager.js` para gerenciamento centralizado
- Migrations: `migration-status-standardization.sql`
- Documentação: `STATUS_PADRONIZACAO.md`

---

## [Anterior] - Funcionalidades Base

### Implementado
- Catálogo de produtos com busca e filtros
- Carrinho de compras
- Checkout com múltiplas formas de pagamento
- Integração com Mercado Pago (PIX, Cartão, Boleto)
- Painel administrativo completo
- Gestão de clientes
- Área do cliente com histórico
- Sistema responsivo para mobile
- Campos customizáveis por produto
- Configurações visuais da loja
- Dashboard de vendas
- Integração com WhatsApp

---

## Formato

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

### Tipos de mudanças
- **Adicionado** para novas funcionalidades
- **Modificado** para mudanças em funcionalidades existentes
- **Descontinuado** para funcionalidades que serão removidas
- **Removido** para funcionalidades removidas
- **Corrigido** para correção de bugs
- **Segurança** para vulnerabilidades
