# Sistema de Verificação de Email - Guia de Instalação

## Visão Geral

Sistema de autenticação de dois fatores para registro de clientes usando código de 6 dígitos enviado por email.

## Fluxo de Funcionamento

1. Cliente preenche formulário de registro
2. Sistema envia código de 6 dígitos para o email
3. Cliente insere o código na tela de verificação
4. Sistema valida o código (válido por 10 minutos)
5. Conta é criada com email verificado

## Instalação

### 1. Aplicar Migration no Banco de Dados

```bash
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-email-verification.sql
```

Ou manualmente:

```sql
CREATE TABLE IF NOT EXISTS email_verifications (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_code ON email_verifications(code);
CREATE INDEX idx_email_verifications_expires ON email_verifications(expires_at);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
```

### 2. Verificar Configuração AWS SES

Certifique-se de que as variáveis de ambiente estão configuradas no `backend/.env`:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
EMAIL_FROM=seu-email@dominio.com
```

### 3. Reiniciar Backend

```bash
cd backend
node server.js
```

## Endpoints da API

### POST `/api/customers/send-verification`

Envia código de verificação para o email.

**Request:**
```json
{
  "email": "cliente@exemplo.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Código enviado para o email"
}
```

**Erros:**
- `400`: Email já cadastrado
- `500`: Erro ao enviar email

### POST `/api/customers/verify-code`

Valida o código de verificação.

**Request:**
```json
{
  "email": "cliente@exemplo.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verificado com sucesso"
}
```

**Erros:**
- `400`: Código inválido ou expirado

### POST `/api/customers/register`

Registra novo cliente (requer email verificado).

**Request:**
```json
{
  "nome_completo": "João Silva",
  "email": "cliente@exemplo.com",
  "senha": "senha123",
  "telefone": "11999999999",
  "cep": "01310100",
  "rua": "Av Paulista",
  "numero": "1000",
  "bairro": "Bela Vista",
  "cidade": "São Paulo",
  "estado": "SP",
  "aceita_marketing": true,
  "email_verified": true
}
```

**Erros:**
- `400`: Email não verificado
- `400`: Email já cadastrado

## Componentes Frontend

### CustomerAuthModal

Modal de autenticação com 3 modos:
- `login`: Tela de login
- `register`: Formulário de registro
- `verify`: Tela de verificação de código

**Estados:**
- `verificationCode`: Código de 6 dígitos
- `emailToVerify`: Email que está sendo verificado
- `mode`: Modo atual do modal

## Segurança

- Código expira em 10 minutos
- Código de 6 dígitos numéricos aleatórios
- Verificação de email único antes de enviar código
- Código marcado como usado após verificação
- Email deve ser verificado antes de criar conta

## Personalização

O email de verificação usa as cores e nome da loja configurados no painel administrativo:
- `primary_color`: Cor principal do email
- `store_name`: Nome da loja no rodapé

## Troubleshooting

### Email não está sendo enviado

1. Verificar configuração AWS SES no `.env`
2. Verificar se o email remetente está verificado no AWS SES
3. Verificar logs do backend para erros

### Código sempre inválido

1. Verificar timezone do banco de dados
2. Verificar se a migration foi aplicada corretamente
3. Verificar se o código não expirou (10 minutos)

### Email já cadastrado

1. Verificar se o email já existe na tabela `customers`
2. Limpar registros antigos de `email_verifications` se necessário

## Limpeza de Códigos Expirados (Opcional)

Para limpar códigos antigos automaticamente, adicione um cron job:

```sql
DELETE FROM email_verifications 
WHERE expires_at < NOW() - INTERVAL '1 day';
```
