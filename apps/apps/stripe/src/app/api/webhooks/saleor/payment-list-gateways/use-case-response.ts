import { z } from "zod";

import { SuccessWebhookResponse } from "@/app/api/webhooks/saleor/saleor-webhook-responses";
import { AppContext } from "@/lib/app-context";

class Success extends SuccessWebhookResponse {
  readonly gateways: Array<{
    id: string;
    name: string;
    currencies: string[];
    config: Array<{ field: string; value: string }>;
  }>;

  private static ResponseDataSchema = z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      currencies: z.array(z.string()),
      config: z.array(
        z.object({
          field: z.string(),
          value: z.string(),
        }),
      ),
    }),
  );

  constructor(args: {
    gateways: Array<{
      id: string;
      name: string;
      currencies: string[];
      config: Array<{ field: string; value: string }>;
    }>;
    appContext: AppContext;
  }) {
    super(args.appContext);
    this.gateways = args.gateways;
  }

  getResponse() {
    const typeSafeResponse = Success.ResponseDataSchema.parse(this.gateways);

    return Response.json(typeSafeResponse, { status: this.statusCode });
  }
}

export const PaymentListGatewaysUseCaseResponses = {
  Success,
};

export type PaymentListGatewaysUseCaseResponsesType = InstanceType<
  typeof PaymentListGatewaysUseCaseResponses.Success
>;
