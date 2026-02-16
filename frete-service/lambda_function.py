import json

def calcular_frete_correios(cep_origem, cep_destino, peso=0.3):
    """Calcula frete PAC e SEDEX baseado em tabelas dos Correios"""
    
    # Calcular distância aproximada baseada nos 2 primeiros dígitos do CEP
    regiao_origem = int(cep_origem[:2]) if cep_origem else 0
    regiao_destino = int(cep_destino[:2]) if cep_destino else 0
    distancia = abs(regiao_origem - regiao_destino)
    
    # PAC: R$ 18-45 dependendo da distância
    valor_pac = 18.0 + (distancia * 0.8) + (peso * 10)
    prazo_pac = 7 + (distancia // 10)
    
    # SEDEX: R$ 25-70 dependendo da distância  
    valor_sedex = 25.0 + (distancia * 1.5) + (peso * 15)
    prazo_sedex = 2 + (distancia // 15)
    
    return [
        {
            'servico': 'PAC',
            'valor': round(valor_pac, 2),
            'prazo': min(prazo_pac, 15)
        },
        {
            'servico': 'SEDEX',
            'valor': round(valor_sedex, 2),
            'prazo': min(prazo_sedex, 5)
        }
    ]

def lambda_handler(event, context):
    """Handler para AWS Lambda"""
    
    try:
        # Parse body se vier de API Gateway
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', event)
        
        cep_origem = body.get('cepOrigem', '').replace('-', '')
        cep_destino = body.get('cepDestino', '').replace('-', '')
        peso = body.get('peso', 0.3)
        
        # Validação básica
        if not cep_origem or not cep_destino:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'CEP origem e destino são obrigatórios'})
            }
        
        # Calcular frete
        resultados = calcular_frete_correios(cep_origem, cep_destino, peso)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps(resultados)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
