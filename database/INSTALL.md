# Guia de Instalação do PostgreSQL - VitrinePro

## 📦 Instalação do PostgreSQL

### No Ubuntu/Debian (AWS EC2)
```bash
# Atualizar pacotes
sudo apt update

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar status
sudo systemctl status postgresql
```

### No Windows
1. Baixar PostgreSQL Installer: https://www.postgresql.org/download/windows/
2. Executar instalador (versão 14+)
3. Anotar a senha do usuário postgres

### No macOS
```bash
# Usando Homebrew
brew install postgresql@14

# Iniciar serviço
brew services start postgresql@14
```

### Usando Docker (Recomendado para desenvolvimento)
```bash
# Criar container PostgreSQL
docker run -d \
  --name vitrinepro-postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=vitrinepro \
  -p 5432:5432 \
  postgres:14

# Verificar se está rodando
docker ps
```

## 🗄️ Criar o Banco de Dados

### Opção 1: Via linha de comando (Linux/Mac)
```bash
# Conectar como usuário postgres
sudo -u postgres psql

# Criar banco
CREATE DATABASE vitrinepro WITH ENCODING 'UTF8';

# Conectar ao banco
\c vitrinepro

# Executar schema (copiar e colar conteúdo do schema.sql)
# Ou sair e executar:
\q

# Executar arquivo SQL
sudo -u postgres psql vitrinepro < /home/samuelalgeri/vitrinepro-catalog/database/schema.sql
```

### Opção 2: Usando Docker
```bash
# Copiar schema para dentro do container
docker cp /home/samuelalgeri/vitrinepro-catalog/database/schema.sql vitrinepro-postgres:/schema.sql

# Executar dentro do container
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro -f /schema.sql
```

### Opção 3: Executar diretamente
```bash
# Se PostgreSQL está instalado localmente
psql -U postgres -d vitrinepro -f /home/samuelalgeri/vitrinepro-catalog/database/schema.sql
```

## ✅ Verificar Instalação

```bash
# Conectar ao banco
psql -U postgres -d vitrinepro

# Verificar tabelas criadas
\dt

# Ver estrutura de uma tabela
\d products

# Ver tipos customizados
\dT

# Sair
\q
```

## 🔐 Criar Usuário para a Aplicação (Recomendado)

```sql
-- Conectar como postgres
psql -U postgres

-- Criar usuário específico
CREATE USER vitrinepro_user WITH PASSWORD 'senha_segura_aqui';

-- Dar permissões no banco vitrinepro
GRANT ALL PRIVILEGES ON DATABASE vitrinepro TO vitrinepro_user;

-- Conectar ao banco vitrinepro
\c vitrinepro

-- Dar permissões nas tabelas
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vitrinepro_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vitrinepro_user;

-- Sair
\q
```

## 📝 Credenciais para .env (próximo passo)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=vitrinepro_user
DB_PASSWORD=senha_segura_aqui
DB_NAME=vitrinepro
```

## 🧪 Testar Conexão

```bash
psql -U vitrinepro_user -d vitrinepro -h localhost
```

Se conectar com sucesso, está tudo pronto! ✅

## 🔧 Comandos Úteis PostgreSQL

```bash
# Listar bancos
\l

# Listar tabelas
\dt

# Descrever tabela
\d nome_tabela

# Executar query
SELECT * FROM products;

# Sair
\q
```
