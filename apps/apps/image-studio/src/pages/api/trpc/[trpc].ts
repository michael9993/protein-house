import type { NextApiRequest, NextApiResponse } from "next";
import * as trpcNext from "@trpc/server/adapters/next";

import { appRouter } from "../../../modules/trpc/router";
import { createTrpcContext } from "../../../modules/trpc/trpc-context";

// Increase body size limit for base64 image payloads (AI edit, enhance, etc.)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

const trpcHandler = trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: createTrpcContext,
  onError: ({ path, error }) => {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      console.error(`${path} returned error:`, error);
      return;
    }
    console.debug(`${path} returned error:`, error);
  },
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return trpcHandler(req, res);
}
