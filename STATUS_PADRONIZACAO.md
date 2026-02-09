# Padronização Global de Status - Implementação Completa

## ✅ Implementado

### 1. Enums e Constantes Globais
**Arquivo:** `/shared/constants/status.ts`

- ✅ `PaymentStatus` - 7 status de pagamento
- ✅ `OrderStatus` - 6 status de pedido
- ✅ `PAYMENT_TO_ORDER_STATUS` - Mapeamento automático
- ✅ `mapMercadoPagoStatus()` - Mapper do gateway
- ✅ Labels e cores para exibição
- ✅ Validação de transições de status

### 2. Backend - Gerenciamento de Status
**Arquivo:** `/backend/statusManager.js`

- ✅ `updateOrderStatus()` - Atualiza status via gateway
- ✅ `updateOrderStatusManual()` - Atualiza status manual (admin)
- ✅ Validações de regras de negócio
- ✅ Registro automático de histórico

### 3. Banco de Dados
**Arquivo:** `/database/migration-status-standardization.sql`

- ✅ Coluna `payment_status` (status interno)
- ✅ Coluna `order_status` (status interno)
- ✅ Coluna `payment_provider_status` (status bruto do gateway)
- ✅ Tabela `order_status_history` (rastreabilidade completa)
- ✅ Índices para performance
- ✅ Migração de dados existentes

### 4. API Endpoints

**Criação de Pedido:**
```
POST /api/orders
- Mapeia automaticamente status do gateway para status interno
- Registra histórico inicial
- Retorna pedido com status padronizados
```

**Atualização de Status (Admin):**
```
PUT /api/orders/:id/status
Body: { order_status, notes }
- Valida transições permitidas
- Registra histórico com origem 'admin'
```

**Histórico de Status:**
```
GET /api/orders/:id/history
- Retorna timeline completa de mudanças
- Inclui origem da mudança (gateway, system, admin, webhook)
```

**Webhook Mercado Pago:**
```
POST /api/webhooks/mercadopago
- Recebe notificações do gateway
- Atualiza status automaticamente
- Registra histórico com origem 'webhook'
```

### 5. Componentes React
**Arquivo:** `/components/StatusComponents.tsx`

- ✅ `<StatusBadge>` - Badge visual de status
- ✅ `<OrderTimeline>` - Linha do tempo do pedido
- ✅ Cores e ícones consistentes
- ✅ Estados especiais (cancelado, estornado)

### 6. Páginas Atualizadas

**OrderDetailsPage:**
- ✅ Exibe status padronizados com badges
- ✅ Timeline visual do pedido
- ✅ Separação clara entre status de pagamento e pedido

**CheckoutPage:**
- ✅ Envia `payment_provider_status` ao criar pedido
- ✅ Backend mapeia automaticamente para status interno

## 📋 Mapeamento de Status

### Pagamento → Pedido
| Status Pagamento | Status Pedido |
|-----------------|---------------|
| PAYMENT_PENDING | ORDER_PENDING_PAYMENT |
| PAYMENT_PROCESSING | ORDER_PENDING_PAYMENT |
| PAYMENT_APPROVED | ORDER_PREPARING |
| PAYMENT_REFUSED | ORDER_PENDING_PAYMENT |
| PAYMENT_EXPIRED | ORDER_CANCELED |
| PAYMENT_CANCELED | ORDER_CANCELED |
| PAYMENT_REFUNDED | ORDER_REFUNDED |

### Mercado Pago → Status Interno
| MP Status | Status Interno |
|-----------|----------------|
| pending | PAYMENT_PENDING |
| in_process | PAYMENT_PROCESSING |
| approved | PAYMENT_APPROVED |
| rejected | PAYMENT_REFUSED |
| cancelled | PAYMENT_CANCELED |
| refunded | PAYMENT_REFUNDED |
| charged_back | PAYMENT_REFUNDED |

## 🔒 Regras de Validação

1. ❌ Não pode enviar pedido sem pagamento aprovado
2. ❌ Não pode voltar para "aguardando pagamento" após aprovado
3. ❌ Não pode alterar pedido cancelado ou estornado
4. ✅ Estorno altera automaticamente status do pedido

## 📊 Rastreabilidade

Cada mudança de status registra:
- Status anterior (pagamento e pedido)
- Status novo (pagamento e pedido)
- Origem da mudança (`gateway`, `system`, `admin`, `webhook`)
- Notas/observações
- Data/hora

## 🎨 Interface do Usuário

### Badges de Status
- Cores consistentes em todo o sistema
- Labels em português
- Ícones visuais

### Timeline do Pedido
- ⏳ Aguardando pagamento
- 📦 Preparando envio
- 🚚 Enviado
- ✅ Concluído
- ❌ Cancelado/Estornado

## 🔄 Fluxo Completo

1. **Cliente finaliza compra**
   - Frontend envia `payment_provider_status` (ex: "approved")
   - Backend mapeia para `PAYMENT_APPROVED`
   - Define `order_status` como `ORDER_PREPARING`
   - Registra histórico inicial

2. **Webhook atualiza status**
   - Mercado Pago notifica mudança
   - Backend busca pedido pelo `payment_id`
   - Atualiza status automaticamente
   - Registra histórico com origem "webhook"

3. **Admin altera status**
   - Admin marca como "enviado"
   - Backend valida se pagamento está aprovado
   - Atualiza `order_status` para `ORDER_SHIPPED`
   - Registra histórico com origem "admin"

4. **Cliente visualiza**
   - Vê badges de status padronizados
   - Vê timeline visual do pedido
   - Vê histórico completo (opcional)

## 🚀 Próximos Passos (Opcional)

- [ ] Notificações por email/WhatsApp baseadas em mudanças de status
- [ ] Dashboard admin com alertas de pagamentos recusados
- [ ] Filtros por status na lista de pedidos
- [ ] Exportação de relatórios por status
- [ ] Integração com outros gateways de pagamento

## 📝 Como Usar

### Frontend
```typescript
import { StatusBadge, OrderTimeline } from '../components/StatusComponents';
import { PaymentStatus, OrderStatus } from '../shared/constants/status';

<StatusBadge status={order.payment_status} type="payment" />
<StatusBadge status={order.order_status} type="order" />
<OrderTimeline orderStatus={order.order_status} paymentStatus={order.payment_status} />
```

### Backend
```javascript
import { mapMercadoPagoStatus, updateOrderStatus } from './statusManager.js';

// Mapear status do gateway
const internalStatus = mapMercadoPagoStatus('approved'); // PAYMENT_APPROVED

// Atualizar status do pedido
await updateOrderStatus(pool, orderId, 'approved', 'webhook', 'Pagamento confirmado');
```

## ✅ Checklist de Consistência

- [x] Status definidos em arquivo único
- [x] Mapeamento centralizado gateway → interno
- [x] Validação de transições
- [x] Histórico completo de mudanças
- [x] Componentes visuais reutilizáveis
- [x] API endpoints padronizados
- [x] Webhook implementado
- [x] Migração de dados existentes
- [x] Documentação completa
