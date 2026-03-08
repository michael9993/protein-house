// Pet product images organized by category
export const IMAGE_URLS = [
  // Pet Toys
  "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=800",
  "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800",
  "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=800",
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
  "https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=800",
  // Pet Feeding
  "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800",
  "https://images.unsplash.com/photo-1600804340584-c7db2eacf0bf?w=800",
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800",
  "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800",
  // Pet Comfort (beds, blankets)
  "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=800",
  "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800",
  "https://images.unsplash.com/photo-1615497001839-b0a0eac3274c?w=800",
  "https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=800",
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800",
  // Pet Care (grooming, accessories)
  "https://images.unsplash.com/photo-1581888227599-779811939961?w=800",
  "https://images.unsplash.com/photo-1587764379873-97837921fd44?w=800",
  "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=800",
  "https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?w=800",
  "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800",
  // General pets
  "https://images.unsplash.com/photo-1450778869180-cfe0f76f8e8a?w=800",
  "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800",
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800",
  "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800",
  "https://images.unsplash.com/photo-1587402092301-725e37c70fd8?w=800",
  "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800",
  "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800",
  "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=800",
];

export function getRandomImages(count: number = 5): string[] {
  const shuffled = [...IMAGE_URLS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
