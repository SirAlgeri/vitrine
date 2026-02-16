# Migration - Sistema de Frete

## Data: 2026-02-10

## Objetivo
Adicionar suporte completo para cálculo e armazenamento de frete dos Correios.

## Alterações no Banco de Dados

### Tabela: `config`
```sql
-- Adicionar CEP de origem para cálculo de frete
ALTER TABLE config ADD COLUMN IF NOT EXISTS cep_origem VARCHAR(8);

-- Campos futuros (não implementados ainda)
ALTER TABLE config ADD COLUMN IF NOT EXISTS frete_gratis_acima DECIMAL(10,2) DEFAULT 0;
ALTER TABLE config ADD COLUMN IF NOT EXISTS prazo_adicional INTEGER DEFAULT 0;
```

### Tabela: `orders`
```sql
-- Adicionar informações de frete no pedido
ALTER TABLE orders ADD COLUMN IF NOT EXISTS frete_servico VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS frete_valor DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS frete_prazo INTEGER DEFAULT 0;
```

## Executar Migration

```bash
# Via Docker
cat database/migration-frete.sql | docker exec -i vitrinepro-postgres psql -U postgres -d vitrinepro

# Ou direto no PostgreSQL
psql -U postgres -d vitrinepro -f database/migration-frete.sql
```

## Verificar

```sql
-- Verificar coluna em config
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'config' AND column_name = 'cep_origem';

-- Verificar colunas em orders
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name LIKE 'frete%';
```

## Rollback (se necessário)

```sql
ALTER TABLE config DROP COLUMN IF EXISTS cep_origem;
ALTER TABLE config DROP COLUMN IF EXISTS frete_gratis_acima;
ALTER TABLE config DROP COLUMN IF EXISTS prazo_adicional;

ALTER TABLE orders DROP COLUMN IF EXISTS frete_servico;
ALTER TABLE orders DROP COLUMN IF EXISTS frete_valor;
ALTER TABLE orders DROP COLUMN IF EXISTS frete_prazo;
```

## Impacto

- ✅ Não quebra dados existentes
- ✅ Colunas com valores padrão
- ✅ Compatível com pedidos antigos (frete = 0)
- ✅ Permite migração gradual

## Próximos Passos

1. Configurar CEP de origem no admin
2. Testar cálculo de frete
3. Verificar pedidos com frete
4. Implementar frete grátis (futuro)
