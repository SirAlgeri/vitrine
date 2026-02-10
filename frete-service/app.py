from flask import Flask, request, jsonify
from flask_cors import CORS
from correios import Correios

app = Flask(__name__)
CORS(app)

@app.route('/calcular', methods=['POST'])
def calcular_frete():
    try:
        data = request.json
        cep_origem = data.get('cepOrigem')
        cep_destino = data.get('cepDestino')
        peso = data.get('peso', 0.3)  # kg
        comprimento = data.get('comprimento', 16)
        altura = data.get('altura', 2)
        largura = data.get('largura', 11)
        
        correios = Correios()
        
        resultados = []
        
        # PAC
        try:
            pac = correios.calc_preco_prazo(
                codigo_servico='04510',
                cep_origem=cep_origem,
                cep_destino=cep_destino,
                peso=peso,
                comprimento=comprimento,
                altura=altura,
                largura=largura,
                formato=1,
                diametro=0
            )
            if pac and pac.get('Valor'):
                resultados.append({
                    'servico': 'PAC',
                    'valor': float(pac['Valor'].replace(',', '.')),
                    'prazo': int(pac.get('PrazoEntrega', 0))
                })
        except Exception as e:
            print(f"Erro PAC: {e}")
        
        # SEDEX
        try:
            sedex = correios.calc_preco_prazo(
                codigo_servico='04014',
                cep_origem=cep_origem,
                cep_destino=cep_destino,
                peso=peso,
                comprimento=comprimento,
                altura=altura,
                largura=largura,
                formato=1,
                diametro=0
            )
            if sedex and sedex.get('Valor'):
                resultados.append({
                    'servico': 'SEDEX',
                    'valor': float(sedex['Valor'].replace(',', '.')),
                    'prazo': int(sedex.get('PrazoEntrega', 0))
                })
        except Exception as e:
            print(f"Erro SEDEX: {e}")
        
        if not resultados:
            return jsonify({'error': 'Nenhum serviço disponível'}), 400
        
        return jsonify(resultados)
    
    except Exception as e:
        print(f"Erro geral: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
