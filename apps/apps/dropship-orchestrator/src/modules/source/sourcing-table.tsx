import { Fragment, useMemo } from "react";
import { Box, Text, Button } from "@/components/ui/primitives";

import type { SourcedProduct } from "./types";
import {
  tableStyle,
  thStyle,
  tdStyle,
  refCellStyle,
  smallInputStyle,
  TYPE_SUGGESTIONS,
  CATEGORY_SUGGESTIONS,
  GENDER_SUGGESTIONS,
} from "./types";

// ---------------------------------------------------------------------------
// Variant sub-table styles
// ---------------------------------------------------------------------------

const variantRowBg = "#fafafa";
const variantBorderLeft = "3px solid #2563eb";

const variantThStyle = {
  textAlign: "left" as const,
  padding: "4px 8px",
  fontSize: "10px",
  fontWeight: 600,
  color: "#9ca3af",
  whiteSpace: "nowrap" as const,
  borderBottom: "1px solid #e5e5e7",
};

const variantTdStyle = {
  padding: "4px 8px",
  fontSize: "12px",
  borderBottom: "1px solid #f0f0f2",
  verticalAlign: "middle" as const,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SourcingTableProps {
  products: SourcedProduct[];
  markup: number;
  shippingLoading: boolean;
  onUpdateProduct: (pid: string, field: keyof SourcedProduct, value: string) => void;
  onToggleVariants: (pid: string) => void;
  onDownloadCSV: () => void;
}

// Column count for the main table (for colSpan on variant expansion row)
const MAIN_COL_COUNT = 14;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SourcingTable({
  products,
  markup,
  shippingLoading,
  onUpdateProduct,
  onToggleVariants,
  onDownloadCSV,
}: SourcingTableProps) {
  const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0);
  const variantImageCount = products.reduce(
    (sum, p) => sum + p.variants.filter((v) => v.image).length,
    0,
  );

  // Collect unique attribute names across ALL expanded products for variant sub-table headers
  const expandedAttrNames = useMemo(() => {
    const names = new Set<string>();
    for (const p of products) {
      if (!p.showVariants) continue;
      for (const v of p.variants) {
        for (const key of Object.keys(v.attributes)) {
          names.add(key);
        }
      }
    }
    // Sort: Color first, Size second, rest alphabetical
    return Array.from(names).sort((a, b) => {
      if (a === "Color") return -1;
      if (b === "Color") return 1;
      if (a === "Size") return -1;
      if (b === "Size") return 1;
      return a.localeCompare(b);
    });
  }, [products]);

  if (products.length === 0) return null;

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Text variant="heading" size="medium">
          Preview ({products.length} products, {totalVariants} variants
          {variantImageCount > 0 ? `, ${variantImageCount} variant images` : ""})
        </Text>
        <Button variant="primary" onClick={onDownloadCSV}>
          Download CSV
        </Button>
      </Box>

      <Box
        borderRadius={4}
        borderWidth={1}
        borderStyle="solid"
        borderColor="default1"
      >
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Image</th>
                <th style={{ ...thStyle, minWidth: "200px" }}>Name</th>
                <th style={thStyle}>Variants</th>
                <th style={thStyle}>Cost</th>
                <th style={thStyle}>CJ Suggest</th>
                <th style={thStyle}>Shipping</th>
                <th style={thStyle}>Total</th>
                <th style={thStyle}>Retail</th>
                <th style={thStyle}>Weight</th>
                <th style={thStyle}>CJ Category</th>
                <th style={{ ...thStyle, minWidth: "130px" }}>Type</th>
                <th style={{ ...thStyle, minWidth: "150px" }}>Category</th>
                <th style={{ ...thStyle, minWidth: "120px" }}>Gender</th>
                <th style={{ ...thStyle, minWidth: "150px" }}>Collections</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const avgCost =
                  product.variants.length > 0
                    ? product.variants.reduce((s, v) => s + v.price, 0) / product.variants.length
                    : product.costPrice;
                const totalCost = avgCost + (product.shippingCost ?? 0);

                // Collect unique attribute names for this product's variants
                const productAttrNames = new Set<string>();
                for (const v of product.variants) {
                  for (const key of Object.keys(v.attributes)) {
                    productAttrNames.add(key);
                  }
                }
                const sortedProductAttrs = Array.from(productAttrNames).sort((a, b) => {
                  if (a === "Color") return -1;
                  if (b === "Color") return 1;
                  if (a === "Size") return -1;
                  if (b === "Size") return 1;
                  return a.localeCompare(b);
                });

                return (
                  <Fragment key={product.pid}>
                    {/* Product summary row */}
                    <tr style={{ verticalAlign: "top" }}>
                      <td style={tdStyle}>
                        {product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.editName}
                            style={{
                              width: "48px",
                              height: "48px",
                              objectFit: "cover",
                              borderRadius: "4px",
                              border: "1px solid #e5e5e7",
                            }}
                          />
                        ) : (
                          <Box
                            __width="48px"
                            backgroundColor="default1"
                            borderRadius={2}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text variant="caption" color="default2">No img</Text>
                          </Box>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <input
                          style={smallInputStyle}
                          value={product.editName}
                          onChange={(e) =>
                            onUpdateProduct(product.pid, "editName", e.target.value)
                          }
                        />
                        {product.supplierName && (
                          <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>
                            {product.supplierName}
                            {product.logisticsType !== "COMMON" && (
                              <span style={{ color: "#ef4444", marginLeft: "4px" }}>
                                [{product.logisticsType}]
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => onToggleVariants(product.pid)}
                          style={{
                            background: "none",
                            border: "1px solid #dcdcde",
                            borderRadius: "4px",
                            padding: "2px 8px",
                            fontSize: "12px",
                            cursor: "pointer",
                            color: "#2563eb",
                            fontWeight: product.showVariants ? 600 : 400,
                          }}
                          title="Click to expand variant details"
                        >
                          {product.variants.length} {product.showVariants ? "\u25B4" : "\u25BE"}
                        </button>
                      </td>
                      <td style={tdStyle}>
                        <Text>${avgCost.toFixed(2)}</Text>
                      </td>
                      <td style={refCellStyle}>
                        {product.suggestSellPrice > 0 ? (
                          <span title="CJ's recommended retail price">
                            ${product.suggestSellPrice.toFixed(2)}
                          </span>
                        ) : "-"}
                      </td>
                      <td style={tdStyle}>
                        {shippingLoading ? (
                          <Text variant="caption" color="default2">...</Text>
                        ) : product.shippingCost != null ? (
                          <span title={`${product.shippingCarrier}${product.shippingDays ? `, ${product.shippingDays}` : ""}`}>
                            <Text>${product.shippingCost.toFixed(2)}</Text>
                          </span>
                        ) : (
                          <Text variant="caption" color="default2">N/A</Text>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <Text variant="bodyStrong">${totalCost.toFixed(2)}</Text>
                      </td>
                      <td style={tdStyle}>
                        <Text variant="bodyStrong">
                          ${(avgCost * markup).toFixed(2)}
                        </Text>
                      </td>
                      <td style={refCellStyle}>
                        {product.weight > 0 ? `${product.weight}g` : "-"}
                      </td>
                      <td style={refCellStyle}>
                        {product.cjCategoryName || "-"}
                      </td>
                      <td style={tdStyle}>
                        <input
                          list="type-suggestions"
                          style={smallInputStyle}
                          value={product.editType}
                          onChange={(e) =>
                            onUpdateProduct(product.pid, "editType", e.target.value)
                          }
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          list="category-suggestions"
                          style={smallInputStyle}
                          value={product.editCategory}
                          onChange={(e) =>
                            onUpdateProduct(product.pid, "editCategory", e.target.value)
                          }
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          list="gender-suggestions"
                          style={smallInputStyle}
                          value={product.editGender}
                          onChange={(e) =>
                            onUpdateProduct(product.pid, "editGender", e.target.value)
                          }
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          style={smallInputStyle}
                          value={product.editCollections}
                          onChange={(e) =>
                            onUpdateProduct(product.pid, "editCollections", e.target.value)
                          }
                          placeholder="new-arrivals"
                        />
                      </td>
                    </tr>

                    {/* Expanded variant rows */}
                    {product.showVariants && (
                      <tr>
                        <td
                          colSpan={MAIN_COL_COUNT}
                          style={{
                            padding: 0,
                            borderBottom: "2px solid #e5e5e7",
                            backgroundColor: variantRowBg,
                          }}
                        >
                          <div
                            style={{
                              borderLeft: variantBorderLeft,
                              padding: "8px 12px 8px 16px",
                              maxHeight: "400px",
                              overflowY: "auto",
                            }}
                          >
                            <table style={{ ...tableStyle, fontSize: "12px" }}>
                              <thead>
                                <tr>
                                  <th style={variantThStyle}>Image</th>
                                  <th style={variantThStyle}>SKU</th>
                                  {sortedProductAttrs.map((name) => (
                                    <th key={name} style={variantThStyle}>{name}</th>
                                  ))}
                                  <th style={variantThStyle}>CJ Price</th>
                                  <th style={variantThStyle}>Weight</th>
                                  <th style={variantThStyle}>Shipping</th>
                                  <th style={variantThStyle}>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {product.variants.map((v) => {
                                  const variantTotal =
                                    v.price + (v.shippingCost ?? 0);
                                  return (
                                    <tr key={v.vid}>
                                      <td style={variantTdStyle}>
                                        {v.image ? (
                                          <img
                                            src={v.image}
                                            alt={v.name}
                                            style={{
                                              width: "30px",
                                              height: "30px",
                                              objectFit: "cover",
                                              borderRadius: "3px",
                                              border: "1px solid #e5e5e7",
                                            }}
                                          />
                                        ) : (
                                          <span style={{ color: "#d1d5db", fontSize: "10px" }}>--</span>
                                        )}
                                      </td>
                                      <td style={{ ...variantTdStyle, fontSize: "11px", fontFamily: "monospace", color: "#6b7280" }}>
                                        {v.sku || v.vid}
                                      </td>
                                      {sortedProductAttrs.map((name) => (
                                        <td key={name} style={{ ...variantTdStyle, fontWeight: 500 }}>
                                          {v.attributes[name] || "-"}
                                        </td>
                                      ))}
                                      <td style={variantTdStyle}>
                                        ${v.price.toFixed(2)}
                                      </td>
                                      <td style={{ ...variantTdStyle, color: "#9ca3af" }}>
                                        {v.weight > 0 ? `${v.weight}g` : "-"}
                                      </td>
                                      <td style={variantTdStyle}>
                                        {shippingLoading ? (
                                          <span style={{ color: "#9ca3af" }}>...</span>
                                        ) : v.shippingCost != null ? (
                                          <span
                                            style={{ color: "#dc2626", fontWeight: 500 }}
                                            title={`${v.shippingCarrier}${v.shippingDays ? `, ${v.shippingDays}` : ""}`}
                                          >
                                            ${v.shippingCost.toFixed(2)}
                                          </span>
                                        ) : (
                                          <span style={{ color: "#d1d5db" }}>--</span>
                                        )}
                                      </td>
                                      <td style={{ ...variantTdStyle, fontWeight: 600 }}>
                                        {v.shippingCost != null
                                          ? `$${variantTotal.toFixed(2)}`
                                          : `$${v.price.toFixed(2)}`}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Box>

      {/* Datalists for autocomplete */}
      <datalist id="type-suggestions">
        {TYPE_SUGGESTIONS.map((t) => <option key={t} value={t} />)}
      </datalist>
      <datalist id="category-suggestions">
        {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
      </datalist>
      <datalist id="gender-suggestions">
        {GENDER_SUGGESTIONS.map((g) => <option key={g} value={g} />)}
      </datalist>

      {/* Bottom Download */}
      <Box display="flex" justifyContent="flex-end" gap={3} alignItems="center">
        <Text color="default2" variant="caption">
          Markup: {markup}x | Margin: ~{((1 - 1 / markup) * 100).toFixed(0)}% |
          {" "}{totalVariants} CSV rows
        </Text>
        <Button variant="primary" onClick={onDownloadCSV}>
          Download CSV
        </Button>
      </Box>
    </Box>
  );
}
