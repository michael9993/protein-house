import { useClipboard } from "@dashboard/hooks/useClipboard";
import { Box, Button, Text } from "@saleor/macaw-ui-next";
import { ExternalLinkIcon } from "lucide-react";
import { useState } from "react";
import { useIntl } from "react-intl";

import { ClipboardCopyIcon } from "./ClipboardCopyIcon";

function getTrackingUrl(trackingNumber: string): string | null {
  const num = trackingNumber.trim().toUpperCase();

  if (num.startsWith("1Z")) {
    return `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingNumber)}`;
  }
  if (/^\d{12,22}$/.test(num)) {
    return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(trackingNumber)}`;
  }
  if (/^(94|93|92|94)\d{18,}$/.test(num) || /^\d{20,22}$/.test(num)) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(trackingNumber)}`;
  }
  if (/^\d{10}$/.test(num) || num.startsWith("JD")) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(trackingNumber)}`;
  }

  // CJ Packet, ePacket, YunExpress, and other international carriers — use 17Track universal
  return `https://t.17track.net/en#nums=${encodeURIComponent(trackingNumber)}`;
}

interface TrackingNumberDisplayProps {
  trackingNumber: string;
}

export const TrackingNumberDisplay = ({
  trackingNumber,
}: TrackingNumberDisplayProps): JSX.Element => {
  const intl = useIntl();
  const [copied, copy] = useClipboard();
  const [showActions, setShowActions] = useState(false);
  const trackingUrl = getTrackingUrl(trackingNumber);

  return (
    <>
      <Text color="default2" size={2} marginRight={1}>
        {", "}
      </Text>
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <Text
          color="default2"
          size={2}
          onFocus={() => setShowActions(true)}
          onBlur={() => setShowActions(false)}
        >
          {intl.formatMessage(
            {
              defaultMessage: "Tracking: {trackingNumber}",
              id: "vMo6/3",
            },
            {
              trackingNumber: (
                <Text size={2} color="default1" fontWeight="medium">
                  {trackingNumber}
                </Text>
              ),
            },
          )}
        </Text>
        <Box __opacity={showActions ? 1 : 0} pointerEvents={showActions ? "auto" : "none"} display="flex" gap={0.5}>
          <Button
            variant="tertiary"
            size="small"
            icon={<ClipboardCopyIcon hasBeenClicked={copied} />}
            onClick={() => copy(trackingNumber)}
            aria-label={intl.formatMessage({
              defaultMessage: "Copy tracking number",
              id: "0KVj6r",
            })}
          />
          {trackingUrl && (
            <Button
              variant="tertiary"
              size="small"
              icon={<ExternalLinkIcon size={16} />}
              onClick={() => window.open(trackingUrl, "_blank", "noopener,noreferrer")}
              aria-label={intl.formatMessage({
                defaultMessage: "Track shipment",
                id: "dRq+Bj",
              })}
            />
          )}
        </Box>
      </Box>
    </>
  );
};
