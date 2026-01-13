import { redirect } from "next/navigation";

export default async function OrdersRedirectPage({ 
	params 
}: { 
	params: Promise<{ channel: string }> 
}) {
	// Redirect old /orders path to new /account/orders
	const { channel } = await params;
	redirect(`/${channel}/account/orders`);
}
