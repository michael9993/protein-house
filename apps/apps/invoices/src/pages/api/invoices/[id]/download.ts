import { NextApiRequest, NextApiResponse } from "next";
import { getPdfFromFile } from "../../../../lib/upload-invoice";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid invoice ID" });
  }

  console.log("Attempting to download invoice:", id);

  // First try memory cache for faster access
  let pdfBuffer = (global as any).invoicePdfs?.get(id);

  // If not in memory, try file system
  if (!pdfBuffer) {
    console.log("Not in memory, checking file system...");
    pdfBuffer = getPdfFromFile(id);
    
    // If found on disk, cache in memory for next request
    if (pdfBuffer) {
      (global as any).invoicePdfs = (global as any).invoicePdfs || new Map();
      (global as any).invoicePdfs.set(id, pdfBuffer);
      console.log("Loaded from file and cached in memory");
    }
  }

  if (!pdfBuffer) {
    console.log("Invoice PDF not found anywhere for id:", id);
    return res.status(404).json({ message: "Invoice PDF not found" });
  }

  console.log("Serving invoice PDF, size:", pdfBuffer.length, "bytes");
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="invoice-${id}.pdf"`);
  res.setHeader("Content-Length", pdfBuffer.length);
  res.send(pdfBuffer);
}

