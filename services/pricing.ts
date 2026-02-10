// Funções para cálculo de preços com margem

export function applyMarkup(basePrice: number, markupPercentage: number): number {
  const price = Number(basePrice) || 0;
  const markup = Number(markupPercentage) || 0;
  
  // Fórmula inversa: preco_cheio = preco_real / (1 - desconto_percentual)
  const result = price / (1 - markup / 100);
  return Number(result.toFixed(2));
}

export function removeMarkup(finalPrice: number, markupPercentage: number): number {
  const price = Number(finalPrice) || 0;
  const markup = Number(markupPercentage) || 0;
  const result = price - (price * markup / 100);
  return Number(result.toFixed(2));
}

export function calculatePixDiscount(finalPrice: number, markupPercentage: number): number {
  const price = Number(finalPrice) || 0;
  const markup = Number(markupPercentage) || 0;
  const result = price * markup / 100;
  return Number(result.toFixed(2));
}

export function getPixPrice(finalPrice: number, markupPercentage: number): number {
  return removeMarkup(finalPrice, markupPercentage);
}
