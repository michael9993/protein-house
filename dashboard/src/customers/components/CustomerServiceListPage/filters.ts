import { FilterElement, IFilter } from "@dashboard/components/Filter/types";
import { FilterOpts, MinMax } from "@dashboard/components/Filter/types";
import { hasPermissions } from "@dashboard/components/RequirePermissions";
import { PermissionEnum, UserFragment } from "@dashboard/graphql";
import { createDateField } from "@dashboard/utils/filters/fields";
import { createOptionsField } from "@dashboard/utils/filters/fields";
import { defineMessages, IntlShape } from "react-intl";

import { CustomerServiceListFilterOpts } from "./CustomerServiceListPage";

export enum CustomerServiceFilterKeys {
  status = "status",
  channel = "channel",
  created = "created",
}

export interface CustomerServiceListFilterOpts {
  status: FilterOpts<string>;
  channel: FilterOpts<string>;
  created: FilterOpts<MinMax>;
}

const messages = defineMessages({
  status: {
    id: "pQ9rT5",
    defaultMessage: "Status",
    description: "contact submission status",
  },
  channel: {
    id: "qR0sU6",
    defaultMessage: "Channel",
    description: "channel",
  },
  created: {
    id: "rS1tV7",
    defaultMessage: "Created",
    description: "created date",
  },
});

export function createFilterStructure(
  intl: IntlShape,
  opts: CustomerServiceListFilterOpts,
  userPermissions: UserFragment["userPermissions"],
): IFilter<CustomerServiceFilterKeys> {
  return [
    {
      ...createOptionsField(
        CustomerServiceFilterKeys.status,
        intl.formatMessage(messages.status),
        opts.status.value ? [opts.status.value] : [],
        false,
        [
          { label: intl.formatMessage({ id: "NEW", defaultMessage: "New" }), value: "NEW" },
          { label: intl.formatMessage({ id: "READ", defaultMessage: "Read" }), value: "READ" },
          { label: intl.formatMessage({ id: "REPLIED", defaultMessage: "Replied" }), value: "REPLIED" },
          { label: intl.formatMessage({ id: "ARCHIVED", defaultMessage: "Archived" }), value: "ARCHIVED" },
        ],
      ),
      active: opts.status.active,
    },
    {
      ...createOptionsField(
        CustomerServiceFilterKeys.channel,
        intl.formatMessage(messages.channel),
        opts.channel.value ? [opts.channel.value] : [],
        false,
        [], // Will be populated dynamically from available channels
      ),
      active: opts.channel.active,
    },
    {
      ...createDateField(
        CustomerServiceFilterKeys.created,
        intl.formatMessage(messages.created),
        opts.created.value,
      ),
      active: opts.created.active,
    },
  ].filter(filter => hasPermissions(userPermissions ?? [], filter.permissions ?? []));
}
