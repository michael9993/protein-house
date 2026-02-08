import { zodResolver } from "@hookform/resolvers/zod";
import { useDashboardNotification } from "@saleor/apps-shared/use-dashboard-notification";
import { TextLink } from "@saleor/apps-ui";
import { Box, Button, Text, Tooltip } from "@saleor/macaw-ui";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { BoxFooter } from "../../../components/box-footer";
import { BoxWithBorder } from "../../../components/box-with-border";
import { ManagePermissionsTextLink } from "../../../components/manage-permissions-text-link";
import { SectionWithDescription } from "../../../components/section-with-description";
import { Table } from "../../../components/table";
import { defaultPadding } from "../../../components/ui-defaults";
import { getEventFormStatus } from "../../../lib/get-event-form-status";
import { setBackendErrors } from "../../../lib/set-backend-errors";
import { messageEventTypesLabels } from "../../event-handlers/message-event-types";
import { trpcClient } from "../../trpc/trpc-client";
import {
  SmtpUpdateEventArray,
  smtpUpdateEventArraySchema,
} from "../configuration/smtp-config-input-schema";
import { SmtpConfiguration } from "../configuration/smtp-config-schema";
import { smtpUrls } from "../urls";

interface SmtpEventsSectionProps {
  configuration: SmtpConfiguration;
}

export const SmtpEventsSection = ({ configuration }: SmtpEventsSectionProps) => {
  const { notifySuccess, notifyError } = useDashboardNotification();
  const router = useRouter();
  const [resetLanguage, setResetLanguage] = useState<"en" | "he">(
    configuration.templateLanguage || "en",
  );
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { data: featureFlags } = trpcClient.app.featureFlags.useQuery();
  const { data: appPermissions } = trpcClient.app.appPermissions.useQuery();

  // Sort events by displayed label
  const eventsSorted = configuration.events.sort((a, b) =>
    messageEventTypesLabels[a.eventType].localeCompare(messageEventTypesLabels[b.eventType]),
  );

  const { register, handleSubmit, setError } = useForm<SmtpUpdateEventArray>({
    defaultValues: {
      configurationId: configuration.id,
      events: eventsSorted,
    },
    resolver: zodResolver(smtpUpdateEventArraySchema),
  });

  const trpcContext = trpcClient.useContext();
  const { mutate } = trpcClient.smtpConfiguration.updateEventArray.useMutation({
    onSuccess: async () => {
      notifySuccess("Configuration saved");
      trpcContext.smtpConfiguration.invalidate();
    },
    onError(error) {
      setBackendErrors<SmtpUpdateEventArray>({ error, setError, notifyError });
    },
  });

  const { mutate: resetTemplates, isLoading: isResetting } =
    trpcClient.smtpConfiguration.resetEventTemplates.useMutation({
      onSuccess: async () => {
        notifySuccess(`Templates reset to ${resetLanguage === "he" ? "Hebrew" : "English"} defaults`);
        setShowResetConfirm(false);
        trpcContext.smtpConfiguration.invalidate();
        router.reload();
      },
      onError() {
        notifyError("Failed to reset templates");
      },
    });

  return (
    <SectionWithDescription
      title="Events"
      description={
        <Box display="flex" flexDirection="column" gap={2}>
          <Text as="p">Choose which Saleor events should send emails via SMTP.</Text>
          <Text as="p">
            You can modify the email templates using{" "}
            <TextLink href="https://mjml.io/" newTab={true}>
              MJML
            </TextLink>{" "}
            syntax.
          </Text>
        </Box>
      }
    >
      <BoxWithBorder>
        <Box padding={defaultPadding} display="flex" flexDirection="column" gap={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Text size={5} fontWeight="bold">
                Template Language
              </Text>
              <Text size={3} color="default2">
                Current: {configuration.templateLanguage === "he" ? "עברית (Hebrew)" : "English"}
              </Text>
            </Box>
            <Box display="flex" gap={3} alignItems="center">
              <label>
                <input
                  type="radio"
                  name="resetLang"
                  value="en"
                  checked={resetLanguage === "en"}
                  onChange={() => setResetLanguage("en")}
                />
                <Text paddingLeft={2}>English</Text>
              </label>
              <label>
                <input
                  type="radio"
                  name="resetLang"
                  value="he"
                  checked={resetLanguage === "he"}
                  onChange={() => setResetLanguage("he")}
                />
                <Text paddingLeft={2}>עברית</Text>
              </label>
              {!showResetConfirm ? (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setShowResetConfirm(true)}
                >
                  Reset All Templates
                </Button>
              ) : (
                <Box display="flex" gap={2} alignItems="center">
                  <Text size={3} color="critical1">
                    Reset all 17 templates to {resetLanguage === "he" ? "Hebrew" : "English"}?
                  </Text>
                  <Button
                    variant="error"
                    size="small"
                    disabled={isResetting}
                    onClick={() =>
                      resetTemplates({
                        configurationId: configuration.id,
                        language: resetLanguage,
                      })
                    }
                  >
                    {isResetting ? "Resetting..." : "Confirm"}
                  </Button>
                  <Button
                    variant="tertiary"
                    size="small"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </BoxWithBorder>
      <form
        onSubmit={handleSubmit((data) => {
          mutate(data);
        })}
      >
        <BoxWithBorder>
          <Box padding={defaultPadding}>
            <Table.Container>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell __width={40}>Active</Table.HeaderCell>
                  <Table.HeaderCell>Event type</Table.HeaderCell>
                  <Table.HeaderCell __width={110}></Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {eventsSorted.map((event, index) => {
                  const { isDisabled, requiredSaleorVersion, missingPermission } =
                    getEventFormStatus({
                      appPermissions,
                      featureFlags: featureFlags,
                      eventType: event.eventType,
                    });

                  return (
                    <Table.Row key={event.eventType}>
                      <Table.Cell>
                        <Tooltip>
                          <Tooltip.Trigger>
                            <input
                              type="checkbox"
                              {...register(`events.${index}.active`)}
                              disabled={isDisabled}
                            />
                          </Tooltip.Trigger>
                          {requiredSaleorVersion ? (
                            <Tooltip.Content side="left">
                              The feature requires Saleor version {requiredSaleorVersion}. Update
                              the instance to enable.
                              <Tooltip.Arrow />
                            </Tooltip.Content>
                          ) : (
                            missingPermission && (
                              <Tooltip.Content side="left">
                                <ManagePermissionsTextLink missingPermission={missingPermission} />
                                <Tooltip.Arrow />
                              </Tooltip.Content>
                            )
                          )}
                        </Tooltip>
                      </Table.Cell>
                      <Table.Cell>
                        <Text>{messageEventTypesLabels[event.eventType]}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                          variant="tertiary"
                          size="small"
                          onClick={() => {
                            router.push(
                              smtpUrls.eventConfiguration(configuration.id, event.eventType),
                            );
                          }}
                          disabled={isDisabled}
                        >
                          Edit template
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Container>
          </Box>
          <BoxFooter>
            <Button type="submit">Save provider</Button>
          </BoxFooter>
        </BoxWithBorder>
      </form>
    </SectionWithDescription>
  );
};
