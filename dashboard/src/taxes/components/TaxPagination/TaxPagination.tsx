import { iconSize, iconStrokeWidth } from "@dashboard/components/icons";
import { commonMessages } from "@dashboard/intl";
import { Button } from "@saleor/macaw-ui-next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIntl } from "react-intl";

interface TaxPaginationProps {
  rowNumber: number;
  currentPage: number;
  setRowNumber: (rowNumber: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  setCurrentPage: (currentPage: number) => void;
}

const rowChoices = [10, 20, 30, 50, 100];

export const TaxPagination = ({
  rowNumber,
  setRowNumber,
  setCurrentPage,
  hasNextPage,
  hasPrevPage,
  currentPage,
}: TaxPaginationProps) => {
  const intl = useIntl();
  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
  };
  const handlePrevPage = () => {
    setCurrentPage(currentPage - 1);
  };

  return (
    <div className="flex items-center justify-between px-8 py-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary">
          {intl.formatMessage(commonMessages.noOfRows)}
        </span>
        <select
          value={rowNumber}
          onChange={e => setRowNumber(Number(e.target.value))}
          className="rounded border border-border-default1 bg-background-default1 px-2 py-1 text-sm"
        >
          {rowChoices.map(choice => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          disabled={!hasPrevPage}
          onClick={handlePrevPage}
          icon={<ChevronLeft size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
        />
        <Button
          variant="secondary"
          disabled={!hasNextPage}
          onClick={handleNextPage}
          icon={<ChevronRight size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
        />
      </div>
    </div>
  );
};
