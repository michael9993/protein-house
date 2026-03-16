import ActionDialog from "@dashboard/components/ActionDialog";
import { WindowTitle } from "@dashboard/components/WindowTitle";
import { ContactSubmissionStatusEnum, useContactSubmissionDeleteMutation, useContactSubmissionDetailsQuery, useContactSubmissionReplyMutation, useContactSubmissionUpdateStatusMutation } from "@dashboard/graphql";
import useNavigator from "@dashboard/hooks/useNavigator";
import useNotifier from "@dashboard/hooks/useNotifier";
import { commonMessages, sectionNames } from "@dashboard/intl";
import createDialogActionHandlers from "@dashboard/utils/handlers/dialogActionHandlers";
import { useIntl } from "react-intl";

import CustomerServiceDetailsPage from "../../components/CustomerServiceDetailsPage";
import { customerServiceListUrl, customerServiceUrl, CustomerServiceUrlQueryParams } from "../../urls";

interface CustomerServiceDetailsProps {
  id: string;
  params: CustomerServiceUrlQueryParams;
}

const CustomerServiceDetails = ({ id, params }: CustomerServiceDetailsProps) => {
  const navigate = useNavigator();
  const notify = useNotifier();
  const intl = useIntl();

  const { data, loading, refetch } = useContactSubmissionDetailsQuery({
    displayLoader: true,
    variables: { id },
  });

  const [updateStatus, updateStatusOpts] = useContactSubmissionUpdateStatusMutation({
    onCompleted: data => {
      if (data.contactSubmissionUpdateStatus?.errors.length === 0) {
        notify({
          status: "success",
          text: intl.formatMessage(commonMessages.savedChanges),
        });
        refetch();
      }
    },
  });

  const [deleteSubmission, deleteSubmissionOpts] = useContactSubmissionDeleteMutation({
    onCompleted: data => {
      if (data.contactSubmissionDelete?.errors.length === 0) {
        notify({
          status: "success",
          text: intl.formatMessage({
            id: "xY8pL3",
            defaultMessage: "Contact submission deleted",
          }),
        });
        navigate(customerServiceListUrl());
      }
    },
  });

  const [replyToSubmission, replyOpts] = useContactSubmissionReplyMutation({
    onCompleted: data => {
      const errors = data.contactSubmissionReply?.errors;
      if (!errors || errors.length === 0) {
        notify({
          status: "success",
          text: intl.formatMessage({
            id: "xY8pL5",
            defaultMessage: "Reply sent successfully",
          }),
        });
        refetch();
      } else {
        notify({
          status: "error",
          text: intl.formatMessage({
            id: "xY8pL6",
            defaultMessage: "Failed to send reply",
          }),
        });
      }
    },
  });

  const [openModal, closeModal] = createDialogActionHandlers<
    CustomerServiceUrlQueryParams["action"],
    CustomerServiceUrlQueryParams
  >(navigate, params => customerServiceUrl(id, params), params);

  const handleStatusChange = (status: string) => {
    updateStatus({
      variables: {
        id,
        status: status as ContactSubmissionStatusEnum,
      },
    });
  };

  const handleDelete = () => {
    deleteSubmission({
      variables: { id },
    });
  };

  const handleReply = (message: string, subject?: string) => {
    replyToSubmission({
      variables: {
        input: {
          id,
          message,
          subject: subject || null,
        },
      },
    });
  };

  const submission = data?.contactSubmission;

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.contactSubmissions)} />
      <CustomerServiceDetailsPage
        submission={submission}
        loading={loading}
        onStatusChange={handleStatusChange}
        onDelete={() => openModal("remove")}
        onReply={handleReply}
        updateStatusState={updateStatusOpts.status}
        replyState={replyOpts.status}
      />
      <ActionDialog
        open={params.action === "remove"}
        onClose={closeModal}
        confirmButtonState={deleteSubmissionOpts.status}
        onConfirm={handleDelete}
        variant="delete"
        title={intl.formatMessage({
          id: "xY8pL4",
          defaultMessage: "Delete Contact Submission",
          description: "dialog header",
        })}
      >
        {intl.formatMessage({
          id: "mN9qK4",
          defaultMessage: "Are you sure you want to delete this contact submission?",
        })}
      </ActionDialog>
    </>
  );
};

export default CustomerServiceDetails;
