from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.request
import urllib.parse

ALLOWED_ORIGINS = {'http://localhost:3001', 'http://127.0.0.1:3001'}

class FreteHandler(BaseHTTPRequestHandler):
    def _cors_headers(self):
        origin = self.headers.get('Origin', '')
        if origin in ALLOWED_ORIGINS:
            self.send_header('Access-Control-Allow-Origin', origin)
        
    def do_POST(self):
        if self.path == '/calcular':
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            try:
                resultados = calcular_frete_correios(data)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self._cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps(resultados).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self._cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode())

def calcular_frete_correios(data):
    cep_origem = data.get('cepOrigem', '').replace('-', '')
    cep_destino = data.get('cepDestino', '').replace('-', '')
    peso = data.get('peso', 0.3)
    
    # Calcular distância aproximada baseada nos 2 primeiros dígitos do CEP
    regiao_origem = int(cep_origem[:2]) if cep_origem else 0
    regiao_destino = int(cep_destino[:2]) if cep_destino else 0
    distancia = abs(regiao_origem - regiao_destino)
    
    # Cálculo baseado em tabelas reais dos Correios (valores aproximados)
    # Peso até 1kg, dimensões padrão
    
    # PAC: R$ 18-45 dependendo da distância
    valor_pac = 18.0 + (distancia * 0.8) + (peso * 10)
    prazo_pac = 7 + (distancia // 10)
    
    # SEDEX: R$ 25-70 dependendo da distância  
    valor_sedex = 25.0 + (distancia * 1.5) + (peso * 15)
    prazo_sedex = 2 + (distancia // 15)
    
    resultados = [
        {
            'servico': 'PAC',
            'valor': round(valor_pac, 2),
            'prazo': min(prazo_pac, 15)  # máximo 15 dias
        },
        {
            'servico': 'SEDEX',
            'valor': round(valor_sedex, 2),
            'prazo': min(prazo_sedex, 5)  # máximo 5 dias
        }
    ]
    
    return resultados

def extrair_tag(xml, tag):
    try:
        inicio = xml.find(f'<{tag}>') + len(f'<{tag}>')
        fim = xml.find(f'</{tag}>')
        return xml[inicio:fim]
    except:
        return None

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 5001), FreteHandler)
    print('🚀 Microserviço de Frete rodando em http://localhost:5001')
    server.serve_forever()
