import { ProductTypeKindEnum } from "@dashboard/graphql";
import { withQs } from "@dashboard/utils/urls";
import urlJoin from "url-join";

import {
  ActiveTab,
  BulkAction,
  Dialog,
  Filters,
  Pagination,
  SingleAction,
  Sort,
  TabActionDialog,
} from "../types";

const productTypeSection = "/product-types/";

export const productTypeListPath = productTypeSection;
export enum ProductTypeListUrlFiltersEnum {
  configurable = "configurable",
  type = "type",
  query = "query",
}
export type ProductTypeListUrlFilters = Filters<ProductTypeListUrlFiltersEnum>;
export type ProductTypeListUrlDialog = "remove" | TabActionDialog;
export enum ProductTypeListUrlSortField {
  name = "name",
  digital = "digital",
}
type ProductTypeListUrlSort = Sort<ProductTypeListUrlSortField>;
export type ProductTypeListUrlQueryParams = ActiveTab &
  BulkAction &
  Dialog<ProductTypeListUrlDialog> &
  Pagination &
  ProductTypeListUrlFilters &
  ProductTypeListUrlSort;
export const productTypeListUrl = (params?: ProductTypeListUrlQueryParams) =>
  withQs(productTypeListPath, params);

interface ProductTypeAddUrlKind {
  kind?: ProductTypeKindEnum;
}
export type ProductTypeAddUrlQueryParams = ProductTypeAddUrlKind;
export const productTypeAddPath = urlJoin(productTypeSection, "add");
export const productTypeAddUrl = (params?: ProductTypeAddUrlQueryParams) =>
  withQs(productTypeAddPath, params);

export const productTypePath = (id: string) => urlJoin(productTypeSection, id);
type ProductTypeUrlDialog =
  | "assign-attribute"
  | "unassign-attribute"
  | "unassign-product-attributes"
  | "unassign-variant-attributes"
  | "remove";
export type ProductTypeUrlQueryParams = BulkAction &
  Dialog<ProductTypeUrlDialog> &
  SingleAction & {
    type?: string;
  };
export const productTypeUrl = (id: string, params?: ProductTypeUrlQueryParams) =>
  withQs(productTypePath(encodeURIComponent(id)), params);
