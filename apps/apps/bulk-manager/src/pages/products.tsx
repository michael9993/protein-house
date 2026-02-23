import { Box, Text, Button } from "@saleor/macaw-ui";
import { useState, useCallback, useMemo } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { ImportWizard, type ProgressInfo } from "@/modules/ui/import-wizard";
import { ExportDialog } from "@/modules/ui/export-dialog";
import { UpsertToggle } from "@/modules/ui/upsert-toggle";
import { ExcludeFieldsDropdown } from "@/modules/ui/exclude-fields-dropdown";
import { readFileContent } from "@/modules/ui/utils/read-file";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { trpcVanillaClient } from "@/modules/trpc/trpc-vanilla-client";
import { ChannelSelect, MultiChannelSelect } from "@/modules/ui/channel-select";
import { CategorySelect } from "@/modules/ui/category-select";
import { ProductTypeSelect } from "@/modules/ui/product-type-select";
import { WarehouseSelect } from "@/modules/ui/warehouse-select";
import { TaxClassSelect } from "@/modules/ui/tax-class-select";
import { downloadCSV } from "@/modules/export/csv-exporter";
import { downloadExcel } from "@/modules/export/excel-exporter";
import { getTargetFields } from "@/modules/import/field-mapper";
import { generateTemplateCSV, generateTemplateExcel } from "@/modules/ui/utils/generate-template";
import { BulkDeleteTab } from "@/modules/ui/bulk-delete-tab";

type Tab = "import" | "export" | "delete" | "template";

const ALL_TARGET_FIELDS = getTargetFields("products");

export default function ProductsPage() {
  const [tab, setTab] = useState<Tab>("import");
  const [channelSlugs, setChannelSlugs] = useState<string[]>([]);
  const [exportChannelSlug, setExportChannelSlug] = useState("");
  const [productTypeId, setProductTypeId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [taxClassId, setTaxClassId] = useState("");
  const [upsertMode, setUpsertMode] = useState(false);
  const [excludedFields, setExcludedFields] = useState<Set<string>>(new Set());
  const [autoCreateAttributes, setAutoCreateAttributes] = useState(true);
  const [autoCreatePages, setAutoCreatePages] = useState(true);
  const [autoCreateProductTypes, setAutoCreateProductTypes] = useState(true);
  const [autoCreateCategories, setAutoCreateCategories] = useState(true);
  const [autoCreateCollections, setAutoCreateCollections] = useState(true);
  const [attributeDefaults, setAttributeDefaults] = useState<Record<string, string>>({});
  const [discoveredAttrColumns, setDiscoveredAttrColumns] = useState<string[]>([]);
  const [isDropship, setIsDropship] = useState(false);
  const [dropshipSupplier, setDropshipSupplier] = useState("cj");

  // Export filter state
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("");

  const excludeColumns = useMemo(
    () => Array.from(excludedFields).join(", "),
    [excludedFields]
  );

  const toggleExcludeField = (field: string) => {
    setExcludedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const parseFile = trpcClient.import.parseFile.useMutation();
  const autoMapFields = trpcClient.import.autoMapFields.useMutation();
  const validateRows = trpcClient.import.validateRows.useMutation();
  const importProducts = trpcClient.products.import.useMutation();

  const handleFileSelected = useCallback(
    async (file: File) => {
      const content = await readFileContent(file);
      const fileType = file.name.endsWith(".csv") ? "csv" : "xlsx";
      const result = await parseFile.mutateAsync({
        fileContent: content,
        fileName: file.name,
        fileType: fileType as "csv" | "xlsx",
      });

      // Discover attr: and variantAttr: columns for the defaults UI
      const attrCols = result.headers.filter(
        (h: string) => h.startsWith("attr:") || h.startsWith("variantAttr:")
      );
      setDiscoveredAttrColumns(attrCols);

      return { rows: result.rows, headers: result.headers };
    },
    [parseFile]
  );

  const handleAutoMap = useCallback(
    async (headers: string[]) => {
      const result = await autoMapFields.mutateAsync({ headers, entityType: "products" });
      return result.mappings;
    },
    [autoMapFields]
  );

  const handleValidate = useCallback(
    async (rows: Record<string, string>[], mappings: Record<string, string>) => {
      return validateRows.mutateAsync({ rows, entityType: "products", fieldMappings: mappings });
    },
    [validateRows]
  );

  const handleExecute = useCallback(
    async (
      rows: Record<string, string>[],
      mappings: Record<string, string>,
      onProgress: (info: ProgressInfo) => void,
    ) => {
      const nameColumn = Object.entries(mappings).find(([, target]) => target === "name")?.[0];
      const productGroups: Record<string, string>[][] = [];
      let currentGroup: Record<string, string>[] = [];
      for (const row of rows) {
        const name = nameColumn ? row[nameColumn]?.trim() : "";
        if (name && currentGroup.length > 0) {
          productGroups.push(currentGroup);
          currentGroup = [row];
        } else {
          currentGroup.push(row);
        }
      }
      if (currentGroup.length > 0) productGroups.push(currentGroup);

      const totalProducts = productGroups.length;
      const BATCH_SIZE = 5;
      const batches: { rows: Record<string, string>[]; productCount: number; firstName: string }[] = [];
      let batchRows: Record<string, string>[] = [];
      let batchProductCount = 0;
      let batchFirstName = "";

      for (const group of productGroups) {
        if (batchProductCount === 0) batchFirstName = nameColumn ? group[0]?.[nameColumn] || "" : "";
        batchRows.push(...group);
        batchProductCount++;
        if (batchProductCount >= BATCH_SIZE) {
          batches.push({ rows: batchRows, productCount: batchProductCount, firstName: batchFirstName });
          batchRows = [];
          batchProductCount = 0;
          batchFirstName = "";
        }
      }
      if (batchRows.length > 0) batches.push({ rows: batchRows, productCount: batchProductCount, firstName: batchFirstName });

      const allResults: { row: number; success: boolean; error?: string }[] = [];
      let totalSuccessful = 0, totalFailed = 0, processedProducts = 0, rowOffset = 0;
      onProgress({ progress: 0, processed: 0, total: totalProducts });

      for (const batch of batches) {
        onProgress({
          progress: Math.round((processedProducts / totalProducts) * 100),
          processed: processedProducts,
          total: totalProducts,
          currentItem: batch.firstName || undefined,
        });

        const result = await importProducts.mutateAsync({
          rows: batch.rows,
          channelSlugs,
          fieldMappings: mappings,
          productTypeId: productTypeId || undefined,
          categoryId: categoryId || undefined,
          warehouseId: warehouseId || undefined,
          taxClassId: taxClassId || undefined,
          upsertMode,
          autoCreateAttributes,
          autoCreatePages,
          autoCreateProductTypes,
          autoCreateCategories,
          autoCreateCollections,
          attributeDefaults: Object.keys(attributeDefaults).length > 0 ? attributeDefaults : undefined,
          isDropship,
          dropshipSupplier: isDropship ? dropshipSupplier : undefined,
        });

        for (const r of result.results) allResults.push({ ...r, row: r.row + rowOffset });
        rowOffset += batch.rows.length;
        totalSuccessful += result.successful;
        totalFailed += result.failed;
        processedProducts += batch.productCount;
      }

      return { total: totalSuccessful + totalFailed, successful: totalSuccessful, failed: totalFailed, results: allResults };
    },
    [importProducts, channelSlugs, productTypeId, categoryId, warehouseId, taxClassId, upsertMode, autoCreateAttributes, autoCreatePages, autoCreateProductTypes, autoCreateCategories, autoCreateCollections, attributeDefaults, isDropship, dropshipSupplier]
  );

  const handleExport = useCallback(
    async (format: "csv" | "xlsx") => {
      const result = await trpcVanillaClient.products.export.query({
        channelSlug: exportChannelSlug,
        format,
        first: 100,
        search: searchFilter || undefined,
        categoryIds: categoryFilter ? [categoryFilter] : undefined,
        productTypeIds: productTypeFilter ? [productTypeFilter] : undefined,
      });
      if (format === "csv") downloadCSV(result.data, `products-export-${Date.now()}.csv`);
      else downloadExcel(result.data, `products-export-${Date.now()}.xlsx`);
    },
    [exportChannelSlug, searchFilter, categoryFilter, productTypeFilter]
  );

  return (
    <AppLayout>
      <Box>
        <Text variant="heading" size={6} __fontWeight="700" __display="block" marginBottom={2}>
          Products
        </Text>
        <Text size={3} __color="#64748b" __display="block" marginBottom={6}>
          Import, export, and manage products in bulk
        </Text>

        <Box display="flex" gap={1} marginBottom={6} __borderBottom="2px solid #e2e8f0">
          {(["import", "export", "template"] as Tab[]).map((t) => (
            <Box
              key={t}
              padding={3}
              paddingBottom={3}
              cursor="pointer"
              onClick={() => setTab(t)}
              __borderBottom={tab === t ? "2px solid #3b82f6" : "2px solid transparent"}
              __marginBottom="-2px"
            >
              <Text size={3} __fontWeight={tab === t ? "600" : "400"} __color={tab === t ? "#1e293b" : "#94a3b8"} __textTransform="capitalize">
                {t}
              </Text>
            </Box>
          ))}
        </Box>

        {tab === "import" && (
          <Box marginBottom={6}>
            <Text size={2} __color="#64748b" __display="block" marginBottom={3}>
              Default values (fallback when not specified in CSV columns)
            </Text>
            <Box display="flex" gap={4} alignItems="flex-start" __flexWrap="wrap">
              <MultiChannelSelect value={channelSlugs} onChange={setChannelSlugs} label="Publish to Channels" />
              <Box __minWidth="180px">
                <ProductTypeSelect value={productTypeId} onChange={setProductTypeId} />
                <Text size={1} __color="#94a3b8" __display="block" __marginTop="4px" __lineHeight="1.2">or use &quot;productType&quot; column</Text>
              </Box>
              <Box __minWidth="180px">
                <CategorySelect value={categoryId} onChange={setCategoryId} label="Default Category" />
                <Text size={1} __color="#94a3b8" __display="block" __marginTop="4px" __lineHeight="1.2">or use &quot;category&quot; column</Text>
              </Box>
              <Box __minWidth="180px">
                <WarehouseSelect value={warehouseId} onChange={setWarehouseId} label="Stock Warehouse" />
                <Text size={1} __color="#94a3b8" __display="block" __marginTop="4px" __lineHeight="1.2">or use &quot;warehouse&quot; column</Text>
              </Box>
              <Box __minWidth="180px">
                <TaxClassSelect value={taxClassId} onChange={setTaxClassId} label="Default Tax Class" />
                <Text size={1} __color="#94a3b8" __display="block" __marginTop="4px" __lineHeight="1.2">or use &quot;taxClass&quot; column</Text>
              </Box>
            </Box>
          </Box>
        )}

        {tab === "import" && (
          <Box display="flex" gap={4} marginBottom={4} alignItems="flex-start" __flexWrap="wrap">
            <UpsertToggle checked={upsertMode} onChange={setUpsertMode} entityLabel="products" matchDescription="match by externalReference or slug" />
            <ExcludeFieldsDropdown fields={ALL_TARGET_FIELDS} excludedFields={excludedFields} onToggle={toggleExcludeField} />
          </Box>
        )}

        {tab === "import" && (
          <Box marginBottom={4} padding={4} borderRadius={4} __backgroundColor="#f0f9ff" __border="1px solid #bae6fd">
            <Text size={3} __fontWeight="600" __display="block" marginBottom={3} __color="#0369a1">
              Dynamic Import Options
            </Text>
            <Box display="flex" gap={4} alignItems="center" __flexWrap="wrap" marginBottom={3}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={autoCreateProductTypes}
                  onChange={(e) => setAutoCreateProductTypes(e.target.checked)}
                />
                <Text size={2}>Auto-create missing product types</Text>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={autoCreateAttributes}
                  onChange={(e) => setAutoCreateAttributes(e.target.checked)}
                />
                <Text size={2}>Auto-create missing attributes &amp; values</Text>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={autoCreateCategories}
                  onChange={(e) => setAutoCreateCategories(e.target.checked)}
                />
                <Text size={2}>Auto-create missing categories</Text>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={autoCreateCollections}
                  onChange={(e) => setAutoCreateCollections(e.target.checked)}
                />
                <Text size={2}>Auto-create missing collections</Text>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={autoCreatePages}
                  onChange={(e) => setAutoCreatePages(e.target.checked)}
                />
                <Text size={2}>Auto-create brand/reference pages</Text>
              </label>
            </Box>
            <Box
              display="flex"
              gap={4}
              alignItems="center"
              __flexWrap="wrap"
              marginBottom={3}
              padding={3}
              borderRadius={4}
              __backgroundColor={isDropship ? "#fef3c7" : "transparent"}
              __border={isDropship ? "1px solid #f59e0b" : "1px solid transparent"}
            >
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={isDropship}
                  onChange={(e) => setIsDropship(e.target.checked)}
                />
                <Text size={2} __fontWeight="600">Dropship product</Text>
              </label>
              {isDropship && (
                <Box display="flex" gap={2} alignItems="center">
                  <Text size={2} __color="#64748b">Supplier:</Text>
                  <input
                    type="text"
                    value={dropshipSupplier}
                    onChange={(e) => setDropshipSupplier(e.target.value)}
                    placeholder="cj"
                    style={{
                      width: "120px",
                      padding: "4px 8px",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  />
                  <Text size={1} __color="#92400e">
                    trackInventory=false, dummy stock=1000, supplier metadata auto-applied
                  </Text>
                </Box>
              )}
            </Box>
            {discoveredAttrColumns.length > 0 && (
              <Box>
                <Text size={2} __fontWeight="500" __display="block" marginBottom={2} __color="#64748b">
                  Attribute Defaults (used when CSV cell is empty)
                </Text>
                <Box display="flex" gap={3} __flexWrap="wrap">
                  {discoveredAttrColumns.map((col) => (
                    <Box key={col} __minWidth="180px">
                      <Text size={1} __fontWeight="500" __display="block" marginBottom={1} __color="#475569">
                        {col}
                      </Text>
                      <input
                        type="text"
                        value={attributeDefaults[col] || ""}
                        onChange={(e) =>
                          setAttributeDefaults((prev) => ({
                            ...prev,
                            [col]: e.target.value,
                          }))
                        }
                        placeholder="Leave empty to skip"
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "13px",
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {tab === "import" && (
          <ImportWizard
            entityType="products"
            entityLabel="Products"
            onFileSelected={handleFileSelected}
            onAutoMap={handleAutoMap}
            onValidate={handleValidate}
            onExecute={handleExecute}
            targetFields={ALL_TARGET_FIELDS}
            excludeColumns={excludeColumns}
          />
        )}

        {tab === "export" && (
          <Box>
            <Box
              display="flex"
              gap={4}
              marginBottom={6}
              padding={4}
              borderRadius={4}
              __backgroundColor="#f8fafc"
              __border="1px solid #e2e8f0"
              __flexWrap="wrap"
            >
              <ChannelSelect value={exportChannelSlug} onChange={setExportChannelSlug} />
              <Box __flex="1" __minWidth="200px">
                <Text size={2} __fontWeight="500" __display="block" marginBottom={1}>
                  Search
                </Text>
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search by name..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </Box>
              <Box __minWidth="180px">
                <CategorySelect value={categoryFilter} onChange={setCategoryFilter} label="Filter by Category" />
              </Box>
              <Box __minWidth="180px">
                <ProductTypeSelect value={productTypeFilter} onChange={setProductTypeFilter} label="Filter by Type" />
              </Box>
            </Box>
            <ExportDialog entityLabel="Products" onExport={handleExport} />
          </Box>
        )}

        {tab === "delete" && (
          <BulkDeleteTab
            entityLabel="Products"
            onDelete={(ids) => trpcVanillaClient.products.bulkDelete.mutate({ ids })}
          />
        )}

        {tab === "template" && (
          <Box padding={6} borderRadius={4} __border="1px solid #e2e8f0">
            <Text variant="heading" size={4} __display="block" marginBottom={4}>Download Import Template</Text>
            <Text size={2} __color="#64748b" __display="block" marginBottom={4}>
              Download a pre-formatted import template (CSV or Excel) with {ALL_TARGET_FIELDS.length} columns — includes field descriptions and sample data.
              Supports variants, pricing, stock, SEO, images, attributes, collections, and metadata.
            </Text>
            <Box display="flex" gap={3}>
              <Button variant="secondary" onClick={() => generateTemplateCSV("products", "Products")}>Download CSV Template</Button>
              <Button variant="secondary" onClick={() => generateTemplateExcel("products", "Products")}>Download Excel Template</Button>
            </Box>
          </Box>
        )}
      </Box>
    </AppLayout>
  );
}
