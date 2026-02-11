// Extracted from shoes-import-20.xlsx template
export const IMAGE_URLS = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
  "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800",
  "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800",
  "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800",
  "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800",
  "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800",
  "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800",
  "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800",
  "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800",
  "https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=800",
  "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800",
  "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800",
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800",
  "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800",
  "https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=800",
  "https://images.unsplash.com/photo-1465453869711-7e174808ace9?w=800",
  "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800",
  "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800",
  "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800",
  "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800",
  "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800",
  "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800",
  "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800",
  "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=800",
  "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800",
  "https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800",
  "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800",
  "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800",
  "https://images.unsplash.com/photo-1618898909019-010e4e234c55?w=800"
];

export function getRandomImages(count: number = 5): string[] {
  const shuffled = [...IMAGE_URLS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
