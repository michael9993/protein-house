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
import { downloadCSV } from "@/modules/export/csv-exporter";
import { downloadExcel } from "@/modules/export/excel-exporter";
import { getTargetFields } from "@/modules/import/field-mapper";
import { generateTemplateCSV, generateTemplateExcel } from "@/modules/ui/utils/generate-template";
import { BulkDeleteTab } from "@/modules/ui/bulk-delete-tab";

type Tab = "import" | "export" | "delete" | "template";

const ALL_TARGET_FIELDS = getTargetFields("collections");

export default function CollectionsPage() {
  const [tab, setTab] = useState<Tab>("import");
  const [channelSlugs, setChannelSlugs] = useState<string[]>([]);
  const [exportChannelSlug, setExportChannelSlug] = useState("");
  const [upsertMode, setUpsertMode] = useState(false);
  const [excludedFields, setExcludedFields] = useState<Set<string>>(new Set());

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
  const importCollections = trpcClient.collections.import.useMutation();

  const handleFileSelected = useCallback(
    async (file: File) => {
      const content = await readFileContent(file);
      const fileType = file.name.endsWith(".csv") ? "csv" : "xlsx";
      const result = await parseFile.mutateAsync({
        fileContent: content,
        fileName: file.name,
        fileType: fileType as "csv" | "xlsx",
      });
      return { rows: result.rows, headers: result.headers };
    },
    [parseFile]
  );

  const handleAutoMap = useCallback(
    async (headers: string[]) => {
      const result = await autoMapFields.mutateAsync({ headers, entityType: "collections" });
      return result.mappings;
    },
    [autoMapFields]
  );

  const handleValidate = useCallback(
    async (rows: Record<string, string>[], mappings: Record<string, string>) => {
      return validateRows.mutateAsync({ rows, entityType: "collections", fieldMappings: mappings });
    },
    [validateRows]
  );

  const handleExecute = useCallback(
    async (
      rows: Record<string, string>[],
      mappings: Record<string, string>,
      onProgress: (info: ProgressInfo) => void,
    ) => {
      const BATCH_SIZE = 20;
      const nameCol = Object.entries(mappings).find(([, t]) => t === "name")?.[0];
      const allResults: { row: number; success: boolean; error?: string }[] = [];
      let totalSuccessful = 0, totalFailed = 0, rowOffset = 0;

      onProgress({ progress: 0, processed: 0, total: rows.length });

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const label = nameCol ? batch[0]?.[nameCol] : undefined;
        onProgress({
          progress: Math.round((rowOffset / rows.length) * 100),
          processed: rowOffset,
          total: rows.length,
          currentItem: label || `Batch ${Math.floor(i / BATCH_SIZE) + 1}`,
        });

        const result = await importCollections.mutateAsync({
          rows: batch,
          channelSlugs,
          fieldMappings: mappings,
          upsertMode,
        });
        for (const r of result.results) allResults.push({ ...r, row: r.row + rowOffset });
        rowOffset += batch.length;
        totalSuccessful += result.successful;
        totalFailed += result.failed;
      }

      return { total: totalSuccessful + totalFailed, successful: totalSuccessful, failed: totalFailed, results: allResults };
    },
    [importCollections, channelSlugs, upsertMode]
  );

  const handleExport = useCallback(
    async (format: "csv" | "xlsx") => {
      const result = await trpcVanillaClient.collections.export.query({ channelSlug: exportChannelSlug, format, first: 100 });
      if (format === "csv") downloadCSV(result.data, `collections-export-${Date.now()}.csv`);
      else downloadExcel(result.data, `collections-export-${Date.now()}.xlsx`);
    },
    [exportChannelSlug]
  );

  return (
    <AppLayout>
      <Box>
        <Text variant="heading" size={6} __fontWeight="700" __display="block" marginBottom={2}>
          Collections
        </Text>
        <Text size={3} __color="#64748b" __display="block" marginBottom={6}>
          Import and export collections in bulk
        </Text>

        <Box display="flex" gap={1} marginBottom={6} __borderBottom="2px solid #e2e8f0">
          {(["import", "export", "template"] as Tab[]).map((t) => (
            <Box
              key={t}
              padding={3}
              cursor="pointer"
              onClick={() => setTab(t)}
              __borderBottom={tab === t ? "2px solid #3b82f6" : "2px solid transparent"}
              __marginBottom="-2px"
            >
              <Text
                size={3}
                __fontWeight={tab === t ? "600" : "400"}
                __color={tab === t ? "#1e293b" : "#94a3b8"}
                __textTransform="capitalize"
              >
                {t}
              </Text>
            </Box>
          ))}
        </Box>

        {tab === "import" && (
          <Box marginBottom={4}>
            <Box marginBottom={4}>
              <MultiChannelSelect value={channelSlugs} onChange={setChannelSlugs} label="Publish to Channels" />
            </Box>
            <Box display="flex" gap={4} marginBottom={4} alignItems="flex-start" __flexWrap="wrap">
              <UpsertToggle checked={upsertMode} onChange={setUpsertMode} entityLabel="collections" matchDescription="match by slug or externalReference" />
              <ExcludeFieldsDropdown fields={ALL_TARGET_FIELDS} excludedFields={excludedFields} onToggle={toggleExcludeField} />
            </Box>
          </Box>
        )}

        {tab === "import" && (
          <ImportWizard
            entityType="collections"
            entityLabel="Collections"
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
            <Box marginBottom={4}>
              <ChannelSelect value={exportChannelSlug} onChange={setExportChannelSlug} maxWidth="300px" />
            </Box>
            <ExportDialog entityLabel="Collections" onExport={handleExport} />
          </Box>
        )}

        {tab === "delete" && (
          <BulkDeleteTab
            entityLabel="Collections"
            onDelete={(ids) => trpcVanillaClient.collections.bulkDelete.mutate({ ids })}
          />
        )}

        {tab === "template" && (
          <Box padding={6} borderRadius={4} __border="1px solid #e2e8f0">
            <Text variant="heading" size={4} __display="block" marginBottom={4}>Download Import Template</Text>
            <Text size={2} __color="#64748b" __display="block" marginBottom={4}>
              Download a pre-formatted import template (CSV or Excel) with {ALL_TARGET_FIELDS.length} columns — includes field descriptions and sample data.
              Supports product assignment by slug, channel publishing, background images, and metadata.
            </Text>
            <Box display="flex" gap={3}>
              <Button variant="secondary" onClick={() => generateTemplateCSV("collections", "Collections")}>Download CSV Template</Button>
              <Button variant="secondary" onClick={() => generateTemplateExcel("collections", "Collections")}>Download Excel Template</Button>
            </Box>
          </Box>
        )}
      </Box>
    </AppLayout>
  );
}
