import graphene
from django.core.exceptions import ValidationError

from ......account import models
from ......core.tracing import traced_atomic_transaction
from ......permission.enums import AccountPermissions
from .....core import ResolveInfo
from .....core.doc_category import DOC_CATEGORY_USERS
from .....core.mutations import BaseMutation
from .....core.types import AccountError
from .....core.utils import from_global_id_or_error
from .....core.dataloaders import get_database_connection_name
from ....types import ContactSubmission
from ......account.services.contact_submission_email import ContactSubmissionEmailService


class ContactSubmissionReplyInput(graphene.InputObjectType):
    id = graphene.ID(required=True, description="ID of the contact submission.")
    message = graphene.String(required=True, description="Reply message content.")
    subject = graphene.String(description="Optional custom subject. If not provided, 'Re: {original subject}' will be used.")


class ContactSubmissionReply(BaseMutation):
    contact_submission = graphene.Field(
        ContactSubmission, description="Contact submission that was replied to."
    )

    class Arguments:
        input = ContactSubmissionReplyInput(
            required=True, description="Fields required to send a reply."
        )

    class Meta:
        description = "Send a reply email to a contact submission customer."
        doc_category = DOC_CATEGORY_USERS
        error_type_class = AccountError
        error_type_field = "account_errors"
        permissions = (AccountPermissions.MANAGE_CONTACT_SUBMISSIONS,)

    @classmethod
    def clean_input(cls, info: ResolveInfo, data):
        """Validate and clean input data."""
        cleaned_input = data.copy()

        # Validate message
        message = cleaned_input.get("message", "").strip()
        if not message or len(message) < 10:
            raise ValidationError(
                {"message": "Reply message must be at least 10 characters long."}
            )
        cleaned_input["message"] = message

        # Validate subject (optional)
        subject = cleaned_input.get("subject")
        if subject:
            subject = subject.strip()
            if len(subject) < 3:
                raise ValidationError(
                    {"subject": "Subject must be at least 3 characters long if provided."}
                )
            cleaned_input["subject"] = subject
        else:
            cleaned_input["subject"] = None

        return cleaned_input

    @classmethod
    @traced_atomic_transaction()
    def perform_mutation(cls, _root, info: ResolveInfo, /, **data):
        input_data = data.get("input", {})
        cleaned_input = cls.clean_input(info, input_data)

        submission_id = cleaned_input.get("id")
        reply_message = cleaned_input.get("message")
        reply_subject = cleaned_input.get("subject")

        _, submission_pk = from_global_id_or_error(
            submission_id, ContactSubmission, raise_error=True
        )

        database_connection_name = get_database_connection_name(info.context)
        submission = models.ContactSubmission.objects.using(
            database_connection_name
        ).get(pk=submission_pk)

        # Send reply email
        email_sent = ContactSubmissionEmailService.send_reply(
            submission=submission,
            reply_message=reply_message,
            reply_subject=reply_subject,
        )

        if not email_sent:
            raise ValidationError(
                {"message": "Failed to send reply email. Please check SMTP configuration."}
            )

        # Update submission status to REPLIED and record who replied
        from django.utils import timezone

        submission.status = models.ContactSubmissionStatus.REPLIED
        if info.context.user:
            submission.replied_by = info.context.user
            submission.replied_at = timezone.now()
        submission.save(update_fields=["status", "replied_by", "replied_at", "updated_at"])

        return cls(contact_submission=submission)
