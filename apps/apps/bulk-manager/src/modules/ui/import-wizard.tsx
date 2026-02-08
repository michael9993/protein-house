import { Box, Text, Button } from "@saleor/macaw-ui";
import { useState, useCallback } from "react";

import { FileUpload } from "./file-upload";
import { DataPreview } from "./data-preview";
import { FieldMappingEditor } from "./field-mapping-editor";
import { ProgressBar } from "./progress-bar";
import { ErrorReport } from "./error-report";
import type { FieldMapping } from "../import/field-mapper";
import type { ValidationSummary, RowValidationResult } from "../import/validator";

export type WizardStep = "upload" | "map" | "validate" | "execute" | "complete";

export interface ProgressInfo {
  /** 0–100 percentage */
  progress: number;
  /** Items processed so far */
  processed: number;
  /** Total items to process */
  total: number;
  /** Name/label of the item currently being processed */
  currentItem?: string;
}

interface ImportWizardProps {
  entityType: string;
  entityLabel: string;
  onFileSelected: (file: File) => Promise<{
    rows: Record<string, string>[];
    headers: string[];
  }>;
  onAutoMap: (headers: string[]) => Promise<FieldMapping[]>;
  onValidate: (
    rows: Record<string, string>[],
    mappings: Record<string, string>
  ) => Promise<ValidationSummary>;
  onExecute: (
    rows: Record<string, string>[],
    mappings: Record<string, string>,
    onProgress: (info: ProgressInfo) => void
  ) => Promise<{
    total: number;
    successful: number;
    failed: number;
    results: { row: number; success: boolean; error?: string }[];
  }>;
  targetFields: string[];
  /** Comma-separated column names to exclude from import (case-insensitive) */
  excludeColumns?: string;
}

export function ImportWizard({
  entityType,
  entityLabel,
  onFileSelected,
  onAutoMap,
  onValidate,
  onExecute,
  targetFields,
  excludeColumns,
}: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationSummary | null>(null);
  const [executeResults, setExecuteResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    results: { row: number; success: boolean; error?: string }[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progressInfo, setProgressInfo] = useState<ProgressInfo>({
    progress: 0, processed: 0, total: 0,
  });

  const handleFileSelected = useCallback(
    async (file: File) => {
      setIsLoading(true);
      try {
        const result = await onFileSelected(file);
        setRows(result.rows);
        setHeaders(result.headers);

        let mappings = await onAutoMap(result.headers);

        // Apply exclude columns — set excluded columns' target to empty
        if (excludeColumns) {
          const excluded = new Set(
            excludeColumns.split(",").map((c) => c.trim().toLowerCase()).filter(Boolean)
          );
          mappings = mappings.map((m) =>
            excluded.has(m.sourceField.toLowerCase())
              ? { ...m, targetField: "", confidence: 0 }
              : m
          );
        }

        setFieldMappings(mappings);
        setStep("map");
      } catch (error) {
        console.error("File parse error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [onFileSelected, onAutoMap]
  );

  const handleValidate = useCallback(async () => {
    setIsLoading(true);
    try {
      const mappingRecord: Record<string, string> = {};
      fieldMappings.forEach((m) => {
        if (m.targetField) {
          mappingRecord[m.sourceField] = m.targetField;
        }
      });

      const results = await onValidate(rows, mappingRecord);
      setValidationResults(results);
      setStep("validate");
    } catch (error) {
      console.error("Validation error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [rows, fieldMappings, onValidate]);

  const handleExecute = useCallback(async () => {
    setIsLoading(true);
    setStep("execute");
    setProgressInfo({ progress: 0, processed: 0, total: 0 });
    try {
      const mappingRecord: Record<string, string> = {};
      fieldMappings.forEach((m) => {
        if (m.targetField) {
          mappingRecord[m.sourceField] = m.targetField;
        }
      });

      const results = await onExecute(rows, mappingRecord, (info) => {
        setProgressInfo(info);
      });
      setExecuteResults(results);
      setProgressInfo({ progress: 100, processed: results.total, total: results.total });
      setStep("complete");
    } catch (error) {
      console.error("Execute error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [rows, fieldMappings, onExecute]);

  const handleReset = useCallback(() => {
    setStep("upload");
    setRows([]);
    setHeaders([]);
    setFieldMappings([]);
    setValidationResults(null);
    setExecuteResults(null);
    setProgressInfo({ progress: 0, processed: 0, total: 0 });
  }, []);

  const steps: { key: WizardStep; label: string; number: number }[] = [
    { key: "upload", label: "Upload", number: 1 },
    { key: "map", label: "Map Fields", number: 2 },
    { key: "validate", label: "Validate", number: 3 },
    { key: "execute", label: "Import", number: 4 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <Box>
      {/* Step indicators */}
      <Box display="flex" gap={4} marginBottom={8} alignItems="center">
        {steps.map((s, idx) => (
          <Box key={s.key} display="flex" alignItems="center" gap={2}>
            <Box
              __width="32px"
              __height="32px"
              borderRadius={4}
              display="flex"
              alignItems="center"
              justifyContent="center"
              __backgroundColor={
                idx < currentStepIndex || step === "complete"
                  ? "#22c55e"
                  : idx === currentStepIndex
                    ? "#3b82f6"
                    : "#e5e7eb"
              }
              __color={idx <= currentStepIndex || step === "complete" ? "white" : "#9ca3af"}
              __fontSize="14px"
              __fontWeight="600"
            >
              {idx < currentStepIndex || step === "complete" ? "OK" : s.number}
            </Box>
            <Text
              size={2}
              __fontWeight={idx === currentStepIndex ? "600" : "400"}
              __color={idx === currentStepIndex ? "#1e293b" : "#94a3b8"}
            >
              {s.label}
            </Text>
            {idx < steps.length - 1 && (
              <Box
                __width="40px"
                __height="2px"
                __backgroundColor={idx < currentStepIndex ? "#22c55e" : "#e5e7eb"}
              />
            )}
          </Box>
        ))}
      </Box>

      {/* Step content */}
      {step === "upload" && (
        <Box>
          <Text variant="heading" size={4} __display="block" marginBottom={4}>
            Upload {entityLabel} File
          </Text>
          <FileUpload onFileSelected={handleFileSelected} />
        </Box>
      )}

      {step === "map" && (
        <Box>
          <Text variant="heading" size={4} __display="block" marginBottom={4}>
            Map Columns to {entityLabel} Fields
          </Text>
          <Text size={2} __color="#64748b" __display="block" marginBottom={4}>
            We auto-detected some mappings. Review and adjust as needed.
          </Text>
          <FieldMappingEditor
            mappings={fieldMappings}
            targetFields={targetFields}
            onChange={setFieldMappings}
          />
          <Box display="flex" gap={3} marginTop={6}>
            <Button onClick={() => setStep("upload")} variant="secondary">
              Back
            </Button>
            <Button onClick={handleValidate} disabled={isLoading}>
              {isLoading ? "Validating..." : "Validate Data"}
            </Button>
          </Box>
        </Box>
      )}

      {step === "validate" && validationResults && (
        <Box>
          <Text variant="heading" size={4} __display="block" marginBottom={4}>
            Validation Results
          </Text>
          <Box display="flex" gap={6} marginBottom={6}>
            <Box
              padding={4}
              borderRadius={4}
              __backgroundColor="rgba(34, 197, 94, 0.1)"
              __flex="1"
            >
              <Text size={6} __fontWeight="700" __color="#16a34a">
                {validationResults.validRows}
              </Text>
              <Text size={2} __color="#64748b" __display="block">
                Valid rows
              </Text>
            </Box>
            <Box
              padding={4}
              borderRadius={4}
              __backgroundColor="rgba(239, 68, 68, 0.1)"
              __flex="1"
            >
              <Text size={6} __fontWeight="700" __color="#dc2626">
                {validationResults.invalidRows}
              </Text>
              <Text size={2} __color="#64748b" __display="block">
                Invalid rows
              </Text>
            </Box>
            <Box
              padding={4}
              borderRadius={4}
              __backgroundColor="rgba(59, 130, 246, 0.1)"
              __flex="1"
            >
              <Text size={6} __fontWeight="700" __color="#3b82f6">
                {validationResults.totalRows}
              </Text>
              <Text size={2} __color="#64748b" __display="block">
                Total rows
              </Text>
            </Box>
          </Box>

          <DataPreview
            rows={rows}
            headers={headers}
            validationResults={validationResults.results}
          />

          {validationResults.invalidRows > 0 && (
            <Box marginTop={4}>
              <ErrorReport
                errors={validationResults.results.filter((r) => !r.valid)}
              />
            </Box>
          )}

          <Box display="flex" gap={3} marginTop={6}>
            <Button onClick={() => setStep("map")} variant="secondary">
              Back
            </Button>
            <Button
              onClick={handleExecute}
              disabled={isLoading || validationResults.validRows === 0}
            >
              {isLoading
                ? "Importing..."
                : `Import ${validationResults.validRows} Valid Rows`}
            </Button>
          </Box>
        </Box>
      )}

      {step === "execute" && (
        <Box>
          <Text variant="heading" size={4} __display="block" marginBottom={4}>
            Importing {entityLabel}...
          </Text>
          <ProgressBar
            progress={progressInfo.progress}
            total={progressInfo.total}
            processed={progressInfo.processed}
            currentItem={progressInfo.currentItem}
          />
        </Box>
      )}

      {step === "complete" && executeResults && (
        <Box>
          <Text variant="heading" size={4} __display="block" marginBottom={4}>
            Import Complete
          </Text>
          <Box display="flex" gap={6} marginBottom={6}>
            <Box
              padding={4}
              borderRadius={4}
              __backgroundColor="rgba(34, 197, 94, 0.1)"
              __flex="1"
            >
              <Text size={6} __fontWeight="700" __color="#16a34a">
                {executeResults.successful}
              </Text>
              <Text size={2} __color="#64748b" __display="block">
                Successfully imported
              </Text>
            </Box>
            <Box
              padding={4}
              borderRadius={4}
              __backgroundColor="rgba(239, 68, 68, 0.1)"
              __flex="1"
            >
              <Text size={6} __fontWeight="700" __color="#dc2626">
                {executeResults.failed}
              </Text>
              <Text size={2} __color="#64748b" __display="block">
                Failed
              </Text>
            </Box>
          </Box>

          {executeResults.failed > 0 && (
            <Box marginBottom={4}>
              <Text size={3} __fontWeight="600" __color="#dc2626" __display="block" marginBottom={2}>
                Failed Rows
              </Text>
              <ErrorReport
                errors={executeResults.results
                  .filter((r) => !r.success)
                  .map((r) => ({
                    row: r.row,
                    valid: false,
                    errors: [{ field: "", message: r.error || "Unknown error" }],
                    data: {},
                  }))}
              />
            </Box>
          )}

          {/* Show warnings for successful rows (e.g., image upload failures) */}
          {executeResults.results.some((r) => r.success && r.error) && (
            <Box marginBottom={4}>
              <Text size={3} __fontWeight="600" __color="#f59e0b" __display="block" marginBottom={2}>
                Warnings (imported with issues)
              </Text>
              <Box borderRadius={4} __border="1px solid #fde68a" __backgroundColor="#fffbeb" padding={3}>
                {executeResults.results
                  .filter((r) => r.success && r.error)
                  .map((r) => (
                    <Box key={r.row} __borderBottom="1px solid #fde68a" paddingBottom={2} marginBottom={2}>
                      <Text size={2} __fontWeight="500" __color="#92400e">
                        Row {r.row}:
                      </Text>{" "}
                      <Text size={2} __color="#78350f">
                        {r.error}
                      </Text>
                    </Box>
                  ))}
              </Box>
            </Box>
          )}

          <Box marginTop={6}>
            <Button onClick={handleReset}>Import More {entityLabel}</Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
