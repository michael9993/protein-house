import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { assertQuerySuccess } from "../utils/helpers";

export const channelsRouter = router({
  list: protectedClientProcedure.query(async ({ ctx }) => {
    const result = await ctx.apiClient.query(
      `query Channels {
        channels {
          id
          slug
          name
          currencyCode
          isActive
        }
      }`,
      {}
    );

    assertQuerySuccess(result, "Channels");

    const channels = (result.data?.channels || []).map((ch: any) => ({
      id: ch.id,
      slug: ch.slug,
      name: ch.name,
      currencyCode: ch.currencyCode,
      isActive: ch.isActive,
    }));

    return { channels };
  }),
});
