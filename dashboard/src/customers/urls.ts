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

const customerSection = "/customers/";

export const customerListPath = customerSection;
export enum CustomerListUrlFiltersEnum {
  joinedFrom = "joinedFrom",
  joinedTo = "joinedTo",
  numberOfOrdersFrom = "numberOfOrdersFrom",
  numberOfOrdersTo = "numberOfOrdersTo",
  query = "query",
}
export type CustomerListUrlFilters = Filters<CustomerListUrlFiltersEnum>;
export type CustomerListUrlDialog = "remove" | TabActionDialog;
export enum CustomerListUrlSortField {
  name = "name",
  email = "email",
  orders = "orders",
}
type CustomerListUrlSort = Sort<CustomerListUrlSortField>;
export type CustomerListUrlQueryParams = ActiveTab &
  BulkAction &
  CustomerListUrlFilters &
  CustomerListUrlSort &
  Dialog<CustomerListUrlDialog> &
  Pagination;
export const customerListUrl = (params?: CustomerListUrlQueryParams) =>
  withQs(customerListPath, params);

export const customerPath = (id: string) => urlJoin(customerSection, id);
type CustomerUrlDialog = "remove";
export type CustomerUrlQueryParams = Dialog<CustomerUrlDialog>;
export const customerUrl = (id: string, params?: CustomerUrlQueryParams) =>
  withQs(customerPath(encodeURIComponent(id)), params);

export const customerAddPath = urlJoin(customerSection, "add");
export const customerAddUrl = customerAddPath;

export const customerAddressesPath = (id: string) => urlJoin(customerPath(id), "addresses");
export type CustomerAddressesUrlDialog = "add" | "edit" | "remove";
export type CustomerAddressesUrlQueryParams = Dialog<CustomerAddressesUrlDialog> & SingleAction;
export const customerAddressesUrl = (id: string, params?: CustomerAddressesUrlQueryParams) =>
  withQs(customerAddressesPath(encodeURIComponent(id)), params);

export const customerServiceListPath = urlJoin(customerSection, "service");
export enum CustomerServiceListUrlFiltersEnum {
  status = "status",
  channel = "channel",
  createdFrom = "createdFrom",
  createdTo = "createdTo",
  query = "query",
}
export type CustomerServiceListUrlFilters = Filters<CustomerServiceListUrlFiltersEnum>;
export type CustomerServiceListUrlDialog = "remove" | TabActionDialog;
export enum CustomerServiceListUrlSortField {
  createdAt = "createdAt",
  updatedAt = "updatedAt",
  name = "name",
  email = "email",
  status = "status",
}
type CustomerServiceListUrlSort = Sort<CustomerServiceListUrlSortField>;
export type CustomerServiceListUrlQueryParams = ActiveTab &
  BulkAction &
  CustomerServiceListUrlFilters &
  CustomerServiceListUrlSort &
  Dialog<CustomerServiceListUrlDialog> &
  Pagination;
export const customerServiceListUrl = (params?: CustomerServiceListUrlQueryParams) =>
  withQs(customerServiceListPath, params);

export const customerServicePath = (id: string) => urlJoin(customerServiceListPath, id);
type CustomerServiceUrlDialog = "remove";
export type CustomerServiceUrlQueryParams = Dialog<CustomerServiceUrlDialog>;
export const customerServiceUrl = (id: string, params?: CustomerServiceUrlQueryParams) =>
  withQs(customerServicePath(encodeURIComponent(id)), params);
