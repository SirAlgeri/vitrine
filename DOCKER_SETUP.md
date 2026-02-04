# 🐳 Guia Rápido - Docker Setup

## Pré-requisitos
- Docker instalado: https://docs.docker.com/get-docker/
- Docker Compose instalado (já vem com Docker Desktop)

## 🚀 Iniciar o Banco de Dados

```bash
# Na pasta do projeto
cd /home/samuelalgeri/vitrinepro-catalog

# Subir o PostgreSQL
docker-compose up -d

# Verificar se está rodando
docker-compose ps
```

## ✅ Verificar se funcionou

```bash
# Ver logs do PostgreSQL
docker-compose logs postgres

# Conectar ao banco
docker exec -it vitrinepro-postgres psql -U postgres -d vitrinepro

# Dentro do psql, verificar tabelas:
\dt

# Sair
\q
```

## 🛑 Parar o Banco

```bash
# Parar containers
docker-compose down

# Parar e remover dados (cuidado!)
docker-compose down -v
```

## 🔄 Recriar o Banco do Zero

```bash
# Parar e limpar tudo
docker-compose down -v

# Subir novamente (vai executar schema.sql automaticamente)
docker-compose up -d
```

## 📊 Acessar o Banco

**Credenciais:**
- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `postgres123`
- Database: `vitrinepro`

**Ferramentas GUI (opcional):**
- DBeaver: https://dbeaver.io/
- pgAdmin: https://www.pgadmin.org/
- TablePlus: https://tableplus.com/

## 🧪 Testar Conexão

```bash
# Via Docker
docker exec -it vitrinepro-postgres psql -U postgres -d vitrinepro -c "SELECT * FROM config;"

# Via psql local (se tiver instalado)
psql -h localhost -U postgres -d vitrinepro
```

Pronto! Seu banco está rodando! 🎉
