import { Box } from "@saleor/macaw-ui";

type Props = {
  value?: string;
};

export const MjmlPreview = ({ value }: Props) => {
  return (
    <Box>
      {value?.length ? (
        <Box
          dangerouslySetInnerHTML={{ __html: value }}
          style={{
            border: "1px solid var(--color-default-1)",
            borderRadius: "4px",
            padding: "16px",
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
