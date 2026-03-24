# Alterações - 24/03/2026

## 🔴 Correções de Segurança

### 1. Webhook Mercado Pago — Tenant Isolation
**Arquivos:** `backend/server.js`, `backend/statusManager.js`

**Problema:** A rota `/api/webhooks/mercadopago` buscava pedidos por `payment_id` sem filtrar por `tenant_id`, permitindo que um webhook afetasse pedidos de outro tenant.

**Correção:**
- Webhook agora busca `tenant_id` junto com o pedido: `SELECT id, tenant_id FROM orders WHERE payment_id = $1`
- `updateOrderStatus()` em `statusManager.js` agora aceita `tenantId` como 6º parâmetro
- Todas as queries internas (SELECT, UPDATE, INSERT no histórico) filtram por `tenant_id` quando fornecido

### 2. Markup Exposto na API Pública
**Arquivos:** `backend/server.js`, `services/api.ts`, `App.tsx`

**Problema:** `GET /api/config` retornava `markup_percentage` para qualquer visitante, permitindo calcular o preço de custo dos produtos.

**Correção:**
- Removido `markup_percentage` do endpoint público `GET /api/config`
- Criado novo endpoint `GET /api/config/admin` (protegido por `authenticateAdmin`) que retorna apenas o markup
- Frontend (`api.ts`) — adicionado método `getAdminConfig()`
- Frontend (`App.tsx`) — markup só é carregado se houver token admin no localStorage

---

## 🟠 Integração Mercado Pago — Ações Obrigatórias

### 3. notification_url (Webhook)
**Arquivo:** `backend/server.js`

Adicionado `notification_url` dinâmico nas 3 rotas de pagamento (cartão, PIX, boleto). A URL é construída automaticamente a partir do host da request:

```js
function getWebhookUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${protocol}://${host}/api/webhooks/mercadopago`;
}
```

Exemplo gerado: `https://anemissara.microhub.com.br/api/webhooks/mercadopago`

### 4. external_reference
**Arquivo:** `backend/server.js`

Adicionado `external_reference` único em cada pagamento no formato:
```
tenant_{id}_{uuid}
```
Exemplo: `tenant_3_a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

## 🟡 Integração Mercado Pago — Ações Recomendadas

### 5. Items (id, title, description, category_id, quantity, unit_price)
**Arquivos:** `backend/server.js`, `components/PaymentForm.tsx`, `pages/CheckoutPage.tsx`

- Backend: as 3 rotas de pagamento agora enviam `additional_info.items` com dados dos produtos
- Frontend (`PaymentForm.tsx`): nova prop `items` adicionada à interface
- Frontend (`CheckoutPage.tsx`): passa os items do carrinho para o `PaymentForm`

Exemplo do que é enviado ao MP:
```json
"additional_info": {
  "items": [
    {
      "id": "prod-abc123",
      "title": "Camiseta Preta M",
      "description": "Camiseta algodão preta",
      "category_id": "others",
      "quantity": 2,
      "unit_price": 79.95
    }
  ]
}
```

### 6. Metadata com dados do Tenant
**Arquivo:** `backend/server.js`

Adicionado helper `getPaymentMetadata()` que busca `store_name` do banco e envia junto com `tenant_id` no campo `metadata` de cada pagamento:

```json
"metadata": {
  "tenant_id": 3,
  "store_name": "Ane Missara"
}
```

---

## 📋 O que fazer na EC2

### 1. Rotacionar credenciais (URGENTE)
As chaves foram expostas em texto. Rotacionar imediatamente:

```bash
# 1. AWS — Criar novas Access Keys no IAM Console
#    https://console.aws.amazon.com/iam → Users → Security Credentials → Create access key
#    Desativar as chaves antigas após confirmar que as novas funcionam

# 2. Mercado Pago — Gerar novas credenciais
#    https://www.mercadopago.com.br/developers/panel/app → Credenciais de produção

# 3. JWT Secret — Gerar novo
openssl rand -hex 64
```

### 2. Atualizar o código na EC2

```bash
cd /home/ubuntu/vitrine    # ou o diretório do projeto na EC2

# Puxar as alterações
git pull origin main

# Reinstalar dependências (se necessário)
cd backend && npm install && cd ..

# Reiniciar o backend
pm2 restart vitrinepro-backend   # ou o nome do seu processo
```

### 3. Atualizar o .env de produção

Adicionar/atualizar no `backend/.env`:

```bash
# Novas chaves rotacionadas
AWS_ACCESS_KEY_ID=nova_chave_aqui
AWS_SECRET_ACCESS_KEY=novo_secret_aqui
MERCADOPAGO_ACCESS_TOKEN=novo_token_aqui
MERCADOPAGO_PUBLIC_KEY=nova_public_key_aqui
JWT_SECRET=novo_secret_gerado_com_openssl
```

### 4. Rebuild do frontend

```bash
npm run build
```

O frontend foi alterado (`PaymentForm.tsx`, `CheckoutPage.tsx`, `App.tsx`, `api.ts`), então precisa rebuildar.

### 5. Verificar que o webhook funciona

Após deploy, testar um pagamento PIX de teste e verificar nos logs:

```bash
pm2 logs vitrinepro-backend --lines 50
```

Confirmar que o `notification_url` está chegando corretamente no formato:
`https://{subdomain}.microhub.com.br/api/webhooks/mercadopago`

---

## Arquivos Modificados

| Arquivo | Alteração |
|---|---|
| `backend/server.js` | Removido markup da API pública, novo endpoint admin, webhook com tenant isolation, notification_url dinâmico, external_reference, items, metadata |
| `backend/statusManager.js` | `updateOrderStatus()` agora aceita e filtra por `tenantId` |
| `services/api.ts` | Novo método `getAdminConfig()` |
| `App.tsx` | Markup carregado apenas para admin autenticado |
| `components/PaymentForm.tsx` | Nova prop `items`, enviada nas 3 rotas de pagamento |
| `pages/CheckoutPage.tsx` | Passa items do carrinho para `PaymentForm` |
| `backend/.env.example` | Adicionado `BACKEND_URL` (não mais necessário, mas documentado) |
