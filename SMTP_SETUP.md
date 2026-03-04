# Guia de Configuração SMTP - Email Próprio

Sistema de envio de emails usando SMTP (sem dependência de serviços terceiros pagos).

## 🚀 Instalação

### 1. Instalar Nodemailer

```bash
cd backend
npm install nodemailer
```

### 2. Atualizar server.js

Substitua a importação do emailService:

```javascript
// ANTES (AWS SES)
// import { sendOrderStatusEmail, sendVerificationEmail } from './emailService.js';

// DEPOIS (SMTP)
import { sendOrderStatusEmail, sendVerificationEmail } from './smtpEmailService.js';
```

### 3. Configurar Variáveis de Ambiente

Escolha uma das opções abaixo e adicione no `backend/.env`:

---

## 📧 Opções de Configuração

### Opção 1: Gmail (Recomendado para Testes)

**Vantagens:**
- ✅ Gratuito
- ✅ Até 500 emails/dia
- ✅ Confiável
- ✅ Fácil configuração

**Limitações:**
- ⚠️ Limite de 500 emails/dia
- ⚠️ Pode cair em spam se não configurar SPF/DKIM

**Configuração:**

1. **Ativar verificação em 2 etapas:**
   - Acesse: https://myaccount.google.com/security
   - Ative "Verificação em duas etapas"

2. **Criar senha de app:**
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "Email" e "Outro (nome personalizado)"
   - Digite "Vitrine Pro"
   - Copie a senha gerada (16 caracteres)

3. **Adicionar no .env:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=seu-email@gmail.com
SMTP_FROM_NAME=Sua Loja
FRONTEND_URL=http://localhost:5173
```

---

### Opção 2: Outlook/Hotmail

**Vantagens:**
- ✅ Gratuito
- ✅ Sem limite diário oficial
- ✅ Boa entregabilidade

**Configuração:**

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

**Nota:** Use sua senha normal do Outlook (não precisa senha de app).

---

### Opção 3: Zoho Mail

**Vantagens:**
- ✅ Gratuito (até 5 usuários)
- ✅ Domínio próprio gratuito
- ✅ Profissional
- ✅ 5GB de armazenamento

**Configuração:**

1. Criar conta em: https://www.zoho.com/mail/
2. Adicionar seu domínio (opcional)
3. Configurar:

```env
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@zoho.com
SMTP_PASS=sua-senha
SMTP_FROM=seu-email@zoho.com
SMTP_FROM_NAME=Sua Loja
FRONTEND_URL=http://localhost:5173
```

---

### Opção 4: Servidor SMTP Próprio

Se você tem hospedagem com cPanel ou Plesk:

**Configuração:**

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

**Como obter as configurações:**
1. Acesse seu cPanel
2. Vá em "Contas de Email"
3. Clique em "Configurar Cliente de Email"
4. Use as configurações SMTP mostradas

---

### Opção 5: SendGrid (Gratuito - 100 emails/dia)

**Vantagens:**
- ✅ 100 emails/dia gratuitos
- ✅ API profissional
- ✅ Estatísticas detalhadas

**Configuração:**

1. Criar conta em: https://sendgrid.com/
2. Criar API Key em: Settings > API Keys
3. Configurar:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.sua-api-key-aqui
SMTP_FROM=seu-email-verificado@seudominio.com
SMTP_FROM_NAME=Sua Loja
FRONTEND_URL=http://localhost:5173
```

---

### Opção 6: Mailgun (Gratuito - 5.000 emails/mês)

**Vantagens:**
- ✅ 5.000 emails/mês gratuitos (3 meses)
- ✅ Profissional
- ✅ Boa entregabilidade

**Configuração:**

1. Criar conta em: https://www.mailgun.com/
2. Verificar domínio
3. Obter credenciais SMTP
4. Configurar:

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@seu-dominio.mailgun.org
SMTP_PASS=sua-senha-smtp
SMTP_FROM=noreply@seudominio.com
SMTP_FROM_NAME=Sua Loja
FRONTEND_URL=http://localhost:5173
```

---

## 🧪 Testar Configuração

### 1. Reiniciar Backend

```bash
cd backend
node server.js
```

### 2. Testar Envio

No painel admin, atualize o status de um pedido que tenha email do cliente.

### 3. Verificar Logs

No terminal do backend, você verá:

```
✅ Email enviado: <message-id>
```

Ou em caso de erro:

```
❌ Erro ao enviar email: Invalid login
```

---

## 🔧 Troubleshooting

### Erro: "Invalid login"

**Causa:** Usuário ou senha incorretos

**Solução:**
- Gmail: Use senha de app (não a senha normal)
- Outlook: Use senha normal
- Verifique se não há espaços extras no .env

### Erro: "Connection timeout"

**Causa:** Porta bloqueada ou host incorreto

**Solução:**
- Verifique se a porta 587 está aberta no firewall
- Tente porta 465 com `SMTP_SECURE=true`
- Verifique o host SMTP

### Erro: "Self signed certificate"

**Causa:** Certificado SSL inválido

**Solução:**

Adicione no `smtpEmailService.js`:

```javascript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false  // Adicione esta linha
  }
});
```

### Emails caindo em spam

**Soluções:**

1. **Configure SPF no DNS:**
```
Tipo: TXT
Nome: @
Valor: v=spf1 include:_spf.google.com ~all
```
(Ajuste conforme seu provedor)

2. **Configure DKIM** (se disponível no provedor)

3. **Use domínio próprio** ao invés de @gmail.com

4. **Evite palavras spam** no assunto:
   - ❌ "GRÁTIS", "PROMOÇÃO", "CLIQUE AQUI"
   - ✅ "Pedido #123 - Confirmado"

---

## 📊 Comparação de Opções

| Provedor | Gratuito | Limite/dia | Domínio Próprio | Dificuldade |
|----------|----------|------------|-----------------|-------------|
| Gmail | ✅ | 500 | ❌ | Fácil |
| Outlook | ✅ | ~300 | ❌ | Fácil |
| Zoho | ✅ | 250 | ✅ | Média |
| SendGrid | ✅ | 100 | ✅ | Fácil |
| Mailgun | ✅ (3 meses) | 166 | ✅ | Média |
| SMTP Próprio | Depende | Ilimitado | ✅ | Média |

---

## 🎯 Recomendações

**Para desenvolvimento/testes:**
- Use **Gmail** (mais fácil e rápido)

**Para produção (baixo volume):**
- Use **Zoho Mail** (domínio próprio gratuito)

**Para produção (médio volume):**
- Use **SendGrid** ou **Mailgun** (profissional)

**Para produção (alto volume):**
- Use **SMTP próprio** ou contrate plano pago

---

## 🔒 Segurança

**Boas práticas:**

1. **Nunca commite o .env:**
```bash
echo "backend/.env" >> .gitignore
```

2. **Use variáveis de ambiente em produção:**
```bash
export SMTP_USER=seu-email@gmail.com
export SMTP_PASS=sua-senha
```

3. **Rotacione senhas periodicamente**

4. **Use senhas de app** (Gmail, Yahoo)

5. **Monitore logs de envio**

---

## 📈 Monitoramento

Adicione logs detalhados no `smtpEmailService.js`:

```javascript
export async function sendEmail(to, subject, htmlBody) {
  console.log(`📧 Enviando email para: ${to}`);
  console.log(`📝 Assunto: ${subject}`);
  
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Loja'}" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html: htmlBody,
    });

    console.log('✅ Email enviado:', info.messageId);
    console.log('📊 Response:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    console.error('🔍 Detalhes:', error);
    return { success: false, error: error.message };
  }
}
```

---

## ✅ Checklist Final

Antes de ir para produção:

- [ ] Nodemailer instalado
- [ ] Variáveis SMTP configuradas no .env
- [ ] Import atualizado no server.js
- [ ] Teste de envio realizado com sucesso
- [ ] SPF configurado no DNS (se domínio próprio)
- [ ] Emails não caindo em spam
- [ ] Logs de erro configurados
- [ ] .env no .gitignore

---

**Implementado por: Kiro AI**
**Data: 20/02/2026**
