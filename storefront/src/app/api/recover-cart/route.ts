import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { TypedDocumentString } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getClientIp, rateLimitResponse, strictLimiter } from "@/lib/rate-limit";

type CheckoutRecoverResult = {
	checkoutRecover: {
		checkout: { id: string; channel: { slug: string } } | null;
		errors: Array<{ field: string | null; message: string | null; code: string | null }>;
	} | null;
};

type CheckoutRecoverVariables = { token: string };

const CheckoutRecoverMutation = new TypedDocumentString<
	CheckoutRecoverResult,
	CheckoutRecoverVariables
>(`mutation CheckoutRecover($token: String!) {
  checkoutRecover(token: $token) {
    checkout {
      id
      channel { slug }
    }
    errors {
      field
      message
      code
    }
  }
}`);

export async function GET(request: NextRequest) {
	const { allowed, resetAt } = strictLimiter(getClientIp(request));
	if (!allowed) return rateLimitResponse(resetAt);

	const { searchParams } = request.nextUrl;
	const token = searchParams.get("token");
	const channel = searchParams.get("channel") || "default-channel";
	const baseUrl = request.nextUrl.origin;

	if (!token) {
		return NextResponse.redirect(new URL(`/${channel}`, baseUrl));
	}

	try {
		const result = await executeGraphQL(CheckoutRecoverMutation, {
			variables: { token },
			cache: "no-store",
			withAuth: false,
		});

		const checkout = result.checkoutRecover?.checkout;
		if (checkout?.id) {
			const proto = request.headers.get("x-forwarded-proto") || "http";
			const isHttps = proto === "https";
			const cookieName = `checkoutId-${channel}`;
			(await cookies()).set(cookieName, checkout.id, {
				path: "/",
				sameSite: "lax",
				secure: isHttps,
			});
			return NextResponse.redirect(new URL(`/${channel}/cart`, baseUrl));
		}
	} catch (e) {
		console.error("[recover-cart] Error:", e);
	}

	// Token invalid/expired — redirect to error page
	return NextResponse.redirect(new URL(`/${channel}/recover-cart`, baseUrl));
}
