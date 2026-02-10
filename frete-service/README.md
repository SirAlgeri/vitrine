# Microserviço de Frete

Serviço Python para cálculo de frete dos Correios.

## Instalação

```bash
cd frete-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Executar

```bash
python app.py
```

Rodará em: http://localhost:5001

## Endpoints

### POST /calcular
Calcula frete PAC e SEDEX

**Body:**
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
    "valor": 15.50,
    "prazo": 7
  },
  {
    "servico": "SEDEX",
    "valor": 25.00,
    "prazo": 3
  }
]
```

### GET /health
Health check
