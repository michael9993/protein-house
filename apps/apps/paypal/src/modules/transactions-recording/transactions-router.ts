import { z } from "zod";

import { protectedClientProcedure } from "@/modules/trpc/protected-client-procedure";
import { router } from "@/modules/trpc/trpc-server";

import { transactionRecorder } from "./index";

export const transactionsRouter = router({
  list: protectedClientProcedure
    .input(
      z
        .object({
          type: z.enum(["CHARGE", "AUTHORIZATION", "REFUND", "CANCEL"]).optional(),
          status: z.enum(["SUCCESS", "FAILURE", "PENDING"]).optional(),
          environment: z.enum(["SANDBOX", "LIVE"]).optional(),
          limit: z.number().min(1).max(200).optional().default(50),
          offset: z.number().min(0).optional().default(0),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const transactions = await transactionRecorder.list(input ?? undefined);
      return { transactions };
    }),

  getByPaypalOrderId: protectedClientProcedure
    .input(z.object({ paypalOrderId: z.string().min(1) }))
    .query(async ({ input }) => {
      const transactions = await transactionRecorder.getByPaypalOrderId(input.paypalOrderId);
      return { transactions };
    }),

  getBySaleorTransactionId: protectedClientProcedure
    .input(z.object({ saleorTransactionId: z.string().min(1) }))
    .query(async ({ input }) => {
      const transactions = await transactionRecorder.getBySaleorTransactionId(
        input.saleorTransactionId,
      );
      return { transactions };
    }),
});
