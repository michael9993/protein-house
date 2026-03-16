import { FilterElement } from "@dashboard/components/Filter/types";
import {
  CustomerServiceFilterKeys,
  CustomerServiceListFilterOpts,
} from "@dashboard/customers/components/CustomerServiceListPage";
import { ContactSubmissionFilterInput, ContactSubmissionStatusEnum } from "@dashboard/graphql";

import {
  createFilterTabUtils,
  getGteLteVariables,
  getMinMaxQueryParam,
} from "../../../utils/filters";
import { CustomerServiceListUrlFilters, CustomerServiceListUrlFiltersEnum } from "../../urls";

const CUSTOMER_SERVICE_FILTERS_KEY = "customerServiceFilters";

export function getFilterOpts(params: CustomerServiceListUrlFilters): CustomerServiceListFilterOpts {
  return {
    status: {
      active: !!params.status,
      value: params.status || "",
    },
    channel: {
      active: !!params.channel,
      value: params.channel || "",
    },
    created: {
      active: [params.createdFrom, params.createdTo].some(field => field !== undefined) ?? false,
      value: {
        max: params.createdTo ?? "",
        min: params.createdFrom ?? "",
      },
    },
  };
}

export function getFilterVariables(
  params: CustomerServiceListUrlFilters,
  defaultChannelSlug?: string | null,
): ContactSubmissionFilterInput {
  return {
    status: params.status ? (params.status as ContactSubmissionStatusEnum) : undefined,
    channel: params.channel || defaultChannelSlug || undefined,
    createdAt: getGteLteVariables({
      gte: params.createdFrom,
      lte: params.createdTo,
    }),
    search: params.query,
  };
}

export function getFilterQueryParam(
  filter: FilterElement<CustomerServiceFilterKeys>,
): CustomerServiceListUrlFilters {
  const { name } = filter;

  switch (name) {
    case CustomerServiceFilterKeys.status:
      return {
        [CustomerServiceListUrlFiltersEnum.status]: (filter.value?.[0] ?? "") as string,
      };

    case CustomerServiceFilterKeys.channel:
      return {
        [CustomerServiceListUrlFiltersEnum.channel]: (filter.value?.[0] ?? "") as string,
      };

    case CustomerServiceFilterKeys.created:
      return getMinMaxQueryParam(
        filter,
        CustomerServiceListUrlFiltersEnum.createdFrom,
        CustomerServiceListUrlFiltersEnum.createdTo,
      );
  }
}

export const storageUtils = createFilterTabUtils<string>(CUSTOMER_SERVICE_FILTERS_KEY);
