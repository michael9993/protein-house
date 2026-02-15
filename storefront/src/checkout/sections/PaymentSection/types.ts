import { type StripeV2GatewayId } from "./StripeV2DropIn/types";
import { type DummyGatewayId } from "./DummyDropIn/types";
import { type PaymentGatewayConfig } from "@/checkout/graphql";

export type PaymentGatewayId = StripeV2GatewayId | DummyGatewayId;

export type ParsedStripeGateway = ParsedPaymentGateway<StripeV2GatewayId, { stripePublishableKey?: string }>;
export type ParsedDummyGateway = ParsedPaymentGateway<DummyGatewayId, {}>;

export type ParsedPaymentGateways = ReadonlyArray<
	ParsedStripeGateway | ParsedDummyGateway
>;

export interface ParsedPaymentGateway<ID extends string, TData extends Record<string, any>>
	extends Omit<PaymentGatewayConfig, "data" | "id"> {
	data: TData;
	id: ID;
}

export type PaymentStatus = "paidInFull" | "overpaid" | "none" | "authorized";
