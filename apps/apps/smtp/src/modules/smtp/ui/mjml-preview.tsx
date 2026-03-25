import React, { useRef, useEffect } from "react";

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
    <>
      {value?.length ? (
        <iframe
          ref={iframeRef}
          sandbox="allow-same-origin"
          title="Email template preview"
          style={{
            width: "100%",
            border: "1px solid #e5e7eb",
            borderRadius: "4px",
            minHeight: "400px",
          }}
        />
      ) : (
        <p>No template preview</p>
      )}
    </>
  );
};
