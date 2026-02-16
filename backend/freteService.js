export async function calcularFrete(params) {
  const {
    cepOrigem,
    cepDestino,
    peso = 0.3,
    comprimento = 16,
    altura = 2,
    largura = 11
  } = params;

  try {
    const response = await fetch('http://localhost:5001/calcular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cepOrigem,
        cepDestino,
        peso,
        comprimento,
        altura,
        largura
      })
    });

    if (!response.ok) {
      throw new Error('Erro ao calcular frete');
    }

    const resultados = await response.json();
    return resultados;
  } catch (error) {
    console.error('Erro ao calcular frete:', error);
    throw new Error('Não foi possível calcular o frete. Tente novamente.');
  }
}

export function validarCEP(cep) {
  const cepLimpo = cep.replace(/\D/g, '');
  return cepLimpo.length === 8;
}
