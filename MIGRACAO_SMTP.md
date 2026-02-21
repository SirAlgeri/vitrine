# Migração AWS SES → SMTP Próprio

## ✅ O que foi feito

1. ✅ Criado `backend/smtpEmailService.js` (substitui emailService.js)
2. ✅ Atualizado `backend/server.js` para usar SMTP
3. ✅ Criado documentação completa em `SMTP_SETUP.md`
4. ✅ Criado exemplo de configuração `.env.smtp.example`

## 🚀 Instalação Rápida (3 passos)

### 1. Instalar dependência

```bash
./install-smtp.sh
```

Ou manualmente:
```bash
cd backend
npm install nodemailer
```

### 2. Configurar SMTP

Escolha uma opção e adicione no `backend/.env`:

**Opção A: Gmail (Recomendado para começar)**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
SMTP_FROM=seu-email@gmail.com
SMTP_FROM_NAME=Sua Loja
FRONTEND_URL=http://localhost:5173
```

**Como obter senha de app do Gmail:**
1. Acesse: https://myaccount.google.com/security
2. Ative "Verificação em duas etapas"
3. Acesse: https://myaccount.google.com/apppasswords
4. Crie senha de app para "Email"
5. Copie a senha de 16 caracteres

**Opção B: Outlook**

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@outlook.com
SMTP_PASS=sua-senha-normal
SMTP_FROM=seu-email@outlook.com
SMTP_FROM_NAME=Sua Loja
FRONTEND_URL=http://localhost:5173
```

**Opção C: Servidor Próprio**

```env
SMTP_HOST=mail.seudominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@seudominio.com
SMTP_PASS=senha-do-email
SMTP_FROM=noreply@seudominio.com
SMTP_FROM_NAME=Sua Loja
FRONTEND_URL=http://localhost:5173
```

### 3. Reiniciar backend

```bash
cd backend
node server.js
```

## 🧪 Testar

1. Acesse o painel admin
2. Atualize o status de um pedido que tenha email
3. Verifique o terminal do backend:
   - ✅ `Email enviado: <message-id>`
   - ❌ `Erro ao enviar email: ...`

## 📊 Comparação

| Recurso | AWS SES | SMTP Próprio |
|---------|---------|--------------|
| Custo | Pago após 62k emails | Gratuito (Gmail: 500/dia) |
| Configuração | Complexa (DNS, IAM) | Simples (usuário/senha) |
| Aprovação | Requer aprovação AWS | Imediato |
| Dependência | AWS | Nenhuma |
| Entregabilidade | Excelente | Boa (depende do provedor) |

## 🔄 Reverter para AWS SES

Se precisar voltar para AWS SES:

```bash
cd backend
# Editar server.js linha 17:
# import { sendOrderStatusEmail, sendVerificationEmail } from './emailService.js';
```

## 📚 Documentação Completa

Veja `SMTP_SETUP.md` para:
- Configuração detalhada de cada provedor
- Troubleshooting
- Configuração de SPF/DKIM
- Monitoramento
- Boas práticas de segurança

## ⚠️ Importante

- **Não commite o .env** com suas credenciais
- Use **senha de app** no Gmail (não a senha normal)
- Configure **SPF no DNS** para evitar spam
- Monitore os **logs de envio**

## 🎯 Recomendações por Uso

**Desenvolvimento/Testes:**
- Use Gmail (mais fácil)

**Produção (até 500 emails/dia):**
- Use Gmail ou Outlook

**Produção (até 5.000 emails/mês):**
- Use Zoho Mail (domínio próprio gratuito)

**Produção (volume alto):**
- Use servidor SMTP próprio
- Ou contrate SendGrid/Mailgun

---

**Data da migração:** 20/02/2026
