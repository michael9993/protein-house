import { iconSize, iconStrokeWidth } from "@dashboard/components/icons";
import useNavigator from "@dashboard/hooks/useNavigator";
import { commonMessages } from "@dashboard/intl";
import { TableCell } from "@dashboard/components/Table";
import { Box, Button } from "@saleor/macaw-ui-next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { useIntl } from "react-intl";

import { ListSettings } from "../../types";

export type ListSettingsUpdate = <T extends keyof ListSettings>(
  key: T,
  value: ListSettings[T],
) => void;

export interface PaginationProps {
  component?: React.ElementType;
  colSpan?: number;
  settings?: ListSettings;
  onUpdateListSettings?: ListSettingsUpdate;
  prevHref?: string;
  nextHref?: string;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  disabled?: boolean;
  labels?: { noOfRows: string };
  onNextPage?: () => void;
  onPreviousPage?: () => void;
}

const choices = [10, 20, 30, 50, 100];

export const TablePagination = ({
  component,
  colSpan,
  settings,
  onUpdateListSettings,
  nextHref,
  prevHref,
  hasNextPage,
  hasPreviousPage,
  disabled,
  labels,
  onNextPage,
  onPreviousPage,
}: PaginationProps) => {
  const intl = useIntl();
  const navigate = useNavigator();
  const Wrapper = component || TableCell;

  const handlers = {
    onPreviousPage: prevHref ? () => navigate(prevHref) : onPreviousPage,
    onNextPage: nextHref ? () => navigate(nextHref) : onNextPage,
  };

  return (
    <Wrapper colSpan={colSpan || 1000}>
      <Box display="flex" justifyContent="space-between" paddingY={4}>
        {settings?.rowNumber && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">
              {labels?.noOfRows || intl.formatMessage(commonMessages.noOfRows)}
            </span>
            <select
              disabled={disabled}
              value={settings.rowNumber}
              onChange={e => onUpdateListSettings?.("rowNumber", Number(e.target.value))}
              className="rounded border border-border-default1 bg-background-default1 px-2 py-1 text-sm disabled:opacity-50"
            >
              {choices.map(choice => (
                <option key={choice} value={choice}>
                  {choice}
                </option>
              ))}
            </select>
          </div>
        )}

        <Box display="flex" flexDirection="row" alignItems="center" gap={2} marginLeft="auto">
          <Button
            variant="secondary"
            disabled={!hasPreviousPage || disabled}
            onClick={handlers.onPreviousPage}
            icon={<ChevronLeft size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
            data-test-id="button-pagination-back"
          />
          <Button
            variant="secondary"
            disabled={!hasNextPage || disabled}
            onClick={handlers.onNextPage}
            icon={<ChevronRight size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
            data-test-id="button-pagination-next"
          />
        </Box>
      </Box>
    </Wrapper>
  );
};

TablePagination.displayName = "TablePagination";
