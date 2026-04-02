import { invariant } from "ts-invariant";
import { type TypedDocumentString } from "../gql/graphql";
import { getServerAuthClient } from "@/app/config";

type GraphQLErrorResponse = {
	errors: readonly {
		message: string;
		code?: string;
		extensions?: {
			code?: string;
			exception?: any;
		};
		[key: string]: any;
	}[];
};

type GraphQLRespone<T> = { data: T } | GraphQLErrorResponse;

export async function executeGraphQL<Result, Variables>(
	operation: TypedDocumentString<Result, Variables>,
	options: {
		headers?: HeadersInit;
		cache?: RequestCache;
		revalidate?: number;
		withAuth?: boolean;
	} & (Variables extends Record<string, never> ? { variables?: never } : { variables: Variables }),
): Promise<Result> {
	// For server-side rendering in Docker, use SALEOR_API_URL (Docker service name)
	// For client-side, use NEXT_PUBLIC_SALEOR_API_URL (localhost for browser)
	// Always prioritize SALEOR_API_URL for server-side (it's available in server context)
	// This ensures Docker service names work correctly
	
	// Check if we're in a server context (Next.js server-side)
	const isServer = typeof window === 'undefined';
	
	// For server-side, try SALEOR_API_URL first, then fallback to Docker service name, then NEXT_PUBLIC_SALEOR_API_URL
	// For client-side, use NEXT_PUBLIC_SALEOR_API_URL
	let saleorApiUrl: string | undefined;
	if (isServer) {
		// Server-side: prioritize SALEOR_API_URL, fallback to Docker service name if not set
		saleorApiUrl = process.env.SALEOR_API_URL;
		if (!saleorApiUrl) {
			// Fallback to Docker service name (for Docker Compose setups)
			const apiPort = process.env.SALEOR_API_PORT || '8000';
			saleorApiUrl = `http://aura-api:${apiPort}/graphql/`;
		}
	} else {
		// Client-side: use NEXT_PUBLIC_SALEOR_API_URL
		saleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
	}
	
	// Final fallback if still not set
	if (!saleorApiUrl) {
		saleorApiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;
	}
	
	invariant(saleorApiUrl, "Missing NEXT_PUBLIC_SALEOR_API_URL or SALEOR_API_URL env variable");
	const { variables, headers, cache, revalidate, withAuth = true } = options;
	
	// Ensure the URL ends with /graphql/ for GraphQL requests
	let graphqlUrl = saleorApiUrl;
	if (!graphqlUrl.endsWith('/graphql/') && !graphqlUrl.endsWith('/graphql')) {
		graphqlUrl = `${graphqlUrl.replace(/\/+$/, '')}/graphql/`;
	} else if (graphqlUrl.endsWith('/graphql')) {
		graphqlUrl = `${graphqlUrl}/`;
	}
	
	// Log the URL being used (only when explicitly enabled to reduce noise)
	// GraphQL requests are frequent and logging each one creates too much noise
	// Set GRAPHQL_VERBOSE_LOGGING=true in .env to enable detailed logging
	if (process.env.NODE_ENV === 'development' && isServer && process.env.GRAPHQL_VERBOSE_LOGGING === 'true') {
		console.log(`[GraphQL] Server-side request using API URL: ${graphqlUrl}`);
	}

	// Configure timeout (default 30 seconds, configurable via env)
	const timeoutMs = parseInt(process.env.GRAPHQL_TIMEOUT_MS || "30000", 10);
	// Increased default retries for unstable connections (Cloudflare tunnels, etc.)
	const maxRetries = parseInt(process.env.GRAPHQL_MAX_RETRIES || "4", 10);
	const retryDelayMs = parseInt(process.env.GRAPHQL_RETRY_DELAY_MS || "1000", 10);

	const input = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...headers,
		},
		body: JSON.stringify({
			query: operation.toString(),
			...(variables && { variables }),
		}),
		cache: cache,
		next: { revalidate },
	};

	// Retry logic with exponential backoff
	let lastError: Error | null = null;
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			// Create AbortController for timeout
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

			try {
				const fetchInput = {
					...input,
					signal: controller.signal,
				};

				const response = withAuth
					? await (await getServerAuthClient()).fetchWithAuth(graphqlUrl, fetchInput, {
						// The JWT token's `iss` is the public API URL (e.g. https://api.example.com/graphql/)
						// but server-side requests use the Docker internal URL (http://aura-api:8000/graphql/).
						// Both point to the same Saleor instance, so it's safe to pass the token.
						allowPassingTokenToThirdPartyDomains: true,
					})
					: await fetch(graphqlUrl, fetchInput);

				clearTimeout(timeoutId);

				if (!response.ok) {
					const body = await (async () => {
						try {
							return await response.text();
						} catch {
							return "";
						}
					})();
					console.error(input.body);
					throw new HTTPError(response, body);
				}

				const body = (await response.json()) as GraphQLRespone<Result>;

				if ("errors" in body) {
					throw new GraphQLError(body);
				}

				return body.data;
			} catch (fetchError: any) {
				clearTimeout(timeoutId);
				
				// Helper to check error cause chain for specific error codes
				const getErrorCode = (error: any): string | undefined => {
					if (error?.code) return error.code;
					if (error?.cause) {
						if (typeof error.cause === 'object' && error.cause.code) {
							return error.cause.code;
						}
						if (Array.isArray(error.cause)) {
							for (const cause of error.cause) {
								if (cause?.code) return cause.code;
							}
						}
					}
					return undefined;
				};
				
				const errorCode = getErrorCode(fetchError);
				const errorMessage = fetchError?.message || '';

				// Next.js: cookies can only be modified in Server Action/Route Handler.
				// Auth SDK may try to refresh/write cookies during RSC render → treat as auth unavailable.
				if (errorMessage.includes("Cookies can only be modified")) {
					throw new Error("AUTH_UNAVAILABLE_RSC");
				}
				
				// Check if it's a timeout or network error that we should retry
				const isRetryableError = 
					fetchError.name === 'AbortError' || 
					errorCode === 'ETIMEDOUT' ||
					errorCode === 'ECONNRESET' ||
					errorCode === 'ECONNREFUSED' ||
					errorCode === 'ENOTFOUND' ||
					errorMessage.includes('fetch failed') ||
					errorMessage.includes('timeout') ||
					errorMessage.includes('network') ||
					errorMessage.includes('socket') ||
					errorMessage.includes('TLS connection');
				
				if (isRetryableError && attempt < maxRetries) {
					lastError = fetchError;
					const delay = retryDelayMs * Math.pow(2, attempt); // Exponential backoff
					if (process.env.NODE_ENV === 'development') {
						console.warn(`[GraphQL] Request failed (${errorCode || fetchError.name || 'network error'}) (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
					}
					await new Promise(resolve => setTimeout(resolve, delay));
					continue;
				}
				
				// Re-throw non-retryable errors or if we've exhausted retries
				throw fetchError;
			}
		} catch (error: any) {
			// Helper to check error cause chain for specific error codes
			const getErrorCode = (err: any): string | undefined => {
				if (err?.code) return err.code;
				if (err?.cause) {
					if (typeof err.cause === 'object' && err.cause.code) {
						return err.cause.code;
					}
					if (Array.isArray(err.cause)) {
						for (const cause of err.cause) {
							if (cause?.code) return cause.code;
						}
					}
				}
				return undefined;
			};
			
			const errorCode = getErrorCode(error);
			const errorMessage = error?.message || '';
			
			// Check if it's a retryable error
			const isRetryableError = error instanceof Error && (
				error.name === 'AbortError' ||
				errorCode === 'ETIMEDOUT' ||
				errorCode === 'ECONNRESET' ||
				errorCode === 'ECONNREFUSED' ||
				errorCode === 'ENOTFOUND' ||
				errorMessage.includes('fetch failed') ||
				errorMessage.includes('timeout') ||
				errorMessage.includes('network') ||
				errorMessage.includes('socket') ||
				errorMessage.includes('TLS connection')
			);

			// If it's the last attempt or a non-retryable error, throw it
			if (attempt === maxRetries || !isRetryableError) {
				if (error?.message?.includes("Cookies can only be modified")) {
					throw new Error("AUTH_UNAVAILABLE_RSC");
				}
				throw error;
			}
			lastError = error as Error;
		}
	}

	// If we exhausted all retries, throw the last error
	if (lastError) {
		if (process.env.NODE_ENV === 'development') {
			console.error(`[GraphQL] Request failed after ${maxRetries + 1} attempts:`, lastError);
		}
		throw lastError;
	}

	// This should never be reached, but TypeScript needs it
	throw new Error("GraphQL request failed after all retries");
}

class GraphQLError extends Error {
	constructor(public errorResponse: GraphQLErrorResponse) {
		const message = errorResponse.errors.map((error) => error.message).join("\n");
		super(message);
		this.name = this.constructor.name;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}
class HTTPError extends Error {
	constructor(response: Response, body: string) {
		const message = `HTTP error ${response.status}: ${response.statusText}\n${body}`;
		super(message);
		this.name = this.constructor.name;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}
