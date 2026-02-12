import { NextRequest, NextResponse } from "next/server";
import { executeGraphQL } from "@/lib/graphql";
import { OrderByNumberAndEmailDocument } from "@/gql/graphql";
import { getLanguageCodeForChannel } from "@/lib/language";

export async function POST(request: NextRequest, { params }: { params: Promise<{ channel: string }> }) {
	try {
		const { channel } = await params;
		const body = (await request.json()) as { orderNumber?: string; email?: string };
		const orderNumber = body.orderNumber;
		const email = body.email;

		if (!orderNumber || !email) {
			return NextResponse.json(
				{ success: false, error: "Order number and email are required" },
				{ status: 400 }
			);
		}

		// Use the public query for order lookup by number and email
		// This query is public (no authentication required) and validates email server-side
		const result = await executeGraphQL(OrderByNumberAndEmailDocument, {
			variables: {
				number: orderNumber.toString(),
				email: email.trim(),
				languageCode: getLanguageCodeForChannel(channel),
			},
			cache: "no-cache",
			withAuth: false, // Public query - no authentication required
		});

		const order = result.orderByNumberAndEmail;

		if (!order) {
			return NextResponse.json(
				{ success: false, error: "Order not found. Please check your order number and email address." },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			orderId: order.id,
			order: order,
		});
	} catch (error) {
		console.error("Order validation error:", error);
		return NextResponse.json(
			{ success: false, error: "An error occurred while validating your order." },
			{ status: 500 }
		);
	}
}
