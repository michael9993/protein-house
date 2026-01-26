import { Box, Button, Text } from "@saleor/macaw-ui";
import { useState, useEffect } from "react";

export interface Product {
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  url: string;
}

interface ProductEditorProps {
  products: Product[];
  onChange: (products: Product[]) => void;
  productsTitle?: string;
  productsSubtitle?: string;
  onTitleChange?: (title: string) => void;
  onSubtitleChange?: (subtitle: string) => void;
}

const defaultProduct: Product = {
  name: "New Product",
  price: "₪99",
  originalPrice: "",
  image: "https://placehold.co/280x280/1F2937/ffffff?text=Product",
  url: "https://example.com/product",
};

export function ProductEditor({
  products,
  onChange,
  productsTitle = "Top Picks",
  productsSubtitle = "Hand-picked deals we think you'll love.",
  onTitleChange,
  onSubtitleChange,
}: ProductEditorProps) {
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [localTitle, setLocalTitle] = useState(productsTitle);
  const [localSubtitle, setLocalSubtitle] = useState(productsSubtitle);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  useEffect(() => {
    setLocalTitle(productsTitle);
  }, [productsTitle]);

  useEffect(() => {
    setLocalSubtitle(productsSubtitle);
  }, [productsSubtitle]);

  const handleProductChange = (index: number, field: keyof Product, value: string) => {
    const updated = [...localProducts];
    updated[index] = { ...updated[index], [field]: value };
    setLocalProducts(updated);
    onChange(updated);
  };

  const handleAddProduct = () => {
    const updated = [...localProducts, { ...defaultProduct }];
    setLocalProducts(updated);
    onChange(updated);
  };

  const handleRemoveProduct = (index: number) => {
    const updated = localProducts.filter((_, i) => i !== index);
    setLocalProducts(updated);
    onChange(updated);
  };

  const handleMoveProduct = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === localProducts.length - 1)
    ) {
      return;
    }

    const updated = [...localProducts];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setLocalProducts(updated);
    onChange(updated);
  };

  const handleTitleChange = (value: string) => {
    setLocalTitle(value);
    onTitleChange?.(value);
  };

  const handleSubtitleChange = (value: string) => {
    setLocalSubtitle(value);
    onSubtitleChange?.(value);
  };

  return (
    <Box
      padding={4}
      backgroundColor="default1"
      borderRadius={2}
      borderWidth={1}
      borderStyle="solid"
      borderColor="default1"
    >
      <Text size={5} fontWeight="bold" marginBottom={3}>
        Products Section
      </Text>

      {/* Section Title & Subtitle */}
      <Box marginBottom={4}>
        <Box marginBottom={2}>
          <Text size={2} color="default2" marginBottom={1}>
            Section Title
          </Text>
          <Box
            as="input"
            type="text"
            value={localTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleTitleChange(e.target.value)
            }
            padding={2}
            borderRadius={2}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
            backgroundColor="default1"
            width="100%"
            style={{ fontSize: "14px" }}
          />
        </Box>
        <Box>
          <Text size={2} color="default2" marginBottom={1}>
            Section Subtitle
          </Text>
          <Box
            as="input"
            type="text"
            value={localSubtitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleSubtitleChange(e.target.value)
            }
            padding={2}
            borderRadius={2}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
            backgroundColor="default1"
            width="100%"
            style={{ fontSize: "14px" }}
          />
        </Box>
      </Box>

      {/* Products List */}
      <Box display="flex" flexDirection="column" gap={3}>
        {localProducts.map((product, index) => (
          <Box
            key={index}
            padding={3}
            backgroundColor="default2"
            borderRadius={2}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={2}>
              <Text size={3} fontWeight="bold">
                Product {index + 1}
              </Text>
              <Box display="flex" gap={1}>
                <Button
                  variant="tertiary"
                  size="small"
                  onClick={() => handleMoveProduct(index, "up")}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  variant="tertiary"
                  size="small"
                  onClick={() => handleMoveProduct(index, "down")}
                  disabled={index === localProducts.length - 1}
                >
                  ↓
                </Button>
                <Button
                  variant="tertiary"
                  size="small"
                  onClick={() => handleRemoveProduct(index)}
                >
                  ✕
                </Button>
              </Box>
            </Box>

            <Box display="grid" gridTemplateColumns={2} gap={2}>
              <Box>
                <Text size={2} color="default2">
                  Name
                </Text>
                <Box
                  as="input"
                  type="text"
                  value={product.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleProductChange(index, "name", e.target.value)
                  }
                  padding={2}
                  borderRadius={2}
                  borderWidth={1}
                  borderStyle="solid"
                  borderColor="default1"
                  backgroundColor="default1"
                  width="100%"
                  style={{ fontSize: "14px" }}
                />
              </Box>
              <Box>
                <Text size={2} color="default2">
                  URL
                </Text>
                <Box
                  as="input"
                  type="text"
                  value={product.url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleProductChange(index, "url", e.target.value)
                  }
                  padding={2}
                  borderRadius={2}
                  borderWidth={1}
                  borderStyle="solid"
                  borderColor="default1"
                  backgroundColor="default1"
                  width="100%"
                  style={{ fontSize: "14px" }}
                />
              </Box>
              <Box>
                <Text size={2} color="default2">
                  Price
                </Text>
                <Box
                  as="input"
                  type="text"
                  value={product.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleProductChange(index, "price", e.target.value)
                  }
                  padding={2}
                  borderRadius={2}
                  borderWidth={1}
                  borderStyle="solid"
                  borderColor="default1"
                  backgroundColor="default1"
                  width="100%"
                  style={{ fontSize: "14px" }}
                />
              </Box>
              <Box>
                <Text size={2} color="default2">
                  Original Price (optional)
                </Text>
                <Box
                  as="input"
                  type="text"
                  value={product.originalPrice || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleProductChange(index, "originalPrice", e.target.value)
                  }
                  padding={2}
                  borderRadius={2}
                  borderWidth={1}
                  borderStyle="solid"
                  borderColor="default1"
                  backgroundColor="default1"
                  width="100%"
                  style={{ fontSize: "14px" }}
                  placeholder="Leave empty for no sale price"
                />
              </Box>
              <Box style={{ gridColumn: "span 2" }}>
                <Text size={2} color="default2">
                  Image URL
                </Text>
                <Box
                  as="input"
                  type="text"
                  value={product.image}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleProductChange(index, "image", e.target.value)
                  }
                  padding={2}
                  borderRadius={2}
                  borderWidth={1}
                  borderStyle="solid"
                  borderColor="default1"
                  backgroundColor="default1"
                  width="100%"
                  style={{ fontSize: "14px" }}
                />
              </Box>
            </Box>

            {/* Image Preview */}
            {product.image && (
              <Box marginTop={2}>
                <Text size={2} color="default2" marginBottom={1}>
                  Preview
                </Text>
                <Box
                  as="img"
                  src={product.image}
                  alt={product.name}
                  style={{
                    maxWidth: "100px",
                    maxHeight: "100px",
                    borderRadius: "8px",
                    objectFit: "cover",
                  }}
                />
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {/* Add Product Button */}
      <Box marginTop={3}>
        <Button variant="secondary" onClick={handleAddProduct}>
          + Add Product
        </Button>
      </Box>

      <Text size={2} color="default2" marginTop={2}>
        Products will be displayed in the email using the {"{{#each products}}"} Handlebars loop.
        Each product has: name, price, originalPrice (optional), image, and url.
      </Text>
    </Box>
  );
}
