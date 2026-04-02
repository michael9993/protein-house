import PDFDocument from "pdfkit";
import { InvoiceBranding } from "./branding-service";

interface GenerateInvoicePdfParams {
  invoice: {
    id: string;
    number: string | null;
  };
  order: {
    id: string;
    number: string;
    created: string;
    billingAddress: {
      firstName?: string;
      lastName?: string;
      companyName?: string;
      streetAddress1: string;
      streetAddress2: string | null;
      city: string;
      postalCode: string;
      country: {
        code: string;
        country: string;
      };
    } | null;
    shippingAddress: {
      firstName?: string;
      lastName?: string;
      companyName?: string;
      streetAddress1: string;
      streetAddress2: string | null;
      city: string;
      postalCode: string;
      country: {
        code: string;
        country: string;
      };
    } | null;
    lines: Array<{
      id: string;
      productName: string;
      variantName: string | null;
      quantity: number;
      unitPrice: {
        gross: {
          amount: number;
          currency: string;
        };
      };
      totalPrice: {
        gross: {
          amount: number;
          currency: string;
        };
      };
    }>;
    subtotal: {
      gross: {
        amount: number;
        currency: string;
      };
    };
    total: {
      gross: {
        amount: number;
        currency: string;
      };
    };
    tax: {
      amount: number;
      currency: string;
    } | null;
    shippingPrice?: {
      gross: {
        amount: number;
        currency: string;
      };
    };
    discount?: {
      amount: number;
      currency: string;
    };
  };
  branding: InvoiceBranding;
}

/**
 * Parse hex color to RGB values for PDFKit
 */
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [27, 40, 56]; // fallback Pawzen navy #1B2838
};

/**
 * Lighten a hex color by mixing with white
 */
const lightenColor = (hex: string, amount: number): string => {
  const [r, g, b] = hexToRgb(hex);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
};

/**
 * Try to fetch a remote image and return it as a Buffer, or null on failure
 */
const fetchLogoImage = async (url: string): Promise<Buffer | null> => {
  if (!url || url.includes("placehold")) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
};

export const generateInvoicePdf = async (params: GenerateInvoicePdfParams): Promise<Buffer> => {
  const { invoice, order, branding } = params;

  // Pre-fetch logo image
  const logoBuffer = await fetchLogoImage(branding.logo);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 0,
      size: "A4", // 595 x 842
      bufferPages: true,
    });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── Design tokens ──────────────────────────────────────────────
    const primary = branding.primaryColor || "#2563EB";
    const textDark = "#111827";
    const textMuted = "#6B7280";
    const borderLight = "#E5E7EB";
    const bgLight = "#F9FAFB";
    const pageLeft = 48;
    const pageRight = 547;
    const contentWidth = pageRight - pageLeft;

    const formatCurrency = (amount: number, currency: string) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

    const formatDate = (dateStr: string) =>
      new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

    const drawLine = (y: number, color = borderLight, width = 0.5) => {
      doc.strokeColor(color).lineWidth(width).moveTo(pageLeft, y).lineTo(pageRight, y).stroke();
    };

    // ── Accent bar (top edge) ──────────────────────────────────────
    doc.rect(0, 0, 595, 4).fill(primary);

    // ── Header: Logo + Company Info (left) | Invoice Details (right) ──
    let y = 28;

    // Logo
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, pageLeft, y, { width: 120, height: 40, fit: [120, 40] });
      } catch {
        // If logo fails to render, fall back to text
        doc.font("Helvetica-Bold").fontSize(18).fillColor(primary)
          .text(branding.companyName, pageLeft, y + 8);
      }
    } else {
      doc.font("Helvetica-Bold").fontSize(18).fillColor(primary)
        .text(branding.companyName, pageLeft, y + 8);
    }

    // Company details under logo
    const companyInfoY = y + 48;
    doc.font("Helvetica").fontSize(8).fillColor(textMuted);
    const companyLines: string[] = [];
    if (branding.companyAddress) {
      const addr = branding.companyAddress;
      if (addr.street) companyLines.push(addr.street);
      const cityLine = [addr.city, addr.state, addr.zip].filter(Boolean).join(", ");
      if (cityLine) companyLines.push(cityLine);
      if (addr.country) companyLines.push(addr.country);
    }
    if (branding.companyPhone) companyLines.push(branding.companyPhone);
    if (branding.companyEmail) companyLines.push(branding.companyEmail);
    companyLines.forEach((line, i) => {
      doc.text(line, pageLeft, companyInfoY + i * 11);
    });

    // Invoice title + details (right-aligned)
    doc.font("Helvetica-Bold").fontSize(28).fillColor(textDark)
      .text("INVOICE", 350, y + 2, { width: contentWidth - 302, align: "right" });

    const detailsX = 400;
    const detailsValueX = 470;
    let detailY = y + 40;

    const addDetail = (label: string, value: string) => {
      doc.font("Helvetica").fontSize(8).fillColor(textMuted)
        .text(label, detailsX, detailY, { width: 65, align: "right" });
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(textDark)
        .text(value, detailsValueX, detailY, { width: 77, align: "right" });
      detailY += 16;
    };

    addDetail("Invoice No.", invoice.number || `INV-${order.number}`);
    addDetail("Date", formatDate(order.created));
    addDetail("Order No.", `#${order.number}`);

    // ── Divider ────────────────────────────────────────────────────
    y = Math.max(companyInfoY + companyLines.length * 11 + 12, detailY + 8);
    drawLine(y, borderLight, 1);
    y += 16;

    // ── Addresses: Bill To | Ship To ──────────────────────────────
    const renderAddress = (
      title: string,
      address: GenerateInvoicePdfParams["order"]["billingAddress"],
      startX: number,
      startY: number,
    ) => {
      doc.font("Helvetica-Bold").fontSize(7).fillColor(textMuted)
        .text(title.toUpperCase(), startX, startY);

      if (!address) {
        doc.font("Helvetica").fontSize(9).fillColor(textMuted)
          .text("Not provided", startX, startY + 14);
        return startY + 30;
      }

      let ay = startY + 14;
      doc.font("Helvetica").fontSize(9).fillColor(textDark);

      const name = [address.firstName, address.lastName].filter(Boolean).join(" ");
      if (name) {
        doc.font("Helvetica-Bold").text(name, startX, ay);
        ay += 13;
        doc.font("Helvetica");
      }
      if (address.companyName) {
        doc.text(address.companyName, startX, ay);
        ay += 13;
      }
      doc.text(address.streetAddress1, startX, ay);
      ay += 13;
      if (address.streetAddress2) {
        doc.text(address.streetAddress2, startX, ay);
        ay += 13;
      }
      doc.text(`${address.city}, ${address.postalCode}`, startX, ay);
      ay += 13;
      doc.text(address.country.country, startX, ay);
      ay += 13;

      return ay;
    };

    const billEndY = renderAddress("Bill To", order.billingAddress, pageLeft, y);
    const shipEndY = order.shippingAddress
      ? renderAddress("Ship To", order.shippingAddress, 320, y)
      : y;

    y = Math.max(billEndY, shipEndY) + 20;

    // ── Line Items Table ──────────────────────────────────────────
    // Table header
    const headerBg = lightenColor(primary, 0.92);
    doc.rect(pageLeft, y, contentWidth, 24).fill(headerBg);

    const headerY = y + 7;
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(textMuted);
    doc.text("DESCRIPTION", pageLeft + 10, headerY);
    doc.text("QTY", 350, headerY, { width: 35, align: "center" });
    doc.text("UNIT PRICE", 390, headerY, { width: 70, align: "right" });
    doc.text("AMOUNT", pageRight - 80, headerY, { width: 70, align: "right" });
    y += 24;

    // Table rows
    order.lines.forEach((line, index) => {
      const productName = line.variantName
        ? `${line.productName} — ${line.variantName}`
        : line.productName;

      // Alternate row background
      if (index % 2 === 1) {
        doc.rect(pageLeft, y, contentWidth, 26).fill(bgLight);
      }

      const rowY = y + 7;
      doc.font("Helvetica").fontSize(8.5).fillColor(textDark)
        .text(productName, pageLeft + 10, rowY, { width: 280 });
      doc.fillColor(textMuted)
        .text(line.quantity.toString(), 350, rowY, { width: 35, align: "center" });
      doc.fillColor(textDark)
        .text(
          formatCurrency(line.unitPrice.gross.amount, line.unitPrice.gross.currency),
          390, rowY, { width: 70, align: "right" },
        )
        .text(
          formatCurrency(line.totalPrice.gross.amount, line.totalPrice.gross.currency),
          pageRight - 80, rowY, { width: 70, align: "right" },
        );

      y += 26;
    });

    // Table bottom border
    drawLine(y, borderLight, 0.5);
    y += 16;

    // ── Totals Section (right-aligned) ────────────────────────────
    const totalsLabelX = 390;
    const totalsValueX = pageRight - 80;

    const addTotalRow = (label: string, value: string, bold = false) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(bold ? 10 : 9)
        .fillColor(textDark)
        .text(label, totalsLabelX, y, { width: 70, align: "right" })
        .text(value, totalsValueX, y, { width: 70, align: "right" });
      y += bold ? 22 : 18;
    };

    addTotalRow("Subtotal", formatCurrency(order.subtotal.gross.amount, order.subtotal.gross.currency));

    if (order.shippingPrice && order.shippingPrice.gross.amount > 0) {
      addTotalRow("Shipping", formatCurrency(order.shippingPrice.gross.amount, order.shippingPrice.gross.currency));
    }

    if (order.discount && order.discount.amount > 0) {
      doc.font("Helvetica").fontSize(9).fillColor("#DC2626")
        .text("Discount", totalsLabelX, y, { width: 70, align: "right" })
        .text(`-${formatCurrency(order.discount.amount, order.discount.currency)}`, totalsValueX, y, { width: 70, align: "right" });
      y += 18;
    }

    if (order.tax && order.tax.amount > 0) {
      addTotalRow("Tax", formatCurrency(order.tax.amount, order.tax.currency));
    }

    // Grand total with brand color background
    y += 4;
    doc.rect(totalsLabelX - 10, y - 4, contentWidth - (totalsLabelX - pageLeft) + 10, 30)
      .fill(primary);

    doc.font("Helvetica-Bold").fontSize(11).fillColor("#FFFFFF")
      .text("TOTAL", totalsLabelX, y + 4, { width: 70, align: "right" })
      .text(
        formatCurrency(order.total.gross.amount, order.total.gross.currency),
        totalsValueX, y + 4, { width: 70, align: "right" },
      );

    // ── Footer ────────────────────────────────────────────────────
    const footerY = 770;
    drawLine(footerY, borderLight, 0.5);

    doc.font("Helvetica").fontSize(8).fillColor(textMuted)
      .text("Thank you for your business!", pageLeft, footerY + 10, { width: contentWidth, align: "center" });

    if (branding.companyEmail) {
      doc.text(
        `Questions? Contact us at ${branding.companyEmail}`,
        pageLeft, footerY + 23, { width: contentWidth, align: "center" },
      );
    }

    doc.fontSize(7).fillColor("#9CA3AF")
      .text(
        `Order #${order.number}  •  Invoice ${invoice.number || `INV-${order.number}`}  •  ${branding.companyName}`,
        pageLeft, footerY + 40, { width: contentWidth, align: "center" },
      );

    doc.end();
  });
};
