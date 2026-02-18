import { Dialog, Pagination, Sort, TabActionDialog } from "@dashboard/types";
import { withQs } from "@dashboard/utils/urls";
import urlJoin from "url-join";

export enum DiscountListUrlSortField {
  name = "name",
  endDate = "endDate",
  startDate = "startDate",
}

const discountSection = "/discounts/sales";

export const discountSalesListPath = discountSection;

export type DiscountListUrlDialog = TabActionDialog;

type DiscountListUrlSort = Sort<DiscountListUrlSortField>;

export type DiscountListUrlQueryParams = Dialog<DiscountListUrlDialog> &
  Pagination &
  DiscountListUrlSort & {
    query?: string;
  };

type DiscountUrlDialog = "remove";
export type DiscountUrlQueryParams = Dialog<DiscountUrlDialog>;

export const discountListUrl = (params?: DiscountListUrlQueryParams) =>
  withQs(discountSection, params);

export const discountUrl = (id: string, params?: DiscountListUrlQueryParams) =>
  withQs(urlJoin(discountSection, id), params);

export const discountAddUrl = () => urlJoin(discountSection, "add");
