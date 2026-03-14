# Auditoria de Segurança - VitrinePro

**Data:** 2026-03-04  
**Status:** 🔴 CRÍTICO - Múltiplas vulnerabilidades encontradas

---

## 🔴 CRÍTICO - Correção Imediata Necessária

### 1. **Falta de Autenticação em Endpoints Administrativos**
**Severidade:** CRÍTICA  
**Risco:** Qualquer pessoa pode modificar configurações, produtos, pedidos

**Endpoints sem proteção:**
- `PUT /api/config` - Qualquer um pode alterar configurações da loja
- `POST /api/products` - Qualquer um pode criar produtos
- `DELETE /api/products/:id` - Qualquer um pode deletar produtos
- `PUT /api/products/:id` - Qualquer um pode editar produtos
- `POST /api/field-definitions` - Qualquer um pode criar campos customizados
- `DELETE /api/field-definitions/:id` - Qualquer um pode deletar campos
- `PUT /api/orders/:id/status` - Qualquer um pode alterar status de pedidos

**Impacto:**
- Atacante pode alterar preços para R$ 0,01
- Deletar todos os produtos
- Modificar pedidos
- Roubar dados de configuração (SMTP, etc)

**Solução:**
```javascript
// Criar middleware de autenticação
function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  
  // Validar token JWT
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Aplicar em todos os endpoints admin
app.put('/api/config', authenticateAdmin, async (req, res) => { ... });
app.post('/api/products', authenticateAdmin, async (req, res) => { ... });
```

---

### 2. **Autenticação Fraca (Session Storage)**
**Severidade:** CRÍTICA  
**Risco:** Sessões podem ser facilmente forjadas

**Problema:**
```javascript
// App.tsx - linha 37
const session = sessionStorage.getItem('vitrine_session');
if (session === 'true') setIsAuthenticated(true);
```

Qualquer usuário pode abrir o console e executar:
```javascript
sessionStorage.setItem('vitrine_session', 'true');
```

**Solução:**
- Implementar JWT (JSON Web Tokens)
- Armazenar token no httpOnly cookie
- Validar token no backend em cada requisição

---

### 3. **Falta de Rate Limiting**
**Severidade:** ALTA  
**Risco:** Ataques de força bruta, DDoS

**Endpoints vulneráveis:**
- `/api/auth/login` - Força bruta de senhas
- `/api/customers/login` - Força bruta de senhas de clientes
- `/api/customers/send-verification` - Spam de emails
- `/api/orders` - Criação massiva de pedidos falsos

**Solução:**
```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
});

app.post('/api/auth/login', loginLimiter, async (req, res) => { ... });
```

---

### 4. **Exposição de Informações Sensíveis em Erros**
**Severidade:** MÉDIA  
**Risco:** Vazamento de estrutura do banco, paths do servidor

**Problema:**
```javascript
res.status(500).json({ error: err.message });
```

Expõe mensagens de erro do PostgreSQL, stack traces, etc.

**Solução:**
```javascript
res.status(500).json({ error: 'Erro interno do servidor' });
console.error('Erro detalhado:', err); // Log apenas no servidor
```

---

### 5. **Falta de Validação de Input**
**Severidade:** ALTA  
**Risco:** Injeção de dados maliciosos, XSS

**Problemas:**
- Nenhuma validação de tipos de dados
- Nenhuma sanitização de strings
- Aceita qualquer valor em campos de texto

**Solução:**
```bash
npm install express-validator
```

```javascript
import { body, validationResult } from 'express-validator';

app.put('/api/config', [
  body('store_name').trim().isLength({ min: 1, max: 100 }),
  body('whatsapp_number').matches(/^\d{10,15}$/),
  body('primary_color').matches(/^#[0-9A-Fa-f]{6}$/),
  authenticateAdmin
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ...
});
```

---

### 6. **CORS Aberto**
**Severidade:** MÉDIA  
**Risco:** Qualquer site pode fazer requisições à API

**Problema:**
```javascript
app.use(cors()); // Permite QUALQUER origem
```

**Solução:**
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:5173',
  credentials: true
}));
```

---

### 7. **Falta de HTTPS Enforcement**
**Severidade:** ALTA (em produção)  
**Risco:** Man-in-the-middle, interceptação de senhas

**Solução:**
```javascript
// Redirecionar HTTP para HTTPS em produção
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}
```

---

### 8. **Senhas de Cliente Armazenadas com bcrypt (OK)**
**Severidade:** ✅ BOM  
**Status:** Implementado corretamente

```javascript
const hash = await bcrypt.hash(senha, 10);
const valid = await bcrypt.compare(senha, customer.senha_hash);
```

---

### 9. **SQL Injection - Protegido (OK)**
**Severidade:** ✅ BOM  
**Status:** Usando queries parametrizadas corretamente

```javascript
pool.query('SELECT * FROM products WHERE id = $1', [id]); // ✅ Seguro
```

---

### 10. **Falta de Helmet.js**
**Severidade:** MÉDIA  
**Risco:** Headers HTTP inseguros

**Solução:**
```bash
npm install helmet
```

```javascript
import helmet from 'helmet';
app.use(helmet());
```

---

### 11. **Dados Sensíveis no Frontend (PARCIALMENTE CORRIGIDO)**
**Severidade:** MÉDIA  
**Status:** Melhorado, mas ainda expõe alguns dados

**Ainda exposto:**
- `payment_methods` - métodos de pagamento aceitos
- `frete_gratis_acima` - valor para frete grátis (pode ser usado para fraude)
- `pickup_address` - endereço completo

**Considerar:** Criar endpoint separado `/api/config/public` vs `/api/config/admin`

---

### 12. **Falta de Logs de Auditoria**
**Severidade:** MÉDIA  
**Risco:** Impossível rastrear ações maliciosas

**Solução:**
- Criar tabela `audit_logs`
- Registrar todas as ações administrativas
- Incluir: usuário, ação, timestamp, IP, dados alterados

---

### 13. **Falta de Proteção CSRF**
**Severidade:** MÉDIA  
**Risco:** Cross-Site Request Forgery

**Solução:**
```bash
npm install csurf
```

```javascript
import csrf from 'csurf';
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);
```

---

### 14. **Timeout de Sessão Inexistente**
**Severidade:** BAIXA  
**Risco:** Sessões nunca expiram

**Solução:**
- Implementar expiração de tokens JWT (ex: 24h)
- Refresh tokens para renovação

---

### 15. **Falta de Backup Automático**
**Severidade:** ALTA (operacional)  
**Risco:** Perda de dados

**Solução:**
```bash
# Cron job diário
0 2 * * * pg_dump vitrinepro > /backups/vitrinepro_$(date +\%Y\%m\%d).sql
```

---

## 🟡 MÉDIO - Melhorias Recomendadas

### 16. **Imagens em Base64 no Banco**
**Problema:** Banco de dados muito grande, queries lentas

**Solução:**
- Migrar para S3/CloudFlare R2
- Armazenar apenas URLs no banco

---

### 17. **Falta de Paginação**
**Problema:** Endpoints retornam TODOS os registros

```javascript
app.get('/api/products', async (req, res) => {
  const result = await pool.query('SELECT * FROM products'); // ❌ Sem limite
});
```

**Solução:**
```javascript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const offset = (page - 1) * limit;

const result = await pool.query(
  'SELECT * FROM products LIMIT $1 OFFSET $2',
  [limit, offset]
);
```

---

### 18. **Falta de Cache**
**Problema:** Configurações buscadas em toda requisição

**Solução:**
- Implementar Redis para cache
- Cache de configurações por 5 minutos

---

### 19. **Falta de Monitoramento**
**Problema:** Sem visibilidade de erros em produção

**Solução:**
- Integrar Sentry para tracking de erros
- Logs estruturados (Winston)

---

## 🟢 BAIXO - Boas Práticas

### 20. **Variáveis de Ambiente**
**Status:** ✅ Usando dotenv corretamente

### 21. **Multi-tenancy**
**Status:** ✅ Implementado com middleware

### 22. **Transações de Banco**
**Status:** ✅ Usando BEGIN/COMMIT em operações críticas

---

## 📋 Checklist de Implementação Prioritária

### Fase 1 - URGENTE (Esta Semana)
- [ ] Implementar autenticação JWT
- [ ] Proteger todos os endpoints administrativos
- [ ] Adicionar rate limiting em login
- [ ] Configurar CORS restritivo
- [ ] Ocultar erros detalhados em produção

### Fase 2 - IMPORTANTE (Próximas 2 Semanas)
- [ ] Adicionar validação de inputs
- [ ] Implementar Helmet.js
- [ ] Adicionar logs de auditoria
- [ ] Configurar backups automáticos
- [ ] Adicionar paginação

### Fase 3 - MELHORIAS (Próximo Mês)
- [ ] Migrar imagens para S3
- [ ] Implementar cache com Redis
- [ ] Adicionar monitoramento (Sentry)
- [ ] Proteção CSRF
- [ ] Timeout de sessões

---

## 🛠️ Comandos para Correções Rápidas

```bash
# Instalar dependências de segurança
npm install jsonwebtoken express-rate-limit express-validator helmet

# Gerar secret para JWT
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Adicionar ao .env
echo "JWT_SECRET=<secret_gerado>" >> backend/.env
echo "ALLOWED_ORIGINS=https://microhub.com.br,https://*.microhub.com.br" >> backend/.env
```

---

## 📞 Contato

Para dúvidas sobre implementação das correções, consulte a documentação ou abra uma issue.

**ATENÇÃO:** Este sistema NÃO deve ser usado em produção até que pelo menos os itens da Fase 1 sejam implementados.
