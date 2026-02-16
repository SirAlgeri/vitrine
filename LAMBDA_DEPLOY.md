# Deploy do Microserviço de Frete como AWS Lambda

## Vantagens de Usar Lambda

✅ **Custo**: Pay-per-use (1M requisições grátis/mês)
✅ **Escalabilidade**: Automática
✅ **Manutenção**: Zero servidor para gerenciar
✅ **Disponibilidade**: 99.95% SLA
✅ **Cold Start**: ~100ms (Python é rápido)
✅ **Sem dependências**: Código puro Python

## Arquitetura

```
Frontend React
    ↓
Backend Node.js
    ↓
API Gateway → Lambda (Python) → Response
```

## Passo a Passo

### 1. Criar Lambda Function

**Via Console AWS:**
1. Acesse Lambda → Create function
2. Nome: `vitrine-frete-calculator`
3. Runtime: **Python 3.12**
4. Architecture: **x86_64**
5. Create function

**Via AWS CLI:**
```bash
aws lambda create-function \
  --function-name vitrine-frete-calculator \
  --runtime python3.12 \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-basic-execution \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://lambda_function.zip
```

### 2. Upload do Código

**Opção 1: Console (mais fácil)**
1. Copie o conteúdo de `lambda_function.py`
2. Cole no editor do Lambda
3. Deploy

**Opção 2: ZIP (recomendado para CI/CD)**
```bash
cd frete-service
zip lambda_function.zip lambda_function.py

aws lambda update-function-code \
  --function-name vitrine-frete-calculator \
  --zip-file fileb://lambda_function.zip
```

### 3. Configurar API Gateway

**REST API:**
1. API Gateway → Create API → REST API
2. Create Resource: `/calcular`
3. Create Method: `POST`
4. Integration type: **Lambda Function**
5. Lambda Function: `vitrine-frete-calculator`
6. Enable CORS
7. Deploy API → Stage: `prod`

**HTTP API (mais simples e barato):**
```bash
aws apigatewayv2 create-api \
  --name vitrine-frete-api \
  --protocol-type HTTP \
  --target arn:aws:lambda:REGION:ACCOUNT_ID:function:vitrine-frete-calculator
```

### 4. Configurar CORS

No API Gateway:
```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
}
```

### 5. Atualizar Backend Node.js

Substitua `http://localhost:5001/calcular` por:
```javascript
const LAMBDA_URL = 'https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod/calcular';
```

Em `backend/server.js`:
```javascript
app.post('/api/frete/calcular', async (req, res) => {
  try {
    const { cepOrigem, cepDestino, peso } = req.body;
    
    const response = await fetch(LAMBDA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cepOrigem, cepDestino, peso })
    });

    const resultados = await response.json();
    res.json(resultados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## Configuração da Lambda

### Memória
- **Recomendado**: 128 MB (mínimo)
- Código é leve, não precisa mais

### Timeout
- **Recomendado**: 3 segundos
- Cálculo é instantâneo (< 100ms)

### Variáveis de Ambiente
Nenhuma necessária (código puro)

### Permissões (IAM Role)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

## Testes

### Teste no Console Lambda
```json
{
  "body": "{\"cepOrigem\":\"01310100\",\"cepDestino\":\"22041001\",\"peso\":0.3}"
}
```

### Teste via cURL
```bash
curl -X POST https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod/calcular \
  -H "Content-Type: application/json" \
  -d '{"cepOrigem":"01310100","cepDestino":"22041001","peso":0.3}'
```

### Teste via Postman
- Method: POST
- URL: `https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod/calcular`
- Body (raw JSON):
```json
{
  "cepOrigem": "01310100",
  "cepDestino": "22041001",
  "peso": 0.3
}
```

## Custos Estimados

### Lambda
- **Free Tier**: 1M requisições/mês + 400.000 GB-s
- **Após Free Tier**: $0.20 por 1M requisições
- **Memória (128MB)**: $0.0000000021 por 100ms

### API Gateway
- **HTTP API**: $1.00 por 1M requisições
- **REST API**: $3.50 por 1M requisições

### Exemplo (10.000 req/mês)
- Lambda: **Grátis** (dentro do free tier)
- API Gateway HTTP: **$0.01/mês**
- **Total: ~$0.01/mês** 🎉

### Comparação com EC2
- **EC2 t3.micro**: ~$8/mês (24/7)
- **Lambda**: ~$0.01/mês (10k req)
- **Economia**: 99.9% 💰

## Monitoramento

### CloudWatch Logs
```bash
aws logs tail /aws/lambda/vitrine-frete-calculator --follow
```

### Métricas
- Invocations
- Duration
- Errors
- Throttles

### Alarmes
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name frete-lambda-errors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## CI/CD com GitHub Actions

```yaml
name: Deploy Lambda

on:
  push:
    branches: [main]
    paths:
      - 'frete-service/lambda_function.py'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy Lambda
        run: |
          cd frete-service
          zip lambda_function.zip lambda_function.py
          aws lambda update-function-code \
            --function-name vitrine-frete-calculator \
            --zip-file fileb://lambda_function.zip
```

## Terraform (Infraestrutura como Código)

```hcl
resource "aws_lambda_function" "frete_calculator" {
  filename         = "lambda_function.zip"
  function_name    = "vitrine-frete-calculator"
  role            = aws_iam_role.lambda_role.arn
  handler         = "lambda_function.lambda_handler"
  runtime         = "python3.12"
  memory_size     = 128
  timeout         = 3

  environment {
    variables = {
      LOG_LEVEL = "INFO"
    }
  }
}

resource "aws_apigatewayv2_api" "frete_api" {
  name          = "vitrine-frete-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["Content-Type"]
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.frete_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.frete_calculator.invoke_arn
}
```

## Versionamento

```bash
# Publicar versão
aws lambda publish-version \
  --function-name vitrine-frete-calculator \
  --description "v1.0.0"

# Criar alias
aws lambda create-alias \
  --function-name vitrine-frete-calculator \
  --name prod \
  --function-version 1
```

## Rollback

```bash
# Voltar para versão anterior
aws lambda update-alias \
  --function-name vitrine-frete-calculator \
  --name prod \
  --function-version 1
```

## Segurança

### API Key (opcional)
```bash
aws apigateway create-api-key \
  --name vitrine-frete-key \
  --enabled

aws apigateway create-usage-plan \
  --name vitrine-frete-plan \
  --throttle burstLimit=100,rateLimit=50
```

### VPC (se necessário)
```hcl
resource "aws_lambda_function" "frete_calculator" {
  # ... outras configs
  
  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
}
```

## Troubleshooting

### Erro: "Internal server error"
- Verifique CloudWatch Logs
- Teste payload no console Lambda

### Erro: CORS
- Configure CORS no API Gateway
- Adicione headers na resposta Lambda

### Cold Start alto
- Aumentar memória para 256MB
- Usar Provisioned Concurrency (custo extra)

### Timeout
- Aumentar timeout (máx 15min)
- Otimizar código

## Migração do Servidor Local

### Antes (Local)
```
python3 server.py  # Porta 5001
```

### Depois (Lambda)
```
# Nada! Lambda gerencia tudo
```

### Atualizar .env
```bash
# Antes
FRETE_SERVICE_URL=http://localhost:5001/calcular

# Depois
FRETE_SERVICE_URL=https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod/calcular
```

## Próximos Passos

1. ✅ Criar Lambda function
2. ✅ Configurar API Gateway
3. ✅ Testar endpoint
4. ✅ Atualizar backend Node.js
5. ✅ Configurar CI/CD
6. ✅ Monitorar CloudWatch
7. ✅ Configurar alarmes

## Recursos

- [AWS Lambda Python](https://docs.aws.amazon.com/lambda/latest/dg/lambda-python.html)
- [API Gateway](https://docs.aws.amazon.com/apigateway/)
- [Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
