import { Box, Text, Button } from "@saleor/macaw-ui";
import { useState, useCallback } from "react";

import { AppLayout, colors } from "@/modules/ui/app-layout";
import { ImportWizard, type ProgressInfo } from "@/modules/ui/import-wizard";
import { readFileContent } from "@/modules/ui/utils/read-file";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { trpcVanillaClient } from "@/modules/trpc/trpc-vanilla-client";
import { getTargetFields } from "@/modules/import/field-mapper";
import { generateTemplateCSV, generateTemplateExcel } from "@/modules/ui/utils/generate-template";

const ALL_TARGET_FIELDS = getTargetFields("translations");

const ENTITY_TYPES = [
  { value: "products", label: "Products" },
  { value: "categories", label: "Categories" },
  { value: "collections", label: "Collections" },
] as const;

const COMMON_LANGUAGES = [
  { value: "HE", label: "Hebrew (HE)" },
  { value: "AR", label: "Arabic (AR)" },
  { value: "EN", label: "English (EN)" },
  { value: "FR", label: "French (FR)" },
  { value: "DE", label: "German (DE)" },
  { value: "ES", label: "Spanish (ES)" },
  { value: "RU", label: "Russian (RU)" },
  { value: "ZH_CN", label: "Chinese Simplified (ZH_CN)" },
  { value: "JA", label: "Japanese (JA)" },
  { value: "PT", label: "Portuguese (PT)" },
] as const;

type Tab = "import" | "template";

export default function TranslationsPage() {
  const [tab, setTab] = useState<Tab>("import");
  const [entityType, setEntityType] = useState<"products" | "categories" | "collections">("products");
  const [languageCode, setLanguageCode] = useState("HE");
  const [customLanguageCode, setCustomLanguageCode] = useState("");

  const effectiveLanguageCode = customLanguageCode.trim().toUpperCase() || languageCode;

  const parseFile = trpcClient.import.parseFile.useMutation();
  const autoMapFields = trpcClient.import.autoMapFields.useMutation();
  const validateRows = trpcClient.import.validateRows.useMutation();

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
      const result = await autoMapFields.mutateAsync({ headers, entityType: "translations" });
      return result.mappings;
    },
    [autoMapFields]
  );

  const handleValidate = useCallback(
    async (rows: Record<string, string>[], mappings: Record<string, string>) => {
      return validateRows.mutateAsync({ rows, entityType: "translations", fieldMappings: mappings });
    },
    [validateRows]
  );

  const handleExecute = useCallback(
    async (
      rows: Record<string, string>[],
      mappings: Record<string, string>,
      onProgress: (info: ProgressInfo) => void,
    ) => {
      const BATCH_SIZE = 50;
      const allResults: { row: number; success: boolean; error?: string }[] = [];
      let totalSuccessful = 0, totalFailed = 0, rowOffset = 0;

      onProgress({ progress: 0, processed: 0, total: rows.length });

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        onProgress({
          progress: Math.round((rowOffset / rows.length) * 100),
          processed: rowOffset,
          total: rows.length,
          currentItem: `Translating ${entityType} to ${effectiveLanguageCode} (batch ${Math.floor(i / BATCH_SIZE) + 1})`,
        });

        const result = await trpcVanillaClient.translations.import.mutate({
          rows: batch,
          entityType,
          languageCode: effectiveLanguageCode,
          fieldMappings: mappings,
        });
        for (const r of result.results) allResults.push({ ...r, row: r.row + rowOffset });
        rowOffset += batch.length;
        totalSuccessful += result.successful;
        totalFailed += result.failed;
      }

      return { total: totalSuccessful + totalFailed, successful: totalSuccessful, failed: totalFailed, results: allResults };
    },
    [entityType, effectiveLanguageCode]
  );

  return (
    <AppLayout>
      <Box>
        <Text variant="heading" size={6} __fontWeight="700" __display="block" marginBottom={2}>
          Translations
        </Text>
        <Text size={3} __color={colors.textMuted} __display="block" marginBottom={6}>
          Import translations for products, categories, and collections
        </Text>

        {/* Entity Type & Language Selector */}
        <Box display="flex" gap={4} marginBottom={6} __flexWrap="wrap" alignItems="flex-end">
          <Box __minWidth="200px">
            <Text size={2} __fontWeight="600" __display="block" marginBottom={1}>Entity Type</Text>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as typeof entityType)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: `1px solid ${colors.border}`,
                fontSize: "14px",
                width: "100%",
                backgroundColor: "#fff",
              }}
            >
              {ENTITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Box>

          <Box __minWidth="200px">
            <Text size={2} __fontWeight="600" __display="block" marginBottom={1}>Target Language</Text>
            <select
              value={languageCode}
              onChange={(e) => {
                setLanguageCode(e.target.value);
                setCustomLanguageCode("");
              }}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: `1px solid ${colors.border}`,
                fontSize: "14px",
                width: "100%",
                backgroundColor: "#fff",
              }}
            >
              {COMMON_LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
              <option value="CUSTOM">Other (enter code)...</option>
            </select>
          </Box>

          {languageCode === "CUSTOM" && (
            <Box __minWidth="160px">
              <Text size={2} __fontWeight="600" __display="block" marginBottom={1}>Language Code</Text>
              <input
                type="text"
                value={customLanguageCode}
                onChange={(e) => setCustomLanguageCode(e.target.value)}
                placeholder="e.g. IT, KO, TR"
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: `1px solid ${colors.border}`,
                  fontSize: "14px",
                  width: "100%",
                }}
              />
            </Box>
          )}
        </Box>

        {/* Info box */}
        <Box
          padding={4}
          marginBottom={6}
          borderRadius={4}
          __backgroundColor={colors.infoBg}
          __border={`1px solid ${colors.infoBorder}`}
        >
          <Text size={2} __color={colors.infoText}>
            {`Upload a CSV/Excel file with a slug (or sku) column to match existing ${entityType}, plus translated columns: name, description, seoTitle, seoDescription.`}
            {entityType === "products" && " You can also include variantName with a sku to translate variant names."}
          </Text>
        </Box>

        {/* Tabs */}
        <Box display="flex" gap={1} marginBottom={6} __borderBottom={`2px solid ${colors.border}`}>
          {(["import", "template"] as Tab[]).map((t) => (
            <Box
              key={t}
              padding={3}
              cursor="pointer"
              onClick={() => setTab(t)}
              __borderBottom={tab === t ? `2px solid ${colors.brand}` : "2px solid transparent"}
              __marginBottom="-2px"
            >
              <Text
                size={3}
                __fontWeight={tab === t ? "600" : "400"}
                __color={tab === t ? colors.text : colors.textLight}
              >
                {t === "import" ? "Import Translations" : "Template"}
              </Text>
            </Box>
          ))}
        </Box>

        {tab === "import" && (
          <ImportWizard
            entityType="translations"
            entityLabel="Translations"
            onFileSelected={handleFileSelected}
            onAutoMap={handleAutoMap}
            onValidate={handleValidate}
            onExecute={handleExecute}
            targetFields={ALL_TARGET_FIELDS}
          />
        )}

        {tab === "template" && (
          <Box padding={6} borderRadius={4} __border={`1px solid ${colors.border}`}>
            <Text variant="heading" size={4} __display="block" marginBottom={4}>
              Download Translation Template
            </Text>
            <Text size={2} __color={colors.textMuted} __display="block" marginBottom={4}>
              Download a pre-formatted template with {ALL_TARGET_FIELDS.length} columns — fill in the slug column with existing entity slugs and add your translated text.
            </Text>
            <Box display="flex" gap={3}>
              <Button variant="secondary" onClick={() => generateTemplateCSV("translations", "Translations")}>Download CSV Template</Button>
              <Button variant="secondary" onClick={() => generateTemplateExcel("translations", "Translations")}>Download Excel Template</Button>
            </Box>
          </Box>
        )}
      </Box>
    </AppLayout>
  );
}
