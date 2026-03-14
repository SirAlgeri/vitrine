# Implementações de Segurança - VitrinePro

**Data:** 2026-03-04  
**Status:** ✅ Implementado

---

## ✅ Implementações Concluídas

### 1. **Autenticação JWT**
- ✅ Middleware `authenticateAdmin` criado
- ✅ Tokens JWT com expiração de 24h
- ✅ Validação de tenant no token
- ✅ Frontend armazena token em localStorage
- ✅ Headers Authorization em todas as requisições admin

**Arquivo:** `backend/middleware/auth.js`

### 2. **Proteção de Endpoints Administrativos**
Todos os endpoints abaixo agora requerem autenticação:

- ✅ `PUT /api/config` - Configurações da loja
- ✅ `POST /api/products` - Criar produtos
- ✅ `PUT /api/products/:id` - Editar produtos
- ✅ `DELETE /api/products/:id` - Deletar produtos
- ✅ `POST /api/field-definitions` - Criar campos customizados
- ✅ `PUT /api/field-definitions/:id` - Editar campos
- ✅ `DELETE /api/field-definitions/:id` - Deletar campos
- ✅ `PUT /api/orders/:id/status` - Atualizar status de pedidos

### 3. **Rate Limiting**
- ✅ Login: 5 tentativas a cada 15 minutos
- ✅ API geral: 100 requisições por minuto
- ✅ Proteção contra força bruta
- ✅ Proteção contra DDoS

**Biblioteca:** `express-rate-limit`

### 4. **Validação de Inputs**
- ✅ Validação de campos obrigatórios
- ✅ Validação de tipos de dados
- ✅ Validação de formatos (cores, CEP, WhatsApp)
- ✅ Validação de ranges (preços, markup)

**Biblioteca:** `express-validator`

Exemplos:
- `store_name`: 1-100 caracteres
- `whatsapp_number`: 10-15 dígitos
- `primary_color`: formato hexadecimal #RRGGBB
- `markup_percentage`: 0-100
- `cep_origem`: 8 dígitos

### 5. **CORS Configurado**
- ✅ Apenas origens permitidas podem acessar a API
- ✅ Suporte a wildcard para subdomínios
- ✅ Credentials habilitado

**Configuração:**
```javascript
ALLOWED_ORIGINS=http://localhost:5173,https://microhub.com.br,https://*.microhub.com.br
```

### 6. **Helmet.js**
- ✅ Headers HTTP seguros
- ✅ Proteção contra XSS
- ✅ Proteção contra clickjacking
- ✅ CSP desabilitado (para não quebrar frontend)

### 7. **Ocultação de Erros**
- ✅ Erros detalhados apenas no console do servidor
- ✅ Mensagens genéricas para o cliente
- ✅ Logs estruturados no backend

### 8. **Validação de Preços no Backend**
- ✅ Preços recalculados no servidor
- ✅ Markup aplicado no backend
- ✅ Frontend não pode manipular preços finais

### 9. **Filtragem de Dados Sensíveis**
Dados removidos dos endpoints públicos:
- ✅ `markup_percentage` - margem de lucro
- ✅ `cep_origem` - CEP de origem
- ✅ `smtp_*` - credenciais de email
- ✅ `tenant_id`, `created_at`, `updated_at` - metadados

### 10. **Auditoria de Ações**
- ✅ Username do admin registrado em alterações de status
- ✅ Histórico de mudanças de pedidos

---

## 🔧 Configuração Necessária

### 1. Gerar JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Adicionar ao .env
```bash
# backend/.env
JWT_SECRET=<secret_gerado_acima>
ALLOWED_ORIGINS=http://localhost:5173,https://microhub.com.br,https://*.microhub.com.br
```

### 3. Reiniciar Backend
```bash
cd backend
pm2 restart backend
# ou
node server.js
```

### 4. Build Frontend
```bash
npm run build
```

---

## 📝 Como Usar

### Login Admin
```javascript
// Frontend
const response = await api.login('admin', 'senha');
// Token é salvo automaticamente em localStorage
```

### Requisições Autenticadas
```javascript
// O token é enviado automaticamente em todas as requisições admin
await api.updateConfig({ store_name: 'Nova Loja' });
await api.createProduct({ name: 'Produto', price: 10 });
```

### Logout
```javascript
api.logout(); // Remove token do localStorage
```

---

## 🔒 Segurança Adicional Recomendada

### Curto Prazo (Próximas Semanas)
- [ ] Implementar refresh tokens
- [ ] Adicionar 2FA para admin
- [ ] Logs de auditoria em tabela do banco
- [ ] Backup automático do banco

### Médio Prazo (Próximo Mês)
- [ ] Migrar imagens para S3/CloudFlare R2
- [ ] Implementar cache com Redis
- [ ] Monitoramento com Sentry
- [ ] Proteção CSRF

### Longo Prazo
- [ ] WAF (Web Application Firewall)
- [ ] Penetration testing
- [ ] Compliance LGPD

---

## 🚨 Checklist de Deploy

Antes de colocar em produção:

- [x] JWT_SECRET configurado
- [x] ALLOWED_ORIGINS configurado
- [x] Rate limiting ativo
- [x] Helmet.js ativo
- [x] Validação de inputs ativa
- [x] Endpoints protegidos
- [ ] SSL/HTTPS configurado
- [ ] Backup automático configurado
- [ ] Monitoramento configurado

---

## 📚 Referências

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 🆘 Troubleshooting

### Token Inválido
- Verificar se JWT_SECRET está configurado
- Verificar se token não expirou (24h)
- Fazer logout e login novamente

### CORS Error
- Verificar ALLOWED_ORIGINS no .env
- Verificar se domínio está na lista
- Verificar wildcard para subdomínios

### Rate Limit Atingido
- Aguardar tempo especificado
- Verificar se não há loop de requisições
- Ajustar limites se necessário

---

**Última atualização:** 2026-03-04
