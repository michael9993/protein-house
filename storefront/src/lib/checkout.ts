import { cookies } from "next/headers";
import {
	CheckoutCreateDocument,
	CheckoutFindDocument,
	CurrentUserDocument,
	CheckoutCustomerAttachDocument,
	CheckoutAddPromoCodeDocument,
	CheckoutRemovePromoCodeDocument,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getLanguageCodeForChannel } from "@/lib/language";

/** Derive languageCode for checkout queries (defaults to EN if channel unknown) */
function checkoutLang(channel?: string) {
	return getLanguageCodeForChannel(channel || process.env.NEXT_PUBLIC_DEFAULT_CHANNEL || "usd");
}

/**
 * Gets the checkout ID from cookies for a specific channel.
 */
export async function getIdFromCookies(channel: string) {
	const cookieName = `checkoutId-${channel}`;
	const allCookies = await cookies();
	const checkoutId = allCookies.get(cookieName)?.value || "";
	console.log(`[Cart Debug] getIdFromCookies(${channel}): cookie="${cookieName}" value="${checkoutId || "(empty)"}" allCookieNames=[${allCookies.getAll().map(c => c.name).join(", ")}]`);
	return checkoutId;
}

type UserWithMetadata = { metadata?: Array<{ key: string; value: string }> | null } | null;

/**
 * Gets the saved checkout ID for a specific user from metadata.
 * User carts are stored in metadata (server-side, syncs across devices).
 * Cookies are ONLY used for guest carts.
 * Pass optional `me` (from getCurrentUser()) to avoid an extra CurrentUser fetch.
 */
export async function getUserCheckoutId(
	_userId: string,
	channel: string,
	me?: UserWithMetadata
): Promise<string | null> {
	const metadataKey = `checkoutId-${channel}`;

	const fromMetadata = (metadata: Array<{ key: string; value: string }> | null | undefined) => {
		if (!metadata) return null;
		const entry = metadata.find((m) => m.key === metadataKey);
		if (entry?.value?.trim()) return entry.value;
		return null;
	};

	if (me !== undefined) {
		const id = fromMetadata(me?.metadata ?? null);
		return id ?? null;
	}

	try {
		const { executeGraphQL } = await import("@/lib/graphql");
		const { CurrentUserDocument } = await import("@/gql/graphql");
		const currentUser = await executeGraphQL(CurrentUserDocument, {
			cache: "no-cache",
		});
		return fromMetadata(currentUser.me?.metadata ?? null) ?? null;
	} catch (error) {
		console.error(`[Get User Checkout] ❌ Failed to read from metadata:`, error);
		return null;
	}
}

/**
 * Saves the checkout ID to a cookie for a specific channel.
 */
export async function saveIdToCookie(channel: string, checkoutId: string) {
	// Only set secure flag when actually serving over HTTPS.
	// In Docker dev (localhost:3000 over HTTP), secure cookies are silently dropped by browsers.
	const { headers } = await import("next/headers");
	const headersList = await headers();
	const proto = headersList.get("x-forwarded-proto") || "http";
	const isHttps = proto === "https";
	const cookieName = `checkoutId-${channel}`;
	console.log(`[Cart Debug] saveIdToCookie(${channel}): cookie="${cookieName}" value="${checkoutId}" secure=${isHttps} proto=${proto}`);
	(await cookies()).set(cookieName, checkoutId, {
		path: "/",
		sameSite: "lax",
		secure: isHttps,
	});
}

/**
 * Saves the user's checkout ID for persistence across logout/login.
 */
/**
 * Saves the user's checkout ID to metadata.
 * User carts are stored in metadata (server-side, syncs across devices).
 * Cookies are ONLY used for guest carts.
 */
export async function saveUserCheckoutId(_userId: string, channel: string, checkoutId: string) {
	const metadataKey = `checkoutId-${channel}`;
	
	try {
		const { executeGraphQL } = await import("@/lib/graphql");
		const { TypedDocumentString } = await import("@/gql/graphql");
		
		const AccountUpdateDocument = new TypedDocumentString(`
			mutation AccountUpdate($input: AccountInput!) {
				accountUpdate(input: $input) {
					user {
						id
						email
						metadata {
							key
							value
						}
					}
					errors {
						field
						message
						code
					}
				}
			}
		`) as any;
		
		// Get current user metadata to preserve existing metadata
		const { CurrentUserDocument } = await import("@/gql/graphql");
		const currentUser = await executeGraphQL(CurrentUserDocument, {
			cache: "no-cache",
		});
		
		const existingMetadata = currentUser.me?.metadata || [];
		const metadataMap = new Map(existingMetadata.map((m: any) => [m.key, m.value]));
		
		// Update checkout ID for this channel
		metadataMap.set(metadataKey, checkoutId);
		
		// Convert back to array format
		const updatedMetadata = Array.from(metadataMap.entries()).map(([key, value]) => ({
			key,
			value: value as string,
		}));
		
		await executeGraphQL(AccountUpdateDocument, {
			variables: {
				input: {
					metadata: updatedMetadata,
				},
			},
			cache: "no-cache",
		});
		
		console.log(`[Save User Checkout] ✅ Saved checkout ${checkoutId} to user metadata (key: ${metadataKey}) - syncs across devices`);
	} catch (error) {
		console.error(`[Save User Checkout] ❌ Failed to save to metadata:`, error);
		throw error; // Re-throw since this is critical for user cart persistence
	}
}

/**
 * Clears the checkout ID cookie for a specific channel.
 */
export async function clearIdFromCookies(channel: string) {
	const cookieName = `checkoutId-${channel}`;
	(await cookies()).delete(cookieName);
}

/**
 * Gets the current authenticated user, if any.
 */
export async function getCurrentUser() {
	try {
		const { me } = await executeGraphQL(CurrentUserDocument, {
			cache: "no-cache",
		});
		return me;
	} catch {
		return null;
	}
}

/**
 * Validates checkout ownership for user isolation.
 * 
 * Rules:
 * - Anonymous checkout (no user): valid for current user OR anonymous
 * - User-attached checkout: only valid for that specific user
 * - Different user's checkout: invalid
 */
function isCheckoutValidForCurrentUser(
	checkout: { user?: { id: string } | null },
	currentUser: { id: string } | null | undefined
): boolean {
	// Anonymous checkout - valid for the current session (guest or user)
	if (!checkout.user?.id) {
		return true;
	}
	
	// Checkout belongs to a user
	// If current session is anonymous, reject (prevent data leak)
	if (!currentUser?.id) {
		return false;
	}
	
	// Both have user IDs - must match
	return checkout.user.id === currentUser.id;
}

/**
 * Finds a checkout by ID.
 * 
 * For logged-in users, validates ownership to prevent data leakage.
 * For anonymous users accessing anonymous checkouts, allows access.
 */
export async function find(
	checkoutId: string,
	options?: { channel?: string; skipOwnershipCheck?: boolean; currentUser?: any }
) {
	try {
		if (!checkoutId) {
			return null;
		}

		const { checkout } = await executeGraphQL(CheckoutFindDocument, {
			variables: {
				id: checkoutId,
				languageCode: checkoutLang(options?.channel),
			},
			cache: "no-cache",
		});

		if (!checkout) {
			return null;
		}

		// Skip ownership check if explicitly requested
		if (options?.skipOwnershipCheck) {
			return checkout;
		}

		// Validate ownership
		const currentUser = options?.currentUser !== undefined ? options.currentUser : await getCurrentUser();
		if (!isCheckoutValidForCurrentUser(checkout, currentUser)) {
			console.warn(
				`[Checkout] Ownership mismatch: checkout belongs to user ${checkout.user?.id}, ` +
				`current user is ${currentUser?.id || 'anonymous'}.`
			);
			return null;
		}

		return checkout;
	} catch (error: any) {
		// ... handled same as before ...
		// Handle permission errors gracefully - checkout might not be accessible
		if (error?.message?.includes('permissions') || error?.message?.includes('permission')) {
			console.warn('[Checkout] Permission denied or checkout not accessible:', error.message);
			return null;
		}
		console.error('[Checkout] Error finding checkout:', error);
		return null;
	}
}

/**
 * Finds an existing checkout or creates a new one.
 * 
 * IMPORTANT: This function saves cookies and MUST be called from a Server Action,
 * not from a Server Component. Use `resolveCheckout()` for read-only access.
 * 
 * For authenticated users:
 * 1. Try to restore their saved checkout first
 * 2. If no saved checkout, check current session checkout
 * 3. If neither exists, create new
 */
export async function findOrCreate({ 
	channel, 
	checkoutId 
}: { 
	checkoutId?: string; 
	channel: string 
}) {
	const currentUser = await getCurrentUser();
	
	// RULE: Authenticated users ALWAYS use their own checkout, NEVER guest checkout
	if (currentUser?.id) {
		// Step 1: Try to restore user's saved checkout (pass me to avoid extra CurrentUser fetch)
		const savedCheckoutId = await getUserCheckoutId(currentUser.id, channel, currentUser as UserWithMetadata);
		if (savedCheckoutId) {
			const savedCheckout = await find(savedCheckoutId, { skipOwnershipCheck: true });
			if (savedCheckout) {
				// If checkout is already attached to this user, restore it
				if (savedCheckout.user?.id === currentUser.id) {
					await saveIdToCookie(channel, savedCheckoutId);
					// CRITICAL: Re-save to userCheckout cookie to ensure it's persisted
					await saveUserCheckoutId(currentUser.id, channel, savedCheckoutId);
					console.log(`[Checkout] Restored saved checkout ${savedCheckoutId} for user ${currentUser.id}`);
					return savedCheckout;
				}
				// If checkout is anonymous (old checkout from before we started attaching), attach it now
				if (!savedCheckout.user?.id) {
					try {
						// Attach checkout to user
						await executeGraphQL(CheckoutCustomerAttachDocument, {
							variables: {
								checkoutId: savedCheckout.id,
							},
							cache: "no-cache",
						});
						// Re-fetch to get updated checkout with user attached
						const { checkout: attachedCheckout } = await executeGraphQL(CheckoutFindDocument, {
							variables: { id: savedCheckout.id, languageCode: checkoutLang(channel) },
							cache: "no-cache",
						});
						if (attachedCheckout && attachedCheckout.user?.id === currentUser.id) {
							await saveIdToCookie(channel, attachedCheckout.id);
							return attachedCheckout;
						}
					} catch (error: any) {
						// Check if error is about already attached checkout
						const errorMessage = error?.message || String(error);
						if (errorMessage.includes("already attached") || errorMessage.includes("reassign")) {
							// Checkout is already attached - verify and return
							const { checkout: attachedCheckout } = await executeGraphQL(CheckoutFindDocument, {
								variables: { id: savedCheckout.id, languageCode: checkoutLang(channel) },
								cache: "no-cache",
							});
							if (attachedCheckout && attachedCheckout.user?.id === currentUser.id) {
								await saveIdToCookie(channel, attachedCheckout.id);
								return attachedCheckout;
							}
						} else {
							console.error("[Checkout] Error attaching saved checkout to user:", error);
						}
						// Continue to create new checkout if attachment failed
					}
				}
				// If checkout belongs to different user, ignore it and create new
				console.warn(`[Checkout] Saved checkout ${savedCheckoutId} belongs to different user, creating new checkout.`);
			}
		}
		
		// Step 2: If provided checkoutId belongs to user, use it
		if (checkoutId) {
			const checkout = await find(checkoutId, { skipOwnershipCheck: true });
			if (checkout) {
				// If checkout is already attached to this user, use it
				if (checkout.user?.id === currentUser.id) {
					await saveIdToCookie(channel, checkout.id);
					await saveUserCheckoutId(currentUser.id, channel, checkout.id);
					return checkout;
				}
				// If checkout is anonymous, attach it to user (this handles the case where checkout was created before login)
				if (!checkout.user?.id) {
					try {
						// Attach checkout to user
						await executeGraphQL(CheckoutCustomerAttachDocument, {
							variables: {
								checkoutId: checkout.id,
							},
							cache: "no-cache",
						});
						// Re-fetch to get updated checkout with user attached
						const { checkout: attachedCheckout } = await executeGraphQL(CheckoutFindDocument, {
							variables: { id: checkout.id, languageCode: checkoutLang(channel) },
							cache: "no-cache",
						});
						if (attachedCheckout && attachedCheckout.user?.id === currentUser.id) {
							await saveIdToCookie(channel, attachedCheckout.id);
							await saveUserCheckoutId(currentUser.id, channel, attachedCheckout.id);
							return attachedCheckout;
						}
					} catch (error: any) {
						// Check if error is about already attached checkout
						const errorMessage = error?.message || String(error);
						if (errorMessage.includes("already attached") || errorMessage.includes("reassign")) {
							// Checkout is already attached - verify and return
							const { checkout: attachedCheckout } = await executeGraphQL(CheckoutFindDocument, {
								variables: { id: checkout.id, languageCode: checkoutLang(channel) },
								cache: "no-cache",
							});
							if (attachedCheckout && attachedCheckout.user?.id === currentUser.id) {
								await saveIdToCookie(channel, attachedCheckout.id);
								await saveUserCheckoutId(currentUser.id, channel, attachedCheckout.id);
								return attachedCheckout;
							}
						} else {
							console.error("[Checkout] Error attaching checkout to user:", error);
						}
						// Continue to create new checkout if attachment failed
					}
				}
				// If checkoutId is guest checkout from different user, IGNORE it
				console.warn(`[Checkout] Logged-in user provided checkout ${checkoutId} belonging to different user, ignoring.`);
			}
		}
		
		// Step 3: Create new user checkout (user has no saved checkout)
		const result = await create({ channel });
		const newCheckout = result.checkoutCreate?.checkout;
		
		if (newCheckout) {
			// Check if checkout is already attached before trying to attach
			const { checkout: existingCheckout } = await executeGraphQL(CheckoutFindDocument, {
				variables: { id: newCheckout.id, languageCode: checkoutLang(channel) },
				cache: "no-cache",
			});
			
			// Only attach if not already attached to this user
			if (existingCheckout && !existingCheckout.user?.id) {
				try {
					// Attach checkout to user
					await executeGraphQL(CheckoutCustomerAttachDocument, {
						variables: {
							checkoutId: newCheckout.id,
						},
						cache: "no-cache",
					});
					// Re-fetch to get updated checkout with user attached
					const { checkout: attachedCheckout } = await executeGraphQL(CheckoutFindDocument, {
						variables: { id: newCheckout.id, languageCode: checkoutLang(channel) },
						cache: "no-cache",
					});
					if (attachedCheckout && attachedCheckout.user?.id === currentUser.id) {
						// Save for the user (only after attachment is confirmed)
						await saveIdToCookie(channel, attachedCheckout.id);
						await saveUserCheckoutId(currentUser.id, channel, attachedCheckout.id);
						return attachedCheckout;
					}
				} catch (error: any) {
					// Check if error is about already attached checkout
					const errorMessage = error?.message || String(error);
					if (errorMessage.includes("already attached") || errorMessage.includes("reassign")) {
						// Checkout is already attached - just verify and save
						const { checkout: attachedCheckout } = await executeGraphQL(CheckoutFindDocument, {
							variables: { id: newCheckout.id, languageCode: checkoutLang(channel) },
							cache: "no-cache",
						});
						if (attachedCheckout && attachedCheckout.user?.id === currentUser.id) {
							await saveIdToCookie(channel, attachedCheckout.id);
							await saveUserCheckoutId(currentUser.id, channel, attachedCheckout.id);
							return attachedCheckout;
						}
					} else {
						console.error("[Checkout] Error attaching new checkout to user:", error);
					}
				}
			} else if (existingCheckout && existingCheckout.user?.id === currentUser.id) {
				// Already attached to this user - just save
				await saveIdToCookie(channel, existingCheckout.id);
				await saveUserCheckoutId(currentUser.id, channel, existingCheckout.id);
				return existingCheckout;
			}
			
			// Fallback: save anyway if attachment failed or checkout wasn't found
			await saveIdToCookie(channel, newCheckout.id);
			await saveUserCheckoutId(currentUser.id, channel, newCheckout.id);
		}
		
		return newCheckout;
	}
	
	// RULE: Anonymous users use guest checkout
	// Step 1: Try the provided checkout ID (if valid and anonymous)
	if (checkoutId) {
		const checkout = await find(checkoutId, { channel });
		if (checkout && !checkout.user?.id) {
			// Valid anonymous checkout
			await saveIdToCookie(channel, checkout.id);
			return checkout;
		}
	}
	
	// Step 2: Create new anonymous checkout
	const result = await create({ channel });
	const newCheckout = result.checkoutCreate?.checkout;
	
	if (newCheckout) {
		await saveIdToCookie(channel, newCheckout.id);
	}
	
	return newCheckout;
}

/**
 * Creates a new checkout for the specified channel.
 */
export const create = ({ channel }: { channel: string }) =>
	executeGraphQL(CheckoutCreateDocument, { cache: "no-cache", variables: { channel, languageCode: checkoutLang(channel) } });

/**
 * Resolves the correct checkout for the current user session.
 * 
 * NOTE: This function does NOT save cookies (read-only).
 * Cookie saving must be done in Server Actions, not Server Components.
 * 
 * For authenticated users:
 * - Tries to restore their saved checkout first
 * - Falls back to session checkout
 * - Creates new if nothing exists
 * 
 * For anonymous users:
 * - Uses session checkout
 * - Creates new if needed
 */
export async function resolveCheckout({ 
	channel 
}: { 
	channel: string 
}): Promise<{
	checkout: Awaited<ReturnType<typeof find>>;
	isNewCheckout: boolean;
	restoredFromUser: boolean;
	shouldSaveCheckoutId?: boolean;
	shouldSaveUserCheckoutId?: boolean;
}> {
	const currentUser = await getCurrentUser();
	const existingCheckoutId = await getIdFromCookies(channel);

	// Prefer session cookie first (current tab/session) so cart page shows just-added items
	// even before user metadata is updated; then fall back to user metadata (cross-device).
	if (existingCheckoutId) {
		const checkout = await find(existingCheckoutId, {
			channel,
			skipOwnershipCheck: !!currentUser?.id,
			currentUser,
		});
		if (checkout && isCheckoutValidForCurrentUser(checkout, currentUser)) {
			return {
				checkout,
				isNewCheckout: false,
				restoredFromUser: false,
				shouldSaveUserCheckoutId: currentUser?.id ? true : false,
			};
		}
	}

	// For authenticated users, restore from metadata (e.g. different device or cookie cleared)
	if (currentUser?.id) {
		const savedCheckoutId = await getUserCheckoutId(currentUser.id, channel, currentUser as UserWithMetadata);
		if (savedCheckoutId) {
			const savedCheckout = await find(savedCheckoutId, { skipOwnershipCheck: true, currentUser });
			if (savedCheckout) {
				return {
					checkout: savedCheckout,
					isNewCheckout: false,
					restoredFromUser: true,
					shouldSaveCheckoutId: true,
				};
			}
		}
	}
	
	// Create new checkout
	const newCheckout = (await create({ channel })).checkoutCreate?.checkout;
	
	if (newCheckout) {
		// Ensure checkout has channel property (type assertion needed as GraphQL may not include it)
		const checkoutWithChannel = {
			...newCheckout,
			channel: (newCheckout as any).channel || { slug: channel },
		} as Awaited<ReturnType<typeof find>>;
		// Return with flags to save both cookies (caller must do this in Server Action)
		return {
			checkout: checkoutWithChannel,
			isNewCheckout: true,
			restoredFromUser: false,
			shouldSaveCheckoutId: true,
			shouldSaveUserCheckoutId: currentUser?.id ? true : false,
		};
	}
	
	return {
		checkout: null,
		isNewCheckout: true,
		restoredFromUser: false,
	};
}

const STOREFRONT_CONTROL_APP_INTERNAL_URL =
	process.env.STOREFRONT_CONTROL_APP_INTERNAL_URL || "http://saleor-storefront-control-app:3000";

export type AutoVoucherItem = {
	code: string;
	minSpent: number | null;
	type: "SHIPPING" | "ENTIRE_ORDER" | "SPECIFIC_PRODUCT";
};

/**
 * Fetches auto-apply vouchers from Storefront Control app (metadata auto=true) with rules (minSpent, type).
 * Server-only; returns empty array if control app is unavailable.
 */
export async function fetchAutoVouchers(channel: string): Promise<AutoVoucherItem[]> {
	try {
		const saleorApiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL || process.env.SALEOR_API_URL;
		const url = `${STOREFRONT_CONTROL_APP_INTERNAL_URL}/api/auto-voucher-codes?channelSlug=${encodeURIComponent(channel)}${saleorApiUrl ? `&saleorApiUrl=${encodeURIComponent(saleorApiUrl)}` : ""}`;
		const res = await fetch(url, {
			cache: "no-store",
			headers: saleorApiUrl ? { "x-saleor-api-url": saleorApiUrl } : undefined,
		});
		if (!res.ok) return [];
		const json = (await res.json()) as { vouchers?: AutoVoucherItem[]; codes?: string[] };
		if (Array.isArray(json.vouchers)) return json.vouchers;
		// Fallback: legacy response with codes only
		if (Array.isArray(json.codes))
			return json.codes.map((code) => ({ code, minSpent: null, type: "ENTIRE_ORDER" as const }));
		return [];
	} catch (error) {
		console.warn("[checkout] fetchAutoVouchers failed:", error);
		return [];
	}
}

/**
 * Applies the first applicable auto-voucher to the checkout (Saleor allows one voucher per checkout).
 * Only ENTIRE_ORDER and SPECIFIC_PRODUCT vouchers are auto-applied; SHIPPING vouchers are excluded
 * (free shipping is shown as a separate method when total >= threshold). Only applies when cart
 * subtotal meets voucher minSpent (if set). Prefers ENTIRE_ORDER then SPECIFIC_PRODUCT.
 * Call after resolving or creating a checkout when no voucher is applied yet.
 * If subtotalAmount is not provided, fetches checkout to get subtotalPrice.
 * Returns the applied voucher info including voucherType, or null if none applied.
 */
export async function applyAutoVouchers(
	checkoutId: string,
	channel: string,
	subtotalAmount?: number
): Promise<{
	voucherCode: string;
	discount?: { amount: number; currency: string };
	discountName?: string;
	voucherType?: "SHIPPING" | "ENTIRE_ORDER" | "SPECIFIC_PRODUCT";
} | null> {
	let amount = subtotalAmount;
	if (amount == null) {
		const checkout = await find(checkoutId, { channel, skipOwnershipCheck: true });
		amount = checkout?.subtotalPrice?.gross?.amount ?? 0;
	}
	const vouchers = await fetchAutoVouchers(channel);
	// Filter by minSpent: only apply if subtotal >= minSpent (or no minSpent).
	// Exclude SHIPPING vouchers: free shipping is a separate method (threshold in config), not auto-applied.
	const eligible = vouchers
		.filter((v) => v.minSpent == null || amount >= v.minSpent)
		.filter((v) => v.type !== "SHIPPING");
	// Prefer ENTIRE_ORDER, then SPECIFIC_PRODUCT (SHIPPING is not auto-applied)
	const order: Array<"ENTIRE_ORDER" | "SPECIFIC_PRODUCT"> = ["ENTIRE_ORDER", "SPECIFIC_PRODUCT"];
	eligible.sort((a, b) => order.indexOf(a.type as "ENTIRE_ORDER" | "SPECIFIC_PRODUCT") - order.indexOf(b.type as "ENTIRE_ORDER" | "SPECIFIC_PRODUCT"));

	for (const v of eligible) {
		try {
			const result = await executeGraphQL(CheckoutAddPromoCodeDocument, {
				variables: { checkoutId, promoCode: v.code },
				cache: "no-cache",
			});
			const data = result as {
				checkoutAddPromoCode?: {
					errors?: unknown[];
					checkout?: {
						voucherCode?: string;
						discount?: { amount: number; currency: string };
						discountName?: string;
					};
				};
			};
			const add = data?.checkoutAddPromoCode;
			if (add?.errors?.length) continue;
			if (add?.checkout?.voucherCode) {
				return {
					voucherCode: add.checkout.voucherCode,
					discount: add.checkout.discount ?? undefined,
					discountName: add.checkout.discountName ?? undefined,
					voucherType: v.type,
				};
			}
		} catch {
			// Try next
		}
	}
	return null;
}

/**
 * Applies a promo/voucher code to the checkout.
 * Returns { success, errors } where errors are GraphQL error messages.
 */
export async function applyPromoCode(
	checkoutId: string,
	promoCode: string
): Promise<{ success: boolean; errors?: string[]; errorCodes?: string[] }> {
	try {
		const result = await executeGraphQL(CheckoutAddPromoCodeDocument, {
			variables: { checkoutId, promoCode: promoCode.trim() },
			cache: "no-cache",
		});
		const data = result as { checkoutAddPromoCode?: { errors?: Array<{ message?: string; code?: string }>; checkout?: { voucherCode?: string } } };
		const add = data?.checkoutAddPromoCode;
		if (add?.errors?.length) {
			return {
				success: false,
				errors: add.errors.map((e) => e.message ?? "Invalid code"),
				errorCodes: add.errors.map((e) => e.code ?? "UNKNOWN"),
			};
		}
		return { success: !!add?.checkout?.voucherCode };
	} catch (error: any) {
		return { success: false, errors: [error?.message ?? "Failed to apply code"], errorCodes: ["UNKNOWN"] };
	}
}

/**
 * Removes the applied voucher from the checkout.
 * Pass voucherId (checkout.voucher.id) when available, or promoCode string.
 */
export async function removePromoCode(
	checkoutId: string,
	options: { promoCodeId?: string; promoCode?: string }
): Promise<{ success: boolean; errors?: string[] }> {
	try {
		const result = await executeGraphQL(CheckoutRemovePromoCodeDocument, {
			variables: {
				checkoutId,
				promoCodeId: options.promoCodeId ?? undefined,
				promoCode: options.promoCode ?? undefined,
			},
			cache: "no-cache",
		});
		const data = result as { checkoutRemovePromoCode?: { errors?: Array<{ message?: string }> } };
		const remove = data?.checkoutRemovePromoCode;
		if (remove?.errors?.length) {
			return { success: false, errors: remove.errors.map((e) => e.message ?? "Failed to remove") };
		}
		return { success: true };
	} catch (error: any) {
		return { success: false, errors: [error?.message ?? "Failed to remove code"] };
	}
}
