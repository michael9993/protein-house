import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Proxy external images to avoid CORS issues when loading into Fabric.js canvas.
 *
 * Without this proxy, images from Saleor's media server (localhost:8000) fail to load
 * into the canvas because crossOrigin: "anonymous" requires the server to send
 * Access-Control-Allow-Origin headers, which Django doesn't do for /media/ files.
 *
 * Usage: /api/proxy-image?url=https://example.com/image.jpg
 */

/** Block requests to private/internal networks to prevent SSRF attacks. */
function isPrivateUrl(urlString: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return true; // Malformed URLs are blocked
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block internal Docker service names
  const blockedHostnames = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "[::1]",
    "saleor-api",
    "saleor-postgres",
    "saleor-redis",
    "saleor-worker",
    "saleor-scheduler",
    "host.docker.internal",
    "metadata.google.internal",
  ];

  if (blockedHostnames.includes(hostname)) return true;

  // Block private IP ranges (10.x, 172.16-31.x, 192.168.x, 169.254.x)
  const privateRanges = [
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
    /^192\.168\.\d{1,3}\.\d{1,3}$/,
    /^169\.254\.\d{1,3}\.\d{1,3}$/, // Link-local / cloud metadata
    /^0\./, // 0.0.0.0/8
  ];

  if (privateRanges.some((re) => re.test(hostname))) return true;

  // Block any hostname ending with known internal suffixes
  if (hostname.endsWith(".internal") || hostname.endsWith(".local")) return true;

  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  // Only allow http(s) URLs — prevent SSRF with file://, etc.
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return res.status(400).json({ error: "Invalid URL scheme" });
  }

  // Block requests to private/internal networks
  if (isPrivateUrl(url)) {
    return res.status(403).json({ error: "Requests to internal networks are not allowed" });
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream returned ${response.status}` });
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";

    // Only allow image content types
    if (!contentType.startsWith("image/")) {
      return res.status(400).json({ error: "URL does not point to an image" });
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(buffer);
  } catch (err) {
    console.error("Image proxy error:", err);
    res.status(500).json({ error: "Failed to fetch image" });
  }
}
