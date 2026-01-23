import graphene

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


class ContactSubmissionDelete(BaseMutation):
    contact_submission = graphene.Field(
        ContactSubmission, description="Deleted contact submission."
    )

    class Arguments:
        id = graphene.ID(required=True, description="ID of the contact submission to delete.")

    class Meta:
        description = "Delete a contact submission."
        doc_category = DOC_CATEGORY_USERS
        error_type_class = AccountError
        error_type_field = "account_errors"
        permissions = (AccountPermissions.MANAGE_CONTACT_SUBMISSIONS,)

    @classmethod
    @traced_atomic_transaction()
    def perform_mutation(cls, _root, info: ResolveInfo, /, **data):
        submission_id = data.get("id")

        _, submission_pk = from_global_id_or_error(
            submission_id, ContactSubmission, raise_error=True
        )

        database_connection_name = get_database_connection_name(info.context)
        submission = models.ContactSubmission.objects.using(
            database_connection_name
        ).get(pk=submission_pk)

        submission.delete()

        return cls(contact_submission=submission)
