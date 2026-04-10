// Supplement & fitness product images for Protein House
export const IMAGE_URLS = [
  // Protein powder / whey
  "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
  "https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=800",
  "https://images.unsplash.com/photo-1616279969856-759f316a5ac1?w=800",
  "https://images.unsplash.com/photo-1627467959547-215b1a09bb85?w=800",
  // Pre-workout / energy
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
  "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
  "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800",
  // Gym / strength training
  "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800",
  "https://images.unsplash.com/photo-1546519638405-a2b83c0ea5e6?w=800",
  "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800",
  "https://images.unsplash.com/photo-1540496905036-5937c10647cc?w=800",
  "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800",
  // Shakers / bottles / nutrition
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800",
  "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800",
  "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800",
  "https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=800",
  "https://images.unsplash.com/photo-1600423115367-87ea7661688f?w=800",
  // Creatine / amino acids / capsules
  "https://images.unsplash.com/photo-1584952811565-c4c4032931e0?w=800",
  "https://images.unsplash.com/photo-1587552132039-6e474d2bdc3c?w=800",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
  "https://images.unsplash.com/photo-1567722066597-a6c3f5deade0?w=800",
  "https://images.unsplash.com/photo-1580086319619-3ed498161c77?w=800",
  // Fitness lifestyle / healthy food
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800",
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800",
  "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800",
];

export function getRandomImages(count: number = 5): string[] {
  const shuffled = [...IMAGE_URLS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
