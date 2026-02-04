# 🚀 Guia de Instalação - Backend + Frontend

## 1️⃣ Instalar Dependências do Backend

```bash
cd backend
npm install
```

## 2️⃣ Criar Usuário Admin no Banco

```bash
# Ainda na pasta backend
node setup-admin.js
```

Isso vai criar o usuário:
- **Username:** admin
- **Password:** admin

## 3️⃣ Iniciar o Backend

```bash
# Na pasta backend
npm run dev
```

O backend vai rodar em: **http://localhost:3001**

## 4️⃣ Iniciar o Frontend (em outro terminal)

```bash
# Voltar para a raiz do projeto
cd ..

# Rodar o frontend
npm run dev
```

O frontend vai rodar em: **http://localhost:5173**

## ✅ Testar

1. Abra http://localhost:5173
2. Clique no ícone de cadeado (Login)
3. Entre com: **admin** / **admin**
4. Crie produtos e veja salvando no PostgreSQL!

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
