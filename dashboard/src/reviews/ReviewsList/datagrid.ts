import { PLACEHOLDER } from "@dashboard/components/Datagrid/const";
import { readonlyTextCell } from "@dashboard/components/Datagrid/customCells/cells";
import { GetCellContentOpts } from "@dashboard/components/Datagrid/Datagrid";
import { AvailableColumn } from "@dashboard/components/Datagrid/types";
import { GridCell, Item } from "@glideapps/glide-data-grid";
import { IntlShape } from "react-intl";

import { messages } from "./messages";

export interface Review {
  id: string;
  product?: {
    id?: string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
  rating?: number | null;
  title?: string | null;
  body?: string | null;
  images?: string[] | null;
  helpfulCount?: number | null;
  status?: string | null;
  isVerifiedPurchase?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  user?: {
    id?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
}

export const reviewsListStaticColumns = (
  intl: IntlShape,
): AvailableColumn[] => [
  {
    id: "product",
    title: intl.formatMessage(messages.product),
    width: 200,
  },
  {
    id: "rating",
    title: intl.formatMessage(messages.rating),
    width: 100,
  },
  {
    id: "title",
    title: intl.formatMessage(messages.review),
    width: 250,
  },
  {
    id: "user",
    title: intl.formatMessage(messages.user),
    width: 150,
  },
  {
    id: "status",
    title: intl.formatMessage(messages.status),
    width: 100,
  },
  {
    id: "createdAt",
    title: intl.formatMessage(messages.createdAt),
    width: 150,
  },
];

export const createGetCellContent =
  ({
    reviews,
    columns,
  }: {
    reviews: Review[];
    columns: AvailableColumn[];
  }) =>
  ([column, row]: Item, opts?: GetCellContentOpts): GridCell => {
    const rowData: Review | undefined = reviews[row];
    const columnId = columns[column]?.id;

    if (!columnId || !rowData) {
      return readonlyTextCell("");
    }

    switch (columnId) {
      case "product":
        return readonlyTextCell(rowData.product?.name || PLACEHOLDER);
      case "rating":
        return readonlyTextCell(
          rowData.rating ? rowData.rating.toFixed(1) : PLACEHOLDER,
        );
      case "title":
        return readonlyTextCell(rowData.title || PLACEHOLDER);
      case "user": {
        const userName =
          rowData.user?.firstName || rowData.user?.lastName
            ? `${rowData.user.firstName || ""} ${rowData.user.lastName || ""}`.trim()
            : rowData.user?.email?.split("@")[0] || "Guest";
        return readonlyTextCell(userName);
      }
      case "status":
        return readonlyTextCell(rowData.status || PLACEHOLDER);
      case "createdAt":
        return readonlyTextCell(
          rowData.createdAt
            ? new Date(rowData.createdAt).toLocaleDateString()
            : PLACEHOLDER,
        );
      default:
        return readonlyTextCell("");
    }
  };

