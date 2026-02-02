import { Box, Button, Text } from "@saleor/macaw-ui";
import { useState } from "react";

interface Variable {
  name: string;
  description: string;
  example: string;
  category: "user" | "system" | "branding" | "products";
}

const AVAILABLE_VARIABLES: Variable[] = [
  // User-specific variables
  {
    name: "{{firstName}}",
    description: "Subscriber's first name",
    example: "John",
    category: "user",
  },
  {
    name: "{{lastName}}",
    description: "Subscriber's last name",
    example: "Doe",
    category: "user",
  },
  {
    name: "{{email}}",
    description: "Subscriber's email address",
    example: "john.doe@example.com",
    category: "user",
  },
  // System variables
  {
    name: "{{subject}}",
    description: "Email subject line",
    example: "Weekend Sale - 50% Off!",
    category: "system",
  },
  {
    name: "{{unsubscribeUrl}}",
    description: "Unique unsubscribe URL for this subscriber",
    example: "https://example.com/unsubscribe/token",
    category: "system",
  },
  // Branding variables
  {
    name: "{{companyName}}",
    description: "Company name from storefront-control",
    example: "My Store",
    category: "branding",
  },
  {
    name: "{{companyLogo}}",
    description: "Company logo URL from storefront-control",
    example: "https://example.com/logo.png",
    category: "branding",
  },
  {
    name: "{{companyEmail}}",
    description: "Company email from storefront-control",
    example: "support@mystore.com",
    category: "branding",
  },
  {
    name: "{{companyWebsite}}",
    description: "Company website from storefront-control",
    example: "https://mystore.com",
    category: "branding",
  },
  {
    name: "{{companyAddress}}",
    description: "Company address from storefront-control",
    example: "Nazareth, IL",
    category: "branding",
  },
  {
    name: "{{primaryColor}}",
    description: "Primary brand color from storefront-control",
    example: "#2563EB",
    category: "branding",
  },
  {
    name: "{{secondaryColor}}",
    description: "Secondary brand color from storefront-control",
    example: "#1F2937",
    category: "branding",
  },
  // Products section variables
  {
    name: "{{productsTitle}}",
    description: "Title for the products section",
    example: "Top Picks",
    category: "products",
  },
  {
    name: "{{productsSubtitle}}",
    description: "Subtitle for the products section",
    example: "Hand-picked deals we think you'll love.",
    category: "products",
  },
  {
    name: "{{#each products}}",
    description: "Loop through products array (start)",
    example: "{{#each products}}...{{/each}}",
    category: "products",
  },
  {
    name: "{{this.name}}",
    description: "Product name (inside loop)",
    example: "Nike Air Max",
    category: "products",
  },
  {
    name: "{{this.price}}",
    description: "Product price (inside loop)",
    example: "₪199",
    category: "products",
  },
  {
    name: "{{this.originalPrice}}",
    description: "Product original price for sales (inside loop)",
    example: "₪299",
    category: "products",
  },
  {
    name: "{{this.image}}",
    description: "Product image URL (inside loop)",
    example: "https://example.com/product.jpg",
    category: "products",
  },
  {
    name: "{{this.url}}",
    description: "Product page URL (inside loop)",
    example: "https://example.com/product-1",
    category: "products",
  },
  {
    name: "{{/each}}",
    description: "End of products loop",
    example: "{{#each products}}...{{/each}}",
    category: "products",
  },
];

interface VariablePickerProps {
  onInsert: (variable: string) => void;
  copiedVariable?: string | null;
}

export const VariablePicker = ({ onInsert, copiedVariable }: VariablePickerProps) => {
  const [selectedCategory, setSelectedCategory] = useState<"user" | "system" | "branding" | "products" | "all">("all");

  const filteredVariables =
    selectedCategory === "all"
      ? AVAILABLE_VARIABLES
      : AVAILABLE_VARIABLES.filter((v) => v.category === selectedCategory);

  return (
    <Box>
      <Text as="h3" size={4} fontWeight="bold" marginBottom={3}>
        Available Variables
      </Text>
      
      <Text size={2} color="default2" marginBottom={3}>
        Click a variable to copy it to clipboard, then paste into the template.
      </Text>

      <Box display="flex" gap={2} marginBottom={4} flexWrap="wrap">
        <Button
          variant={selectedCategory === "all" ? "primary" : "secondary"}
          size="small"
          onClick={() => setSelectedCategory("all")}
        >
          All
        </Button>
        <Button
          variant={selectedCategory === "user" ? "primary" : "secondary"}
          size="small"
          onClick={() => setSelectedCategory("user")}
        >
          User
        </Button>
        <Button
          variant={selectedCategory === "system" ? "primary" : "secondary"}
          size="small"
          onClick={() => setSelectedCategory("system")}
        >
          System
        </Button>
        <Button
          variant={selectedCategory === "branding" ? "primary" : "secondary"}
          size="small"
          onClick={() => setSelectedCategory("branding")}
        >
          Branding
        </Button>
        <Button
          variant={selectedCategory === "products" ? "primary" : "secondary"}
          size="small"
          onClick={() => setSelectedCategory("products")}
        >
          Products
        </Button>
      </Box>

      <Box display="grid" gap={2}>
        {filteredVariables.map((variable) => {
          const isCopied = copiedVariable === variable.name;
          return (
            <Box
              key={variable.name}
              padding={3}
              borderWidth={1}
              borderStyle="solid"
              borderColor={isCopied ? "info1" : "default1"}
              borderRadius={2}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              backgroundColor={isCopied ? "info1" : undefined}
            >
              <Box>
                <Text fontWeight="bold" marginBottom={1}>
                  {variable.name}
                </Text>
                <Text size={2} color="default2" marginBottom={1}>
                  {variable.description}
                </Text>
                <Text size={1} color="default2">
                  Example: {variable.example}
                </Text>
              </Box>
              <Button 
                variant={isCopied ? "primary" : "secondary"} 
                size="small" 
                onClick={() => onInsert(variable.name)}
              >
                {isCopied ? "✓ Copied" : "Copy"}
              </Button>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
