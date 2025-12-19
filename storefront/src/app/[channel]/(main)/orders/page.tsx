import { redirect } from "next/navigation";

export default function OrdersRedirectPage({ 
	params 
}: { 
	params: { channel: string } 
}) {
	// Redirect old /orders path to new /account/orders
	redirect(`/${params.channel}/account/orders`);
}
