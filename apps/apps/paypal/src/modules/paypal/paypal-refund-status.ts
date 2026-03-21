import { TransactionEventTypeEnum, TransactionActionEnum } from "@/generated/graphql";
import { PayPalRefundStatus } from "./types";

interface RefundStatusMapping {
  type: TransactionEventTypeEnum;
  message: string;
  availableActions: TransactionActionEnum[];
}

export function mapPayPalRefundStatus(status: PayPalRefundStatus): RefundStatusMapping {
  switch (status) {
    case "COMPLETED":
      return {
        type: "REFUND_SUCCESS",
        message: "Refund completed by PayPal",
        availableActions: [],
      };
    case "CANCELLED":
      return {
        type: "REFUND_FAILURE",
        message: "Refund cancelled by PayPal",
        availableActions: ["REFUND"],
      };
    case "FAILED":
      return {
        type: "REFUND_FAILURE",
        message: "Refund failed on PayPal",
        availableActions: ["REFUND"],
      };
    case "PENDING":
      return {
        type: "REFUND_REQUEST",
        message: "Refund pending on PayPal",
        availableActions: [],
      };
    default:
      return {
        type: "REFUND_FAILURE",
        message: `Unknown refund status: ${status as string}`,
        availableActions: ["REFUND"],
      };
  }
}
