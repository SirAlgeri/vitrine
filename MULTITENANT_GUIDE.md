# Guia de Implementação Multi-Tenant - Passo a Passo

## ✅ Arquivos Criados

1. `/home/aneca/vitrine/database/migration-multitenant.sql` - Migration SQL
2. `/home/aneca/vitrine/backend/middleware/tenant.js` - Middleware de tenant
3. `/home/aneca/vitrine/contexts/TenantContext.tsx` - Contexto React
4. `/home/aneca/vitrine/hooks/useTenant.ts` - Hook React
5. `/home/aneca/vitrine/MULTITENANT_IMPLEMENTATION.md` - Documentação

## 📋 Checklist de Implementação

### Fase 1: Banco de Dados (RDS)

- [ ] **1.1** Conectar no RDS via DBeaver
- [ ] **1.2** Executar `database/migration-multitenant.sql`
- [ ] **1.3** Verificar se tabela `tenants` foi criada
- [ ] **1.4** Verificar se tenant 'default' e 'mcptennis' foram criados

```sql
-- Verificar
SELECT * FROM tenants;
SELECT * FROM config WHERE tenant_id IS NOT NULL;
```

### Fase 2: Backend (EC2)

- [ ] **2.1** SSH na EC2: `ssh -i sua-chave.pem ubuntu@54.221.171.166`
- [ ] **2.2** Ir para o projeto: `cd ~/vitrine`
- [ ] **2.3** Criar pasta middleware: `mkdir -p backend/middleware`
- [ ] **2.4** Copiar arquivo `backend/middleware/tenant.js` do local para EC2
- [ ] **2.5** Modificar `backend/server.js` (ver instruções abaixo)
- [ ] **2.6** Testar backend: `cd backend && node server.js`
- [ ] **2.7** Se funcionar, reiniciar PM2: `pm2 restart vitrinepro-backend`

### Fase 3: Frontend (Local)

- [ ] **3.1** Criar pasta contexts: `mkdir -p contexts`
- [ ] **3.2** Criar pasta hooks: `mkdir -p hooks`
- [ ] **3.3** Arquivos já criados em `contexts/TenantContext.tsx` e `hooks/useTenant.ts`
- [ ] **3.4** Modificar `App.tsx` (ver instruções abaixo)
- [ ] **3.5** Build: `npm run build`
- [ ] **3.6** Testar localmente: `npm run dev`

### Fase 4: Deploy

- [ ] **4.1** Commit e push para GitHub
- [ ] **4.2** Na EC2, fazer `git pull`
- [ ] **4.3** Build frontend: `npm run build`
- [ ] **4.4** Atualizar Nginx (ver instruções abaixo)
- [ ] **4.5** Reiniciar Nginx: `sudo systemctl restart nginx`

### Fase 5: DNS

- [ ] **5.1** Configurar wildcard DNS: `*.meudominio.com → 54.221.171.166`
- [ ] **5.2** Aguardar propagação (5-30 minutos)

### Fase 6: Testes

- [ ] **6.1** Acessar `www.meudominio.com` (tenant default)
- [ ] **6.2** Acessar `mcptennis.meudominio.com` (tenant exemplo)
- [ ] **6.3** Verificar isolamento de dados
- [ ] **6.4** Criar produto em cada tenant e verificar que não aparecem no outro

---

## 🔧 Modificações Detalhadas

### 2.5 - Modificar backend/server.js

#### A) Adicionar import no topo (após outras importações):

```javascript
import { tenantMiddleware } from './middleware/tenant.js';
```

#### B) Adicionar middleware (após `app.use(express.json({ limit: '50mb' }));`):

```javascript
// Tenant middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/admin/tenants')) {
    return next();
  }
  return tenantMiddleware(req, res, next);
});
```

#### C) Adicionar rota de tenant atual (após rotas de config):

```javascript
// ========== TENANT ==========
app.get('/api/tenant/current', async (req, res) => {
  try {
    res.json(req.tenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

#### D) Adicionar rotas administrativas (antes de `app.listen`):

Copiar todo o bloco de rotas administrativas do arquivo `MULTITENANT_IMPLEMENTATION.md` seção 4.

#### E) Modificar queries existentes:

**CRÍTICO:** Adicionar `tenant_id` em TODAS as queries. Exemplos:

**Produtos - GET:**
```javascript
// ANTES
const result = await pool.query('SELECT * FROM products');

// DEPOIS
const result = await pool.query(
  'SELECT * FROM products WHERE tenant_id = $1',
  [req.tenant.id]
);
```

**Produtos - POST:**
```javascript
// ANTES
await pool.query(
  'INSERT INTO products (id, name, price) VALUES ($1, $2, $3)',
  [id, name, price]
);

// DEPOIS
await pool.query(
  'INSERT INTO products (id, name, price, tenant_id) VALUES ($1, $2, $3, $4)',
  [id, name, price, req.tenant.id]
);
```

**Aplicar em todas as rotas:**
- `/api/products`
- `/api/orders`
- `/api/customers`
- `/api/config`
- `/api/field-definitions`
- Etc.

### 3.4 - Modificar App.tsx

#### Adicionar import no topo:

```typescript
import { TenantProvider } from './contexts/TenantContext';
```

#### Envolver todo o conteúdo com TenantProvider:

```typescript
function App() {
  return (
    <BrowserRouter>
      <TenantProvider>
        <AppContent />
      </TenantProvider>
    </BrowserRouter>
  );
}

// Mover todo o código atual para dentro de AppContent
const AppContent: React.FC = () => {
  // Todo o código atual do App fica aqui
  ...
};
```

### 4.4 - Atualizar Nginx

Editar `/etc/nginx/sites-available/vitrine`:

```nginx
server {
    listen 80;
    server_name *.meudominio.com meudominio.com;  # Wildcard

    location / {
        root /home/ubuntu/vitrine/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;  # IMPORTANTE
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🧪 Como Testar

### Teste 1: Verificar tenant atual

```bash
# Tenant default (www)
curl -H "Host: www.meudominio.com" http://54.221.171.166/api/tenant/current

# Tenant mcptennis
curl -H "Host: mcptennis.meudominio.com" http://54.221.171.166/api/tenant/current
```

### Teste 2: Criar produto em cada tenant

```bash
# Produto no tenant default
curl -X POST http://www.meudominio.com/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Produto Default","price":100}'

# Produto no tenant mcptennis
curl -X POST http://mcptennis.meudominio.com/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Raquete Tennis","price":500}'
```

### Teste 3: Verificar isolamento

```bash
# Listar produtos do default (não deve mostrar raquete)
curl http://www.meudominio.com/api/products

# Listar produtos do mcptennis (não deve mostrar produto default)
curl http://mcptennis.meudominio.com/api/products
```

---

## 🚨 Troubleshooting

### Erro: "Loja não encontrada"
- Verificar se tenant existe no banco
- Verificar se subdomain está correto
- Verificar se tenant está ativo

### Produtos aparecem em todos os tenants
- Verificar se queries têm `WHERE tenant_id = $1`
- Verificar se `req.tenant.id` está sendo passado
- Ver logs: `pm2 logs vitrinepro-backend`

### Nginx não aceita wildcard
- Verificar sintaxe: `sudo nginx -t`
- Verificar se DNS está configurado
- Testar com curl passando header Host

---

## 📞 Próximos Passos

Após implementação:

1. **Criar interface admin** para gerenciar tenants
2. **Adicionar mais campos** na tabela tenants (logo, domínio customizado, etc)
3. **Implementar billing** por tenant
4. **Adicionar analytics** por tenant
5. **Configurar SSL** para wildcard (Let's Encrypt)

---

**Quer que eu implemente isso agora passo a passo ou prefere fazer sozinho seguindo este guia?**
