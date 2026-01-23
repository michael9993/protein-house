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
from ....enums import ContactSubmissionStatusEnum
from ....types import ContactSubmission


class ContactSubmissionUpdateStatus(BaseMutation):
    contact_submission = graphene.Field(
        ContactSubmission, description="Updated contact submission."
    )

    class Arguments:
        id = graphene.ID(required=True, description="ID of the contact submission.")
        status = ContactSubmissionStatusEnum(
            required=True, description="New status for the submission."
        )

    class Meta:
        description = "Update the status of a contact submission."
        doc_category = DOC_CATEGORY_USERS
        error_type_class = AccountError
        error_type_field = "account_errors"
        permissions = (AccountPermissions.MANAGE_CONTACT_SUBMISSIONS,)

    @classmethod
    @traced_atomic_transaction()
    def perform_mutation(cls, _root, info: ResolveInfo, /, **data):
        submission_id = data.get("id")
        status = data.get("status")

        _, submission_pk = from_global_id_or_error(
            submission_id, ContactSubmission, raise_error=True
        )

        database_connection_name = get_database_connection_name(info.context)
        submission = models.ContactSubmission.objects.using(
            database_connection_name
        ).get(pk=submission_pk)

        # Update status
        submission.status = status
        submission.save(update_fields=["status", "updated_at"])

        # If status is REPLIED and user is authenticated, record who replied
        if status == models.ContactSubmissionStatus.REPLIED and info.context.user:
            from django.utils import timezone

            submission.replied_by = info.context.user
            submission.replied_at = timezone.now()
            submission.save(update_fields=["replied_by", "replied_at", "updated_at"])

        return cls(contact_submission=submission)
