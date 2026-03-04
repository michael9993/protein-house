import queryString from "query-string";

const queryParamsMap = {
	redirectUrl: "redirectUrl",
	checkout: "checkoutId",
	order: "orderId",
	token: "passwordResetToken",
	email: "passwordResetEmail",
	saleorApiUrl: "saleorApiUrl",
	transaction: "transaction",
	processingPayment: "processingPayment",
	redirectResult: "redirectResult",
	resultCode: "resultCode",
	type: "type",
	payment_intent: "paymentIntent",
	payment_intent_client_secret: "paymentIntentClientSecret",
} as const;

type UnmappedQueryParam = keyof typeof queryParamsMap;
type QueryParam = (typeof queryParamsMap)[UnmappedQueryParam];
type ParamBasicValue = string | null | undefined;

interface CustomTypedQueryParams {
	countryCode: string;
	channel: string;
	saleorApiUrl: string;
}

type RawQueryParams = Record<UnmappedQueryParam, ParamBasicValue> & CustomTypedQueryParams;
export type QueryParams = Record<QueryParam, ParamBasicValue> & CustomTypedQueryParams;

const getRawQueryParams = () => queryString.parse(location.search) as unknown as RawQueryParams;

export const getQueryParams = (): QueryParams => {
	const params = getRawQueryParams();
	return Object.entries(params).reduce((result, entry) => {
		const [paramName, paramValue] = entry as [UnmappedQueryParam, ParamBasicValue];
		const mappedParamName = queryParamsMap[paramName];
		return { ...result, [mappedParamName]: paramValue };
	}, {}) as QueryParams;
};
