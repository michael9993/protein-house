import { stringifyQs } from "@dashboard/utils/urls";
import urlJoin from "url-join";

import { ReviewListUrlQueryParams } from "./ReviewsList/types";
import { ReviewUpdatePageUrlQueryParams } from "./ReviewUpdate/types";

export const reviewsSectionUrlName = "/reviews";

export const reviewsListPath = `${reviewsSectionUrlName}/`;
export const reviewListUrl = (params?: ReviewListUrlQueryParams) =>
  reviewsListPath + "?" + stringifyQs(params);

export const reviewPath = (id: string) => urlJoin(reviewsListPath, id);

export const reviewUrl = (id: string, params?: ReviewUpdatePageUrlQueryParams) =>
  reviewPath(encodeURIComponent(id)) + "?" + stringifyQs(params);

