import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Button, Text } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";

import { BasicLayout } from "../components/basic-layout";
import { SectionWithDescription } from "../components/section-with-description";
import { Table } from "../components/table";
import { trpcClient } from "../modules/trpc/trpc-client";

const TemplatesPage: NextPage = () => {
  const { appBridgeState } = useAppBridge();
  const router = useRouter();
  const utils = trpcClient.useUtils();

  const { data: templatesData, isLoading } = trpcClient.template.list.useQuery(undefined, {
    enabled: !!appBridgeState?.ready,
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      await trpcClient.template.delete.mutate({ id });
      await utils.template.list.invalidate();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete template");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await trpcClient.template.duplicate.mutate({ id });
      await utils.template.list.invalidate();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to duplicate template");
    }
  };

  if (!appBridgeState?.ready) {
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
      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={4}>
        <Box>
          <Text as="h1" variant="hero">
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
        {isLoading ? (
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
