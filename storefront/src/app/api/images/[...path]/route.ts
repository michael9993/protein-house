import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route for images in Docker environment
 * Proxies requests from localhost:8000 to saleor-api:8000
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ path: string[] }> }
) {
	const { path } = await params;
	const pathString = path.join("/");
	
	// Use Docker service name for server-side requests
	const apiBase = process.env.SALEOR_API_URL?.replace("/graphql/", "") || "http://aura-api:8000";
	const imageUrl = `${apiBase}/${pathString}${request.nextUrl.search}`;

	try {
		const response = await fetch(imageUrl, {
			headers: {
				// Forward any relevant headers
				"User-Agent": request.headers.get("user-agent") || "",
			},
		});

		if (!response.ok) {
			return new NextResponse("Image not found", { status: response.status });
		}

		const imageData = await response.arrayBuffer();
		const contentType = response.headers.get("content-type") || "image/jpeg";

		return new NextResponse(imageData, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=31536000, immutable",
			},
		});
	} catch (error) {
		console.error("Error proxying image:", error);
		return new NextResponse("Error loading image", { status: 500 });
	}
}

