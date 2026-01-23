import { TopNav } from "@dashboard/components/AppLayout/TopNav";
import { Button } from "@dashboard/components/Button";
import { DashboardCard } from "@dashboard/components/Card";
import CardSpacer from "@dashboard/components/CardSpacer";
import { ConfirmButtonTransitionState } from "@dashboard/components/ConfirmButton";
import { FormSpacer } from "@dashboard/components/FormSpacer";
import { Hr } from "@dashboard/components/Hr";
import { Skeleton, Input, Textarea } from "@saleor/macaw-ui-next";
import { customerServiceListUrl } from "@dashboard/customers/urls";
import useNavigator from "@dashboard/hooks/useNavigator";
import { sectionNames } from "@dashboard/intl";
import { Box, Text, useTheme } from "@saleor/macaw-ui-next";
import { DateTime } from "@dashboard/components/Date";
import { ContactSubmissionDetailsQuery } from "@dashboard/graphql";
import { useIntl } from "react-intl";
import { useState } from "react";
import { getStatusColor } from "@dashboard/misc";

interface CustomerServiceDetailsPageProps {
  submission: ContactSubmissionDetailsQuery["contactSubmission"] | null | undefined;
  loading: boolean;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
  onReply: (message: string, subject?: string) => void;
  updateStatusState: ConfirmButtonTransitionState;
  replyState: ConfirmButtonTransitionState;
}

const getStatusLabel = (status: string, intl: ReturnType<typeof useIntl>): string => {
  const statusMap: Record<string, string> = {
    NEW: intl.formatMessage({ id: "NEW", defaultMessage: "New" }),
    READ: intl.formatMessage({ id: "READ", defaultMessage: "Read" }),
    REPLIED: intl.formatMessage({ id: "REPLIED", defaultMessage: "Replied" }),
    ARCHIVED: intl.formatMessage({ id: "ARCHIVED", defaultMessage: "Archived" }),
  };
  return statusMap[status] || status;
};

const getStatusColorType = (status: string): "info" | "warning" | "success" | "error" => {
  switch (status) {
    case "NEW":
      return "info";
    case "READ":
      return "warning";
    case "REPLIED":
      return "success";
    case "ARCHIVED":
      return "error";
    default:
      return "info";
  }
};

// Custom Status Badge component that mimics Pill styling without using the problematic component
const StatusBadge = ({ status, label }: { status: string; label: string }) => {
  const { theme: currentTheme } = useTheme();
  const statusColorType = getStatusColorType(status);
  
  console.log("StatusBadge - statusColorType:", statusColorType);
  console.log("StatusBadge - currentTheme:", currentTheme);
  
  const colors = getStatusColor({
    status: statusColorType,
    currentTheme,
  });
  
  console.log("StatusBadge - colors:", colors);
  console.log("StatusBadge - colors.base:", colors.base);
  console.log("StatusBadge - colors.border:", colors.border);
  console.log("StatusBadge - colors.text:", colors.text);
  
  // Use a plain div to avoid any theme token issues
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        paddingLeft: "8px",
        paddingRight: "8px",
        paddingTop: "4px",
        paddingBottom: "4px",
        borderRadius: "32px",
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.base,
        color: colors.text,
        fontWeight: 500,
        fontSize: "12px",
        lineHeight: "1.5",
      }}
    >
      {label}
    </div>
  );
};

export const CustomerServiceDetailsPage = ({
  submission,
  loading,
  onStatusChange,
  onDelete,
  onReply,
  updateStatusState,
  replyState,
}: CustomerServiceDetailsPageProps) => {
  const intl = useIntl();
  const navigate = useNavigator();
  const [replyMessage, setReplyMessage] = useState("");
  const [replySubject, setReplySubject] = useState("");

  console.log("CustomerServiceDetailsPage - replyMessage:", replyMessage);
  console.log("CustomerServiceDetailsPage - replySubject:", replySubject);
  console.log("CustomerServiceDetailsPage - replyState:", replyState);

  console.log("CustomerServiceDetailsPage - submission:", submission);
  console.log("CustomerServiceDetailsPage - loading:", loading);
  console.log("CustomerServiceDetailsPage - submission?.status:", submission?.status);
  
  if (submission?.status) {
    const statusColorType = getStatusColorType(submission.status);
    console.log("CustomerServiceDetailsPage - statusColorType:", statusColorType);
    console.log("CustomerServiceDetailsPage - statusColorType type:", typeof statusColorType);
  }

  // Log component render to track when defaultClass error might occur
  console.log("CustomerServiceDetailsPage - Rendering component, loading:", loading, "hasSubmission:", !!submission);

  if (loading) {
    return (
      <>
        <TopNav title={intl.formatMessage(sectionNames.contactSubmissions)} />
        <DashboardCard>
          <Skeleton />
        </DashboardCard>
      </>
    );
  }

  if (!submission) {
    return (
      <>
        <TopNav title={intl.formatMessage(sectionNames.contactSubmissions)} />
        <DashboardCard>
          <Text>{intl.formatMessage({ id: "notFound", defaultMessage: "Not found" })}</Text>
        </DashboardCard>
      </>
    );
  }

  console.log("CustomerServiceDetailsPage - About to render main content");
  
  return (
    <>
      <TopNav
        title={intl.formatMessage(sectionNames.contactSubmissions)}
        href={customerServiceListUrl()}
      >
        <Box display="flex" gap={2}>
          <Button variant="secondary" onClick={() => navigate(customerServiceListUrl())}>
            {intl.formatMessage({ id: "back", defaultMessage: "Back" })}
          </Button>
          <Button variant="tertiary" onClick={onDelete} data-test-id="delete">
            {intl.formatMessage({ id: "delete", defaultMessage: "Delete" })}
          </Button>
        </Box>
      </TopNav>
      <Box padding={6}>
        <DashboardCard>
          <Box padding={6}>
            {console.log("CustomerServiceDetailsPage - Rendering DashboardCard content")}
            <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={4}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {intl.formatMessage({ id: "submissionDetails", defaultMessage: "Submission Details" })}
              </div>
              {submission.status ? (
                <StatusBadge
                  status={submission.status}
                  label={getStatusLabel(submission.status, intl)}
                />
              ) : (
                console.warn("No status found in submission:", submission) || null
              )}
            </Box>

            <Hr />

            <FormSpacer />
            <Box>
              <div style={{ fontSize: 12, fontWeight: 300, marginBottom: 4, display: "block" }}>
                {intl.formatMessage({ id: "name", defaultMessage: "Name" })}
              </div>
              <Text>{submission.name}</Text>
              <CardSpacer />

              <div style={{ fontSize: 12, fontWeight: 300, marginBottom: 4, display: "block" }}>
                {intl.formatMessage({ id: "email", defaultMessage: "Email" })}
              </div>
              <Text>
                <a href={`mailto:${submission.email}`}>{submission.email}</a>
              </Text>
              <CardSpacer />

              <div style={{ fontSize: 12, fontWeight: 300, marginBottom: 4, display: "block" }}>
                {intl.formatMessage({ id: "channel", defaultMessage: "Channel" })}
              </div>
              <Text>{submission.channel?.name || "-"}</Text>
              <CardSpacer />

              <div style={{ fontSize: 12, fontWeight: 300, marginBottom: 4, display: "block" }}>
                {intl.formatMessage({ id: "createdAt", defaultMessage: "Created" })}
              </div>
              {submission.createdAt ? (
                <Text><DateTime date={submission.createdAt} /></Text>
              ) : (
                <Text>-</Text>
              )}
              {submission.repliedAt && (
                <>
                  <CardSpacer />
                  <div style={{ fontSize: 12, fontWeight: 300, marginBottom: 4, display: "block" }}>
                    {intl.formatMessage({ id: "repliedAt", defaultMessage: "Replied At" })}
                  </div>
                  <Text><DateTime date={submission.repliedAt} /></Text>
                </>
              )}
              {submission.repliedBy && (
                <>
                  <CardSpacer />
                  <div style={{ fontSize: 12, fontWeight: 300, marginBottom: 4, display: "block" }}>
                    {intl.formatMessage({ id: "repliedBy", defaultMessage: "Replied By" })}
                  </div>
                  <Text>
                    {submission.repliedBy.firstName || ""} {submission.repliedBy.lastName || ""} {submission.repliedBy.firstName || submission.repliedBy.lastName ? "(" : ""}{submission.repliedBy.email}{submission.repliedBy.firstName || submission.repliedBy.lastName ? ")" : ""}
                  </Text>
                </>
              )}
            </Box>

            <FormSpacer />
            <Hr />
            <FormSpacer />

            <Box>
              <div style={{ fontSize: 12, fontWeight: 300, marginBottom: 4, display: "block" }}>
                {intl.formatMessage({ id: "subject", defaultMessage: "Subject" })}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {submission.subject || "-"}
              </div>
            </Box>

            <FormSpacer />

            <Box>
              <div style={{ fontSize: 12, fontWeight: 300, marginBottom: 4, display: "block" }}>
                {intl.formatMessage({ id: "message", defaultMessage: "Message" })}
              </div>
              <Box
                padding={4}
                borderRadius={2}
                style={{ 
                  whiteSpace: "pre-wrap",
                  backgroundColor: "var(--macaw-ui-colors-background-default1, #f5f5f5)"
                }}
              >
                <Text>{submission.message || "-"}</Text>
              </Box>
            </Box>

            <FormSpacer />
            <Hr />
            <FormSpacer />

            <Box>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                {intl.formatMessage({ id: "replyToCustomer", defaultMessage: "Reply to Customer" })}
              </div>
              <Box display="flex" flexDirection="column" gap={3}>
                <Box>
                  <div style={{ fontSize: 12, fontWeight: 300, marginBottom: 4, display: "block" }}>
                    {intl.formatMessage({ id: "subject", defaultMessage: "Subject" })} ({intl.formatMessage({ id: "optional", defaultMessage: "Optional" })})
                  </div>
                  <Input
                    value={replySubject}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReplySubject(e.target.value)}
                    placeholder={intl.formatMessage({ id: "replySubjectPlaceholder", defaultMessage: "Leave empty to use 'Re: {original subject}'" }, { subject: submission.subject })}
                  />
                </Box>
                <Box>
                  <div style={{ fontSize: 12, fontWeight: 300, marginBottom: 4, display: "block" }}>
                    {intl.formatMessage({ id: "replyMessage", defaultMessage: "Reply Message" })}
                  </div>
                  <Textarea
                    rows={6}
                    value={replyMessage}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyMessage(e.target.value)}
                    placeholder={intl.formatMessage({ id: "replyMessagePlaceholder", defaultMessage: "Type your reply message here..." })}
                  />
                </Box>
                <Box display="flex" gap={2}>
                  <Button
                    variant="primary"
                    onClick={() => {
                      const trimmedMessage = replyMessage.trim();
                      const trimmedSubject = replySubject.trim();
                      console.log("CustomerServiceDetailsPage - Sending reply, message length:", trimmedMessage.length);
                      console.log("CustomerServiceDetailsPage - Reply subject:", trimmedSubject || "Using default");
                      if (trimmedMessage.length >= 10) {
                        onReply(trimmedMessage, trimmedSubject || undefined);
                        setReplyMessage("");
                        setReplySubject("");
                      } else {
                        console.warn("CustomerServiceDetailsPage - Reply message too short:", trimmedMessage.length);
                      }
                    }}
                    disabled={replyState === "loading" || replyMessage.trim().length < 10}
                  >
                    {intl.formatMessage({ id: "sendReply", defaultMessage: "Send Reply" })}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setReplyMessage("");
                      setReplySubject("");
                    }}
                    disabled={replyState === "loading"}
                  >
                    {intl.formatMessage({ id: "clear", defaultMessage: "Clear" })}
                  </Button>
                </Box>
              </Box>
            </Box>

            <FormSpacer />
            <Hr />
            <FormSpacer />

            <Box>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                {intl.formatMessage({ id: "updateStatus", defaultMessage: "Update Status" })}
              </div>
              <Box display="flex" gap={2} flexWrap="wrap">
                {["NEW", "READ", "REPLIED", "ARCHIVED"].map(status => (
                  <Button
                    key={status}
                    variant={submission.status === status ? "primary" : "secondary"}
                    onClick={() => onStatusChange(status)}
                    disabled={updateStatusState === "loading" || submission.status === status}
                  >
                    {getStatusLabel(status, intl)}
                  </Button>
                ))}
              </Box>
            </Box>
          </Box>
        </DashboardCard>
      </Box>
    </>
  );
};

export default CustomerServiceDetailsPage;
