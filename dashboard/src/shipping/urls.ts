import { ChannelsAction } from "@dashboard/channels/urls";
import { ShippingMethodTypeEnum } from "@dashboard/graphql";
import { withQs } from "@dashboard/utils/urls";
import urlJoin from "url-join";

import { BulkAction, Dialog, Pagination, Search, SingleAction } from "../types";

const shippingSection = "/shipping/";

export const shippingZonesListPath = shippingSection;
export type ShippingZonesListUrlDialog = "remove" | "change-weight-unit";
export type ShippingZonesListUrlQueryParams = BulkAction &
  Dialog<ShippingZonesListUrlDialog> &
  Pagination &
  Search &
  SingleAction;
export const shippingZonesListUrl = (params?: ShippingZonesListUrlQueryParams) =>
  withQs(shippingZonesListPath, params);

export const shippingZonePath = (id: string) => urlJoin(shippingZonesListPath, id);
export type ShippingZoneUrlDialog =
  | "add-rate"
  | "add-warehouse"
  | "assign-country"
  | "edit-rate"
  | "remove"
  | "remove-rate"
  | "unassign-country";

type ShippingMethodActions = "assign-product" | "unassign-product";

export type ShippingZoneUrlQueryParams = Dialog<ShippingZoneUrlDialog> &
  SingleAction &
  Partial<{
    type: ShippingMethodTypeEnum;
  }>;
export const shippingZoneUrl = (id: string, params?: ShippingZoneUrlQueryParams) =>
  withQs(shippingZonePath(encodeURIComponent(id)), params);

type ZipCodeRangeActions = "add-range" | "remove-range";
export type ShippingRateUrlDialog =
  | ZipCodeRangeActions
  | "remove"
  | ShippingMethodActions
  | ChannelsAction;

export type ShippingRateUrlQueryParams = Dialog<ShippingRateUrlDialog> & SingleAction & BulkAction;
export type ShippingRateCreateUrlDialog = ZipCodeRangeActions | ChannelsAction;
export type ShippingRateCreateUrlQueryParams = Dialog<ShippingRateCreateUrlDialog> &
  SingleAction &
  Partial<{
    type: ShippingMethodTypeEnum;
  }>;

export const shippingRateCreatePath = (id: string) => urlJoin(shippingZonePath(id), "add");
export const shippingRateCreateUrl = (id: string, params?: ShippingRateCreateUrlQueryParams) =>
  withQs(shippingRateCreatePath(encodeURIComponent(id)), params);

export const shippingRateEditPath = (id: string, rateId: string) =>
  urlJoin(shippingZonePath(id), rateId);
export const shippingRateEditUrl = (
  id: string,
  rateId: string,
  params?: ShippingRateUrlQueryParams,
) =>
  withQs(shippingRateEditPath(encodeURIComponent(id), encodeURIComponent(rateId)), params);

export const shippingZoneAddPath = urlJoin(shippingZonesListPath, "add");
export const shippingZoneAddUrl = shippingZoneAddPath;
