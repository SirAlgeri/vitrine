# 🔧 Troubleshooting - Vitrine Pro

Guia de solução de problemas comuns.

## 🚨 Problemas Comuns

### Backend não inicia

**Sintoma:** Erro ao executar `node server.js`

**Possíveis causas:**

1. **Porta 3001 já está em uso**
```bash
# Verificar o que está usando a porta
lsof -i :3001

# Matar o processo
kill -9 <PID>

# Ou usar pkill
pkill -f "node server.js"

# Reiniciar
cd backend && node server.js
```

2. **Banco de dados não está acessível**
```bash
# Verificar se o container está rodando
docker ps | grep vitrinepro-postgres

# Se não estiver, iniciar
docker start vitrinepro-postgres

# Verificar logs
docker logs vitrinepro-postgres
```

3. **Variáveis de ambiente faltando**
```bash
# Verificar se existe .env na pasta backend
ls -la backend/.env

# Se não existir, criar com:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vitrinepro
PORT=3001
```

### Frontend não conecta ao backend

**Sintoma:** Erro de rede no console do navegador

**Soluções:**

1. **Verificar se backend está rodando**
```bash
curl http://localhost:3001/api/health
# Deve retornar: {"status":"ok"}
```

2. **Verificar CORS**
- O backend já tem CORS habilitado
- Se ainda assim der erro, verifique se está usando `http://localhost:5173` e não outro endereço

3. **Limpar cache do navegador**
- Pressione Ctrl+Shift+R (ou Cmd+Shift+R no Mac)
- Ou abra em aba anônima

### Banco de dados não conecta

**Sintoma:** Erro "ECONNREFUSED" ou "connection refused"

**Soluções:**

1. **Verificar se PostgreSQL está rodando**
```bash
# Com Docker
docker ps | grep postgres

# Sem Docker (Linux)
sudo systemctl status postgresql
```

2. **Verificar credenciais**
```bash
# Testar conexão manual
docker exec -it vitrinepro-postgres psql -U postgres -d vitrinepro

# Se funcionar, o problema é na string de conexão do backend
```

3. **Recriar container**
```bash
docker stop vitrinepro-postgres
docker rm vitrinepro-postgres

# Criar novamente
docker run -d \
  --name vitrinepro-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=vitrinepro \
  -p 5432:5432 \
  postgres:14

# Executar migrations novamente
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/schema.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-status-standardization.sql
```

### Migrations falharam

**Sintoma:** Erro ao executar SQL ou tabelas faltando

**Soluções:**

1. **Verificar se o banco existe**
```bash
docker exec vitrinepro-postgres psql -U postgres -c "\l" | grep vitrinepro
```

2. **Executar migrations na ordem correta**
```bash
# 1. Schema inicial
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/schema.sql

# 2. Migration de status
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-status-standardization.sql

# 3. Configurar timezone
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "ALTER DATABASE vitrinepro SET timezone TO 'America/Sao_Paulo';"
docker restart vitrinepro-postgres
```

3. **Verificar tabelas criadas**
```bash
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "\dt"
```

### Não consigo fazer login

**Admin:**

1. **Verificar se usuário existe**
```bash
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "SELECT * FROM users;"
```

2. **Recriar usuário admin**
```bash
cd backend
node setup-admin.js
```

3. **Credenciais corretas:**
- Email: `admin@admin.com`
- Senha: `admin`

**Cliente:**

1. **Registrar novo cliente**
- Vá para /auth
- Clique em "Criar Conta"
- Preencha os dados

2. **Verificar se email já existe**
```bash
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "SELECT email FROM customers WHERE email='seu@email.com';"
```

### Produtos não aparecem

**Sintoma:** Catálogo vazio

**Soluções:**

1. **Verificar se há produtos no banco**
```bash
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "SELECT id, name, price FROM products;"
```

2. **Verificar console do navegador**
- Abra DevTools (F12)
- Vá para Console
- Procure por erros em vermelho

3. **Verificar resposta da API**
```bash
curl http://localhost:3001/api/products
# Deve retornar JSON com array de produtos
```

4. **Criar produto de teste**
- Faça login como admin
- Clique em "+ Novo Produto"
- Preencha e salve

### Erro ao fazer upload de imagem

**Sintoma:** Erro ao salvar produto com imagem

**Soluções:**

1. **Verificar tamanho da imagem**
- Limite: 50MB (configurado no backend)
- Tente com uma imagem menor

2. **Verificar formato**
- Formatos suportados: PNG, JPG, JPEG, GIF, SVG
- Tente converter para PNG

3. **Verificar console**
- Pode haver erro de conversão para base64
- Tente outra imagem

### Cores não aplicam

**Sintoma:** Mudei as cores no admin mas não aparecem

**Soluções:**

1. **Verificar se salvou**
```bash
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "SELECT primary_color, secondary_color FROM config;"
```

2. **Limpar cache**
- Pressione Ctrl+Shift+R
- Ou feche e abra o navegador

3. **Verificar formato**
- Cores devem estar em formato hexadecimal: #FF5733
- Não use nomes de cores (red, blue, etc)

### WhatsApp não abre

**Sintoma:** Clique no botão WhatsApp não faz nada

**Soluções:**

1. **Verificar número configurado**
```bash
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "SELECT whatsapp_number FROM config;"
```

2. **Formato correto**
- Deve ser: 5541988630921 (DDI + DDD + número)
- Sem espaços, parênteses ou traços

3. **Verificar link gerado**
- Abra DevTools (F12)
- Vá para Network
- Clique no botão WhatsApp
- Veja o link gerado
- Deve ser: `https://wa.me/5541988630921?text=...`

### Erro ao gerar boleto

**Sintoma:** Erro 500 ao tentar gerar boleto

**Soluções:**

1. **Verificar dados do cliente**
- Nome completo deve ter pelo menos 2 palavras (nome e sobrenome)
- Email deve ser válido
- CPF deve ter 11 dígitos

2. **Verificar token Mercado Pago**
```bash
# Verificar se está configurado
cat backend/.env | grep MERCADOPAGO
```

3. **Verificar logs do backend**
- Veja o terminal onde o backend está rodando
- Procure por mensagens de erro

### Endereço não aparece na conta do cliente

**Sintoma:** Campo de endereço vazio ou incompleto

**Solução:**

✅ **Corrigido em 2026-02-09**
- O bug foi corrigido no componente `CustomerAccount.tsx`
- Se ainda estiver com problema, atualize o código

**Verificar dados no banco:**
```bash
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "SELECT id, nome_completo, endereco, numero, bairro, cidade FROM customers WHERE id='seu-id';"
```

### Timezone errado

**Sintoma:** Datas aparecem com horário errado

**Solução:**

```bash
# Verificar timezone atual
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "SHOW timezone;"

# Deve retornar: America/Sao_Paulo

# Se não estiver correto, configurar:
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "ALTER DATABASE vitrinepro SET timezone TO 'America/Sao_Paulo';"
docker exec vitrinepro-postgres psql -U postgres -c "ALTER USER postgres SET timezone TO 'America/Sao_Paulo';"
docker restart vitrinepro-postgres
```

## 🔍 Comandos Úteis para Debug

### Verificar saúde do sistema

```bash
# Backend
curl http://localhost:3001/api/health

# Banco de dados
docker exec vitrinepro-postgres pg_isready

# Container rodando
docker ps | grep vitrinepro
```

### Ver logs

```bash
# Logs do container PostgreSQL
docker logs vitrinepro-postgres

# Últimas 50 linhas
docker logs --tail 50 vitrinepro-postgres

# Seguir logs em tempo real
docker logs -f vitrinepro-postgres
```

### Consultas úteis no banco

```bash
# Conectar ao banco
docker exec -it vitrinepro-postgres psql -U postgres -d vitrinepro

# Listar todas as tabelas
\dt

# Ver estrutura de uma tabela
\d orders

# Contar registros
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM customers;

# Ver últimos pedidos
SELECT id, customer_name, total, order_status, created_at 
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

# Ver status de pedidos
SELECT order_status, COUNT(*) 
FROM orders 
GROUP BY order_status;

# Sair
\q
```

### Resetar o sistema

**⚠️ ATENÇÃO: Isso vai apagar TODOS os dados!**

```bash
# Parar e remover container
docker stop vitrinepro-postgres
docker rm vitrinepro-postgres

# Criar novo container
docker run -d \
  --name vitrinepro-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=vitrinepro \
  -p 5432:5432 \
  postgres:14

# Executar migrations
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/schema.sql
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-status-standardization.sql

# Configurar timezone
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "ALTER DATABASE vitrinepro SET timezone TO 'America/Sao_Paulo';"
docker restart vitrinepro-postgres

# Criar admin
cd backend && node setup-admin.js
```

## 📞 Ainda com problemas?

1. Verifique os logs do backend (terminal onde está rodando)
2. Verifique o console do navegador (F12 → Console)
3. Verifique os logs do PostgreSQL (`docker logs vitrinepro-postgres`)
4. Consulte a documentação completa em [DOCUMENTACAO.md](DOCUMENTACAO.md)
5. Verifique o changelog em [CHANGELOG.md](CHANGELOG.md) para mudanças recentes
