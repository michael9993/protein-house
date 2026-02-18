import { withQs } from "@dashboard/utils/urls";
import urlJoin from "url-join";

import { GiftCardListUrlQueryParams } from "./GiftCardsList/types";
import { GiftCardUpdatePageUrlQueryParams } from "./GiftCardUpdate/types";

export const giftCardsSectionUrlName = "/gift-cards";

export const giftCardsListPath = `${giftCardsSectionUrlName}/`;

export const giftCardListUrl = (params?: GiftCardListUrlQueryParams) =>
  withQs(giftCardsListPath, params);

export const giftCardPath = (id: string) => urlJoin(giftCardsListPath, id);

export const giftCardUrl = (id: string, params?: GiftCardUpdatePageUrlQueryParams) =>
  withQs(giftCardPath(encodeURIComponent(id)), params);

export const giftCardSettingsUrl = urlJoin(giftCardsListPath, "settings");
