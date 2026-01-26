import React from "react";
import { PaymentMethods } from "./PaymentMethods";
import { Divider } from "@/checkout/components/Divider";
import { Title } from "@/checkout/components/Title";
import { useCheckoutText } from "@/checkout/hooks/useCheckoutText";

export const PaymentSection = () => {
	const text = useCheckoutText();
	
	return (
		<>
			<Divider />
			<div className="py-4" data-testid="paymentMethods">
				<Title>{text.paymentMethodLabel || "Payment methods"}</Title>
				<PaymentMethods />
			</div>
		</>
	);
};
