import { useState, useRef, useCallback } from "react";
import { Box, Text, Button } from "@saleor/macaw-ui";

import { trpcClient } from "@/modules/trpc/trpc-client";
import { 
  type ConfigDiffEntry, 
  type ImportValidationError,
  groupDiffsBySection,
  formatDiffValue,
} from "@/modules/config/import-schema";

interface ConfigImportProps {
  channelSlug: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type ImportStep = "upload" | "preview" | "applying" | "success" | "error";

export function ConfigImport({ channelSlug, onSuccess, onCancel }: ConfigImportProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<unknown>(null);
  const [validationErrors, setValidationErrors] = useState<ImportValidationError[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [diff, setDiff] = useState<ConfigDiffEntry[]>([]);
  const [applyError, setApplyError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpcClient.useUtils();

  const validateMutation = trpcClient.config.validateImport.useMutation();
  const importMutation = trpcClient.config.importConfig.useMutation();

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setValidationErrors([]);
    setWarnings([]);
    setApplyError(null);

    try {
      const text = await selectedFile.text();
      let parsed: unknown;
      
      try {
        parsed = JSON.parse(text);
      } catch {
        setValidationErrors([{ path: "", message: "Invalid JSON format. Please check the file syntax." }]);
        return;
      }

      setImportData(parsed);

      // Validate on server
      const result = await validateMutation.mutateAsync({
        channelSlug,
        importData: parsed,
      });

      if (!result.validation.valid) {
        setValidationErrors(result.validation.errors);
        setWarnings(result.validation.warnings);
        return;
      }

      setWarnings(result.validation.warnings);
      setDiff(result.diff);
      setStep("preview");
    } catch (error) {
      setValidationErrors([{ 
        path: "", 
        message: error instanceof Error ? error.message : "Failed to validate file" 
      }]);
    }
  }, [channelSlug, validateMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/json") {
      handleFileSelect(droppedFile);
    } else {
      setValidationErrors([{ path: "", message: "Please drop a JSON file" }]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleApply = useCallback(async () => {
    if (!importData) return;

    setStep("applying");
    setApplyError(null);

    try {
      const result = await importMutation.mutateAsync({
        channelSlug,
        importData,
      });

      if (!result.success) {
        setApplyError(result.errors?.[0]?.message || "Failed to import configuration");
        setStep("error");
        return;
      }

      // Invalidate cache to refresh config
      await utils.config.getConfig.invalidate({ channelSlug });
      setStep("success");
      
      // Delay callback to show success message
      setTimeout(onSuccess, 1500);
    } catch (error) {
      setApplyError(error instanceof Error ? error.message : "Failed to import configuration");
      setStep("error");
    }
  }, [channelSlug, importData, importMutation, utils.config.getConfig, onSuccess]);

  const handleReset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setImportData(null);
    setValidationErrors([]);
    setWarnings([]);
    setDiff([]);
    setApplyError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Upload step
  if (step === "upload") {
    return (
      <Box>
        <Text as="h3" variant="heading" marginBottom={4}>
          Import Configuration
        </Text>
        
        <Text as="p" color="default2" marginBottom={4}>
          Upload a JSON configuration file to import settings for the <strong>{channelSlug}</strong> channel.
        </Text>

        {/* Drop zone */}
        <Box
          padding={8}
          borderRadius={4}
          borderStyle="solid"
          borderWidth={1}
          borderColor="default1"
          backgroundColor="default1"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          __minHeight="200px"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          cursor="pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Text variant="bodyStrong" marginBottom={2}>
            Drop JSON file here
          </Text>
          <Text variant="caption" color="default2" marginBottom={4}>
            or click to browse
          </Text>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileInputChange}
            style={{ display: "none" }}
          />
          {file && (
            <Text variant="caption" color="default2">
              Selected: {file.name}
            </Text>
          )}
        </Box>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <Box marginTop={4} padding={4} backgroundColor="critical1" borderRadius={4}>
            <Text variant="bodyStrong" color="critical1" marginBottom={2}>
              Validation Errors
            </Text>
            {validationErrors.map((error, i) => (
              <Box key={i} marginTop={1}>
                <Text variant="caption" color="critical1">
                  {error.path ? `${error.path}: ` : ""}{error.message}
                </Text>
              </Box>
            ))}
          </Box>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <Box marginTop={4} padding={4} backgroundColor="warning1" borderRadius={4}>
            <Text variant="bodyStrong" marginBottom={2}>
              Warnings
            </Text>
            {warnings.map((warning, i) => (
              <Text key={i} variant="caption" display="block">
                {warning}
              </Text>
            ))}
          </Box>
        )}

        <Box display="flex" justifyContent="flex-end" gap={2} marginTop={4}>
          <Button variant="tertiary" onClick={onCancel}>
            Cancel
          </Button>
        </Box>
      </Box>
    );
  }

  // Preview step
  if (step === "preview") {
    const groupedDiffs = groupDiffsBySection(diff);
    const sections = Object.keys(groupedDiffs);

    return (
      <Box>
        <Text as="h3" variant="heading" marginBottom={4}>
          Preview Changes
        </Text>
        
        <Text as="p" color="default2" marginBottom={4}>
          {diff.length === 0 
            ? "No changes detected. The imported config is identical to the current config."
            : `${diff.length} field(s) will be changed:`
          }
        </Text>

        {/* Warnings */}
        {warnings.length > 0 && (
          <Box marginBottom={4} padding={4} backgroundColor="warning1" borderRadius={4}>
            {warnings.map((warning, i) => (
              <Text key={i} variant="caption" display="block">
                {warning}
              </Text>
            ))}
          </Box>
        )}

        {/* Diff by section */}
        {sections.map((section) => (
          <Box key={section} marginBottom={4}>
            <Text variant="bodyStrong" marginBottom={2} __textTransform="capitalize">
              {section}
            </Text>
            <Box backgroundColor="default1" borderRadius={4} padding={3}>
              {groupedDiffs[section].map((entry, i) => (
                <Box 
                  key={i} 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="flex-start"
                  paddingY={2}
                  __borderBottomStyle={i < groupedDiffs[section].length - 1 ? "solid" : "none"}
                  borderWidth={1}
                  borderColor="default1"
                >
                  <Box __flex="1">
                    <Text variant="caption" color="default2">
                      {entry.path}
                    </Text>
                  </Box>
                  <Box __flex="1" __textAlign="right">
                    <Text variant="caption" color="critical1" style={{ textDecoration: "line-through" }}>
                      {formatDiffValue(entry.currentValue)}
                    </Text>
                    <Text variant="caption" color="success1" marginLeft={2}>
                      → {formatDiffValue(entry.newValue)}
                    </Text>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ))}

        {diff.length === 0 && (
          <Box padding={4} backgroundColor="default1" borderRadius={4}>
            <Text variant="caption" color="default2">
              The configuration is already up to date.
            </Text>
          </Box>
        )}

        <Box display="flex" justifyContent="flex-end" gap={2} marginTop={4}>
          <Button variant="tertiary" onClick={handleReset}>
            Back
          </Button>
          <Button variant="tertiary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApply} disabled={diff.length === 0}>
            Apply Changes
          </Button>
        </Box>
      </Box>
    );
  }

  // Applying step
  if (step === "applying") {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" __minHeight="200px">
        <Text variant="bodyStrong" marginBottom={2}>
          Applying configuration...
        </Text>
        <Text variant="caption" color="default2">
          Please wait while the configuration is being saved.
        </Text>
      </Box>
    );
  }

  // Success step
  if (step === "success") {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" __minHeight="200px">
        <Text variant="bodyStrong" color="success1" marginBottom={2}>
          Configuration imported successfully!
        </Text>
        <Text variant="caption" color="default2">
          The storefront will reflect the changes shortly.
        </Text>
      </Box>
    );
  }

  // Error step
  if (step === "error") {
    return (
      <Box>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" __minHeight="200px">
          <Text variant="bodyStrong" color="critical1" marginBottom={2}>
            Failed to import configuration
          </Text>
          <Text variant="caption" color="default2">
            {applyError || "An unknown error occurred"}
          </Text>
        </Box>
        <Box display="flex" justifyContent="flex-end" gap={2} marginTop={4}>
          <Button variant="tertiary" onClick={handleReset}>
            Try Again
          </Button>
          <Button variant="tertiary" onClick={onCancel}>
            Cancel
          </Button>
        </Box>
      </Box>
    );
  }

  return null;
}
