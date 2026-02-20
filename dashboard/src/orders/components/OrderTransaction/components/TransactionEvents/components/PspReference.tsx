// @ts-strict-ignore
import OverflowTooltip from "@dashboard/components/OverflowTooltip";
import { useClipboard } from "@dashboard/hooks/useClipboard";
import { commonMessages } from "@dashboard/intl";
import { cn } from "@dashboard/utils/cn";
import { IconButton } from "@dashboard/components/IconButton/IconButton";
import { Check, Copy } from "lucide-react";
import { useIntl } from "react-intl";

import { PspReferenceLink } from "./PspReferenceLink";

interface PspReferenceProps {
  reference: string;
  url?: string;
}

export const PspReference = ({ reference, url }: PspReferenceProps) => {
  const intl = useIntl();
  const [copied, copy] = useClipboard();

  return (
    <div className="flex gap-2">
      <OverflowTooltip
        className="font-mono font-semibold text-xs rounded bg-gray-100 dark:bg-background-paper p-1 cursor-default whitespace-nowrap text-ellipsis overflow-hidden"
        header={intl.formatMessage(commonMessages.pspReference)}
      >
        <PspReferenceLink href={url}>{reference}</PspReferenceLink>
      </OverflowTooltip>
      {!!navigator.clipboard && (
        <IconButton
          variant="secondary"
          className={cn(
            "h-[26px] w-[26px] transition-colors duration-200",
            copied && "bg-saleor-success text-saleor-main-1",
          )}
          onClick={event => {
            event.preventDefault();
            copy(reference);
          }}
          size="medium">
          {copied ? (
            <Check size={16} />
          ) : (
            <Copy size={16} />
          )}
        </IconButton>
      )}
    </div>
  );
};
