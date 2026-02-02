import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Button, Text } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";

import { BasicLayout } from "../components/basic-layout";
import { SectionWithDescription } from "../components/section-with-description";
import { Table } from "../components/table";
import { trpcClient } from "../modules/trpc/trpc-client";

const TemplatesPage: NextPage = () => {
  const { appBridgeState } = useAppBridge();
  const router = useRouter();
  const utils = trpcClient.useUtils();

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const { data: templatesData, isLoading } = trpcClient.template.list.useQuery(undefined, {
    enabled: !!appBridgeState?.ready,
    staleTime: 30000,
    refetchOnWindowFocus: true,
    });

  const deleteMutation = trpcClient.template.delete.useMutation({
    onSuccess: async () => {
      await utils.template.list.invalidate();
      await utils.template.list.refetch();
      await utils.template.get.invalidate();
      setMessage({ type: "success", text: "Template deleted successfully!" });
      setDeleteConfirm(null);
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({ type: "error", text: error.message || "Failed to delete template" });
      setDeleteConfirm(null);
      setTimeout(() => setMessage(null), 5000);
    },
  });

  const duplicateMutation = trpcClient.template.duplicate.useMutation({
    onSuccess: async () => {
      await utils.template.list.invalidate();
      await utils.template.list.refetch();
      setMessage({ type: "success", text: "Template duplicated successfully!" });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({ type: "error", text: error.message || "Failed to duplicate template" });
      setTimeout(() => setMessage(null), 5000);
    },
  });

  const handleDelete = (id: string) => {
    const template = templatesData?.templates.find((t) => t.id === id);
    if (template) {
      setDeleteConfirm({ id, name: template.name });
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteMutation.mutate({ id: deleteConfirm.id });
  };

  const handleDuplicate = (id: string) => {
    duplicateMutation.mutate({ id });
  };

  // Return null while App Bridge is initializing - this prevents race conditions
  if (!appBridgeState) {
    return null;
  }

  // Show loading while App Bridge is connecting
  if (!appBridgeState.ready) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Templates" }]}>
        <Text>Loading...</Text>
      </BasicLayout>
    );
  }

  if (appBridgeState.user?.permissions.includes("MANAGE_APPS") === false) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Templates" }]}>
        <Text>You do not have permission to access this page.</Text>
      </BasicLayout>
    );
  }

  return (
    <BasicLayout breadcrumbs={[{ name: "Templates" }]}>
      {message && (
        <Box
          padding={3}
          marginBottom={4}
          backgroundColor={message.type === "success" ? "success1" : "critical1"}
          borderRadius={2}
        >
          <Text color={message.type === "success" ? "default1" : "critical2"}>
            {message.text}
          </Text>
        </Box>
      )}

      {deleteConfirm && (
        <Box
          padding={4}
          marginBottom={4}
          backgroundColor="warning1"
          borderRadius={2}
          borderWidth={1}
          borderStyle="solid"
          borderColor="default1"
        >
          <Text marginBottom={2} fontWeight="bold">
            Delete Template?
          </Text>
          <Text marginBottom={3}>
            Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
          </Text>
          <Box display="flex" gap={2}>
            <Button variant="primary" onClick={confirmDelete} disabled={deleteMutation.isLoading}>
              {deleteMutation.isLoading ? "Deleting..." : "Yes, Delete"}
            </Button>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={4}>
        <Box>
          <Text as="h1" size={5} fontWeight="bold">
            Email Templates
          </Text>
          <Text as="p" color="default2" marginTop={2}>
            Create and manage email templates for your newsletter campaigns.
          </Text>
        </Box>
        <Button variant="primary" onClick={() => router.push("/templates/new")}>
          Create Template
        </Button>
      </Box>

      <SectionWithDescription
        title="Templates"
        description={<Text>Manage your email templates. Templates can be used in campaigns.</Text>}
      >
        {isLoading && !templatesData ? (
          <Text>Loading templates...</Text>
        ) : templatesData?.templates.length === 0 ? (
          <Box padding={6} textAlign="center">
            <Text color="default2">No templates yet. Create your first template to get started.</Text>
          </Box>
        ) : (
          <Table.Container>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Subject</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Created</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {templatesData?.templates.map((template) => (
                <Table.Row key={template.id}>
                  <Table.Cell>
                    <Text fontWeight="bold">{template.name}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text>{template.subject}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text color={template.isLocked ? "warning1" : "success1"}>
                      {template.isLocked ? "Locked" : "Active"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size={3}>
                      {new Date(template.createdAt).toLocaleDateString()}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Box display="flex" gap={2}>
                      <Button
                        variant="tertiary"
                        size="small"
                        onClick={() => router.push(`/templates/${template.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="tertiary"
                        size="small"
                        onClick={() => handleDuplicate(template.id)}
                      >
                        Duplicate
                      </Button>
                      <Button
                        variant="tertiary"
                        size="small"
                        onClick={() => handleDelete(template.id)}
                        disabled={template.isLocked}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Container>
        )}
      </SectionWithDescription>
    </BasicLayout>
  );
};

export default TemplatesPage;
