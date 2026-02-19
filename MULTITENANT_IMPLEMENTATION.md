# Modificações no Backend para Multi-Tenant

## 1. Importar middleware no início do server.js

Adicione após as outras importações:

```javascript
import { tenantMiddleware, skipTenantMiddleware } from './middleware/tenant.js';
```

## 2. Aplicar middleware ANTES das rotas

Adicione após `app.use(express.json({ limit: '50mb' }));`:

```javascript
// Aplicar tenant middleware em todas as rotas (exceto admin)
app.use((req, res, next) => {
  // Pular tenant para rotas administrativas
  if (req.path.startsWith('/api/admin/tenants')) {
    return next();
  }
  return tenantMiddleware(req, res, next);
});
```

## 3. Adicionar rota para obter tenant atual

Adicione após as rotas de configuração:

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

## 4. Rotas administrativas de tenants

Adicione no final, antes de `app.listen`:

```javascript
// ========== ADMIN - TENANTS ==========
app.post('/api/admin/tenants', async (req, res) => {
  try {
    const { subdomain, store_name } = req.body;
    
    if (!subdomain || !store_name) {
      return res.status(400).json({ error: 'Subdomain e store_name são obrigatórios' });
    }
    
    const id = `tenant-${subdomain}`;
    
    // Criar tenant
    const tenantResult = await pool.query(
      'INSERT INTO tenants (id, subdomain, store_name, active) VALUES ($1, $2, $3, true) RETURNING *',
      [id, subdomain, store_name]
    );
    
    const tenant = tenantResult.rows[0];
    
    // Criar config padrão
    await pool.query(
      `INSERT INTO config (tenant_id, store_name, primary_color, secondary_color)
       VALUES ($1, $2, '#3b82f6', '#10b981')`,
      [tenant.id, store_name]
    );
    
    // Criar field definitions padrão
    const fields = [
      ['field-name-' + subdomain, 'Nome', 'text', 1],
      ['field-price-' + subdomain, 'Preço', 'currency', 2],
      ['field-description-' + subdomain, 'Descrição', 'text', 3],
      ['field-image-' + subdomain, 'Imagem', 'text', 4]
    ];
    
    for (const [id, name, type, order] of fields) {
      await pool.query(
        `INSERT INTO field_definitions (id, field_name, field_type, is_default, can_delete, field_order, tenant_id)
         VALUES ($1, $2, $3, true, false, $4, $5)`,
        [id, name, type, order, tenant.id]
      );
    }
    
    res.status(201).json(tenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/tenants', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tenants ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/tenants/:id', async (req, res) => {
  try {
    const { store_name, active } = req.body;
    
    const result = await pool.query(
      'UPDATE tenants SET store_name = $1, active = $2 WHERE id = $3 RETURNING *',
      [store_name, active, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/tenants/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE tenants SET active = false WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }
    
    res.json({ message: 'Tenant desativado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## 5. Modificar TODAS as queries para filtrar por tenant_id

### Exemplo - Rota de produtos:

**ANTES:**
```javascript
app.get('/api/products', async (req, res) => {
  const result = await pool.query('SELECT * FROM products');
  res.json(result.rows);
});
```

**DEPOIS:**
```javascript
app.get('/api/products', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM products WHERE tenant_id = $1',
    [req.tenant.id]
  );
  res.json(result.rows);
});
```

### Aplicar em TODAS as rotas:

- `/api/products` - GET, POST, PUT, DELETE
- `/api/orders` - GET, POST, PUT
- `/api/customers` - GET, POST, PUT
- `/api/config` - GET, PUT
- `/api/field-definitions` - GET, POST, DELETE
- E todas as outras rotas que acessam dados

### Padrão para INSERT:

```javascript
// Adicionar tenant_id em todos os INSERTs
await pool.query(
  'INSERT INTO products (id, name, price, tenant_id) VALUES ($1, $2, $3, $4)',
  [id, name, price, req.tenant.id]
);
```

### Padrão para SELECT:

```javascript
// Adicionar WHERE tenant_id em todos os SELECTs
await pool.query(
  'SELECT * FROM products WHERE id = $1 AND tenant_id = $2',
  [productId, req.tenant.id]
);
```

### Padrão para UPDATE:

```javascript
// Adicionar WHERE tenant_id em todos os UPDATEs
await pool.query(
  'UPDATE products SET name = $1 WHERE id = $2 AND tenant_id = $3',
  [name, productId, req.tenant.id]
);
```

### Padrão para DELETE:

```javascript
// Adicionar WHERE tenant_id em todos os DELETEs
await pool.query(
  'DELETE FROM products WHERE id = $1 AND tenant_id = $2',
  [productId, req.tenant.id]
);
```

## 6. Configuração Nginx

Editar `/etc/nginx/sites-available/vitrine`:

```nginx
server {
    listen 80;
    server_name *.meudominio.com meudominio.com;  # Wildcard + domínio principal

    location / {
        root /home/ubuntu/vitrine/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;  # IMPORTANTE: passa o subdomínio
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 7. Configuração DNS

No seu provedor de DNS (Route 53, GoDaddy, etc):

```
Type: A
Name: *
Value: 54.221.171.166
TTL: 300
```

Isso permite qualquer subdomínio apontar para o servidor.

## IMPORTANTE: Segurança

1. **Isolamento de dados**: Cada query DEVE filtrar por `tenant_id`
2. **Validação**: Sempre validar que o tenant existe e está ativo
3. **Testes**: Testar com múltiplos tenants para garantir isolamento
4. **Performance**: Índices em `tenant_id` são essenciais

## Checklist de Implementação

- [ ] Executar migration SQL no RDS
- [ ] Criar pasta `backend/middleware/`
- [ ] Adicionar middleware de tenant
- [ ] Modificar server.js (importar middleware)
- [ ] Adicionar rotas administrativas
- [ ] Modificar TODAS as queries para incluir tenant_id
- [ ] Criar contexto React
- [ ] Modificar App.tsx para usar TenantProvider
- [ ] Atualizar Nginx
- [ ] Configurar DNS wildcard
- [ ] Testar com múltiplos subdomínios
