# 🚀 Guia de Instalação - Backend + Frontend

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+ (via Docker recomendado)
- npm ou yarn

## 1️⃣ Configurar Banco de Dados

### Usando Docker (Recomendado)

```bash
# Criar container PostgreSQL
docker run -d \
  --name vitrinepro-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=vitrinepro \
  -p 5432:5432 \
  postgres:14

# Executar schema inicial
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/schema.sql

# Executar migration de status
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-status-standardization.sql

# Configurar timezone para GMT-3
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "ALTER DATABASE vitrinepro SET timezone TO 'America/Sao_Paulo';"
docker exec vitrinepro-postgres psql -U postgres -c "ALTER USER postgres SET timezone TO 'America/Sao_Paulo';"

# Reiniciar container
docker restart vitrinepro-postgres

# Verificar timezone
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro -c "SHOW timezone;"
# Deve retornar: America/Sao_Paulo
```

### Sem Docker

Consulte [database/INSTALL.md](database/INSTALL.md) para instalação manual.

## 2️⃣ Instalar Dependências

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
# Na raiz do projeto
npm install
```

## 3️⃣ Configurar Variáveis de Ambiente

### Backend (.env na pasta backend/)

```env
# Banco de Dados
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vitrinepro

# Servidor
PORT=3001

# Mercado Pago (opcional, para pagamentos)
MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui
```

## 4️⃣ Criar Usuário Admin

```bash
cd backend
node setup-admin.js
```

Isso vai criar o usuário:
- **Email:** admin@admin.com
- **Senha:** admin

## 5️⃣ Iniciar o Backend

```bash
# Na pasta backend
node server.js
```

O backend vai rodar em: **http://localhost:3001**

Você deve ver:
```
✅ Conectado ao PostgreSQL
🚀 Backend rodando na porta 3001
```

## 6️⃣ Iniciar o Frontend (em outro terminal)

```bash
# Na raiz do projeto
npm run dev
```

O frontend vai rodar em: **http://localhost:5173**

## ✅ Testar o Sistema

1. Abra http://localhost:5173
2. Clique no ícone de usuário (Login)
3. Entre com: **admin@admin.com** / **admin**
4. Você estará no painel administrativo!

### Primeiros Passos

1. **Configure a loja:**
   - Clique no ícone de engrenagem (⚙️)
   - Defina nome, logo e cores
   - Configure WhatsApp
   - Salve

2. **Crie produtos:**
   - Clique em "+ Novo Produto"
   - Preencha os dados
   - Faça upload de uma imagem
   - Salve

3. **Teste o checkout:**
   - Faça logout
   - Navegue pela loja
   - Adicione produtos ao carrinho
   - Finalize uma compra

## 🔍 Verificar Dados no Banco

```bash
# Ver produtos cadastrados
docker exec -it vitrinepro-postgres psql -U postgres -d vitrinepro -c "SELECT * FROM products;"

# Ver pedidos
docker exec -it vitrinepro-postgres psql -U postgres -d vitrinepro -c "SELECT * FROM orders;"
```

## 🛑 Parar Tudo

```bash
# Parar backend: Ctrl+C no terminal
# Parar frontend: Ctrl+C no terminal
# Parar PostgreSQL:
docker compose down
```
