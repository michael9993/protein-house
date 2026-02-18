import { ChannelsAction } from "@dashboard/channels/urls";
import urlJoin from "url-join";

import {
  ActiveTab,
  BulkAction,
  Dialog,
  Filters,
  FiltersAsDictWithMultipleValues,
  FiltersWithKeyValueValues,
  FiltersWithMultipleValues,
  Pagination,
  SingleAction,
  Sort,
  TabActionDialog,
} from "../types";
import { withQs } from "../utils/urls";

const productSection = "/products/";

export const productAddPath = urlJoin(productSection, "add");
export const productAddUrl = (params?: ProductCreateUrlQueryParams) =>
  withQs(productAddPath, params);

export const productListPath = productSection;
export type ProductListUrlDialog = "delete" | "export" | "create-product" | TabActionDialog;
export enum ProductListUrlFiltersEnum {
  priceFrom = "priceFrom",
  priceTo = "priceTo",
  status = "status",
  stockStatus = "stockStatus",
  query = "query",
  channel = "channel",
  productKind = "productKind",
}
export enum ProductListUrlFiltersWithMultipleValues {
  categories = "categories",
  collections = "collections",
  productTypes = "productTypes",
}
export const ProductListUrlFiltersAsDictWithMultipleValues = {
  booleanAttributes: "boolean-attributes",
  dateAttributes: "date-attributes",
  dateTimeAttributes: "datetime-attributes",
  numericAttributes: "numeric-attributes",
  stringAttributes: "string-attributes",
} as const;
export type ProductListUrlFiltersAsDictWithMultipleValues =
  (typeof ProductListUrlFiltersAsDictWithMultipleValues)[keyof typeof ProductListUrlFiltersAsDictWithMultipleValues];
export enum ProductListUrlFiltersWithKeyValueValues {
  metadata = "metadata",
}
export type ProductListUrlFilters = Filters<ProductListUrlFiltersEnum> &
  FiltersWithMultipleValues<ProductListUrlFiltersWithMultipleValues> &
  FiltersWithKeyValueValues<ProductListUrlFiltersWithKeyValueValues> &
  FiltersAsDictWithMultipleValues<ProductListUrlFiltersAsDictWithMultipleValues>;
export enum ProductListUrlSortField {
  attribute = "attribute",
  name = "name",
  productType = "productType",
  availability = "availability",
  price = "price",
  rank = "rank",
  date = "date",
  created = "created",
}
type ProductListUrlSort = Sort<ProductListUrlSortField>;
export interface ProductListUrlQueryParams
  extends BulkAction,
    Dialog<ProductListUrlDialog>,
    ProductListUrlFilters,
    ProductListUrlSort,
    Pagination,
    ActiveTab {
  attributeId?: string;
  presestesChanged?: string;
}
export const productListUrl = (params?: ProductListUrlQueryParams): string =>
  withQs(productListPath, params);

export const productPath = (id: string) => urlJoin(productSection + id);
export type ProductUrlDialog = "remove" | "assign-attribute-value" | ChannelsAction;
export type ProductUrlQueryParams = BulkAction & Dialog<ProductUrlDialog> & SingleAction;
export type ProductCreateUrlDialog = "assign-attribute-value" | ChannelsAction;
interface ProductCreateUrlProductType {
  "product-type-id"?: string;
}
export type ProductCreateUrlQueryParams = Dialog<ProductCreateUrlDialog> &
  SingleAction &
  ProductCreateUrlProductType;
export const productUrl = (id: string, params?: ProductUrlQueryParams) =>
  withQs(productPath(encodeURIComponent(id)), params);

export const productVariantEditPath = (variantId: string) =>
  urlJoin(productSection, "variant", variantId);

/** @deprecated TODO: Remove in Saleor Dashboard 3.23 */
export const productVariantLegacyEditPath = (productId: string, variantId: string) =>
  urlJoin(productSection, productId, "variant", variantId);

export type ProductVariantEditUrlDialog = "remove" | "assign-attribute-value";
export type ProductVariantEditUrlQueryParams = Dialog<ProductVariantEditUrlDialog> & SingleAction;
export const productVariantEditUrl = (
  variantId: string,
  params?: ProductVariantEditUrlQueryParams,
) => withQs(productVariantEditPath(encodeURIComponent(variantId)), params);

type ProductVariantAddUrlDialog = "assign-attribute-value";
export type ProductVariantAddUrlQueryParams = Dialog<ProductVariantAddUrlDialog> & SingleAction;
export const productVariantAddPath = (productId: string) =>
  urlJoin(productSection, productId, "variant/add");
export const productVariantAddUrl = (
  productId: string,
  params?: ProductVariantAddUrlQueryParams,
): string => withQs(productVariantAddPath(encodeURIComponent(productId)), params);

export const productImagePath = (productId: string, imageId: string) =>
  urlJoin(productSection, productId, "image", imageId);
export type ProductImageUrlQueryParams = Dialog<"remove">;
export const productImageUrl = (
  productId: string,
  imageId: string,
  params?: ProductImageUrlQueryParams,
) =>
  withQs(
    productImagePath(encodeURIComponent(productId), encodeURIComponent(imageId)),
    params,
  );
