# 💳 Guia de Configuração - Mercado Pago

## 📋 O que foi implementado

✅ **Checkout Transparente** - Pagamento direto no seu site
✅ **Cartão de Crédito** - Com parcelamento
✅ **PIX** - Gera QR Code e código copia e cola
✅ **Integração completa** - Backend + Frontend

## 🔑 Como obter suas credenciais

### 1. Acesse o Painel do Mercado Pago
https://www.mercadopago.com.br/developers/panel/credentials

### 2. Faça login com sua conta Mercado Pago

### 3. Escolha o ambiente
- **Teste (Sandbox)**: Para desenvolvimento e testes
- **Produção**: Para vendas reais

### 4. Copie as credenciais
Você vai precisar de:
- **Public Key**: Começa com `APP_USR-` ou `TEST-`
- **Access Token**: Token longo para o backend

## ⚙️ Configurar no Sistema

### 1. Edite o arquivo `.env` no backend
```bash
cd /home/aneca/vitrine/backend
nano .env
```

### 2. Adicione suas credenciais
```env
# Mercado Pago - TESTE (para desenvolvimento)
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdef1234567890abcdef1234567890-123456789
MERCADOPAGO_PUBLIC_KEY=TEST-abcd1234-5678-90ab-cdef-1234567890ab

# Mercado Pago - PRODUÇÃO (quando for ao ar)
# MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890-123456-abcdef1234567890abcdef1234567890-123456789
# MERCADOPAGO_PUBLIC_KEY=APP_USR-abcd1234-5678-90ab-cdef-1234567890ab
```

### 3. Reinicie o backend
```bash
pkill -f "node server.js"
cd /home/aneca/vitrine/backend
node server.js
```

## 🧪 Testar com Credenciais de Teste

### Cartões de Teste do Mercado Pago

**Cartão Aprovado:**
- Número: `5031 4332 1540 6351`
- CVV: `123`
- Validade: Qualquer data futura (ex: `11/25`)
- Nome: Qualquer nome

**Outros cartões de teste:**
- **Mastercard**: `5031 4332 1540 6351`
- **Visa**: `4509 9535 6623 3704`
- **Amex**: `3711 803032 57522`

**Status de teste:**
- Aprovado: Use os cartões acima
- Recusado: `5031 7557 3453 0604`
- Pendente: `5031 4332 1540 6351` com valor terminado em `.01`

### PIX de Teste
- No ambiente de teste, o PIX é gerado normalmente
- Não precisa pagar de verdade
- O status fica como "pending" no teste

## 📁 Arquivos Modificados

### Backend
- ✅ `server.js` - Endpoints do Mercado Pago adicionados
- ✅ `.env` - Credenciais configuradas
- ✅ `package.json` - SDK instalado

### Frontend
- ✅ `components/PaymentForm.tsx` - Novo componente de pagamento
- ✅ `pages/CheckoutPage.tsx` - Integrado com PaymentForm

### Database
- ✅ `migration-mercadopago.sql` - Colunas payment_id e payment_status

## 🎯 Como Funciona

### Fluxo de Pagamento com Cartão

1. Cliente preenche dados do cartão
2. SDK do Mercado Pago tokeniza o cartão (seguro)
3. Token é enviado ao backend
4. Backend processa pagamento via API
5. Retorna status: `approved`, `rejected`, `pending`
6. Pedido é criado com status do pagamento

### Fluxo de Pagamento com PIX

1. Cliente clica em "Gerar PIX"
2. Backend cria pagamento PIX via API
3. Mercado Pago retorna QR Code e código
4. Cliente escaneia ou copia o código
5. Paga no app do banco
6. Webhook notifica quando pago (implementar depois)

## 🔒 Segurança

✅ **Tokenização**: Dados do cartão nunca passam pelo seu servidor
✅ **PCI Compliance**: Mercado Pago é certificado PCI DSS
✅ **HTTPS**: Use sempre em produção
✅ **Credenciais**: Nunca commite o .env no git

## 📊 Próximos Passos (Opcional)

### 1. Webhooks (Notificações)
Receber notificação quando pagamento for aprovado/recusado:
```javascript
app.post('/api/mercadopago/webhook', async (req, res) => {
  const { type, data } = req.body;
  
  if (type === 'payment') {
    const paymentId = data.id;
    // Atualizar status do pedido no banco
  }
  
  res.sendStatus(200);
});
```

### 2. Reembolsos
```javascript
const payment = new Payment(mercadopago);
await payment.refund(paymentId);
```

### 3. Parcelamento sem juros
Configure no painel do Mercado Pago

### 4. Boleto Bancário
Similar ao PIX, mas gera boleto

## 🐛 Troubleshooting

### Erro: "Invalid credentials"
- Verifique se copiou as credenciais corretas
- Confirme que está usando TEST para teste e APP_USR para produção

### Erro: "Public key not found"
- Verifique se o .env está correto
- Reinicie o backend após alterar .env

### Pagamento não processa
- Abra o console do navegador (F12)
- Veja erros na aba Network
- Verifique logs do backend

### PIX não gera QR Code
- Verifique se o CPF está válido
- Confirme que o valor é maior que R$ 0,01

## 📚 Documentação Oficial

- **SDK Node.js**: https://github.com/mercadopago/sdk-nodejs
- **API Reference**: https://www.mercadopago.com.br/developers/pt/reference
- **Checkout Transparente**: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/landing
- **Cartões de Teste**: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing

## ✅ Checklist de Produção

Antes de ir ao ar:

- [ ] Trocar credenciais de TESTE para PRODUÇÃO
- [ ] Configurar HTTPS no servidor
- [ ] Implementar webhooks para notificações
- [ ] Testar todos os fluxos de pagamento
- [ ] Configurar tratamento de erros
- [ ] Adicionar logs de transações
- [ ] Testar reembolsos
- [ ] Configurar backup do banco de dados

---

**Pronto!** Agora você tem um sistema completo de pagamentos integrado com Mercado Pago 🎉
