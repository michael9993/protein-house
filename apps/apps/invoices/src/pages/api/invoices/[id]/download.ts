import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid invoice ID" });
  }

  // Get PDF from in-memory storage (in production, use proper storage)
  const pdfBuffer = (global as any).invoicePdfs?.get(id);

  if (!pdfBuffer) {
    return res.status(404).json({ message: "Invoice PDF not found" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="invoice-${id}.pdf"`);
  res.send(pdfBuffer);
}

