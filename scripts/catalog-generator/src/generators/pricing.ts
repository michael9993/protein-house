export function calculatePricing(basePrice_ILS: number, basePrice_USD: number, discount?: number) {
  const finalPrice_ILS = discount ? basePrice_ILS * (1 - discount) : basePrice_ILS;
  const finalPrice_USD = discount ? basePrice_USD * (1 - discount) : basePrice_USD;

  // Round to .99 endings
  const price_ILS = Math.round(finalPrice_ILS / 10) * 10 - 0.01;
  const price_USD = Math.round(finalPrice_USD) - 0.01;

  const costPrice_ILS = Math.round(basePrice_ILS * 0.5);
  const costPrice_USD = Math.round(basePrice_USD * 0.5);

  return {
    price_ILS,
    price_USD,
    costPrice_ILS,
    costPrice_USD,
  };
}
