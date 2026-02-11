export function generateStockLevels(totalVariants: number) {
  const stockLevels: { main: number; international: number }[] = [];

  for (let i = 0; i < totalVariants; i++) {
    const rand = Math.random();

    if (rand < 0.05) {
      // 5% out of stock
      stockLevels.push({ main: 0, international: 0 });
    } else if (rand < 0.15) {
      // 10% low stock (1-4 units)
      const total = 1 + Math.floor(Math.random() * 4);
      stockLevels.push({
        main: Math.ceil(total * 0.6),
        international: Math.floor(total * 0.4),
      });
    } else if (rand < 0.40) {
      // 25% moderate stock (5-15 units)
      const total = 5 + Math.floor(Math.random() * 11);
      stockLevels.push({
        main: Math.ceil(total * 0.6),
        international: Math.floor(total * 0.4),
      });
    } else {
      // 60% healthy stock (20-50 units)
      const total = 20 + Math.floor(Math.random() * 31);
      stockLevels.push({
        main: Math.ceil(total * 0.6),
        international: Math.floor(total * 0.4),
      });
    }
  }

  return stockLevels;
}
