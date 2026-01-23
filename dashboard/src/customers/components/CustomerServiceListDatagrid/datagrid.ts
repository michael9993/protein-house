import { readonlyTextCell } from "@dashboard/components/Datagrid/customCells/cells";
import { AvailableColumn } from "@dashboard/components/Datagrid/types";
import { CustomerServiceListUrlSortField } from "@dashboard/customers/urls";
import { Sort } from "@dashboard/types";
import { getColumnSortDirectionIcon } from "@dashboard/utils/columns/getColumnSortDirectionIcon";
import { GridCell, Item } from "@glideapps/glide-data-grid";
import { IntlShape } from "react-intl";

import { columnsMessages } from "./messages";

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  repliedAt?: string | null;
  channel: {
    id: string;
    name: string;
    slug: string;
  };
  repliedBy?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  } | null;
};

export type ContactSubmissions = ContactSubmission[];

export const customerServiceListStaticColumnsAdapter = (
  intl: IntlShape,
  sort: Sort<CustomerServiceListUrlSortField>,
): AvailableColumn[] =>
  [
    {
      id: "name",
      title: intl.formatMessage(columnsMessages.name),
      width: 200,
    },
    {
      id: "email",
      title: intl.formatMessage(columnsMessages.email),
      width: 250,
    },
    {
      id: "subject",
      title: intl.formatMessage(columnsMessages.subject),
      width: 300,
    },
    {
      id: "status",
      title: intl.formatMessage(columnsMessages.status),
      width: 120,
    },
    {
      id: "channel",
      title: intl.formatMessage(columnsMessages.channel),
      width: 150,
    },
    {
      id: "createdAt",
      title: intl.formatMessage(columnsMessages.createdAt),
      width: 180,
    },
  ].map(column => ({
    ...column,
    icon: getColumnSortDirectionIcon(sort, column.id),
  }));

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateString;
  }
};

const getStatusLabel = (status: string, intl: IntlShape): string => {
  const statusMap: Record<string, string> = {
    NEW: intl.formatMessage({ id: "NEW", defaultMessage: "New" }),
    READ: intl.formatMessage({ id: "READ", defaultMessage: "Read" }),
    REPLIED: intl.formatMessage({ id: "REPLIED", defaultMessage: "Replied" }),
    ARCHIVED: intl.formatMessage({ id: "ARCHIVED", defaultMessage: "Archived" }),
  };
  return statusMap[status] || status;
};

export const createGetCellContent =
  ({ submissions, columns, intl }: { submissions: ContactSubmissions | undefined; columns: AvailableColumn[]; intl: IntlShape }) =>
  ([column, row]: Item): GridCell => {
    const rowData = submissions?.[row];
    const columnId = columns[column]?.id;

    if (!columnId || !rowData) {
      return readonlyTextCell("");
    }

    switch (columnId) {
      case "name":
        return readonlyTextCell(rowData.name ?? "");
      case "email":
        return readonlyTextCell(rowData.email ?? "");
      case "subject":
        return readonlyTextCell(rowData.subject ?? "");
      case "status":
        return readonlyTextCell(getStatusLabel(rowData.status, intl));
      case "channel":
        return readonlyTextCell(rowData.channel?.name ?? "");
      case "createdAt":
        return readonlyTextCell(formatDate(rowData.createdAt));
      default:
        return readonlyTextCell("");
    }
  };
