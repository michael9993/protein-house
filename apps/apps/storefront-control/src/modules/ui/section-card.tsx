import { Box, Text } from "@saleor/macaw-ui";
import { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <Box
      backgroundColor="default1"
      borderRadius={4}
      padding={6}
      marginBottom={4}
      boxShadow="defaultFocused"
    >
      <Text as="h3" variant="heading" marginBottom={2}>
        {title}
      </Text>
      {description && (
        <Text as="p" color="default2" marginBottom={4}>
          {description}
        </Text>
      )}
      {children}
    </Box>
  );
}
