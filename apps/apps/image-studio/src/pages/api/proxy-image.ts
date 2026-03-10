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
