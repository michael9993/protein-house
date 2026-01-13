import { NextRequest, NextResponse } from "next/server";

/**
 * Invoice Request API Route
 * 
 * This endpoint handles invoice generation requests from customers.
 * It calls the Invoices app directly to generate and return the PDF.
 */

// Use internal Docker network URL for server-to-server communication
const INVOICES_APP_INTERNAL_URL = process.env.INVOICES_APP_INTERNAL_URL || 
                                  "http://saleor-invoice-app:3000";

// Public URL for client-side downloads (tunnel URL in development)
const INVOICES_APP_PUBLIC_URL = process.env.INVOICES_APP_URL || 
                                "http://localhost:3003";

export async function POST(request: NextRequest) {
	try {
		const { orderId } = (await request.json()) as { orderId?: string };

		if (!orderId) {
			return NextResponse.json(
				{ success: false, message: "Order ID is required" },
				{ status: 400 }
			);
		}

		console.log("Requesting invoice generation for order:", orderId);
		console.log("Invoices app internal URL:", INVOICES_APP_INTERNAL_URL);
		console.log("Invoices app public URL:", INVOICES_APP_PUBLIC_URL);

		// Call the invoices app directly to generate the invoice (using internal URL)
		const response = await fetch(`${INVOICES_APP_INTERNAL_URL}/api/invoices/generate`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ orderId }),
		});

		const data = (await response.json()) as { success?: boolean; message?: string; invoice?: { id?: string; number?: string } };
		console.log("Invoice generation response:", data);

		if (!response.ok) {
			return NextResponse.json(
				{ 
					success: false, 
					message: data.message || "Unable to generate invoice. Please try again." 
				},
				{ status: response.status }
			);
		}

		if (data.success && data.invoice?.id) {
			// Invoice generated successfully - return public URL for browser download
			const publicDownloadUrl = `${INVOICES_APP_PUBLIC_URL}/api/invoices/${data.invoice.id}/download`;
			
			return NextResponse.json({
				success: true,
				invoice: {
					id: data.invoice.id,
					number: data.invoice.number,
					url: publicDownloadUrl,
				},
			});
		}

		return NextResponse.json({
			success: false,
			message: data.message || "Failed to generate invoice",
		});

	} catch (error) {
		console.error("Invoice request error:", error);
		
		// If invoices app is not available, return helpful message
		if (error instanceof TypeError && error.message.includes("fetch")) {
			return NextResponse.json({
				success: false,
				message: "Invoice service is currently unavailable. Please try again later or contact support.",
			}, { status: 503 });
		}
		
		return NextResponse.json(
			{ 
				success: false, 
				message: "We couldn't process your invoice request at this time. " +
					"Please try again later or contact our support team for assistance." 
			},
			{ status: 500 }
		);
	}
}

// GET endpoint to check invoice status
export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const orderId = searchParams.get("orderId");

	if (!orderId) {
		return NextResponse.json(
			{ success: false, message: "Order ID is required" },
			{ status: 400 }
		);
	}

	try {
		// Try to generate the invoice (will use cached version if exists)
		const response = await fetch(`${INVOICES_APP_INTERNAL_URL}/api/invoices/generate`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ orderId }),
		});

		const data = (await response.json()) as { success?: boolean; invoice?: { id?: string; number?: string } };

		if (data.success && data.invoice?.id) {
			// Return public URL for browser download
			const publicDownloadUrl = `${INVOICES_APP_PUBLIC_URL}/api/invoices/${data.invoice.id}/download`;
			
			return NextResponse.json({
				success: true,
				invoice: {
					...data.invoice,
					url: publicDownloadUrl,
				},
			});
		}

		return NextResponse.json({
			success: false,
			message: "No invoice available for this order",
		});

	} catch (error) {
		console.error("Invoice status check error:", error);
		return NextResponse.json(
			{ success: false, message: "Failed to check invoice status" },
			{ status: 500 }
		);
	}
}

