# 🔄 Atualização - Sistema de Compra

## 1️⃣ Atualizar o Banco de Dados

Execute a migration para adicionar o campo WhatsApp:

```bash
# Executar migration
docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-whatsapp.sql
```

Ou manualmente:
```bash
docker exec -it vitrinepro-postgres psql -U postgres -d vitrinepro
```

Depois cole:
```sql
ALTER TABLE config ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);
UPDATE config SET whatsapp_number = '5511999999999' WHERE id = 1;
\q
```

## 2️⃣ Reiniciar o Backend

```bash
# Parar o backend (Ctrl+C)
# Iniciar novamente
cd backend
npm run dev
```

## 3️⃣ Testar

1. Abra o frontend: http://localhost:5173
2. Faça login como admin
3. Vá em Configurações (ícone de engrenagem)
4. Configure seu número de WhatsApp (ex: 5511999999999)
5. Salve
6. Saia do admin e teste comprar um produto
7. Vai aparecer 2 opções:
   - **WhatsApp**: Abre conversa direto com vendedor
   - **Compra Online**: Adiciona ao carrinho normal

## ✅ Pronto!

Agora os clientes podem escolher como querem comprar! 🎉
