import { router } from "./trpc-server";
import { newsletterRouter } from "../newsletter/newsletter.router";
import { imageRouter } from "../newsletter/images/image.router";
import { templateRouter } from "../newsletter/templates/template.router";
import { campaignRouter } from "../newsletter/campaigns/campaign.router";

export const appRouter = router({
    newsletter: newsletterRouter,
    image: imageRouter,
    template: templateRouter,
    campaign: campaignRouter,
});

export type AppRouter = typeof appRouter;
