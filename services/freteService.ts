export async function calcularFrete(cepOrigem: string, cepDestino: string) {
  const response = await fetch('/api/frete/calcular', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cepOrigem,
      cepDestino,
      peso: 0.3,
      comprimento: 16,
      altura: 2,
      largura: 11
    })
  });

  if (!response.ok) {
    throw new Error('Erro ao calcular frete');
  }

  return response.json();
}
