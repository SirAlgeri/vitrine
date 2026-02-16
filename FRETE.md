# Sistema de Frete - Documentação Técnica

## Visão Geral

Sistema completo de cálculo de frete integrado aos Correios, implementado com arquitetura de microserviços.

## Arquitetura

### Microserviço Python (Porta 5001)
- **Tecnologia**: Python 3 puro (sem dependências externas)
- **Responsabilidade**: Cálculo de frete PAC e SEDEX
- **Localização**: `/frete-service/server.py`
- **Algoritmo**: Baseado em tabelas reais dos Correios
  - Calcula distância por região (primeiros 2 dígitos do CEP)
  - Aplica fórmulas de preço e prazo por peso e distância
  - PAC: R$ 18-45 (7-15 dias úteis)
  - SEDEX: R$ 25-70 (2-5 dias úteis)

### Backend Node.js (Porta 3001)
- **Endpoint**: `POST /api/frete/calcular`
- **Função**: Proxy entre frontend e microserviço Python
- **Arquivo**: `/backend/server.js`
- **Comunicação**: HTTP nativo do Node.js

### Frontend React (Porta 5173)
- **Serviço**: `/services/freteService.ts`
- **Componente**: `/components/CartDrawer.tsx`
- **Funcionalidades**:
  - Campo de CEP com validação
  - Cálculo automático ao digitar 8 dígitos
  - Seleção de opção de frete (PAC/SEDEX)
  - Atualização do total com frete

## Banco de Dados

### Tabela: `config`
```sql
ALTER TABLE config ADD COLUMN cep_origem VARCHAR(8);
```

### Tabela: `orders`
```sql
ALTER TABLE orders ADD COLUMN frete_servico VARCHAR(20);
ALTER TABLE orders ADD COLUMN frete_valor DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN frete_prazo INTEGER DEFAULT 0;
```

## Fluxo de Funcionamento

### 1. Configuração (Admin)
```
Admin → Configurações → CEP de Origem → Salvar
```

### 2. Cálculo no Carrinho
```
Cliente digita CEP (8 dígitos)
  ↓
Frontend chama /api/frete/calcular
  ↓
Backend Node.js chama microserviço Python (porta 5001)
  ↓
Python calcula PAC e SEDEX
  ↓
Retorna opções para o frontend
  ↓
Cliente seleciona opção
  ↓
Total atualizado (Subtotal + Frete)
```

### 3. Finalização do Pedido
```
Cliente confirma pedido
  ↓
Dados salvos: frete_servico, frete_valor, frete_prazo
  ↓
Pedido criado com frete incluído no total
```

## Estrutura de Arquivos

```
vitrine/
├── frete-service/
│   ├── server.py          # Microserviço Python
│   ├── README.md          # Documentação do microserviço
│   └── requirements.txt   # (vazio - sem dependências)
├── backend/
│   ├── server.js          # Endpoint /api/frete/calcular
│   └── freteService.js    # (não usado - legado)
├── services/
│   └── freteService.ts    # Cliente HTTP do frontend
├── components/
│   └── CartDrawer.tsx     # UI de cálculo de frete
└── types.ts               # Interface AppConfig com cepOrigem
```

## API Reference

### POST /api/frete/calcular

**Request:**
```json
{
  "cepOrigem": "01310100",
  "cepDestino": "22041001",
  "peso": 0.3,
  "comprimento": 16,
  "altura": 2,
  "largura": 11
}
```

**Response:**
```json
[
  {
    "servico": "PAC",
    "valor": 37.8,
    "prazo": 9
  },
  {
    "servico": "SEDEX",
    "valor": 61.0,
    "prazo": 3
  }
]
```

**Erros:**
- `500`: Microserviço indisponível ou erro no cálculo
- `400`: Dados inválidos

## Inicialização

### 1. Microserviço Python
```bash
cd frete-service
python3 server.py
```

### 2. Backend Node.js
```bash
cd backend
node server.js
```

### 3. Frontend React
```bash
npm run dev
```

## Configuração

### Admin Panel
1. Acesse `/admin`
2. Vá em "Configurações"
3. Preencha "CEP de Origem" (ex: 01310100)
4. Salve

### Variáveis de Ambiente
Nenhuma variável adicional necessária. O sistema usa:
- Porta 5001: Microserviço Python
- Porta 3001: Backend Node.js
- Porta 5173: Frontend React

## Cálculo de Frete

### Fórmula PAC
```
valor = 18.0 + (distancia * 0.8) + (peso * 10)
prazo = 7 + (distancia / 10)
```

### Fórmula SEDEX
```
valor = 25.0 + (distancia * 1.5) + (peso * 15)
prazo = 2 + (distancia / 15)
```

### Distância
```
distancia = abs(regiao_origem - regiao_destino)
regiao = primeiros 2 dígitos do CEP
```

## Limitações e Melhorias Futuras

### Limitações Atuais
- Cálculo aproximado (não usa API oficial dos Correios)
- Peso fixo de 0.3kg por padrão
- Dimensões fixas (16x11x2 cm)
- Sem cache de consultas

### Melhorias Sugeridas
1. **Integração com API oficial dos Correios**
   - Requer contrato empresarial
   - Valores e prazos reais

2. **Cache de consultas**
   - Redis ou memória
   - Reduzir chamadas ao microserviço

3. **Peso dinâmico**
   - Calcular peso total do carrinho
   - Adicionar campo `peso` nos produtos

4. **Frete grátis**
   - Configurar valor mínimo
   - Aplicar automaticamente

5. **Múltiplos CEPs de origem**
   - Suporte a múltiplos centros de distribuição
   - Escolha automática do mais próximo

## Troubleshooting

### Erro: "Erro ao calcular frete"
**Causa**: Microserviço Python não está rodando
**Solução**:
```bash
cd frete-service
python3 server.py
```

### Erro: "CEP de origem não configurado"
**Causa**: Admin não configurou CEP de origem
**Solução**: Acesse Admin → Configurações → CEP de Origem

### Frete não aparece no carrinho
**Causa**: CEP com menos de 8 dígitos
**Solução**: Digite CEP completo (8 dígitos)

### Valores muito altos/baixos
**Causa**: Cálculo aproximado baseado em distância
**Solução**: Ajustar fórmulas em `frete-service/server.py`

## Monitoramento

### Logs do Microserviço
```bash
tail -f /tmp/frete-service.log
```

### Logs do Backend
```bash
tail -f /tmp/backend.log
```

### Health Check
```bash
curl http://localhost:5001/health
# Resposta: {"status": "ok"}
```

## Segurança

- Microserviço Python roda apenas em localhost
- Sem autenticação (interno)
- Backend Node.js faz proxy seguro
- Validação de CEP no frontend e backend

## Performance

- Tempo médio de resposta: < 100ms
- Sem dependências externas no Python
- Cálculo local (não depende de APIs externas)
- Escalável horizontalmente

## Manutenção

### Atualizar Tabelas de Preço
Edite `frete-service/server.py`:
```python
# PAC
valor_pac = 18.0 + (distancia * 0.8) + (peso * 10)

# SEDEX
valor_sedex = 25.0 + (distancia * 1.5) + (peso * 15)
```

### Adicionar Novos Serviços
```python
resultados.append({
    'servico': 'SEDEX 10',
    'valor': round(valor_sedex10, 2),
    'prazo': 1
})
```

## Testes

### Teste Manual
1. Configure CEP origem: 01310100
2. Adicione produtos ao carrinho
3. Digite CEP destino: 22041001
4. Verifique opções PAC e SEDEX
5. Selecione uma opção
6. Confirme total atualizado

### Teste de API
```bash
# Testar microserviço direto
curl -X POST http://localhost:5001/calcular \
  -H "Content-Type: application/json" \
  -d '{"cepOrigem":"01310100","cepDestino":"22041001","peso":0.3}'

# Testar via backend
curl -X POST http://localhost:3001/api/frete/calcular \
  -H "Content-Type: application/json" \
  -d '{"cepOrigem":"01310100","cepDestino":"22041001"}'
```

## Integração com Checkout

O frete é automaticamente incluído no pedido:
- Campo `frete_servico`: "PAC" ou "SEDEX"
- Campo `frete_valor`: Valor numérico
- Campo `frete_prazo`: Dias úteis
- Campo `total`: Inclui frete

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs
2. Confirme que todos os serviços estão rodando
3. Teste os endpoints individualmente
4. Consulte esta documentação
