import { Box } from "@saleor/macaw-ui";
import { useRef, useEffect } from "react";

type Props = {
  value?: string;
};

export const MjmlPreview = ({ value }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && value) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(value);
        doc.close();
      }
    }
  }, [value]);

  return (
    <Box>
      {value?.length ? (
        <iframe
          ref={iframeRef}
          sandbox="allow-same-origin"
          title="Email template preview"
          style={{
            width: "100%",
            border: "1px solid var(--color-default-1)",
            borderRadius: "4px",
            minHeight: "400px",
          }}
        />
      ) : (
        <Box padding={4} textAlign="center" color="default2">
          No template preview available
        </Box>
      )}
    </Box>
  );
};
