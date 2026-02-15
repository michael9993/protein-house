export interface CanvasPreset {
  id: string;
  label: string;
  width: number;
  height: number;
  category: "social" | "web" | "print" | "ecommerce";
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  // Social
  { id: "ig-square", label: "Instagram Post", width: 1080, height: 1080, category: "social" },
  { id: "ig-story", label: "Instagram Story", width: 1080, height: 1920, category: "social" },
  { id: "fb-cover", label: "Facebook Cover", width: 820, height: 312, category: "social" },
  { id: "fb-post", label: "Facebook Post", width: 1200, height: 630, category: "social" },
  { id: "twitter", label: "Twitter/X Post", width: 1200, height: 675, category: "social" },
  { id: "linkedin", label: "LinkedIn Post", width: 1200, height: 627, category: "social" },
  { id: "pinterest", label: "Pinterest Pin", width: 1000, height: 1500, category: "social" },
  { id: "youtube", label: "YouTube Thumbnail", width: 1280, height: 720, category: "social" },
  // Web
  { id: "hd", label: "HD 1080p", width: 1920, height: 1080, category: "web" },
  { id: "banner", label: "Web Banner", width: 1200, height: 300, category: "web" },
  { id: "og-image", label: "OG Image", width: 1200, height: 630, category: "web" },
  { id: "email-header", label: "Email Header", width: 600, height: 200, category: "web" },
  // Print
  { id: "a4-landscape", label: "A4 Landscape", width: 3508, height: 2480, category: "print" },
  { id: "a4-portrait", label: "A4 Portrait", width: 2480, height: 3508, category: "print" },
  { id: "letter", label: "US Letter", width: 2550, height: 3300, category: "print" },
  // E-Commerce
  { id: "product-square", label: "Product Square", width: 1000, height: 1000, category: "ecommerce" },
  { id: "product-portrait", label: "Product Portrait", width: 800, height: 1200, category: "ecommerce" },
  { id: "hero-banner", label: "Hero Banner", width: 1920, height: 600, category: "ecommerce" },
  { id: "collection-card", label: "Collection Card", width: 600, height: 400, category: "ecommerce" },
];

export const PRESET_CATEGORIES = [
  { value: "social", label: "Social Media" },
  { value: "web", label: "Web" },
  { value: "print", label: "Print" },
  { value: "ecommerce", label: "E-Commerce" },
] as const;

export function getAspectRatioLabel(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(width, height);
  const rw = width / d;
  const rh = height / d;

  const known: Record<string, string> = {
    "1:1": "1:1",
    "16:9": "16:9",
    "9:16": "9:16",
    "4:3": "4:3",
    "3:4": "3:4",
    "3:2": "3:2",
    "2:3": "2:3",
  };

  const key = `${rw}:${rh}`;
  if (known[key]) return known[key];

  if (rw > 20 || rh > 20) {
    const ratio = width / height;
    const approx: [number, string][] = [
      [1, "1:1"],
      [16 / 9, "16:9"],
      [9 / 16, "9:16"],
      [4 / 3, "4:3"],
      [3 / 4, "3:4"],
      [3 / 2, "3:2"],
      [2 / 3, "2:3"],
      [4 / 5, "4:5"],
      [5 / 4, "5:4"],
    ];
    for (const [val, label] of approx) {
      if (Math.abs(ratio - val) < 0.05) return `~${label}`;
    }
  }

  return key;
}
