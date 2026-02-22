import { NextResponse } from "next/server";
import { executeGraphQL } from "@/lib/graphql";
import { MyDataExportDocument } from "@/gql/graphql";
import { getClientIp, rateLimitResponse, strictLimiter } from "@/lib/rate-limit";

export async function GET(request: Request): Promise<Response> {
	const { allowed, resetAt } = strictLimiter(getClientIp(request));
	if (!allowed) return rateLimitResponse(resetAt);
	const result = await executeGraphQL(MyDataExportDocument, {
		cache: "no-cache",
		withAuth: true,
	});

	if (!result.me) {
		return NextResponse.json(
			{ error: "Authentication required" },
			{ status: 401 },
		);
	}

	const { me } = result;

	const orders =
		me.orders?.edges.map(({ node }) => ({
			id: node.id,
			number: node.number,
			created: node.created,
			status: node.status,
			total: node.total.gross,
			shippingAddress: node.shippingAddress
				? {
						firstName: node.shippingAddress.firstName,
						lastName: node.shippingAddress.lastName,
						streetAddress1: node.shippingAddress.streetAddress1,
						city: node.shippingAddress.city,
						postalCode: node.shippingAddress.postalCode,
						country: node.shippingAddress.country.code,
					}
				: null,
			lines: node.lines.map((line) => ({
				productName: line.productName,
				variantName: line.variantName,
				quantity: line.quantity,
				totalPrice: line.totalPrice.gross,
			})),
		})) ?? [];

	const exportData = {
		exportDate: new Date().toISOString(),
		profile: {
			id: me.id,
			email: me.email,
			firstName: me.firstName,
			lastName: me.lastName,
			languageCode: me.languageCode,
			dateJoined: me.dateJoined,
			lastLogin: me.lastLogin,
		},
		addresses: me.addresses.map((addr) => ({
			id: addr.id,
			firstName: addr.firstName,
			lastName: addr.lastName,
			streetAddress1: addr.streetAddress1,
			streetAddress2: addr.streetAddress2,
			city: addr.city,
			cityArea: addr.cityArea,
			postalCode: addr.postalCode,
			country: addr.country,
			countryArea: addr.countryArea,
			phone: addr.phone,
			isDefaultShippingAddress: addr.isDefaultShippingAddress,
			isDefaultBillingAddress: addr.isDefaultBillingAddress,
		})),
		orders,
		metadata: me.metadata.map((m) => ({
			key: m.key,
			value: m.value,
		})),
	};

	return new NextResponse(JSON.stringify(exportData, null, 2), {
		status: 200,
		headers: {
			"Content-Type": "application/json",
			"Content-Disposition": 'attachment; filename="my-data-export.json"',
		},
	});
}
